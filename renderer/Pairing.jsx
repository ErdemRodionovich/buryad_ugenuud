import { Html5QrcodeScanner } from 'html5-qrcode'
import QRCode from 'qrcode'
import { useEffect, useRef, useState } from 'react'
import { useI18n } from './I18nContext'

function PairingQrCode({ code, label, onError }) {
  const { t } = useI18n()
  const [image, setImage] = useState('')
  const onErrorRef = useRef(onError)
  onErrorRef.current = onError

  useEffect(() => {
    let active = true
    setImage('')
    QRCode.toDataURL(code, { errorCorrectionLevel: 'M', margin: 2, width: 550 })
      .then((dataUrl) => {
        if (active) setImage(dataUrl)
      })
      .catch((error) => onErrorRef.current(error))

    return () => {
      active = false
    }
  }, [code])

  return image ? (
    <img className='pairing-qr' src={image} alt={t(label)} />
  ) : (
    <small>{t('Generating QR code...')}</small>
  )
}

function PairingScanner({ onScan, onError, onClose }) {
  const { t } = useI18n()

  const callbacksRef = useRef({ onScan, onError, onClose })
  callbacksRef.current = { onScan, onError, onClose }

  const [message, setMessage] = useState('')
  const scannerRef = useRef(null)
  const isScanning = useRef(false)

  useEffect(() => {
    if (scannerRef.current) {
      return
    }
    setMessage(prev => prev + '\nScanner initializing...')

    const scanner = new Html5QrcodeScanner('qr-reader', {
      fps: 10,                            // Частота кадров в секунду
      qrbox: { width: 250, height: 250 }, // Размер рамки сканирования
      rememberLastUsedCamera: true,       // Запоминать выбранную камеру
      supportedScanTypes: [0]             // 0 = только камера (Html5QrcodeScanType.SCAN_TYPE_CAMERA)
    }, false)

    scannerRef.current = scanner
    isScanning.current = true

    scanner.render(
      (decodedText) => {
        setMessage(prev => prev + '\nQR code detected')

        if (scannerRef.current) {
          scannerRef.current.clear()
            .then(() => {
              callbacksRef.current.onScan(decodedText)
            })
            .catch(err => console.error('Error clearing scanner:', err))
            .finally(() => {
              scannerRef.current = null
              isScanning.current = false
            })
        }
      },
      (error) => {
        if (error && error.includes('No MultiFormat Readers were able to detect the code')) {
          return
        }

        setMessage(prev => prev + `\nScanner feedback: ${error}`)
      }
    )

    setMessage(prev => prev + '\nScanner active')

    return () => {
      setMessage(prev => prev + '\nStopping scanner...')

      if (scannerRef.current && isScanning.current === false) {
        scannerRef.current.clear()
          .then(() => {
            setMessage(prev => prev + '\nScanner stopped successfully')
          })
          .catch((err) => {
            console.warn('Scanner clear failed or already cleared:', err)
          })
          .finally(() => scannerRef.current = null)
      }
    }
  }, [])

  return (
    <div className='pairing-scanner'>
      <div id="qr-reader" style={{ width: '100%', maxWidth: '500px', margin: '0 auto' }}></div>

      <button type='button' className='quiet' onClick={onClose}>
        {t('Close scanner')}
      </button>

      <pre style={{ textAlign: 'left', fontSize: '12px', marginTop: '10px' }}>{message}</pre>
    </div>
  )
}

function expiresAt(code, locale) {
  try {
    const parsed = JSON.parse(code)
    const timestamp = parsed.expiresAt
    return Number.isSafeInteger(timestamp)
      ? new Date(timestamp).toLocaleString(
        locale === 'ru' ? 'ru-RU' : locale === 'bua' ? 'bua-RU' : 'en-US'
      )
      : ''
  } catch {
    return ''
  }
}

