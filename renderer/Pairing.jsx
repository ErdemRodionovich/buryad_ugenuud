import { useState } from 'react'
import { useI18n } from './I18nContext'

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
  approvalCode,
  connectionStatuses,
  onCreateRequest,
  onApprove,
  onComplete,
  onError
}) {
  const { locale, t, plural } = useI18n()
  const [requestInput, setRequestInput] = useState('')
  const [approvalInput, setApprovalInput] = useState('')
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

  function approve(event) {
    event.preventDefault()
    onApprove(requestInput)
  }

  function complete(event) {
    event.preventDefault()
    onComplete(approvalInput)
  }

  const activeDeviceCount = status?.devices?.filter((device) => device.active).length || 0

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
                <code>{device.key}</code>
                <span>
                  {device.key === status.deviceKey ? `${t('This device')} · ` : ''}
                  {device.active ? t('Authorized') : t('Not authorized')}
                </span>
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
          <button className='primary' type='button' onClick={onCreateRequest}>
            {t('Create pairing request')}
          </button>
          {requestCode && (
            <div className='pairing-code'>
              <small>
                {t('Direct connection')}: {t(connectionStatuses?.[currentRequestId] || 'starting')}
              </small>
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
              "Paste the new device's request and approve it. If both devices are online, the signed approval is sent over a direct encrypted connection; the code remains a fallback."
            )}
          </p>
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
