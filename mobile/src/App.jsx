import { useCallback, useEffect, useRef, useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import * as Clipboard from 'expo-clipboard'
import { reloadAppAsync } from 'expo-modules-core'
import { WebView } from 'react-native-webview'
import PearRuntime from 'pear-mobile'
import FramedStream from 'framed-stream'
import b4a from 'b4a'
import workerBundle from './worker.bundle.js'
import packageJson from '../../package.json'
import { createMobileBridgeScript } from './mobile-bridge'
import { burlangTranslate, gTranslate, yTranslate } from './translations'

const workerSpecifier = '/workers/main.js'
// Android app-code updates are restricted to Google Play releases.
const appName = packageJson.productName ?? packageJson.name
const isDebugBuild = globalThis.__DEV__ === true
const bridgeScript = createMobileBridgeScript(packageJson.version, isDebugBuild)

function debugLog(scope, message, details) {
  if (isDebugBuild) {
    console.log(`[BuryadAndroid:${scope}] ${message}`, details ?? '')
  }
}

function debugError(scope, message, details) {
  if (isDebugBuild) {
    console.error(`[BuryadAndroid:${scope}] ${message}`, details ?? '')
  }
}

export default function App() {
  const webViewRef = useRef(null)
  const pipeRef = useRef(null)
  const [startupError, setStartupError] = useState('')

  const sendToWebView = useCallback((message) => {
    const serialized = JSON.stringify(message)
    if (!webViewRef.current && isDebugBuild) {
      debugError('bridge', 'Cannot send a message before the WebView is mounted', {
        method: message.method ?? message.event
      })
      return
    }
    webViewRef.current?.injectJavaScript(`window.__mobileBridgeReceive(${serialized}); true;`)
  }, [])

  const startWorker = useCallback(() => {
    if (pipeRef.current) {
      debugLog('worker', 'Start requested while worker is already running')
      return
    }
    debugLog('worker', 'Starting Pear worker', { specifier: workerSpecifier })
    setStartupError('')

    const ipc = PearRuntime.run('/worker.bundle', workerBundle, [
      '--updates',
      'false',
      '--version',
      packageJson.version,
      '--upgrade',
      packageJson.upgrade,
      '--productName',
      appName
    ])
    const pipe = new FramedStream(ipc)
    pipeRef.current = pipe

    debugLog('worker', 'Pear worker process started')
    pipe.on('data', (data) => {
      debugLog('worker', 'Received worker IPC data', { bytes: data.byteLength })
      sendToWebView({
        event: 'worker-ipc',
        specifier: workerSpecifier,
        data: b4a.toString(data)
      })
    })
    pipe.on('error', (error) => {
      const message = error instanceof Error ? error.message : String(error)
      debugError('worker', 'Worker IPC stream failed', message)
      sendToWebView({
        event: 'worker-stderr',
        specifier: workerSpecifier,
        data: message
      })
      setStartupError(message)
    })
    pipe.on('end', () => {
      debugLog('worker', 'Worker IPC stream ended')
      pipeRef.current = null
      sendToWebView({ event: 'worker-exit', specifier: workerSpecifier, data: 0 })
    })
  }, [sendToWebView])

  const restartApp = useCallback(async () => {
    pipeRef.current?.destroy()
    pipeRef.current = null
    await reloadAppAsync('Device data reset')
  }, [])

  useEffect(() => {
    debugLog('app', 'Native app host mounted', { development: isDebugBuild })
    return () => {
      debugLog('app', 'Native app host unmounted')
      pipeRef.current?.destroy()
      pipeRef.current = null
    }
  }, [])

  const reply = useCallback(
    (requestId, result, error) => {
      if (!requestId) return
      sendToWebView({ method: 'reply', requestId, result, error })
    },
    [sendToWebView]
  )

  const handleMessage = useCallback(
    async (event) => {
      let message
      try {
        message = JSON.parse(event.nativeEvent.data)
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error)
        debugError('bridge', 'Received invalid JSON from WebView', reason)
        setStartupError(`Invalid message from app UI: ${reason}`)
        return
      }

      if (message.method === 'debugLog') {
        const { level, message: text, source } = message.payload ?? {}
        const log = level === 'error' || level === 'warn' ? console.error : console.log
        log(`[BuryadAndroid:${source ?? 'webview'}] ${String(text ?? '').slice(0, 1000)}`)
        return
      }

      debugLog('bridge', 'Received native bridge request', { method: message.method })
      try {
        let result
        switch (message.method) {
          case 'startWorker':
            if (message.payload?.specifier !== workerSpecifier) {
              throw new Error(`Unsupported worker: ${message.payload?.specifier}`)
            }
            startWorker()
            return
          case 'writeWorkerIPC':
            if (message.payload?.specifier !== workerSpecifier || !pipeRef.current) {
              throw new Error('The app worker is not running')
            }
            pipeRef.current.write(message.payload.data)
            return
          case 'restartApp':
            await restartApp()
            result = true
            break
          case 'yTranslate':
            result = await yTranslate(message.payload)
            break
          case 'gTranslate':
            result = await gTranslate(message.payload)
            break
          case 'burlangTranslate':
            result = await burlangTranslate(message.payload.text)
            break
          case 'clipboard.writeText':
            result = await Clipboard.setStringAsync(message.payload.text)
            break
          default:
            throw new Error(`Unsupported native bridge method: ${message.method}`)
        }
        reply(message.requestId, result)
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error)
        debugError('bridge', `Native bridge method failed: ${message.method}`, reason)
        if (!message.requestId) {
          setStartupError(reason)
          sendToWebView({
            event: 'worker-stderr',
            specifier: workerSpecifier,
            data: reason
          })
        }
        reply(message.requestId, undefined, reason)
      }
    },
    [reply, restartApp, sendToWebView, startWorker]
  )

  return (
    <View style={styles.container}>
      <StatusBar style='dark' />
      {startupError ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{startupError}</Text>
        </View>
      ) : null}
      <WebView
        ref={webViewRef}
        source={{ uri: 'file:///android_asset/buryad-web/index.html' }}
        injectedJavaScriptBeforeContentLoaded={bridgeScript}
        onMessage={handleMessage}
        onLoadStart={(event) =>
          debugLog('webview', 'Page load started', { url: event.nativeEvent.url })
        }
        onLoadEnd={(event) =>
          debugLog('webview', 'Page load finished', {
            url: event.nativeEvent.url,
            title: event.nativeEvent.title,
            loading: event.nativeEvent.loading
          })
        }
        onError={(event) => {
          const { description, url, code } = event.nativeEvent
          debugError('webview', 'Page load failed', { description, url, code })
          setStartupError(description)
        }}
        onHttpError={(event) => {
          const { url, statusCode, description } = event.nativeEvent
          debugError('webview', 'HTTP error while loading app UI', { url, statusCode, description })
          setStartupError(`The app UI could not load (HTTP ${statusCode}).`)
        }}
        onRenderProcessGone={(event) => {
          debugError('webview', 'Android WebView renderer exited', event.nativeEvent)
          setStartupError('The Android WebView renderer stopped unexpectedly. Check device logs.')
        }}
        onShouldStartLoadWithRequest={({ url }) => {
          const allowed =
            url.startsWith('file:///android_asset/buryad-web/') || url === 'about:blank'
          if (!allowed) debugLog('webview', 'Blocked navigation outside app assets', { url })
          return allowed
        }}
        originWhitelist={['file://*', 'about:blank']}
        allowFileAccess
        allowFileAccessFromFileURLs={false}
        allowUniversalAccessFromFileURLs={false}
        javaScriptEnabled
        domStorageEnabled
        mediaCapturePermissionGrantType='grantIfSameHostElsePrompt'
        mixedContentMode='never'
        setSupportMultipleWindows={false}
        style={styles.webView}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator size='large' color='#1d4a3b' />
          </View>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eef3ed'
  },
  webView: {
    flex: 1,
    backgroundColor: '#eef3ed'
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eef3ed'
  },
  errorBanner: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f8dddd'
  },
  errorText: {
    color: '#752727'
  }
})
