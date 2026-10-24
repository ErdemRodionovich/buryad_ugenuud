import { useState } from 'react'
import { roleLabels } from './LanguageRoles'
import { UserIdentity } from './UserIdentity'

export function UserPage({ user, canManage, roles, onBack, onRoleChange }) {
  const [role, setRole] = useState('word-creator')

  function grantRole(event) {
    event.preventDefault()
    onRoleChange(user.userKey, role, true)
  }

  return (
    <section className='user-page'>
      <button className='quiet user-page-back' type='button' onClick={onBack}>
        ← Back
      </button>
      <div className='user-page-profile'>
        <UserIdentity
          nickname={user.nickname}
          avatar={user.avatar}
          joinedAt={user.joinedAt}
          fallbackKey={user.userKey}
        />
        <code>{user.userKey}</code>
      </div>
      {canManage && (
        <section className='user-page-roles'>
          <h2>Language roles</h2>
          <form className='user-page-role-form' onSubmit={grantRole}>
            <select
              aria-label='Role to grant'
              value={role}
              onChange={(event) => setRole(event.target.value)}
            >
              {Object.entries(roleLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <button className='primary' type='submit' disabled={roles.includes(role)}>
              Grant role
            </button>
          </form>
          <h3>Current roles</h3>
          {roles.length > 0 ? (
            <ul className='user-page-role-list'>
              {roles.map((userRole) => (
                <li key={userRole}>
                  <span>{roleLabels[userRole] || userRole}</span>
                  <button
                    className='quiet'
                    type='button'
                    aria-label={`Remove ${roleLabels[userRole] || userRole}`}
                    onClick={() => onRoleChange(user.userKey, userRole, false)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className='empty'>No roles assigned.</p>
          )}
        </section>
      )}
    </section>
  )
}
