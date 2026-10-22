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
  onCreateRequest,
  onApprove,
  onComplete,
  onError
}) {
  const [requestInput, setRequestInput] = useState('')
  const [approvalInput, setApprovalInput] = useState('')

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
            This device is paired. {status.devices?.filter((device) => device.active).length || 0}{' '}
            active devices on this profile.
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
      <div className='pairing-grid'>
        <section className='pairing-step'>
          <h3>On the new device: create a request</h3>
          <p>Create a request there, then paste it into an already-paired device for approval.</p>
          <button className='primary' type='button' onClick={onCreateRequest}>
            Create pairing request
          </button>
          {requestCode && (
            <div className='pairing-code'>
              <textarea value={requestCode} readOnly rows={5} aria-label='Pairing request code' />
              <button type='button' className='quiet' onClick={() => copyCode(requestCode)}>
                Copy request
              </button>
              <small>Request expires: {expiresAt(requestCode)}</small>
            </div>
          )}
        </section>
        <form className='pairing-step' onSubmit={approve}>
          <h3>On an already-paired device: approve</h3>
          <p>
            Review the request on the new device, paste it here, and approve to create a 24-hour
            response code.
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
              <textarea value={approvalCode} readOnly rows={5} aria-label='Pairing approval code' />
              <button type='button' className='quiet' onClick={() => copyCode(approvalCode)}>
                Copy approval
              </button>
              <small>Approval expires: {expiresAt(approvalCode)}</small>
            </div>
          )}
        </form>
        <form className='pairing-step' onSubmit={complete}>
          <h3>On the new device: finish pairing</h3>
          <p>
            Paste the approved response here. It is valid for 24 hours and only matches this
            device's request. This replaces the current local profile and language list.
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
