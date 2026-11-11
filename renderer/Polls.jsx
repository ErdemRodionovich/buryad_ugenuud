import { lazy, Suspense, useContext, useEffect, useMemo, useRef, useState } from 'react'
import './styles.css'
import { IPCContext } from './IPCContext'
import { PollContext } from './PollContext'
import { ActiveLanguageContext } from './ActiveLanguageContext'
import { MediaFields, MediaPreview } from './Media'
import { UserIdentity } from './UserIdentity'
import { useI18n } from './I18nContext'

const EmojiPicker = lazy(() =>
  import('./EmojiPicker').then((module) => ({ default: module.EmojiPicker }))
)

const pollsPerPage = 10
const initialPollFilters = {
  dateMode: 'all',
  dateValue: '',
  dateFrom: '',
  dateTo: '',
  creator: '',
  word: '',
  voteStatus: 'all',
  pollStatus: 'all'
}

function pollText(value) {
  if (typeof value === 'string') return value
  return typeof value?.text === 'string' ? value.text : ''
}

function pollSearchText(poll) {
  const text = [pollText(poll.question)]
  if (Array.isArray(poll.options)) text.push(...poll.options.map(pollText))
  if (poll.translationDetails) {
    text.push(poll.translationDetails.languageOfWordForTranslation)
    if (Array.isArray(poll.translationDetails.wordsForTranslation)) {
      text.push(...poll.translationDetails.wordsForTranslation)
    }
  }
  return text.filter((value) => typeof value === 'string').join('\n')
}

function localDateStart(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null
  const [, yearText, monthText, dayText] = match
  const year = Number(yearText)
  const month = Number(monthText)
  const day = Number(dayText)
  const date = new Date(0)
  date.setFullYear(year, month - 1, day)
  date.setHours(0, 0, 0, 0)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null
  }
  return date.getTime()
}

function nextLocalDay(start) {
  const date = new Date(start)
  date.setDate(date.getDate() + 1)
  return date.getTime()
}

function totalVotes(poll) {
  const votes = poll.votes && typeof poll.votes === 'object' ? Object.values(poll.votes) : []
  return votes.reduce((sum, count) => sum + (Number.isFinite(count) && count > 0 ? count : 0), 0)
}

