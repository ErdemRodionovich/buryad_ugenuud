import { useState, useContext } from 'react'
import './styles.css'
import { gTranslate } from './Translation/gTranslate'
import { yTranslate } from './Translation/yTranslate'
import { TranslationAPI_Context } from './Translation/TranslationAPI_Context'
import { SearchTranslationContext } from './SearchTranslationContext'
import { MediaPreview } from './Media'
import { IPCContext } from './IPCContext'
import { ActiveLanguageContext } from './ActiveLanguageContext'

export function TranslateWord() {
    const [word, setWord] = useState('')
    const [translationG, setTranslationG] = useState('')
    const [translationY, setTranslationY] = useState('')

    const { yKey, yFolderID, gKey, gProjectID } = useContext(TranslationAPI_Context)
    const { foundTranslations } = useContext(SearchTranslationContext)
    const { request } = useContext(IPCContext)
    const { activeLanguageId } = useContext(ActiveLanguageContext)

    const handleTranslate = () => {
        const w = word.trim().toLowerCase()
        request({
            type: 'search',
            data: {
                word: w,
                activeLanguageId
            }
        })
        setTranslationG(gTranslate(w, gKey, gProjectID))
        setTranslationY(yTranslate(w, yKey, yFolderID))
    }

    return (
        <div className="translate-panel">
            <p className='eyebrow'>Translate</p>
            <div className="translate-bar">
                <input
                    type="text"
                    value={word}
                    onChange={(e) => setWord(e.target.value)}
                    placeholder="Enter word to translate"
                />
                <button className='primary' type='submit' onClick={handleTranslate}>Translate</button>
            </div>
            {translationG && (
                <div className="translation-result">
                    {foundTranslations.map((t) => (
                        <div className='found-translation' key={t.translationID}>
                            <p>{t.language}</p>
                            <p>{t.translation}</p>
                            <p>{t.description}</p>
                            <MediaPreview media={t.media} />
                        </div>
                    ))}

                    <br />
                    Google translate: {translationG}<br />
                    Yandex translate: {translationY}
                </div>
            )}
        </div>
    )
}