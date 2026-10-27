import { useState } from 'react'
import { UserIdentity } from './UserIdentity'
import { useI18n } from './I18nContext'

export const roleLabels = {
  administrator: 'Administrator',
  'vote-closer': 'Vote closer',
  'word-creator': 'Word creator',
  'banned-create-vote': 'Banned from creating polls',
  'banned-comment': 'Banned from commenting'
}

export function LanguageRoles({
  accountKey,
  canManage,
  members = [],
  roles,
  onAssign,
  onOpenUser
}) {
  const { t } = useI18n()
  const [target, setTarget] = useState('')
  const [role, setRole] = useState('word-creator')
  const [selectedRoles, setSelectedRoles] = useState({})

  const membersByKey = new Map(members.map((member) => [member.accountKey.toLowerCase(), member]))
  const roleUsers = new Map(
    roles.map(({ userKey, roles: userRoles }) => [
      userKey.toLowerCase(),
      { userKey: userKey.toLowerCase(), roles: userRoles }
    ])
  )
  for (const member of members) {
    const userKey = member.accountKey.toLowerCase()
    if (!roleUsers.has(userKey)) roleUsers.set(userKey, { userKey, roles: [] })
  }

  function submit(event) {
    event.preventDefault()
    onAssign(target.trim().toLowerCase(), role, true)
    setTarget('')
  }

  return (
    <section className='language-roles'>
      <p className='eyebrow'>{t('Language access')}</p>
      {canManage && <h2>{t('Manage roles')}</h2>}
      <p>
        {canManage
          ? t('Grant or remove roles for language members, or assign a role using an account key.')
          : t('Share your account key with a language administrator to be assigned roles.')}
      </p>
      <div className='role-account-key'>
        <strong>{t('Your account key')}</strong>
        <code>{accountKey || t('Loading account key…')}</code>
        <button
          className='quiet'
          type='button'
          disabled={!accountKey}
          onClick={() => navigator.clipboard?.writeText(accountKey)}
        >
          {t('Copy account key')}
        </button>
      </div>
      {canManage && (
        <>
          <form className='role-form' onSubmit={submit}>
            <input
              value={target}
              onChange={(event) => setTarget(event.target.value)}
              placeholder={t('Account key (64 hexadecimal characters)')}
              pattern='[0-9a-fA-F]{64}'
              title={t('Use the 64-character account key')}
              required
            />
            <select value={role} onChange={(event) => setRole(event.target.value)}>
              {Object.entries(roleLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {t(label)}
                </option>
              ))}
            </select>
            <button className='primary' type='submit'>
              {t('Assign role')}
            </button>
          </form>
          <h3 className='role-list-heading'>{t('Members and assigned roles')}</h3>
          <div className='role-list'>
            {roleUsers.size === 0 && (
              <p className='empty'>{t('No members or role assignments yet.')}</p>
            )}
            {[...roleUsers.values()].map(({ userKey, roles: userRoles }) => (
              <div className='role-user' key={userKey}>
                {membersByKey.has(userKey) ? (
                  <UserIdentity
                    nickname={membersByKey.get(userKey).nickname}
                    avatar={membersByKey.get(userKey).avatar}
                    joinedAt={membersByKey.get(userKey).joinedAt}
                    fallbackKey={userKey}
                    onOpenUser={onOpenUser}
                  />
                ) : null}
                <code>{userKey}</code>
                <div className='role-badges'>
                  {userRoles.map((userRole) => (
                    <span className='role-badge' key={userRole}>
                      {t(roleLabels[userRole] || userRole)}
                      <button
                        type='button'
                        aria-label={t('Remove {role} from {user}', {
                          role: t(roleLabels[userRole] || userRole),
                          user: userKey
                        })}
                        onClick={() => onAssign(userKey, userRole, false)}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <form
                  className='role-member-form'
                  onSubmit={(event) => {
                    event.preventDefault()
                    onAssign(userKey, selectedRoles[userKey] || 'word-creator', true)
                  }}
                >
                  <select
                    aria-label={t('Role to grant to {user}', { user: userKey })}
                    value={selectedRoles[userKey] || 'word-creator'}
                    onChange={(event) =>
                      setSelectedRoles((current) => ({
                        ...current,
                        [userKey]: event.target.value
                      }))
                    }
                  >
                    {Object.entries(roleLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {t(label)}
                      </option>
                    ))}
                  </select>
                  <button
                    className='quiet'
                    type='submit'
                    disabled={userRoles.includes(selectedRoles[userKey] || 'word-creator')}
                  >
                    {t('Grant role')}
                  </button>
                </form>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
