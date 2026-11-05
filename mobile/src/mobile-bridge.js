export function createMobileBridgeScript(version, enableDebug = false) {
  return `
    (function () {
      const pending = new Map()
      const listeners = new Map()
      let nextRequestId = 0
      const debugEnabled = ${JSON.stringify(enableDebug)}

      function reportDebug(level, message) {
        if (!debugEnabled) return
        window.ReactNativeWebView.postMessage(JSON.stringify({
          method: 'debugLog',
          payload: { source: 'webview', level, message: String(message).slice(0, 1000) }
        }))
      }

      if (debugEnabled) {
        for (const level of ['warn', 'error']) {
          const original = console[level].bind(console)
          console[level] = function (...args) {
            original(...args)
            reportDebug(level, args.map((value) =>
              value instanceof Error ? value.stack || value.message : String(value)
            ).join(' ').slice(0, 1000))
          }
        }

        window.addEventListener(
          'error',
          function (event) {
            if (event.target && event.target !== window) {
              reportDebug(
                'error',
                'Resource failed to load: ' +
                  (event.target.src || event.target.href || event.target.tagName)
              )
              return
            }
            reportDebug('error', [
              event.message,
              event.filename && event.filename + ':' + event.lineno + ':' + event.colno
            ].filter(Boolean).join(' '))
          },
          true
        )

        window.addEventListener('unhandledrejection', function (event) {
          const reason = event.reason
          reportDebug('error', reason instanceof Error ? reason.stack || reason.message : reason)
        })

        const reportDomReady = function () {
          const root = document.getElementById('root')
          if (!root) {
            reportDebug('error', 'DOM ready but the renderer #root element is missing')
            return
          }

          reportDebug('info', 'DOM ready; root children=' + root.childElementCount)
          if (root.childElementCount === 0) {
            const observer = new MutationObserver(function () {
              if (root.childElementCount > 0) {
                reportDebug('info', 'Renderer mounted; root children=' + root.childElementCount)
                observer.disconnect()
              }
            })
            observer.observe(root, { childList: true })
            setTimeout(function () {
              if (root.childElementCount === 0) {
                reportDebug('error', 'Renderer did not populate #root within 3 seconds')
              }
              observer.disconnect()
            }, 3000)
          }
        }
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', reportDomReady, { once: true })
        } else {
          reportDomReady()
        }
        window.addEventListener('load', function () {
          reportDebug('info', 'window load complete; root children=' +
            (document.getElementById('root')?.childElementCount ?? 'missing'))
        }, { once: true })
      }

      function send(method, payload, expectsReply) {
        const requestId = expectsReply ? String(++nextRequestId) : undefined
        if (expectsReply) {
          return new Promise((resolve, reject) => {
            pending.set(requestId, { resolve, reject })
            window.ReactNativeWebView.postMessage(JSON.stringify({ method, payload, requestId }))
          })
        }
        window.ReactNativeWebView.postMessage(JSON.stringify({ method, payload }))
      }

      function subscribe(event, specifier, listener) {
        const key = event + ':' + specifier
        if (!listeners.has(key)) listeners.set(key, new Set())
        listeners.get(key).add(listener)
        return function () {
          listeners.get(key)?.delete(listener)
        }
      }

      window.__mobileBridgeReceive = function (message) {
        if (message.method === 'reply') {
          const waiting = pending.get(message.requestId)
          if (!waiting) return
          pending.delete(message.requestId)
          if (message.error) waiting.reject(new Error(message.error))
          else waiting.resolve(message.result)
          return
        }

        const key = message.event + ':' + message.specifier
        const data =
          message.event === 'worker-ipc' ||
          message.event === 'worker-stdout' ||
          message.event === 'worker-stderr'
            ? new TextEncoder().encode(message.data)
            : message.data
        for (const listener of listeners.get(key) || []) listener(data)
      }

      window.bridge = {
        pkg: function () {
          return { version: ${JSON.stringify(version)} }
        },
        startWorker: function (specifier) {
          send('startWorker', { specifier }, false)
        },
        onWorkerStdout: function (specifier, listener) {
          return subscribe('worker-stdout', specifier, listener)
        },
        onWorkerStderr: function (specifier, listener) {
          return subscribe('worker-stderr', specifier, listener)
        },
        onWorkerIPC: function (specifier, listener) {
          return subscribe('worker-ipc', specifier, listener)
        },
        onWorkerExit: function (specifier, listener) {
          return subscribe('worker-exit', specifier, listener)
        },
        writeWorkerIPC: function (specifier, data) {
          send('writeWorkerIPC', { specifier, data }, false)
        },
        restartApp: function () {
          return send('restartApp', {}, true)
        },
        applyUpdate: function () {
          return Promise.reject(new Error('Android app updates are delivered through Google Play.'))
        },
        appAfterUpdate: function () {
          return Promise.reject(new Error('Android app updates are delivered through Google Play.'))
        },
        yTranslate: function (text, apiKey, folderId, targetLang) {
          return send('yTranslate', { text, apiKey, folderId, targetLang }, true)
        },
        gTranslate: function (text, apiKey, projectID, targetLang) {
          return send('gTranslate', { text, apiKey, projectID, targetLang }, true)
        },
        burlangTranslate: function (text) {
          return send('burlangTranslate', { text }, true)
        }
      }

      const clipboard = {
        writeText: function (text) {
          return send('clipboard.writeText', { text }, true)
        }
      }
      try {
        Object.defineProperty(navigator, 'clipboard', { configurable: true, value: clipboard })
      } catch {
        navigator.clipboard = clipboard
      }

      reportDebug('info', 'mobile bridge injected')
    })()
    true;
  `
}