export function Polls({
  canComment,
  canManageLanguage,
  canMakeTranslation,
  onMakeTranslation,
  onOpenUser
}) {
  const { locale, t, plural } = useI18n()
  const { polls, commentsByPoll, selectedPollId, setSelectedPollId, refresh } =
    useContext(PollContext)
  const { request, setNotice } = useContext(IPCContext)
  const { activeLanguageId } = useContext(ActiveLanguageContext)
  const [commentText, setCommentText] = useState('')
  const [commentMedia, setCommentMedia] = useState([])
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false)
  const [reactionPickerCommentId, setReactionPickerCommentId] = useState(null)
  const [sortOrder, setSortOrder] = useState('newest')
  const [filters, setFilters] = useState(initialPollFilters)
  const [page, setPage] = useState(0)
  const commentInput = useRef(null)
  const requestRef = useRef(request)
  requestRef.current = request

  const pollSortIndexes = useMemo(() => {
    const collator = new Intl.Collator(locale, { numeric: true, sensitivity: 'base' })
    const indexedPolls = polls.map((poll, index) => {
      const createdAt = Number(poll.createdAt)
      const creator = [
        typeof poll.creatorProfile?.nickname === 'string' ? poll.creatorProfile.nickname : '',
        typeof poll.creator === 'string' ? poll.creator : ''
      ]
        .filter(Boolean)
        .join('\n')
      return {
        index,
        id: String(poll.id ?? ''),
        question: pollText(poll.question),
        searchText: pollSearchText(poll).toLocaleLowerCase(locale),
        creator: creator.toLocaleLowerCase(locale),
        createdAt: Number.isFinite(createdAt) ? createdAt : null,
        votes: totalVotes(poll)
      }
    })
    const withStableTieBreak = (compare) => (left, right) =>
      compare(left, right) || left.id.localeCompare(right.id) || left.index - right.index
    const createIndex = (compare) =>
      [...indexedPolls].sort(withStableTieBreak(compare)).map(({ index }) => index)

    return {
      newest: createIndex((left, right) => right.createdAt - left.createdAt),
      oldest: createIndex((left, right) => left.createdAt - right.createdAt),
      questionAsc: createIndex((left, right) => collator.compare(left.question, right.question)),
      questionDesc: createIndex((left, right) => collator.compare(right.question, left.question)),
      mostVotes: createIndex((left, right) => right.votes - left.votes),
      fewestVotes: createIndex((left, right) => left.votes - right.votes),
      metadata: indexedPolls
    }
  }, [locale, polls])
  const sortedPollIndexes = pollSortIndexes[sortOrder] || pollSortIndexes.newest
  const filteredPollIndexes = useMemo(() => {
    const creatorFilter = filters.creator.trim().toLocaleLowerCase(locale)
    const wordFilter = filters.word.trim().toLocaleLowerCase(locale)
    const dateValue = filters.dateValue ? localDateStart(filters.dateValue) : null
    const dateFrom = filters.dateFrom ? localDateStart(filters.dateFrom) : null
    const dateTo = filters.dateTo ? localDateStart(filters.dateTo) : null
    const hasDateFilter = filters.dateMode !== 'all'

    return sortedPollIndexes.filter((index) => {
      const poll = polls[index]
      const metadata = pollSortIndexes.metadata[index]
      if (filters.pollStatus === 'open' && poll.closed) return false
      if (filters.pollStatus === 'closed' && !poll.closed) return false
      if (filters.voteStatus === 'voted' && !poll.hasVoted) return false
      if (filters.voteStatus === 'not-voted' && poll.hasVoted) return false
      if (creatorFilter && !metadata.creator.includes(creatorFilter)) return false
      if (wordFilter && !metadata.searchText.includes(wordFilter)) return false

      if (filters.dateMode === 'after' && dateValue !== null) {
        if (metadata.createdAt === null || metadata.createdAt < nextLocalDay(dateValue)) {
          return false
        }
      } else if (filters.dateMode === 'before' && dateValue !== null) {
        if (metadata.createdAt === null || metadata.createdAt >= dateValue) return false
      } else if (filters.dateMode === 'range') {
        if (
          metadata.createdAt === null ||
          (dateFrom !== null && metadata.createdAt < dateFrom) ||
          (dateTo !== null && metadata.createdAt >= nextLocalDay(dateTo))
        ) {
          return false
        }
      }
      if (
        hasDateFilter &&
        filters.dateMode !== 'range' &&
        filters.dateValue &&
        dateValue === null
      ) {
        return false
      }
      if (
        filters.dateMode === 'range' &&
        ((filters.dateFrom && dateFrom === null) || (filters.dateTo && dateTo === null))
      ) {
        return false
      }
      return true
    })
  }, [filters, locale, pollSortIndexes.metadata, polls, sortedPollIndexes])
  const dateRangeInvalid = Boolean(
    filters.dateMode === 'range' &&
    filters.dateFrom &&
    filters.dateTo &&
    filters.dateFrom > filters.dateTo
  )
  const pageCount = Math.max(1, Math.ceil(filteredPollIndexes.length / pollsPerPage))
  const currentPage = Math.min(page, pageCount - 1)
  const visiblePolls = filteredPollIndexes
    .slice(currentPage * pollsPerPage, (currentPage + 1) * pollsPerPage)
    .map((index) => polls[index])

  const selectedPoll = polls.find((poll) => poll.id === selectedPollId)
  const comments = selectedPoll
    ? commentsByPoll[`${activeLanguageId}/${selectedPoll.id}`] || []
    : []
  const winningTranslationOption = (() => {
    if (selectedPoll?.kind !== 'translation' || !selectedPoll.closed) return null
    const counts = selectedPoll.options.map((_, index) => selectedPoll.votes?.[index] || 0)
    const highestCount = Math.max(...counts, 0)
    if (highestCount === 0 || counts.filter((count) => count === highestCount).length !== 1) {
      return null
    }
    return selectedPoll.options[counts.indexOf(highestCount)]
  })()

  useEffect(() => {
    setPage(0)
    setFilters(initialPollFilters)
  }, [activeLanguageId])

  useEffect(() => {
    setPage((currentPage) => Math.min(currentPage, pageCount - 1))
  }, [pageCount])

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

  function removeComment(comment) {
    request({
      type: 'comment',
      data: {
        cmd: 'remove',
        languageId: activeLanguageId,
        pollId: selectedPoll.id,
        commentId: comment.commentId
      }
    })
  }

  function updateFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value }))
    setPage(0)
  }

  function clearFilters() {
    setFilters(initialPollFilters)
    setPage(0)
  }

  return (
    <section className='workspace'>
      <div className='poll-list'>
        <div className='section-heading'>
          <h2>{t('Open conversations')}</h2>
          <button className='quiet' type='button' onClick={refresh}>
            {t('Refresh')}
          </button>
        </div>
        <details className='poll-filters'>
          <summary>{t('Filter polls')}</summary>
          <div className='poll-filter-fields'>
            <label className='poll-filter-control'>
              <span>{t('Poll text')}</span>
              <input
                type='search'
                value={filters.word}
                placeholder={t('Question, options, or translation words')}
                onChange={(event) => updateFilter('word', event.target.value)}
              />
            </label>
            <label className='poll-filter-control'>
              <span>{t('Creator')}</span>
              <input
                type='search'
                value={filters.creator}
                placeholder={t('Creator name or key')}
                onChange={(event) => updateFilter('creator', event.target.value)}
              />
            </label>
            <label className='poll-filter-control'>
              <span>{t('Created date')}</span>
              <select
                value={filters.dateMode}
                onChange={(event) => updateFilter('dateMode', event.target.value)}
              >
                <option value='all'>{t('Any date')}</option>
                <option value='after'>{t('After date')}</option>
                <option value='before'>{t('Before date')}</option>
                <option value='range'>{t('Between dates')}</option>
              </select>
            </label>
            {filters.dateMode === 'after' || filters.dateMode === 'before' ? (
              <label className='poll-filter-control'>
                <span>{t('Date')}</span>
                <input
                  type='date'
                  value={filters.dateValue}
                  onChange={(event) => updateFilter('dateValue', event.target.value)}
                />
              </label>
            ) : null}
            {filters.dateMode === 'range' && (
              <div className='poll-filter-date-range'>
                <label className='poll-filter-control'>
                  <span>{t('Start date')}</span>
                  <input
                    type='date'
                    value={filters.dateFrom}
                    max={filters.dateTo || undefined}
                    aria-invalid={Boolean(dateRangeInvalid)}
                    onChange={(event) => updateFilter('dateFrom', event.target.value)}
                  />
                </label>
                <label className='poll-filter-control'>
                  <span>{t('End date')}</span>
                  <input
                    type='date'
                    value={filters.dateTo}
                    min={filters.dateFrom || undefined}
                    aria-invalid={Boolean(dateRangeInvalid)}
                    onChange={(event) => updateFilter('dateTo', event.target.value)}
                  />
                </label>
                {dateRangeInvalid && (
                  <p className='poll-filter-date-error'>
                    {t('Start date must be on or before end date.')}
                  </p>
                )}
              </div>
            )}
            <label className='poll-filter-control'>
              <span>{t('Vote status')}</span>
              <select
                value={filters.voteStatus}
                onChange={(event) => updateFilter('voteStatus', event.target.value)}
              >
                <option value='all'>{t('Any vote status')}</option>
                <option value='voted'>{t('Voted by me')}</option>
                <option value='not-voted'>{t('Not voted by me')}</option>
              </select>
            </label>
            <label className='poll-filter-control'>
              <span>{t('Poll status')}</span>
              <select
                value={filters.pollStatus}
                onChange={(event) => updateFilter('pollStatus', event.target.value)}
              >
                <option value='all'>{t('Any poll status')}</option>
                <option value='open'>{t('Open')}</option>
                <option value='closed'>{t('Closed')}</option>
              </select>
            </label>
            <button className='quiet poll-filter-reset' type='button' onClick={clearFilters}>
              {t('Clear filters')}
            </button>
          </div>
        </details>
        {polls.length > 0 && (
          <p className='poll-result-count'>
            {t('Showing {shown} of {total} polls', {
              shown: filteredPollIndexes.length,
              total: polls.length
            })}
          </p>
        )}
        <label className='poll-sort-control'>
          <span>{t('Sort by')}</span>
          <select
            value={sortOrder}
            onChange={(event) => {
              setSortOrder(event.target.value)
              setPage(0)
            }}
          >
            <option value='newest'>{t('Newest first')}</option>
            <option value='oldest'>{t('Oldest first')}</option>
            <option value='questionAsc'>{t('Question (A–Z)')}</option>
            <option value='questionDesc'>{t('Question (Z–A)')}</option>
            <option value='mostVotes'>{t('Most votes')}</option>
            <option value='fewestVotes'>{t('Fewest votes')}</option>
          </select>
        </label>
        {polls.length === 0 && <p className='empty'>{t('No polls yet. Start the first one.')}</p>}
        {polls.length > 0 && filteredPollIndexes.length === 0 && (
          <p className='empty'>{t('No polls match these filters.')}</p>
        )}
        {visiblePolls.map((poll) => (
          <button
            className={`poll-row ${poll.id === selectedPollId ? 'active' : ''}`}
            key={poll.id}
            onClick={() => setSelectedPollId(poll.id)}
          >
            <strong>{pollText(poll.question)}</strong>
            <span>
              {poll.kind === 'translation' ? `${t('Translation poll')} · ` : ''}
              {poll.closed ? t('Closed') : t('Open')} · {totalVotes(poll)}{' '}
              {plural('vote', totalVotes(poll))}
            </span>
          </button>
        ))}
        {filteredPollIndexes.length > pollsPerPage && (
          <nav className='poll-pagination' aria-label={t('Poll pages')}>
            <button
              className='quiet'
              type='button'
              disabled={currentPage === 0}
              aria-label={t('Previous page')}
              onClick={() => setPage(currentPage - 1)}
            >
              {t('Previous page')}
            </button>
            <span aria-live='polite'>
              {t('Page {current} of {total}', {
                current: currentPage + 1,
                total: pageCount
              })}
            </span>
            <button
              className='quiet'
              type='button'
              disabled={currentPage >= pageCount - 1}
              aria-label={t('Next page')}
              onClick={() => setPage(currentPage + 1)}
            >
              {t('Next page')}
            </button>
          </nav>
        )}
      </div>
      <div className='poll-detail'>
        {selectedPoll ? (
          <>
            <p className='eyebrow'>
              {selectedPoll.kind === 'translation' ? `${t('Translation poll')} · ` : ''}
              {selectedPoll.closed
                ? t('Voting closed')
                : selectedPoll.hasVoted
                  ? t('You have voted')
                  : t('Cast your vote')}
            </p>
            <h2>{pollText(selectedPoll.question)}</h2>
            {selectedPoll.kind === 'translation' && selectedPoll.translationDetails && (
              <p className='translation-poll-prompt'>
                {t('Translate from {language}: {words}', {
                  language: selectedPoll.translationDetails.languageOfWordForTranslation,
                  words: selectedPoll.translationDetails.wordsForTranslation.join(', ')
                })}
              </p>
            )}
            <div className='poll-creator'>
              <span className='eyebrow'>{t('Created by')}</span>
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
            {canMakeTranslation && winningTranslationOption && selectedPoll.translationDetails && (
              <button
                className='primary'
                onClick={() => onMakeTranslation(selectedPoll, winningTranslationOption)}
              >
                {t('Make translation')}
              </button>
            )}
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
                {t('Close voting')}
              </button>
            )}
            <section className='poll-comments'>
              <div className='section-heading'>
                <h3>{t('Comments')}</h3>
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
                  {t('Refresh comments')}
                </button>
              </div>
              {comments.length === 0 ? (
                <p className='empty'>{t('No comments yet. Start the discussion.')}</p>
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
                          {new Date(comment.createdAt).toLocaleString(
                            locale === 'ru' ? 'ru-RU' : locale === 'bua' ? 'bua-RU' : 'en-US'
                          )}
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
                            {t('Add reaction')}
                          </button>
                          {reactionPickerCommentId === comment.commentId && (
                            <Suspense fallback={<p className='empty'>{t('Loading emojis…')}</p>}>
                              <EmojiPicker
                                onSelect={(emoji) => {
                                  toggleReaction(comment, emoji)
                                  setReactionPickerCommentId(null)
                                }}
                              />
                            </Suspense>
                          )}
                        </div>
                        {canManageLanguage && (
                          <button
                            className='quiet'
                            type='button'
                            onClick={() => removeComment(comment)}
                          >
                            {t('Remove comment')}
                          </button>
                        )}
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
                    placeholder={t('Write a comment')}
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
                      {t('Add emoji')}
                    </button>
                    {emojiPickerOpen && (
                      <Suspense fallback={<p className='empty'>{t('Loading emojis…')}</p>}>
                        <EmojiPicker onSelect={insertEmoji} />
                      </Suspense>
                    )}
                  </div>
                  <MediaFields
                    value={commentMedia}
                    onChange={setCommentMedia}
                    onError={(error) => setNotice(error.message)}
                    label={t('Comment media')}
                  />
                  <button className='primary' type='submit'>
                    {t('Add comment')}
                  </button>
                </form>
              ) : (
                <p className='empty'>
                  {selectedPoll.closed
                    ? t('This poll is closed. Comments are no longer accepted.')
                    : t('You are not allowed to comment in this language.')}
                </p>
              )}
            </section>
          </>
        ) : (
          <p className='empty'>{t('Select a poll to see the question and current results.')}</p>
        )}
      </div>
    </section>
  )
}
