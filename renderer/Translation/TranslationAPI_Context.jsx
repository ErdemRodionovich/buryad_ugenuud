import { createContext, useState } from 'react'

export const TranslationAPI_Context = createContext();

export function TranslationAPI_Provider({ children }) {
    const [yKey, setYKey] = useState('')
    const [yFolderID, setYFolderID] = useState('')

    return (
        <TranslationAPI_Context.Provider value={{ yKey, setYKey, yFolderID, setYFolderID }}>
            {children}
        </TranslationAPI_Context.Provider>
    );
}