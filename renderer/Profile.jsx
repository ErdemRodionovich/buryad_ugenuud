import { useEffect, useState } from 'react'

const maxAvatarBytes = 2 * 1024 * 1024
const supportedAvatarTypes = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif'])

function bytesToBase64(buffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000))
  }
  return btoa(binary)
}

function avatarSource(avatar) {
  return avatar ? `data:${avatar.mime};base64,${avatar.data}` : ''
}

export function Profile({ profile, onSave, onError }) {
  const [nickname, setNickname] = useState(profile.nickname)
  const [avatar, setAvatar] = useState(profile.avatar)

  useEffect(() => {
    setNickname(profile.nickname)
    setAvatar(profile.avatar)
  }, [profile])

  async function selectAvatar(event) {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      if (!supportedAvatarTypes.has(file.type)) {
        throw new Error('Choose a PNG, JPEG, WebP, or GIF image')
      }
      if (file.size > maxAvatarBytes) throw new Error('Avatar must be 2 MB or smaller')
      setAvatar({ data: bytesToBase64(await file.arrayBuffer()), mime: file.type })
    } catch (error) {
      onError(error)
      event.target.value = ''
    }
  }

  function submit(event) {
    event.preventDefault()
    onSave({ nickname, avatar })
  }

  return (
    <section className='profile-panel'>
      <div className='profile-summary'>
        <div className='profile-avatar'>
          {avatar ? (
            <img src={avatarSource(avatar)} alt={`${profile.nickname || nickname}'s avatar`} />
          ) : (
            <span>{(profile.nickname || nickname).trim().slice(0, 1).toUpperCase() || '?'}</span>
          )}
        </div>
        <div>
          <p className='eyebrow'>Your profile</p>
          <strong>{profile.nickname || 'Set up your profile'}</strong>
        </div>
      </div>
      <form className='profile-form' onSubmit={submit}>
        <label>
          Nickname
          <input
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
            maxLength={40}
            placeholder='Choose a nickname'
            required
          />
        </label>
        <label>
          Avatar
          <input
            type='file'
            accept='image/png,image/jpeg,image/webp,image/gif'
            onChange={selectAvatar}
          />
          <small>PNG, JPEG, WebP, or GIF; 2 MB maximum.</small>
        </label>
        <div className='profile-avatar-actions'>
          {avatar && (
            <button type='button' className='quiet' onClick={() => setAvatar(null)}>
              Remove avatar
            </button>
          )}
          <button className='primary' type='submit'>
            Save profile
          </button>
        </div>
      </form>
    </section>
  )
}