export function Pairing({
  status,
  requestCode,
  requestOnStart,
  approvalCode,
  connectionStatuses,
  onCreateRequest,
  onApprove,
  onComplete,
  onRevoke,
  onError
}) {
  const { locale, t, plural } = useI18n()
  const [requestInput, setRequestInput] = useState('')
  const [approvalInput, setApprovalInput] = useState('')
  const [showRequestQr, setShowRequestQr] = useState(true)
  const [showApprovalQr, setShowApprovalQr] = useState(true)
  const [scannerTarget, setScannerTarget] = useState(null)
  const currentRequestId = (() => {
    try {
      return JSON.parse(requestCode || '').requestId
    } catch {
      return null
    }
  })()
  const approvalRequestId = (() => {
    try {
      return JSON.parse(approvalCode || '').requestId
    } catch {
      return null
    }
  })()

  async function copyCode(code) {
    try {
      await navigator.clipboard.writeText(code)
    } catch (error) {
      onError(error)
    }
  }

  function createRequest() {
    onCreateRequest()
    setShowRequestQr(true)
  }

  function approve(event) {
    event.preventDefault()
    onApprove(requestInput)
  }

  function complete(event) {
    event.preventDefault()
    onComplete(approvalInput)
  }

  function scannedCode(value) {
    if (value.length > 4096) {
      onError(new Error(t('Scanned pairing QR code is too large')))
      setScannerTarget(null)
      return
    }

    let scannedType
    try {
      scannedType = JSON.parse(value).type
    } catch {
      onError(new Error(t('Scanned QR code is not a pairing code')))
      setScannerTarget(null)
      return
    }
    if (
      (scannerTarget === 'request' && scannedType !== 'request') ||
      (scannerTarget === 'approval' && scannedType !== 'approval')
    ) {
      onError(new Error(t('This QR code is for the wrong pairing step')))
      setScannerTarget(null)
      return
    }

    if (scannerTarget === 'request') {
      setRequestInput(value)
      onApprove(value)
    }
    if (scannerTarget === 'approval') {
      setApprovalInput(value)
      onComplete(value)
    }
    setScannerTarget(null)
  }

  const activeDeviceCount = status?.devices?.filter((device) => device.active).length || 0

  if (requestOnStart) {
    useEffect(() => {
      if (!requestCode || requestCode == '')
        createRequest()
    })
  }

  return (
    <section className='pairing-panel'>
      <div>
        <p className='eyebrow'>{t('Devices')}</p>
        <h2>{t('Pair another device')}</h2>
        {status?.paired ? (
          <p className='empty'>
            {t('This device is authorized for its current profile.')} {activeDeviceCount}{' '}
            {plural('activeDevice', activeDeviceCount)}
          </p>
        ) : status?.pending ? (
          <p className='empty'>
            {t('Waiting for the approved device to connect and authorize this installation.')}
          </p>
        ) : (
          <p className='empty'>
            {t('This device is not yet approved for the profile shown in the pairing code.')}
          </p>
        )}
      </div>
      {status?.devices?.length > 0 && (
        <section className='paired-devices'>
          <h3>{t('Paired devices')}</h3>
          <ul>
            {status.devices.map((device) => (
              <li key={device.key}>
                <strong>{device.deviceName || t('Unknown device')}</strong>
                <span>
                  {device.key === status.deviceKey ? `${t('This device')} · ` : ''}
                  {device.devicePlatform ? `${t(device.devicePlatform)} · ` : ''}
                  {device.active ? t('Authorized') : t('Not authorized')} ·{' '}
                  <code>{device.key.slice(0, 12)}</code>
                </span>
                {status.paired && device.active && device.key !== status.deviceKey && (
                  <button
                    className='revoke-access'
                    type='button'
                    onClick={() => {
                      if (
                        globalThis.confirm(
                          t(
                            'Revoke access to this device and remove its ability to sync this profile?'
                          )
                        )
                      ) {
                        onRevoke(device.key)
                      }
                    }}
                  >
                    {t('Revoke access')}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
      <div className='pairing-grid'>
        <section className='pairing-step'>
          <h3>{t('On the device to add: create a request')}</h3>
          <p>
            {t(
              'Create a request here, then paste it into an already-authorized device for approval.'
            )}
          </p>
          <button className='primary' type='button' onClick={createRequest}>
            {t('Create pairing request')}
          </button>
          {requestCode && (
            <div className='pairing-code'>
              <small>
                {t('Direct connection')}: {t(connectionStatuses?.[currentRequestId] || 'starting')}
              </small>
              <button
                type='button'
                className='quiet'
                onClick={() => setShowRequestQr((visible) => !visible)}
              >
                {t(showRequestQr ? 'Hide QR code' : 'Show QR code')}
              </button>
              {showRequestQr && (
                <PairingQrCode
                  code={requestCode}
                  label='QR code for pairing request'
                  onError={onError}
                />
              )}
              <textarea
                value={requestCode}
                readOnly
                rows={5}
                aria-label={t('Pairing request code')}
              />
              <button type='button' className='quiet' onClick={() => copyCode(requestCode)}>
                {t('Copy request')}
              </button>
              <small>
                {t('Request expires: {date}', { date: expiresAt(requestCode, locale) })}
              </small>
            </div>
          )}
        </section>
        <form className='pairing-step' onSubmit={approve}>
          <h3>{t('On an authorized device: approve')}</h3>
          <p>
            {t(
              "Scan the new device's request QR code or paste its request, then approve it. If both devices are online, the signed approval is sent over a direct encrypted connection; otherwise scan the approval QR code or paste its code."
            )}
          </p>
          <button type='button' className='quiet' onClick={() => setScannerTarget('request')}>
            {t('Scan pairing request QR code')}
          </button>
          {scannerTarget === 'request' && (
            <PairingScanner
              onScan={scannedCode}
              onError={onError}
              onClose={() => setScannerTarget(null)}
            />
          )}
          <textarea
            value={requestInput}
            onChange={(event) => setRequestInput(event.target.value)}
            placeholder={t('Paste pairing request')}
            rows={5}
            maxLength={4096}
            required
          />
          <button className='primary' type='submit'>
            {t('Approve request')}
          </button>
          {approvalCode && (
            <div className='pairing-code'>
              <small>
                {t('Direct connection')}: {t(connectionStatuses?.[approvalRequestId] || 'starting')}
              </small>
              <button
                type='button'
                className='quiet'
                onClick={() => setShowApprovalQr((visible) => !visible)}
              >
                {t(showApprovalQr ? 'Hide QR code' : 'Show QR code')}
              </button>
              {showApprovalQr && (
                <PairingQrCode
                  code={approvalCode}
                  label='QR code for pairing approval'
                  onError={onError}
                />
              )}
              <textarea
                value={approvalCode}
                readOnly
                rows={5}
                aria-label={t('Pairing approval code')}
              />
              <button type='button' className='quiet' onClick={() => copyCode(approvalCode)}>
                {t('Copy approval')}
              </button>
              <small>
                {t('Approval expires: {date}', { date: expiresAt(approvalCode, locale) })}
              </small>
            </div>
          )}
        </form>
        <form className='pairing-step' onSubmit={complete}>
          <h3>{t('On the device to add: finish pairing')}</h3>
          <p>
            {t(
              'If the direct connection succeeds, this device joins automatically. Otherwise paste the 24-hour approval code here. Pairing replaces the current local profile and language list.'
            )}
          </p>
          <button type='button' className='quiet' onClick={() => setScannerTarget('approval')}>
            {t('Scan pairing approval QR code')}
          </button>
          {scannerTarget === 'approval' && (
            <PairingScanner
              onScan={scannedCode}
              onError={onError}
              onClose={() => setScannerTarget(null)}
            />
          )}
          <textarea
            value={approvalInput}
            onChange={(event) => setApprovalInput(event.target.value)}
            placeholder={t('Paste pairing approval')}
            rows={5}
            maxLength={4096}
            required
          />
          <button className='primary' type='submit'>
            {t('Join user profile')}
          </button>
        </form>
      </div>
    </section>
  )
}
