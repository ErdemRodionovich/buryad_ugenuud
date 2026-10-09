import { createContext, useState } from 'react';

export const ActiveLanguageContext = createContext();

export function ActiveLanguageProvider({ children }) {
  const [activeLanguageId, setActiveLanguageId] = useState(null)
  const [isOwnerOfLanguage, setIsOwnerOfLanguage] = useState(false)

  return (
    <ActiveLanguageContext.Provider value={{ activeLanguageId, setActiveLanguageId, isOwnerOfLanguage, setIsOwnerOfLanguage }}>
      {children}
    </ActiveLanguageContext.Provider>
  );
}