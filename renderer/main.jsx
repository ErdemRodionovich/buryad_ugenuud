import { StrictMode, useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

const workerSpecifier = '/workers/main.js'
const decoder = new TextDecoder('utf-8')

function App() {
    const [version] = useState(() => window.bridge.pkg().version)
    const [status, setStatus] = useState(`v${version}`)
    const [pong, setPong] = useState('')
    const [polls, setPolls] = useState('')
    const [errors, setErrors] = useState([])
    const [updateReady, setUpdateReady] = useState(false)
    const [updating, setUpdating] = useState(false)
    const sentHello = useRef(false)

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

            if (parsed?.type === 'pong') setPong('Worker time: ' + parsed.time)
            if (parsed?.type === 'polls') setPolls(JSON.stringify(parsed.data))
            if (parsed?.type === 'error') setErrors((current) => [...current, parsed.data])

            if (!sentHello.current) {
                sentHello.current = true
                window.bridge.writeWorkerIPC(workerSpecifier, 'Hello from renderer')
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
            offStdout()
            offStderr()
            offIpc()
            offExit()
        }
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

    return (
        <main className='container'>
            <h1>{updateReady ? 'Update ready!' : status}</h1>
            {updateReady && (
                <button onClick={applyUpdate} disabled={updating}>
                    {updating ? 'Updating...' : 'Apply update'}
                </button>
            )}
            <button onClick={() => send({ type: 'ping' })}>Ping worker</button>
            <p>{pong}</p>
            <button
                onClick={() =>
                    send({
                        type: 'poll',
                        data: {
                            cmd: 'create',
                            poll: { question: 'Where to go?', options: ['There', 'Somewhere'] }
                        }
                    })
                }
            >
                Create poll
            </button>
            <button onClick={() => send({ type: 'poll', data: { cmd: 'get-all' } })}>
                Get all polls
            </button>
            <p>{polls}</p>
            <p>{errors.join('\n')}</p>
        </main>
    )
}

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <App />
    </StrictMode>
)
