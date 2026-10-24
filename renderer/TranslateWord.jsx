import { useState, useContext, useRef } from 'react'
import './styles.css'
import { gTranslate } from './Translation/gTranslate'
import { yTranslate } from './Translation/yTranslate'
import { burlangTranslate } from './Translation/burlangTranslate'
import { TranslationAPI_Context } from './Translation/TranslationAPI_Context'
import { SearchTranslationContext } from './SearchTranslationContext'
import { MediaPreview } from './Media'
import { IPCContext } from './IPCContext'
import { ActiveLanguageContext } from './ActiveLanguageContext'

function hasTranslation(translation) {
  return (
    translation && translation !== 'Translation failed' && translation !== 'No translation found'
  )
}

export function TranslateWord({ canEdit, canSuggest, onSuggestTranslation }) {
  const [word, setWord] = useState('')
  const [translationG, setTranslationG] = useState('')
  const [translationY, setTranslationY] = useState('')
  const [translationB, setTranslationB] = useState('')
  const translationRequestId = useRef(0)

  const { yKey, yFolderID, gKey, gProjectID } = useContext(TranslationAPI_Context)
  const { foundTranslations, setFoundTranslations } = useContext(SearchTranslationContext)
  const { request } = useContext(IPCContext)
  const { activeLanguageId } = useContext(ActiveLanguageContext)

  const handleTranslate = () => {
    const w = word.trim().toLowerCase()
    if (!w) return
    const requestId = ++translationRequestId.current
    setFoundTranslations([])
    setTranslationG('')
    setTranslationY('')
    setTranslationB('')
    request({
      type: 'search',
      data: {
        word: w,
        activeLanguageId
      }
    })
    gTranslate(w, gKey, gProjectID).then((translation) => {
      if (requestId === translationRequestId.current) setTranslationG(translation)
    })
    yTranslate(w, yKey, yFolderID).then((translation) => {
      if (requestId === translationRequestId.current) setTranslationY(translation)
    })
    burlangTranslate(w).then((translation) => {
      if (requestId === translationRequestId.current) setTranslationB(translation)
    })
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
      {(foundTranslations.length > 0 ||
        hasTranslation(translationG) ||
        hasTranslation(translationY) ||
        hasTranslation(translationB)) && (
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
          {hasTranslation(translationG) && (
            <>
              <br />
              Google translate: {translationG}
            </>
          )}
          {hasTranslation(translationY) && (
            <>
              <br />
              Yandex translate: {translationY}
            </>
          )}
          {hasTranslation(translationB) && (
            <>
              <br />
              Burlang: {translationB}
            </>
          )}
          {canSuggest && (
            <>
              <br />
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
                      translationY,
                      translationB
                    ].filter(hasTranslation)
                  })
                }
              >
                Suggest translation
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
