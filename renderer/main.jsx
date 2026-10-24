import { StrictMode, useEffect, useState, useContext } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import { PollContext, PollProvider } from './PollContext'
import { Polls } from './Polls'
import { IPCContext, IPCProvider } from './IPCContext'
import { ActiveLanguageContext, ActiveLanguageProvider } from './ActiveLanguageContext'
import { MediaFields } from './Media'
import { Profile } from './Profile'
import { Pairing } from './Pairing'
import { LanguageRoles } from './LanguageRoles'
import { UserPage } from './UserPage'
import { TranslateWord } from './TranslateWord'
import {
  TranslationAPI_Context,
  TranslationAPI_Provider
} from './Translation/TranslationAPI_Context'
import { TranslationAPI_Details } from './Translation/TranslationAPI_Details'
import { SaveTranslation } from './SaveTranslation'
import {
  TranslationCreationContext,
  TranslationCreationProvider
} from './TranslationCreationContext'
import { SearchTranslationContext, SearchTranslationProvider } from './SearchTranslationContext'

const decoder = new TextDecoder('utf-8')

function App() {
  const [version] = useState(() => window.bridge.pkg().version)
  const [status, setStatus] = useState(`v${version}`)
  const [peerCount, setPeerCount] = useState(0)
  const [languages, setLanguages] = useState([])
  const [languageRoles, setLanguageRoles] = useState([])
  const [rolesLanguageId, setRolesLanguageId] = useState(null)
  const [languageMembers, setLanguageMembers] = useState([])
  const [membersLanguageId, setMembersLanguageId] = useState(null)
  const [accountKey, setAccountKey] = useState(null)
  const [profile, setProfile] = useState({ nickname: '', avatar: null })
  const [profileLoaded, setProfileLoaded] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [pairingStatus, setPairingStatus] = useState(null)
  const [pairingRequestCode, setPairingRequestCode] = useState('')
  const [pairingApprovalCode, setPairingApprovalCode] = useState('')
  const [pairingConnectionStatuses, setPairingConnectionStatuses] = useState({})
  const [languageName, setLanguageName] = useState('')
  const [languageDescription, setLanguageDescription] = useState('')
  const [joinKey, setJoinKey] = useState('')
  const [question, setQuestion] = useState({ text: '', media: [] })
  const [options, setOptions] = useState([
    { text: '', media: [] },
    { text: '', media: [] }
  ])

  const [updateReady, setUpdateReady] = useState(false)
  const [updating, setUpdating] = useState(false)

  const { workerSpecifier, send, request, notice, setNotice } = useContext(IPCContext)
  const { activeLanguageId, setActiveLanguageId, setIsOwnerOfLanguage } =
    useContext(ActiveLanguageContext)
  const { setPolls, setCommentsByPoll, resetRefresher, clearRefresherTimeout } =
    useContext(PollContext)

  const activeLanguage = findActiveLanguage()
  const currentRoles =
    rolesLanguageId === activeLanguageId
      ? languageRoles.find((user) => user.userKey === accountKey)?.roles || []
      : []
  const canManageLanguage = Boolean(
    activeLanguage?.isOwner || currentRoles.includes('administrator')
  )
  const canCreateWords = canManageLanguage || currentRoles.includes('word-creator')
  const canCreatePolls = canManageLanguage || !currentRoles.includes('banned-create-vote')

  const { setYKey, setYFolderID, setGKey, setGProjectID } = useContext(TranslationAPI_Context)
  const { setFoundTranslations } = useContext(SearchTranslationContext)
  const {
    setTranslationID,
    setLanguageOfWordForTranslation,
    setWordsForTranslation,
    setTranslations
  } = useContext(TranslationCreationContext)

  useEffect(() => {
    window.bridge.startWorker(workerSpecifier)
    const offStdout = window.bridge.onWorkerStdout(workerSpecifier, (data) =>
      console.log('worker stdout', '[', workerSpecifier, ']:', decoder.decode(data))
    )
    const offStderr = window.bridge.onWorkerStderr(workerSpecifier, (data) =>
      console.error('worker stderr', '[', workerSpecifier, ']:', decoder.decode(data))
    )
    const offIpc = window.bridge.onWorkerIPC(workerSpecifier, (data) => {
      const message = decoder.decode(data)
      let parsed
      try {
        parsed = JSON.parse(message)
      } catch {
        if (message === 'updating') setStatus('UPDATING...')
        if (message === 'updated') setUpdateReady(true)
      }
      if (parsed?.type === 'languages') {
        setLanguages(parsed.data)
        if (activeLanguageId !== parsed.active && activeLanguageId) {
          selectLanguage(parsed.active)
        }
        const lang = parsed.data.find((language) => language.id === parsed.active)
        setIsOwnerOfLanguage(lang ? lang.isOwner : false)
      }
      if (parsed?.type === 'language-roles') {
        setLanguageRoles(parsed.roles)
        setRolesLanguageId(parsed.languageId)
        setAccountKey(parsed.accountKey)
        const current = parsed.roles.find((user) => user.userKey === parsed.accountKey)
        const admin = Boolean(current?.roles.includes('administrator'))
        setLanguages((items) =>
          items.map((language) =>
            language.id === parsed.languageId ? { ...language, isOwner: admin } : language
          )
        )
      }
      if (parsed?.type === 'language-members') {
        setLanguageMembers(parsed.members)
        setMembersLanguageId(parsed.languageId)
      }
      if (parsed?.type === 'polls') setPolls(Object.values(parsed.data))
      if (parsed?.type === 'poll-comments') {
        setCommentsByPoll((current) => ({
          ...current,
          [`${parsed.languageId}/${parsed.pollId}`]: parsed.data
        }))
      }
      if (parsed?.type === 'error') setNotice(parsed.data)
      if (parsed?.type === 'peers') setPeerCount(parsed.data)
      if (parsed?.type === 'profile') {
        setProfile(parsed.data)
        setProfileLoaded(true)
      }
      if (parsed?.type === 'pairing-status') setPairingStatus(parsed.data)
      if (parsed?.type === 'pairing-request') setPairingRequestCode(parsed.data)
      if (parsed?.type === 'pairing-approval') setPairingApprovalCode(parsed.data)
      if (parsed?.type === 'pairing-connection-status') {
        setPairingConnectionStatuses((current) => ({
          ...current,
          [parsed.data.requestId]: parsed.data.status
        }))
      }
      if (parsed?.type === 'translation-api-details') {
        setYKey(parsed.data.yKey)
        setYFolderID(parsed.data.yFolderID)
        setGKey(parsed.data.gKey)
        setGProjectID(parsed.data.gProjectID)
      }
      if (parsed?.type === 'found-translations') {
        setFoundTranslations(parsed.data)
      }
      if (parsed?.type === 'translation-for-edit') {
        setTranslationID(parsed.data.translationID)
        setTranslations(parsed.data.translations)
        setLanguageOfWordForTranslation(parsed.data.languageOfWordForTranslation)
        setWordsForTranslation(parsed.data.wordsForTranslation)
      }
    })
    const offExit = window.bridge.onWorkerExit(workerSpecifier, (code) => {
      console.log('Worker exited with code', code)
      offStdout()
      offStderr()
      offIpc()
      offExit()
    })
    return () => {
      clearRefresherTimeout()
      offStdout()
      offStderr()
      offIpc()
      offExit()
    }
  }, [])

  useEffect(() => {
    send({ type: 'profile', data: { cmd: 'get' } })
    send({ type: 'pairing', data: { cmd: 'status' } })
    send({ type: 'language', data: { cmd: 'list' } })
  }, [])

  useEffect(() => {
    if (activeLanguageId && canManageLanguage) {
      setLanguageMembers([])
      setMembersLanguageId(activeLanguageId)
      send({ type: 'language', data: { cmd: 'get-members', languageId: activeLanguageId } })
    } else {
      setLanguageMembers([])
      setMembersLanguageId(null)
    }
  }, [activeLanguageId, canManageLanguage])

  async function applyUpdate() {
    setUpdating(true)
    setStatus('Updating...')
    try {
      await window.bridge.applyUpdate()
      await window.bridge.appAfterUpdate()
    } catch (error) {
      setStatus('Update failed: ' + error.message)
      setUpdateReady(false)
      setUpdating(false)
    }
  }

  function createPoll(event) {
    event.preventDefault()
    request({
      type: 'poll',
      data: {
        cmd: 'create',
        languageId: activeLanguageId,
        poll: { question: question.text, questionMedia: question.media, options }
      }
    })
    resetRefresher()
    setQuestion({ text: '', media: [] })
    setOptions([
      { text: '', media: [] },
      { text: '', media: [] }
    ])
  }

  function createLanguage(event) {
    event.preventDefault()
    request({
      type: 'language',
      data: { cmd: 'create', name: languageName, description: languageDescription }
    })
    setLanguageName('')
    setLanguageDescription('')
  }

  function joinLanguage(event) {
    event.preventDefault()
    request({ type: 'language', data: { cmd: 'join', key: joinKey } })
    setJoinKey('')
  }

  function selectLanguage(id) {
    setActiveLanguageId(id)
    const lang = findActiveLanguage(id)
    setIsOwnerOfLanguage(lang ? lang.isOwner : false)
    setPolls([])
    setCommentsByPoll({})
    send({ type: 'language', data: { cmd: 'select', id } })
  }

  function findActiveLanguage(id = activeLanguageId) {
    return languages.find((language) => language.id === id)
  }

  return (
    <main className='container'>
      <header className='topbar'>
        <div>
          <p className='eyebrow'>Buryad Ugenuud</p>
          <h1>
            {updateReady
              ? 'Update ready!'
              : selectedUser?.nickname || activeLanguage?.name || 'Language library'}
          </h1>
        </div>
        <span className='status'>
          {peerCount} {peerCount === 1 ? 'peer' : 'peers'} connected · {status}
        </span>
      </header>
      {!selectedUser && profileLoaded && (
        <Profile
          profile={profile}
          onSave={(data) => request({ type: 'profile', data: { cmd: 'save', ...data } })}
          onError={(error) => setNotice(error.message)}
        />
      )}
      {!selectedUser && pairingStatus && (
        <Pairing
          status={pairingStatus}
          requestCode={pairingRequestCode}
          approvalCode={pairingApprovalCode}
          connectionStatuses={pairingConnectionStatuses}
          onCreateRequest={() => request({ type: 'pairing', data: { cmd: 'create-request' } })}
          onApprove={(code) => request({ type: 'pairing', data: { cmd: 'approve', code } })}
          onComplete={(code) => request({ type: 'pairing', data: { cmd: 'complete', code } })}
          onError={(error) => setNotice(error.message)}
        />
      )}
      {notice && (
        <p className='notice' role='alert'>
          {notice}
        </p>
      )}
      {updateReady && (
        <button onClick={applyUpdate} disabled={updating}>
          {updating ? 'Updating...' : 'Apply update'}
        </button>
      )}
      {selectedUser ? (
        <UserPage
          user={selectedUser}
          canManage={canManageLanguage}
          roles={
            canManageLanguage && rolesLanguageId === activeLanguageId
              ? languageRoles.find((user) => user.userKey.toLowerCase() === selectedUser.userKey)
                  ?.roles || []
              : []
          }
          onBack={() => setSelectedUser(null)}
          onRoleChange={(target, role, enabled) =>
            request({
              type: 'language',
              data: { cmd: 'set-role', languageId: activeLanguageId, target, role, enabled }
            })
          }
        />
      ) : !activeLanguage ? (
        <section className='language-home'>
          <div className='language-intro'>
            <p className='eyebrow'>Shared study spaces</p>
            <h2>Choose a language to begin</h2>
            <p>
              Each language has its own replicated poll database. Create one or join with a shared
              key.
            </p>
          </div>
          <div className='language-forms'>
            <form className='language-form' onSubmit={createLanguage}>
              <h2>Create a language</h2>
              <input
                value={languageName}
                onChange={(event) => setLanguageName(event.target.value)}
                placeholder='Language name'
                required
              />
              <textarea
                value={languageDescription}
                onChange={(event) => setLanguageDescription(event.target.value)}
                placeholder='Short description'
                rows='3'
              />
              <button className='primary' type='submit'>
                Create language
              </button>
            </form>
            <form className='language-form' onSubmit={joinLanguage}>
              <h2>Join a language</h2>
              <input
                value={joinKey}
                onChange={(event) => setJoinKey(event.target.value)}
                placeholder='Paste language key'
                pattern='[0-9a-fA-F]{64}'
                title='Use the 64-character language key'
                required
              />
              <button className='primary' type='submit'>
                Join language
              </button>
            </form>
          </div>
          {languages.length > 0 && (
            <div className='joined-list'>
              <h2>Your languages</h2>
              {languages.map((language) => (
                <button
                  className='language-row'
                  key={language.id}
                  onClick={() => selectLanguage(language.id)}
                >
                  <strong>{language.name}</strong>
                  <span>{language.description || 'No description'}</span>
                </button>
              ))}
            </div>
          )}
        </section>
      ) : (
        <>
          <div className='language-bar'>
            <div>
              <p className='eyebrow'>Language</p>
              <h2>{activeLanguage.name}</h2>
              <p>{activeLanguage.description}</p>
            </div>
            <div className='language-actions'>
              <button
                className='quiet'
                onClick={() => {
                  setActiveLanguageId(null)
                  setIsOwnerOfLanguage(false)
                  setPolls([])
                }}
              >
                All languages
              </button>
              <button
                className='share-key'
                onClick={() => navigator.clipboard?.writeText(activeLanguage.key)}
              >
                Copy key
              </button>
              <code>{activeLanguage.key}</code>
            </div>
          </div>
          <TranslationAPI_Details canEdit={canManageLanguage} />
          <LanguageRoles
            accountKey={rolesLanguageId === activeLanguageId ? accountKey : null}
            canManage={canManageLanguage}
            members={membersLanguageId === activeLanguageId ? languageMembers : []}
            roles={rolesLanguageId === activeLanguageId ? languageRoles : []}
            onOpenUser={setSelectedUser}
            onAssign={(target, role, enabled) =>
              request({
                type: 'language',
                data: { cmd: 'set-role', languageId: activeLanguageId, target, role, enabled }
              })
            }
          />
          <TranslateWord canEdit={canCreateWords} />
          {canCreateWords && <SaveTranslation />}
          <Polls
            canComment={canManageLanguage || !currentRoles.includes('banned-comment')}
            canManageLanguage={canManageLanguage}
            onOpenUser={setSelectedUser}
          />
          {canCreatePolls && (
            <form className='create-panel' onSubmit={createPoll}>
              <div>
                <p className='eyebrow'>New poll</p>
                <h2>Ask the community</h2>
              </div>
              <input
                value={question.text}
                onChange={(event) =>
                  setQuestion((current) => ({ ...current, text: event.target.value }))
                }
                placeholder='What should we decide together?'
                required
              />
              <MediaFields
                value={question.media}
                onChange={(media) => setQuestion((current) => ({ ...current, media }))}
                onError={(error) => setNotice(error.message)}
                label='Question media'
              />
              {options.map((option, index) => (
                <div className='option-fields' key={index}>
                  <input
                    value={option.text}
                    onChange={(event) =>
                      setOptions((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, text: event.target.value } : item
                        )
                      )
                    }
                    placeholder={`Option ${index + 1}`}
                    required
                  />
                  <MediaFields
                    value={option.media}
                    onChange={(media) =>
                      setOptions((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, media } : item
                        )
                      )
                    }
                    onError={(error) => setNotice(error.message)}
                    label={`Option ${index + 1} media`}
                  />
                </div>
              ))}
              <button
                type='button'
                onClick={() => setOptions((current) => [...current, { text: '', media: [] }])}
              >
                Add option
              </button>
              <button className='primary' type='submit'>
                Publish poll
              </button>
            </form>
          )}
        </>
      )}
    </main>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <IPCProvider>
      <ActiveLanguageProvider>
        <TranslationAPI_Provider>
          <PollProvider>
            <TranslationCreationProvider>
              <SearchTranslationProvider>
                <App />
              </SearchTranslationProvider>
            </TranslationCreationProvider>
          </PollProvider>
        </TranslationAPI_Provider>
      </ActiveLanguageProvider>
    </IPCProvider>
  </StrictMode>
)
