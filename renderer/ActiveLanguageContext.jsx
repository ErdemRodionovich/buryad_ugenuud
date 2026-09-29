import { createContext, useState } from 'react';

export const ActiveLanguageContext = createContext();

export function ActiveLanguageProvider({ children }) {
  const [activeLanguageId, setActiveLanguageId] = useState(null)

  return (
    <ActiveLanguageContext.Provider value={{ activeLanguageId, setActiveLanguageId }}>
      {children}
    </ActiveLanguageContext.Provider>
  );
}