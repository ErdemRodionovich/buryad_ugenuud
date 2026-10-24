import { lazy, Suspense, useContext, useEffect, useRef, useState } from 'react'
import './styles.css'
import { IPCContext } from './IPCContext'
import { PollContext } from './PollContext'
import { ActiveLanguageContext } from './ActiveLanguageContext'
import { MediaFields, MediaPreview } from './Media'
import { UserIdentity } from './UserIdentity'

const EmojiPicker = lazy(() =>
  import('./EmojiPicker').then((module) => ({ default: module.EmojiPicker }))
)

function pollText(value) {
  return typeof value === 'string' ? value : value?.text || ''
}

export function Polls({ canComment, onOpenUser }) {
  const { polls, commentsByPoll, selectedPollId, setSelectedPollId, refresh } =
    useContext(PollContext)
  const { request, setNotice } = useContext(IPCContext)
  const { activeLanguageId } = useContext(ActiveLanguageContext)
  const [commentText, setCommentText] = useState('')
  const [commentMedia, setCommentMedia] = useState([])
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false)
  const [reactionPickerCommentId, setReactionPickerCommentId] = useState(null)
  const commentInput = useRef(null)
  const requestRef = useRef(request)
  requestRef.current = request

  const selectedPoll = polls.find((poll) => poll.id === selectedPollId)
  const comments = selectedPoll
    ? commentsByPoll[`${activeLanguageId}/${selectedPoll.id}`] || []
    : []

  useEffect(() => {
    if (!activeLanguageId || !selectedPoll) return
    requestRef.current({
      type: 'comment',
      data: { cmd: 'get-all', languageId: activeLanguageId, pollId: selectedPoll.id }
    })
  }, [activeLanguageId, selectedPoll?.id])

  function submitComment(event) {
    event.preventDefault()
    if (!selectedPoll) return
    request({
      type: 'comment',
      data: {
        cmd: 'create',
        languageId: activeLanguageId,
        pollId: selectedPoll.id,
        text: commentText,
        media: commentMedia
      }
    })
    setCommentText('')
    setCommentMedia([])
  }

  function insertEmoji(emoji) {
    const input = commentInput.current
    const start = input?.selectionStart ?? commentText.length
    const end = input?.selectionEnd ?? start
    const updatedText = `${commentText.slice(0, start)}${emoji}${commentText.slice(end)}`
    setCommentText(updatedText)
    setEmojiPickerOpen(false)
    requestAnimationFrame(() => {
      input?.focus()
      input?.setSelectionRange(start + emoji.length, start + emoji.length)
    })
  }

  function toggleReaction(comment, emoji) {
    const enabled = !comment.reactions?.[emoji]?.reacted
    request({
      type: 'comment',
      data: {
        cmd: 'react',
        languageId: activeLanguageId,
        pollId: selectedPoll.id,
        commentId: comment.commentId,
        emoji,
        enabled
      }
    })
  }

  return (
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
            <strong>{pollText(poll.question)}</strong>
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
              {selectedPoll.closed
                ? 'Voting closed'
                : selectedPoll.hasVoted
                  ? 'You have voted'
                  : 'Cast your vote'}
            </p>
            <h2>{pollText(selectedPoll.question)}</h2>
            <div className='poll-creator'>
              <span className='eyebrow'>Created by</span>
              <UserIdentity
                nickname={selectedPoll.creatorProfile?.nickname}
                avatar={selectedPoll.creatorProfile?.avatar}
                fallbackKey={selectedPoll.creator}
                onOpenUser={onOpenUser}
              />
            </div>
            <MediaPreview media={selectedPoll.questionMedia} />
            <div className='options'>
              {selectedPoll.options.map((option, index) => (
                <button
                  key={index}
                  disabled={selectedPoll.closed || selectedPoll.hasVoted}
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
                  <span>
                    {pollText(option)}
                    <MediaPreview media={option.media} />
                  </span>
                  <b>{selectedPoll.votes?.[index] || 0}</b>
                </button>
              ))}
            </div>
            {!selectedPoll.closed && selectedPoll.canClose && (
              <button
                className='close-vote'
                onClick={() =>
                  request({
                    type: 'poll',
                    data: { cmd: 'close', languageId: activeLanguageId, pollId: selectedPoll.id }
                  })
                }
              >
                Close voting
              </button>
            )}
            <section className='poll-comments'>
              <div className='section-heading'>
                <h3>Comments</h3>
                <button
                  className='quiet'
                  onClick={() =>
                    request({
                      type: 'comment',
                      data: {
                        cmd: 'get-all',
                        languageId: activeLanguageId,
                        pollId: selectedPoll.id
                      }
                    })
                  }
                >
                  Refresh comments
                </button>
              </div>
              {comments.length === 0 ? (
                <p className='empty'>No comments yet. Start the discussion.</p>
              ) : (
                <div className='comment-list'>
                  {comments.map((comment) => (
                    <article className='poll-comment' key={comment.commentId}>
                      <div className='comment-heading'>
                        <UserIdentity
                          nickname={comment.authorProfile?.nickname}
                          avatar={comment.authorProfile?.avatar}
                          fallbackKey={comment.author}
                          onOpenUser={onOpenUser}
                        />
                        <time dateTime={new Date(comment.createdAt).toISOString()}>
                          {new Date(comment.createdAt).toLocaleString()}
                        </time>
                      </div>
                      <p>{comment.text}</p>
                      <MediaPreview media={comment.media} />
                      <div className='comment-reactions'>
                        {Object.entries(comment.reactions || {})
                          .sort(([, left], [, right]) => right.count - left.count)
                          .map(([emoji, reaction]) => (
                            <button
                              className={`reaction-button ${reaction.reacted ? 'active' : ''}`}
                              key={emoji}
                              type='button'
                              disabled={!canComment || selectedPoll.closed}
                              aria-label={`${emoji} reaction, ${reaction.count}`}
                              aria-pressed={Boolean(reaction.reacted)}
                              onClick={() => toggleReaction(comment, emoji)}
                            >
                              {emoji} <span>{reaction.count}</span>
                            </button>
                          ))}
                        <div className='reaction-picker'>
                          <button
                            className='reaction-button add-reaction'
                            type='button'
                            disabled={!canComment || selectedPoll.closed}
                            aria-expanded={reactionPickerCommentId === comment.commentId}
                            onClick={() =>
                              setReactionPickerCommentId((current) =>
                                current === comment.commentId ? null : comment.commentId
                              )
                            }
                          >
                            Add reaction
                          </button>
                          {reactionPickerCommentId === comment.commentId && (
                            <Suspense fallback={<p className='empty'>Loading emojis…</p>}>
                              <EmojiPicker
                                onSelect={(emoji) => {
                                  toggleReaction(comment, emoji)
                                  setReactionPickerCommentId(null)
                                }}
                              />
                            </Suspense>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
              {canComment && !selectedPoll.closed ? (
                <form className='comment-form' onSubmit={submitComment}>
                  <textarea
                    ref={commentInput}
                    value={commentText}
                    onChange={(event) => setCommentText(event.target.value)}
                    placeholder='Write a comment'
                    rows='3'
                    required
                  />
                  <div className='emoji-picker'>
                    <button
                      className='quiet'
                      type='button'
                      aria-expanded={emojiPickerOpen}
                      onClick={() => setEmojiPickerOpen((open) => !open)}
                    >
                      Add emoji
                    </button>
                    {emojiPickerOpen && (
                      <Suspense fallback={<p className='empty'>Loading emojis…</p>}>
                        <EmojiPicker onSelect={insertEmoji} />
                      </Suspense>
                    )}
                  </div>
                  <MediaFields
                    value={commentMedia}
                    onChange={setCommentMedia}
                    onError={(error) => setNotice(error.message)}
                    label='Comment media'
                  />
                  <button className='primary' type='submit'>
                    Add comment
                  </button>
                </form>
              ) : (
                <p className='empty'>
                  {selectedPoll.closed
                    ? 'This poll is closed. Comments are no longer accepted.'
                    : 'You are not allowed to comment in this language.'}
                </p>
              )}
            </section>
          </>
        ) : (
          <p className='empty'>Select a poll to see the question and current results.</p>
        )}
      </div>
    </section>
  )
}
