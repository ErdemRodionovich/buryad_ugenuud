import { useState } from 'react'
import emojiGroups from 'unicode-emoji-json/data-by-group.json'
import emojiComponents from 'unicode-emoji-json/data-emoji-components.json'
import { useI18n } from './I18nContext'

const skinTones = Object.entries(emojiComponents)
  .filter(([name]) => name.endsWith('_skin_tone'))
  .map(([name, emoji]) => ({
    emoji,
    name: name.replaceAll('_', ' ')
  }))
const skinToneBases = new Set(
  emojiGroups
    .flatMap((group) => group.emojis)
    .filter(({ emoji, skin_tone_support }) => skin_tone_support && [...emoji].length === 1)
    .map(({ emoji }) => emoji)
)

function variantsFor(emoji, name) {
  const characters = [...emoji]
  const variants = []

  function addVariants(index, value, tones) {
    if (index === characters.length) {
      if (tones.length > 0) {
        variants.push({
          emoji: value,
          name: `${name} ${tones.join(' ')}`
        })
      }
      return
    }

    const character = characters[index]
    addVariants(index + 1, value + character, tones)
    if (skinToneBases.has(character)) {
      for (const tone of skinTones) {
        addVariants(index + 1, value + character + tone.emoji, [...tones, tone.name])
      }
    }
  }

  addVariants(0, '', [])
  return [{ emoji, name }, ...variants]
}

const groupedEmojiOptions = emojiGroups.map((group) => ({
  ...group,
  emojis: group.emojis.flatMap(({ emoji, name, skin_tone_support }) =>
    skin_tone_support ? variantsFor(emoji, name) : [{ emoji, name }]
  )
}))

export function EmojiPicker({ onSelect }) {
  const { t } = useI18n()
  const [search, setSearch] = useState('')
  const normalizedSearch = search.trim().toLocaleLowerCase()

  return (
    <div className='emoji-picker-panel'>
      <input
        type='search'
        aria-label={t('Search emojis')}
        placeholder={t('Search emojis')}
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      <div className='emoji-picker-results'>
        {groupedEmojiOptions.map((group) => {
          const emojis = group.emojis.filter(
            ({ name }) => !normalizedSearch || name.toLocaleLowerCase().includes(normalizedSearch)
          )
          if (emojis.length === 0) return null
          return (
            <section className='emoji-group' key={group.slug}>
              <h4>{t(group.name)}</h4>
              <div className='emoji-picker-options'>
                {emojis.map(({ emoji, name }) => (
                  <button
                    key={emoji}
                    type='button'
                    title={name}
                    aria-label={name}
                    onClick={() => onSelect(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
