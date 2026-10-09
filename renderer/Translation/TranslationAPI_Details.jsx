import { useContext, useState } from 'react'
import '../styles.css'
import { IPCContext } from '../IPCContext'
import { ActiveLanguageContext } from '../ActiveLanguageContext'
import { TranslationAPI_Context } from './TranslationAPI_Context'

export function TranslationAPI_Details() {
    const { request } = useContext(IPCContext)
    const { activeLanguageId, isOwnerOfLanguage } = useContext(ActiveLanguageContext)
    const { yKey, setYKey, yFolderID, setYFolderID } = useContext(TranslationAPI_Context)

    function handleYKeyChange(e) {
        setYKey(e.target.value)
    }

    function handleYFolderIDChange(e) {
        setYFolderID(e.target.value)
    }

    function handleSubmit(e) {
        e.preventDefault()
        request({
            type: 'language',
            data: {
                cmd: 'saveAPI_Details',
                languageId: activeLanguageId,
                yKey,
                yFolderID
            }
        })
    }

    return (
        <div>
            {isOwnerOfLanguage && (
                <form className='translation-api-details' onSubmit={handleSubmit} >
                    <p className='eyebrow'>Translation API details</p>
                    <div className='translation-api-field'>Yandex Translate API key: <input value={yKey} onChange={handleYKeyChange} required /></div>
                    <div className='translation-api-field'>Yandex Translate folder ID: <input value={yFolderID} onChange={handleYFolderIDChange} required /></div>
                    <button className='primary' type='submit'>Save</button>
                </form>
            )}
        </div>
    )

}
