import { useState } from 'react'

function expiresAt(code) {
  try {
    const parsed = JSON.parse(code)
    const timestamp = parsed.expiresAt
    return Number.isSafeInteger(timestamp) ? new Date(timestamp).toLocaleString() : ''
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

  return (
    <section className='pairing-panel'>
      <div>
        <p className='eyebrow'>Devices</p>
        <h2>Pair another device</h2>
        {status?.paired ? (
          <p className='empty'>
            This device is authorized for its current profile.{' '}
            {status.devices?.filter((device) => device.active).length || 0} active devices.
          </p>
        ) : status?.pending ? (
          <p className='empty'>
            Waiting for the approved device to connect and authorize this installation.
          </p>
        ) : (
          <p className='empty'>
            This device is not yet approved for the profile shown in the pairing code.
          </p>
        )}
      </div>
      {status?.devices?.length > 0 && (
        <section className='paired-devices'>
          <h3>Paired devices</h3>
          <ul>
            {status.devices.map((device) => (
              <li key={device.key}>
                <code>{device.key}</code>
                <span>
                  {device.key === status.deviceKey ? 'This device · ' : ''}
                  {device.active ? 'Authorized' : 'Not authorized'}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
      <div className='pairing-grid'>
        <section className='pairing-step'>
          <h3>On the device to add: create a request</h3>
          <p>
            Create a request here, then paste it into an already-authorized device for approval.
          </p>
          <button className='primary' type='button' onClick={onCreateRequest}>
            Create pairing request
          </button>
          {requestCode && (
            <div className='pairing-code'>
              <small>
                Direct connection: {connectionStatuses?.[currentRequestId] || 'starting'}
              </small>
              <textarea value={requestCode} readOnly rows={5} aria-label='Pairing request code' />
              <button type='button' className='quiet' onClick={() => copyCode(requestCode)}>
                Copy request
              </button>
              <small>Request expires: {expiresAt(requestCode)}</small>
            </div>
          )}
        </section>
        <form className='pairing-step' onSubmit={approve}>
          <h3>On an authorized device: approve</h3>
          <p>
            Paste the new device's request and approve it. If both devices are online, the signed
            approval is sent over a direct encrypted connection; the code remains a fallback.
          </p>
          <textarea
            value={requestInput}
            onChange={(event) => setRequestInput(event.target.value)}
            placeholder='Paste pairing request'
            rows={5}
            maxLength={4096}
            required
          />
          <button className='primary' type='submit'>
            Approve request
          </button>
          {approvalCode && (
            <div className='pairing-code'>
              <small>
                Direct connection: {connectionStatuses?.[approvalRequestId] || 'starting'}
              </small>
              <textarea value={approvalCode} readOnly rows={5} aria-label='Pairing approval code' />
              <button type='button' className='quiet' onClick={() => copyCode(approvalCode)}>
                Copy approval
              </button>
              <small>Approval expires: {expiresAt(approvalCode)}</small>
            </div>
          )}
        </form>
        <form className='pairing-step' onSubmit={complete}>
          <h3>On the device to add: finish pairing</h3>
          <p>
            If the direct connection succeeds, this device joins automatically. Otherwise paste the
            24-hour approval code here. Pairing replaces the current local profile and language
            list.
          </p>
          <textarea
            value={approvalInput}
            onChange={(event) => setApprovalInput(event.target.value)}
            placeholder='Paste pairing approval'
            rows={5}
            maxLength={4096}
            required
          />
          <button className='primary' type='submit'>
            Join user profile
          </button>
        </form>
      </div>
    </section>
  )
}
