import { useEffect, useState } from 'react'

const maxUserAvatarBytes = 2 * 1024 * 1024
const maxLanguageAvatarBytes = 80 * 1024
const supportedAvatarTypes = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
const heicExtensions = /\.(heic|heif)$/i

function bytesToBase64(buffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000))
  }
  return btoa(binary)
}

function isHeic(file) {
  return file.type === 'image/heic' || file.type === 'image/heif' || heicExtensions.test(file.name)
}

function canvasToJpeg(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Could not compress avatar image'))
      },
      'image/jpeg',
      quality
    )
  })
}

async function prepareAvatar(file, maxBytes) {
  const convertHeic = isHeic(file)
  let image = file

  if (convertHeic) {
    const { heicTo } = await import('heic-to')
    image = await heicTo({ blob: file, type: 'image/jpeg', quality: 0.9 })
    if (!image) throw new Error('Could not convert HEIC avatar to JPEG')
  }

  if (!convertHeic && file.size <= maxBytes) {
    return { data: bytesToBase64(await file.arrayBuffer()), mime: file.type }
  }

  const bitmap = await window.createImageBitmap(image)
  try {
    let width = bitmap.width
    let height = bitmap.height
    let quality = 0.9

    for (let attempt = 0; attempt < 60; attempt++) {
      const canvas = window.document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const context = canvas.getContext('2d')
      if (!context) throw new Error('Could not process avatar image')
      context.fillStyle = '#fff'
      context.fillRect(0, 0, width, height)
      context.drawImage(bitmap, 0, 0, width, height)

      const compressed = await canvasToJpeg(canvas, quality)
      if (compressed.size <= maxBytes) {
        return { data: bytesToBase64(await compressed.arrayBuffer()), mime: 'image/jpeg' }
      }

      if (quality > 0.5) {
        quality = Math.max(0.5, quality - 0.1)
      } else {
        width = Math.max(1, Math.floor(width * 0.8))
        height = Math.max(1, Math.floor(height * 0.8))
        quality = 0.9
      }
    }
  } finally {
    bitmap.close()
  }

  throw new Error(
    `Could not compress avatar image to ${Math.round(maxBytes / 1024)} KiB or smaller`
  )
}

function fileFromAvatar(avatar) {
  const binary = atob(avatar.data)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index++) {
    bytes[index] = binary.charCodeAt(index)
  }
  return new File([bytes], 'avatar', { type: avatar.mime })
}

function avatarSource(avatar) {
  return avatar ? `data:${avatar.mime};base64,${avatar.data}` : ''
}

export function Profile({ profile, onSave, onError }) {
  const [nickname, setNickname] = useState(profile.nickname)
  const [avatar, setAvatar] = useState(profile.avatar)
  const [languageAvatar, setLanguageAvatar] = useState(profile.languageAvatar || null)

  useEffect(() => {
    setNickname(profile.nickname)
    setAvatar(profile.avatar)
    setLanguageAvatar(profile.languageAvatar || null)
  }, [profile])

  async function selectAvatar(event) {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const heic = isHeic(file)
      if (!heic && !supportedAvatarTypes.has(file.type)) {
        throw new Error('Choose a PNG, JPEG, WebP, GIF, or HEIC image')
      }
      const [userAvatar, smallAvatar] = await Promise.all([
        prepareAvatar(file, maxUserAvatarBytes),
        prepareAvatar(file, maxLanguageAvatarBytes)
      ])
      setAvatar(userAvatar)
      setLanguageAvatar(smallAvatar)
    } catch (error) {
      onError(error)
      event.target.value = ''
    }
  }

  async function submit(event) {
    event.preventDefault()
    try {
      let compressedLanguageAvatar = languageAvatar
      if (
        avatar &&
        (!compressedLanguageAvatar ||
          atob(compressedLanguageAvatar.data).length > maxLanguageAvatarBytes)
      ) {
        compressedLanguageAvatar = await prepareAvatar(
          fileFromAvatar(avatar),
          maxLanguageAvatarBytes
        )
      }
      setLanguageAvatar(compressedLanguageAvatar)
      onSave({ nickname, avatar, languageAvatar: compressedLanguageAvatar })
    } catch (error) {
      onError(error)
    }
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
            accept='image/png,image/jpeg,image/webp,image/gif,image/heic,image/heif,.heic,.heif'
            onChange={selectAvatar}
          />
          <small>
            PNG, JPEG, WebP, GIF, or HEIC; up to 2 MiB is saved to your profile, with an 80 KiB copy
            for each language.
          </small>
        </label>
        <div className='profile-avatar-actions'>
          {avatar && (
            <button
              type='button'
              className='quiet'
              onClick={() => {
                setAvatar(null)
                setLanguageAvatar(null)
              }}
            >
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
