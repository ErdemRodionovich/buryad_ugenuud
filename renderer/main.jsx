import { StrictMode, useEffect, useRef, useState, useContext } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import { PollContext, PollProvider } from './PollContext'
import { Polls } from './Polls'
import { IPCContext, IPCProvider } from './IPCContext'
import { ActiveLanguageContext, ActiveLanguageProvider } from './ActiveLanguageContext'

const decoder = new TextDecoder('utf-8')
const maxMediaBytes = 10 * 1024 * 1024

function emptyMedia() {
    return { url: '', data: '', mime: '', name: '' }
}

function mediaType(media) {
    if (media?.mime?.startsWith('video/')) return 'video'
    if (media?.mime?.startsWith('image/')) return 'image'
    return media?.type
}

function MediaPreview({ media }) {
    const items = Array.isArray(media) ? media : media?.url ? [media] : []
    return (
        <div className='media-previews'>
            {items.map((item, index) => {
                const source = item.data ? `data:${item.mime};base64,${item.data}` : item.url
                const type = mediaType(item)
                if (type === 'video') {
                    return <video key={index} className='media-preview' src={source} controls preload='metadata' />
                }
                if (type === 'image') return <img key={index} className='media-preview' src={source} alt='' />
                return null
            })}
        </div>
    )
}

function App() {
    const [version] = useState(() => window.bridge.pkg().version)
    const [status, setStatus] = useState(`v${version}`)
    const [peerCount, setPeerCount] = useState(0)
    const [languages, setLanguages] = useState([])
    const [languageName, setLanguageName] = useState('')
    const [languageDescription, setLanguageDescription] = useState('')
    const [joinKey, setJoinKey] = useState('')
    const [question, setQuestion] = useState({ text: '', media: [] })
    const [options, setOptions] = useState([
        { text: '', media: [] },
        { text: '', media: [] }
    ])
    const [notice, setNotice] = useState('')
    const [updateReady, setUpdateReady] = useState(false)
    const [updating, setUpdating] = useState(false)
    const refreshTimer = useRef(null)

    const { workerSpecifier, send } = useContext(IPCContext)
    const { activeLanguageId, setActiveLanguageId } = useContext(ActiveLanguageContext)
    const { setPolls, refresh } = useContext(PollContext)

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
                setActiveLanguageId(parsed.active)
            }
            if (parsed?.type === 'polls') setPolls(Object.values(parsed.data))
            if (parsed?.type === 'error') setNotice(parsed.data)
            if (parsed?.type === 'peers') setPeerCount(parsed.data)
        })
        const offExit = window.bridge.onWorkerExit(workerSpecifier, (code) => {
            console.log('Worker exited with code', code)
            offStdout()
            offStderr()
            offIpc()
            offExit()
        })
        return () => {
            clearTimeout(refreshTimer.current)
            offStdout()
            offStderr()
            offIpc()
            offExit()
        }
    }, [])

    useEffect(() => {
        send({ type: 'language', data: { cmd: 'list' } })
    }, [])

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

    function request(message) {
        setNotice('')
        send(message)
        if (message.type !== 'poll') return
        clearTimeout(refreshTimer.current)
        refreshTimer.current = setTimeout(refresh, 250)
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
        setPolls([])
        send({ type: 'language', data: { cmd: 'select', id } })
    }

    const activeLanguage = languages.find((language) => language.id === activeLanguageId)

    return (
        <main className='container'>
            <header className='topbar'>
                <div>
                    <p className='eyebrow'>Buryad Ugenuud</p>
                    <h1>{updateReady ? 'Update ready!' : activeLanguage?.name || 'Language library'}</h1>
                </div>
                <span className='status'>
                    {peerCount} {peerCount === 1 ? 'peer' : 'peers'} connected · {status}
                </span>
            </header>
            {updateReady && (
                <button onClick={applyUpdate} disabled={updating}>
                    {updating ? 'Updating...' : 'Apply update'}
                </button>
            )}
            {!activeLanguage ? (
                <section className='language-home'>
                    <div className='language-intro'>
                        <p className='eyebrow'>Shared study spaces</p>
                        <h2>Choose a language to begin</h2>
                        <p>Each language has its own replicated poll database. Create one or join with a shared key.</p>
                    </div>
                    <div className='language-forms'>
                        <form className='language-form' onSubmit={createLanguage}>
                            <h2>Create a language</h2>
                            <input value={languageName} onChange={(event) => setLanguageName(event.target.value)} placeholder='Language name' required />
                            <textarea value={languageDescription} onChange={(event) => setLanguageDescription(event.target.value)} placeholder='Short description' rows='3' />
                            <button className='primary' type='submit'>Create language</button>
                        </form>
                        <form className='language-form' onSubmit={joinLanguage}>
                            <h2>Join a language</h2>
                            <input value={joinKey} onChange={(event) => setJoinKey(event.target.value)} placeholder='Paste language key' pattern='[0-9a-fA-F]{64}' title='Use the 64-character language key' required />
                            <button className='primary' type='submit'>Join language</button>
                        </form>
                    </div>
                    {languages.length > 0 && (
                        <div className='joined-list'>
                            <h2>Your languages</h2>
                            {languages.map((language) => (
                                <button className='language-row' key={language.id} onClick={() => selectLanguage(language.id)}>
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
                            <button className='quiet' onClick={() => { setActiveLanguageId(null); setPolls([]) }}>All languages</button>
                            <button className='share-key' onClick={() => navigator.clipboard?.writeText(activeLanguage.key)}>Copy key</button>
                            <code>{activeLanguage.key}</code>
                        </div>
                    </div>
                    <Polls />
                    <form className='create-panel' onSubmit={createPoll}>
                        <div><p className='eyebrow'>New poll</p><h2>Ask the community</h2></div>
                        <input value={question.text} onChange={(event) => setQuestion((current) => ({ ...current, text: event.target.value }))} placeholder='What should we decide together?' required />
                        <MediaFields value={question.media} onChange={(media) => setQuestion((current) => ({ ...current, media }))} onError={(error) => setNotice(error.message)} label='Question media' />
                        {options.map((option, index) => (
                            <div className='option-fields' key={index}>
                                <input value={option.text} onChange={(event) => setOptions((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, text: event.target.value } : item))} placeholder={`Option ${index + 1}`} required />
                                <MediaFields value={option.media} onChange={(media) => setOptions((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, media } : item))} onError={(error) => setNotice(error.message)} label={`Option ${index + 1} media`} />
                            </div>
                        ))}
                        <button type='button' onClick={() => setOptions((current) => [...current, { text: '', media: [] }])}>Add option</button>
                        <button className='primary' type='submit'>Publish poll</button>
                    </form>
                    {notice && <p className='notice'>{notice}</p>}
                </>
            )}
        </main>
    )
}

function bytesToBase64(buffer) {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let offset = 0; offset < bytes.length; offset += 0x8000) binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000))
    return btoa(binary)
}

