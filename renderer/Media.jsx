import { useI18n } from './I18nContext'

const maxMediaBytes = 10 * 1024 * 1024

function emptyMedia() {
  return { url: '', data: '', mime: '', name: '' }
}

function mediaType(media) {
  if (media?.mime?.startsWith('video/')) return 'video'
  if (media?.mime?.startsWith('image/')) return 'image'
  return media?.type
}

export function MediaPreview({ media }) {
  const items = Array.isArray(media) ? media : media?.url ? [media] : []
  return (
    <div className='media-previews'>
      {items.map((item, index) => {
        const source = item.data ? `data:${item.mime};base64,${item.data}` : item.url
        const type = mediaType(item)
        if (type === 'video') {
          return (
            <video key={index} className='media-preview' src={source} controls preload='metadata' />
          )
        }
        if (type === 'image') {
          return <img key={index} className='media-preview' src={source} alt='' />
        }
        return null
      })}
    </div>
  )
}

function bytesToBase64(buffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000))
  }
  return btoa(binary)
}

export function MediaFields({ value, onChange, onError, label }) {
  const { t } = useI18n()
  function addMedia() {
    onChange([...value, emptyMedia()])
  }
  function removeMedia(index) {
    onChange(value.filter((_, mediaIndex) => mediaIndex !== index))
  }

  async function handleFile(index, event) {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      if (file.size > maxMediaBytes) throw new Error(t('Each media file must be 10 MB or smaller'))
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        throw new Error(t('Choose an image or video file'))
      }
      const data = bytesToBase64(await file.arrayBuffer())
      onChange(
        value.map((media, mediaIndex) =>
          mediaIndex === index ? { url: '', data, mime: file.type, name: file.name } : media
        )
      )
    } catch (error) {
      onError(error)
      event.target.value = ''
    }
  }

  return (
    <div className='media-fields'>
      {value.map((media, index) => (
        <div className='media-entry' key={index}>
          <label>{index === 0 ? label : `${label} ${index + 1}`}</label>
          <input
            key={`${index}-${media.name}`}
            type='file'
            accept='image/*,video/*'
            onChange={(event) => handleFile(index, event)}
          />
          {media.name && <small>{media.name}</small>}
          <button type='button' className='remove-media' onClick={() => removeMedia(index)}>
            {t('Remove')}
          </button>
        </div>
      ))}
      <button type='button' onClick={addMedia}>
        {t('Add media')}
      </button>
    </div>
  )
}
