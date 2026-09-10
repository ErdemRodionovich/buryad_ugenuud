import { StrictMode, useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

const workerSpecifier = '/workers/main.js'
const decoder = new TextDecoder('utf-8')

function App() {
    const [version] = useState(() => window.bridge.pkg().version)
    const [status, setStatus] = useState(`v${version}`)
    const [peerCount, setPeerCount] = useState(0)
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
        send({ type: 'poll', data: { cmd: 'get-all' } })
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
        send({ type: 'poll', data: { cmd: 'get-all' } })
    }

    function request(message) {
        setNotice('')
        send(message)
        clearTimeout(refreshTimer.current)
        refreshTimer.current = setTimeout(refresh, 250)
    }

    function createPoll(event) {
        event.preventDefault()
        request({
            type: 'poll',
            data: { cmd: 'create', poll: { question, options } }
        })
        setQuestion('')
        setOptions(['', ''])
    }

    const selectedPoll = polls.find((poll) => poll.id === selectedPollId)

    return (
        <main className='container'>
            <header className='topbar'>
                <div>
                    <p className='eyebrow'>Buryad Ugenuud</p>
                    <h1>{updateReady ? 'Update ready!' : 'Community polls'}</h1>
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
                            <p className='eyebrow'>{selectedPoll.closed ? 'Voting closed' : 'Cast your vote'}</p>
                            <h2>{selectedPoll.question}</h2>
                            <div className='options'>
                                {selectedPoll.options.map((option, index) => (
                                    <button
                                        key={option}
                                        disabled={selectedPoll.closed}
                                        onClick={() =>
                                            request({
                                                type: 'poll',
                                                data: { cmd: 'vote', pollId: selectedPoll.id, optionIndex: index }
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
                                        request({ type: 'poll', data: { cmd: 'close', pollId: selectedPoll.id } })
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
                                current.map((item, itemIndex) => (itemIndex === index ? event.target.value : item))
                            )
                        }
                        placeholder={`Option ${index + 1}`}
                        required
                    />
                ))}
                <button className='primary' type='submit'>
                    Publish poll
                </button>
            </form>
            {notice && <p className='notice'>{notice}</p>}
        </main>
    )
}

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <App />
    </StrictMode>
)