function MediaFields({ value, onChange, onError, label }) {
    function addMedia() { onChange([...value, emptyMedia()]) }
    function removeMedia(index) { onChange(value.filter((_, mediaIndex) => mediaIndex !== index)) }

    async function handleFile(index, event) {
        const file = event.target.files?.[0]
        if (!file) return
        try {
            if (file.size > maxMediaBytes) throw new Error('Each media file must be 10 MB or smaller')
            if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) throw new Error('Choose an image or video file')
            const data = bytesToBase64(await file.arrayBuffer())
            onChange(value.map((media, mediaIndex) => mediaIndex === index ? { url: '', data, mime: file.type, name: file.name } : media))
        } catch (error) {
            onError(error)
            event.target.value = ''
        }
    }

    return (
        <div className='media-fields'>
            {value.map((media, index) => (
                <div className='media-entry' key={index}>
                    <label>{index === 0 ? label : `${label} ${index + 1}`}</label>
                    <input key={`${index}-${media.name}`} type='file' accept='image/*,video/*' onChange={(event) => handleFile(index, event)} />
                    {media.name && <small>{media.name}</small>}
                    <button type='button' className='remove-media' onClick={() => removeMedia(index)}>Remove</button>
                </div>
            ))}
            <button type='button' onClick={addMedia}>Add media</button>
        </div>
    )
}

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <IPCProvider>
            <ActiveLanguageProvider>
                <PollProvider>
                    <App />
                </PollProvider>
            </ActiveLanguageProvider>
        </IPCProvider>
    </StrictMode>
)
