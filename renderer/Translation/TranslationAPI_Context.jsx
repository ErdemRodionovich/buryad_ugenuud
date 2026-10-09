import { createContext, useState } from 'react'

export const TranslationAPI_Context = createContext();

export function TranslationAPI_Provider({ children }) {
    const [yKey, setYKey] = useState('')
    const [yFolderID, setYFolderID] = useState('')
    const [gKey, setGKey] = useState('')
    const [gProjectID, setGProjectID] = useState('')

    return (
        <TranslationAPI_Context.Provider value={{ yKey, setYKey, yFolderID, setYFolderID, gKey, setGKey, gProjectID, setGProjectID }}>
            {children}
        </TranslationAPI_Context.Provider>
    );
}