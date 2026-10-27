import { useContext, useState } from 'react'
import '../styles.css'
import { IPCContext } from '../IPCContext'
import { ActiveLanguageContext } from '../ActiveLanguageContext'
import { TranslationAPI_Context } from './TranslationAPI_Context'
import { useI18n } from '../I18nContext'

export function TranslationAPI_Details({ canEdit }) {
  const { t } = useI18n()
  const { request } = useContext(IPCContext)
  const { activeLanguageId } = useContext(ActiveLanguageContext)
  const { yKey, setYKey, yFolderID, setYFolderID, gKey, setGKey, gProjectID, setGProjectID } =
    useContext(TranslationAPI_Context)

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
      {canEdit && (
        <form className='translation-api-details' onSubmit={handleSubmit}>
          <p className='eyebrow'>{t('Translation API details')}</p>
          <div className='translation-api-field'>
            {t('Yandex Translate API key')}:{' '}
            <input value={yKey} onChange={handleYKeyChange} required />
          </div>
          <div className='translation-api-field'>
            {t('Yandex Translate folder ID')}:{' '}
            <input value={yFolderID} onChange={handleYFolderIDChange} required />
          </div>
          <div className='translation-api-field'>
            {t('Google Translate API key')}:{' '}
            <input value={gKey} onChange={handleGKeyChange} required />
          </div>
          <div className='translation-api-field'>
            {t('Google Cloud Project ID')}:{' '}
            <input value={gProjectID} onChange={handleGProjectIDChange} required />
          </div>
          <button className='primary' type='submit'>
            {t('Save')}
          </button>
        </form>
      )}
    </div>
  )
}
