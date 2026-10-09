import { useState, useContext } from 'react'
import './styles.css'
import { gTranslate } from './Translation/gTranslate'
import { TranslationAPI_Context } from './Translation/TranslationAPI_Context'
import { yTranslate } from './Translation/yTranslate'

export function TranslateWord() {
    const [word, setWord] = useState('')
    const [translationG, setTranslationG] = useState('')
    const [translationY, setTranslationY] = useState('')

    const { yKey, yFolderID } = useContext(TranslationAPI_Context)

    const handleTranslate = () => {
        if (word.trim()) {
            setTranslationG(gTranslate(word))
            setTranslationY(yTranslate(word, yKey, yFolderID))
        }
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
                    Google translate: {translationG}<br />
                    Yandex translate: {translationY}
                </div>
            )}
        </div>
    )
}