import { StrictMode, useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

const workerSpecifier = '/workers/main.js'
const decoder = new TextDecoder('utf-8')

function App() {
    const [version] = useState(() => window.bridge.pkg().version)
    const [status, setStatus] = useState(`v${version}`)
    const [peerCount, setPeerCount] = useState(0)
    const [languages, setLanguages] = useState([])
    const [activeLanguageId, setActiveLanguageId] = useState(null)
    const [languageName, setLanguageName] = useState('')
    const [languageDescription, setLanguageDescription] = useState('')
    const [joinKey, setJoinKey] = useState('')
    const [polls, setPolls] = useState([])
    const [selectedPollId, setSelectedPollId] = useState(null)
    const [question, setQuestion] = useState('')
    const [options, setOptions] = useState(['', ''])
    const [notice, setNotice] = useState('')
    const [updateReady, setUpdateReady] = useState(false)
    const [updating, setUpdating] = useState(false)
    const refreshTimer = useRef(null)

    useEffect(() => {
        window.bridge.startWorker(workerSpecifier)

        const offStdout = window.bridge.onWorkerStdout(workerSpecifier, (data) => {
            console.log('worker stdout', '[', workerSpecifier, ']:', decoder.decode(data))
        })
        const offStderr = window.bridge.onWorkerStderr(workerSpecifier, (data) => {
            console.error('worker stderr', '[', workerSpecifier, ']:', decoder.decode(data))
        })
        const offIpc = window.bridge.onWorkerIPC(workerSpecifier, (data) => {
            const message = decoder.decode(data)
            console.log('worker ipc', '[', workerSpecifier, ']:', message)

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

    function send(message) {
        window.bridge.writeWorkerIPC(workerSpecifier, JSON.stringify(message))
    }

    function refresh() {
        send({ type: 'poll', data: { cmd: 'get-all', languageId: activeLanguageId } })
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
            data: { cmd: 'create', languageId: activeLanguageId, poll: { question, options } }
        })
        setQuestion('')
        setOptions(['', ''])
    }

    function addOption() {
        setOptions((current) => [...current, ''])
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

    const selectedPoll = polls.find((poll) => poll.id === selectedPollId)
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
                    <section className='workspace'>
                        <div className='poll-list'>
                            <div className='section-heading'>
                                <h2>Open conversations</h2>
                                <button className='quiet' onClick={refresh}>
                                    Refresh
                                </button>
                            </div>
                            {polls.length === 0 && <p className='empty'>No polls yet. Start the first one.</p>}
                            {polls.map((poll) => (
                                <button
                                    className={`poll-row ${poll.id === selectedPollId ? 'active' : ''}`}
                                    key={poll.id}
                                    onClick={() => setSelectedPollId(poll.id)}
                                >
                                    <strong>{poll.question}</strong>
                                    <span>
                                        {poll.closed ? 'Closed' : 'Open'} ·{' '}
                                        {Object.values(poll.votes || {}).reduce((sum, count) => sum + count, 0)} votes
                                    </span>
                                </button>
                            ))}
                        </div>
                        <div className='poll-detail'>
                            {selectedPoll ? (
                                <>
                                    <p className='eyebrow'>
                                        {selectedPoll.closed ? 'Voting closed' : 'Cast your vote'}
                                    </p>
                                    <h2>{selectedPoll.question}</h2>
                                    <div className='options'>
                                        {selectedPoll.options.map((option, index) => (
                                            <button
                                                key={option}
                                                disabled={selectedPoll.closed}
                                                onClick={() =>
                                                    request({
                                                        type: 'poll',
                                                        data: {
                                                            cmd: 'vote',
                                                            languageId: activeLanguageId,
                                                            pollId: selectedPoll.id,
                                                            optionIndex: index
                                                        }
                                                    })
                                                }
                                            >
                                                <span>{option}</span>
                                                <b>{selectedPoll.votes?.[index] || 0}</b>
                                            </button>
                                        ))}
                                    </div>
                                    {!selectedPoll.closed && (
                                        <button
                                            className='close-vote'
                                            onClick={() =>
                                                request({
                                                    type: 'poll',
                                                    data: {
                                                        cmd: 'close',
                                                        languageId: activeLanguageId,
                                                        pollId: selectedPoll.id
                                                    }
                                                })
                                            }
                                        >
                                            Close voting
                                        </button>
                                    )}
                                </>
                            ) : (
                                <p className='empty'>Select a poll to see the question and current results.</p>
                            )}
                        </div>
                    </section>
                    <form className='create-panel' onSubmit={createPoll}>
                        <div>
                            <p className='eyebrow'>New poll</p>
                            <h2>Ask the community</h2>
                        </div>
                        <input
                            value={question}
                            onChange={(event) => setQuestion(event.target.value)}
                            placeholder='What should we decide together?'
                            required
                        />
                        {options.map((option, index) => (
                            <input
                                key={index}
                                value={option}
                                onChange={(event) =>
                                    setOptions((current) =>
                                        current.map((item, itemIndex) =>
                                            itemIndex === index ? event.target.value : item
                                        )
                                    )
                                }
                                placeholder={`Option ${index + 1}`}
                                required
                            />
                        ))}
                        <button type='button' onClick={addOption}>
                            Add option
                        </button>
                        <button className='primary' type='submit'>
                            Publish poll
                        </button>
                    </form>
                    {notice && <p className='notice'>{notice}</p>}
                </>
            )}
        </main>
    )
}

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <App />
    </StrictMode>
)
