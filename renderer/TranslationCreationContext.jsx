import { createContext, useState, useContext } from 'react';

export const TranslationCreationContext = createContext();

export function TranslationCreationProvider({ children }) {
  const [translationID, setTranslationID] = useState('')
  const [languageOfWordForTranslation, setLanguageOfWordForTranslation] = useState('')
  const [wordsForTranslation, setWordsForTranslation] = useState(['']);
  const [translations, setTranslations] = useState([{ translation: '', description: '', media: [] }]);

  return (
    <TranslationCreationContext.Provider value={{
      translationID,
      setTranslationID,
      languageOfWordForTranslation,
      setLanguageOfWordForTranslation,
      wordsForTranslation,
      setWordsForTranslation,
      translations,
      setTranslations
    }}>
      {children}
    </TranslationCreationContext.Provider>
  );
}