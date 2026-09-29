import { useState, useContext } from 'react'
import './styles.css'
import { IPCContext } from './IPCContext'
import { PollContext } from './PollContext'
import { ActiveLanguageContext } from './ActiveLanguageContext'

function pollText(value) {
    return typeof value === 'string' ? value : value?.text || ''
}

export function Polls() {
    const { polls, setPolls, selectedPollId, setSelectedPollId, refresh } = useContext(PollContext)
    const { send } = useContext(IPCContext)
    const { activeLanguageId } = useContext(ActiveLanguageContext)

    const selectedPoll = polls.find((poll) => poll.id === selectedPollId)

    return (
        <section className='workspace'>
            <div className='poll-list'>
                <div className='section-heading'><h2>Open conversations</h2><button className='quiet' onClick={refresh}>Refresh</button></div>
                {polls.length === 0 && <p className='empty'>No polls yet. Start the first one.</p>}
                {polls.map((poll) => (
                    <button className={`poll-row ${poll.id === selectedPollId ? 'active' : ''}`} key={poll.id} onClick={() => setSelectedPollId(poll.id)}>
                        <strong>{pollText(poll.question)}</strong>
                        <span>{poll.closed ? 'Closed' : 'Open'} · {Object.values(poll.votes || {}).reduce((sum, count) => sum + count, 0)} votes</span>
                    </button>
                ))}
            </div>
            <div className='poll-detail'>
                {selectedPoll ? (
                    <>
                        <p className='eyebrow'>{selectedPoll.closed ? 'Voting closed' : 'Cast your vote'}</p>
                        <h2>{pollText(selectedPoll.question)}</h2>
                        <MediaPreview media={selectedPoll.questionMedia} />
                        <div className='options'>
                            {selectedPoll.options.map((option, index) => (
                                <button key={index} disabled={selectedPoll.closed} onClick={() => request({ type: 'poll', data: { cmd: 'vote', languageId: activeLanguageId, pollId: selectedPoll.id, optionIndex: index } })}>
                                    <span>{pollText(option)}<MediaPreview media={option.media} /></span>
                                    <b>{selectedPoll.votes?.[index] || 0}</b>
                                </button>
                            ))}
                        </div>
                        {!selectedPoll.closed && <button className='close-vote' onClick={() => request({ type: 'poll', data: { cmd: 'close', languageId: activeLanguageId, pollId: selectedPoll.id } })}>Close voting</button>}
                    </>
                ) : <p className='empty'>Select a poll to see the question and current results.</p>}
            </div>
        </section>
    );
}
