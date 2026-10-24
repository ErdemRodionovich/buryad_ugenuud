import { useState } from 'react'

const roleLabels = {
    administrator: 'Administrator',
    'vote-closer': 'Vote closer',
    'word-creator': 'Word creator',
    'banned-create-vote': 'Banned from creating polls',
    'banned-comment': 'Banned from commenting'
}

export function LanguageRoles({ accountKey, canManage, roles, onAssign }) {
    const [target, setTarget] = useState('')
    const [role, setRole] = useState('word-creator')

    function submit(event) {
        event.preventDefault()
        onAssign(target.trim().toLowerCase(), role, true)
        setTarget('')
    }

    return (
        <section className='language-roles'>
            <p className='eyebrow'>Language access</p>
            {canManage && <h2>Manage roles</h2>}
            <p>{canManage ? 'Share your account key with others so you can assign them access in this language.' : 'Share your account key with a language administrator to be assigned roles.'}</p>
            <div className='role-account-key'>
                <strong>Your account key</strong>
                <code>{accountKey || 'Loading account key…'}</code>
                <button className='quiet' type='button' disabled={!accountKey} onClick={() => navigator.clipboard?.writeText(accountKey)}>
                    Copy account key
                </button>
            </div>
            {canManage && (
                <>
                    <form className='role-form' onSubmit={submit}>
                        <input
                            value={target}
                            onChange={(event) => setTarget(event.target.value)}
                            placeholder='Account key (64 hexadecimal characters)'
                            pattern='[0-9a-fA-F]{64}'
                            title='Use the 64-character account key'
                            required
                        />
                        <select value={role} onChange={(event) => setRole(event.target.value)}>
                            {Object.entries(roleLabels).map(([value, label]) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            ))}
                        </select>
                        <button className='primary' type='submit'>
                            Assign role
                        </button>
                    </form>
                    <div className='role-list'>
                        {roles.length === 0 && <p className='empty'>No roles have been assigned yet.</p>}
                        {roles.map(({ userKey, roles: userRoles }) => (
                            <div className='role-user' key={userKey}>
                                <code>{userKey}</code>
                                <div className='role-badges'>
                                    {userRoles.map((userRole) => (
                                        <span className='role-badge' key={userRole}>
                                            {roleLabels[userRole] || userRole}
                                            <button type='button' aria-label={`Remove ${roleLabels[userRole] || userRole} from ${userKey}`} onClick={() => onAssign(userKey, userRole, false)}>
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </section>
    )
}
