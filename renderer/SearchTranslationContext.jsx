import { createContext, useState, useContext } from 'react';

export const SearchTranslationContext = createContext();

export function SearchTranslationProvider({ children }) {
  const [foundTranslations, setFoundTranslations] = useState([{ translation: '', description: '', media: [], language: '', translationID: '' }]);

  return (
    <SearchTranslationContext.Provider value={{
      foundTranslations, setFoundTranslations
    }}>
      {children}
    </SearchTranslationContext.Provider>
  );
}