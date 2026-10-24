import { useState, useContext } from 'react'
import './styles.css'
import { gTranslate } from './Translation/gTranslate'
import { yTranslate } from './Translation/yTranslate'
import { TranslationAPI_Context } from './Translation/TranslationAPI_Context'
import { SearchTranslationContext } from './SearchTranslationContext'
import { MediaPreview } from './Media'
import { IPCContext } from './IPCContext'
import { ActiveLanguageContext } from './ActiveLanguageContext'

export function TranslateWord({ canEdit, canSuggest, onSuggestTranslation }) {
  const [word, setWord] = useState('')
  const [translationG, setTranslationG] = useState('')
  const [translationY, setTranslationY] = useState('')

  const { yKey, yFolderID, gKey, gProjectID } = useContext(TranslationAPI_Context)
  const { foundTranslations, setFoundTranslations } = useContext(SearchTranslationContext)
  const { request } = useContext(IPCContext)
  const { activeLanguageId } = useContext(ActiveLanguageContext)

  const handleTranslate = async () => {
    const w = word.trim().toLowerCase()
    if (!w) return
    setFoundTranslations([])
    setTranslationG('')
    setTranslationY('')
    request({
      type: 'search',
      data: {
        word: w,
        activeLanguageId
      }
    })
    const [googleTranslation, yandexTranslation] = await Promise.all([
      gTranslate(w, gKey, gProjectID),
      yTranslate(w, yKey, yFolderID)
    ])
    setTranslationG(googleTranslation)
    setTranslationY(yandexTranslation)
  }

  function editTranslation(translationID) {
    request({
      type: 'translation',
      data: {
        cmd: 'get-for-edit',
        translationID,
        languageId: activeLanguageId
      }
    })
  }

  return (
    <div className='translate-panel'>
      <p className='eyebrow'>Translate</p>
      <div className='translate-bar'>
        <input
          type='text'
          value={word}
          onChange={(e) => setWord(e.target.value)}
          placeholder='Enter word to translate'
        />
        <button className='primary' type='submit' onClick={handleTranslate}>
          Translate
        </button>
      </div>
      {translationG && (
        <div className='translation-result'>
          {foundTranslations.map((t, index) => (
            <div className='found-translation' key={index}>
              <p>{t.language}</p>
              <p>{t.translation}</p>
              <p>{t.description}</p>
              <MediaPreview media={t.media} />
              {canEdit && (
                <button className='primary' onClick={() => editTranslation(t.translationID)}>
                  Edit translation
                </button>
              )}
            </div>
          ))}
          <br />
          Google translate: {translationG}
          <br />
          Yandex translate: {translationY}
          {canSuggest && (
            <button
              type='button'
              className='primary'
              onClick={() =>
                onSuggestTranslation({
                  word: word.trim(),
                  sourceLanguage: foundTranslations.find((item) => item.language)?.language || '',
                  translations: [
                    ...foundTranslations.map((item) => item.translation),
                    translationG,
                    translationY
                  ].filter((translation) => translation && translation !== 'Translation failed')
                })
              }
            >
              Suggest translation
            </button>
          )}
        </div>
      )}
    </div>
  )
}
