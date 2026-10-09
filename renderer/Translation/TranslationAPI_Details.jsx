import { useContext, useState } from 'react'
import '../styles.css'
import { IPCContext } from '../IPCContext'
import { ActiveLanguageContext } from '../ActiveLanguageContext'
import { TranslationAPI_Context } from './TranslationAPI_Context'

export function TranslationAPI_Details() {
    const { request } = useContext(IPCContext)
    const { activeLanguageId, isOwnerOfLanguage } = useContext(ActiveLanguageContext)
    const { yKey, setYKey, yFolderID, setYFolderID, gKey, setGKey, gProjectID, setGProjectID } = useContext(TranslationAPI_Context)

    function handleYKeyChange(e) {
        setYKey(e.target.value)
    }

    function handleYFolderIDChange(e) {
        setYFolderID(e.target.value)
    }

    function handleGKeyChange(e) {
        setGKey(e.target.value)
    }

    function handleGProjectIDChange(e) {
        setGProjectID(e.target.value)
    }

    function handleSubmit(e) {
        e.preventDefault()
        request({
            type: 'language',
            data: {
                cmd: 'saveAPI_Details',
                languageId: activeLanguageId,
                yKey,
                yFolderID,
                gKey,
                gProjectID
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
                    <div className='translation-api-field'>Google Translate API key: <input value={gKey} onChange={handleGKeyChange} required /></div>
                    <div className='translation-api-field'>Google Cloud Project ID: <input value={gProjectID} onChange={handleGProjectIDChange} required /></div>
                    <button className='primary' type='submit'>Save</button>
                </form>
            )}
        </div>
    )

}
