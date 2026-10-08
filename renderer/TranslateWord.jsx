import { useState } from 'react'
import './styles.css'
import { gTranslate } from './Translation/gTranslate'

export function TranslateWord() {
    const [word, setWord] = useState('')
    const [translationG, setTranslationG] = useState('')

    const handleTranslate = () => {
        if (word.trim()) {
            setTranslationG(gTranslate(word))
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
                    Google translate: {translationG}
                </div>
            )}
        </div>
    )
}