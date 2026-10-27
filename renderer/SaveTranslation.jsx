import { useState, useContext } from 'react'
import './styles.css'
import { IPCContext } from './IPCContext'
import { ActiveLanguageContext } from './ActiveLanguageContext'
import { TranslationCreationContext } from './TranslationCreationContext'
import { MediaFields, MediaPreview } from './Media'
import { ISO_languages } from './ISO_languages'
import { useI18n } from './I18nContext'

export function SaveTranslation() {
  const { t, languageName: getLanguageName } = useI18n()
  const { request } = useContext(IPCContext)
  const { activeLanguageId } = useContext(ActiveLanguageContext)
  const {
    translationID,
    setTranslationID,
    languageOfWordForTranslation,
    setLanguageOfWordForTranslation,
    wordsForTranslation,
    setWordsForTranslation,
    translations,
    setTranslations
  } = useContext(TranslationCreationContext)

  function updateLanguageOfWordForTranslation(language) {
    setLanguageOfWordForTranslation(language)
  }

  function updateWordForTranslation(index, word) {
    setWordsForTranslation(wordsForTranslation.map((w, i) => (i === index ? word : w)))
  }

  function addWordForTranslation() {
    setWordsForTranslation([...wordsForTranslation, ''])
  }

  function removeWordForTranslation(index) {
    setWordsForTranslation(wordsForTranslation.filter((_, i) => i !== index))
  }

  function addTranslation() {
    setTranslations([...translations, { translation: '', description: '', media: [] }])
  }

  function removeTranslation(index) {
    setTranslations(translations.filter((_, i) => i !== index))
  }

  function updateTranslation(index, field, value) {
    setTranslations(translations.map((t, i) => (i === index ? { ...t, [field]: value } : t)))
  }

  function handleSubmit(event) {
    event.preventDefault()
    request({
      type: 'translation',
      data: {
        cmd: 'save',
        translationID,
        languageId: activeLanguageId,
        languageOfWordForTranslation,
        wordsForTranslation,
        translations
      }
    })
    resetTranslation()
  }

  function resetTranslation() {
    setWordsForTranslation([''])
    setTranslations([{ translation: '', description: '', media: [] }])
    setTranslationID('')
  }

  function removeWholeTranslation() {
    request({
      type: 'translation',
      data: {
        cmd: 'remove',
        translationID,
        languageId: activeLanguageId,
        languageOfWordForTranslation
      }
    })
    resetTranslation()
  }

  return (
    <form className='save-translation' onSubmit={handleSubmit}>
      <div>
        <p className='eyebrow'>{t('Save Translation')}</p>
        <h2>{t('Add a new word translation')}</h2>
      </div>

      <div className='words-for-translation'>
        <select
          value={languageOfWordForTranslation}
          onChange={(e) => updateLanguageOfWordForTranslation(e.target.value)}
          required
        >
          <option value='' disabled>
            {t('Select source language')}
          </option>
          {ISO_languages().map(({ code, name }) => (
            <option key={code} value={code}>
              {getLanguageName(code, name)}
            </option>
          ))}
        </select>

        {wordsForTranslation.map((word, index) => (
          <div key={index}>
            <input
              value={word}
              onChange={(e) => updateWordForTranslation(index, e.target.value)}
              placeholder={t('Enter the word to translate')}
              required
            />

            {index > 0 && (
              <button
                type='button'
                className='remove-word-for-translation'
                onClick={() => removeWordForTranslation(index)}
              >
                {t('Remove word')}
              </button>
            )}
          </div>
        ))}

        <button type='button' onClick={addWordForTranslation}>
          {t('Add another word for the same translation')}
        </button>
      </div>

      {translations.map((translation, index) => (
        <div className='translation-entry' key={index}>
          <h3>{t('Translation {number}', { number: index + 1 })}</h3>

          <input
            value={translation.translation}
            onChange={(e) => updateTranslation(index, 'translation', e.target.value)}
            placeholder={t('Translation text')}
            required
          />

          <textarea
            value={translation.description}
            onChange={(e) => updateTranslation(index, 'description', e.target.value)}
            placeholder={t('Description or context')}
            rows={3}
          />

          <MediaFields
            value={translation.media}
            onChange={(media) => updateTranslation(index, 'media', media)}
            label={t('Media for this translation')}
          />

          {index > 0 && (
            <button
              type='button'
              className='remove-translation'
              onClick={() => removeTranslation(index)}
            >
              {t('Remove translation')}
            </button>
          )}
        </div>
      ))}

      <button type='button' onClick={addTranslation}>
        {t('Add another translation')}
      </button>

      <button type='submit' className='primary'>
        {t('Save Translation')}
      </button>

      {translationID !== '' && (
        <button type='button' onClick={() => removeWholeTranslation()}>
          {t('Remove whole translation')}
        </button>
      )}
    </form>
  )
}
