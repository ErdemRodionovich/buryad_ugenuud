function avatarSource(avatar) {
  return avatar ? `data:${avatar.mime};base64,${avatar.data}` : ''
}

export function UserIdentity({ nickname, avatar, joinedAt, fallbackKey }) {
  const displayName =
    nickname || (fallbackKey ? `Unknown user · ${fallbackKey.slice(0, 8)}` : 'Unknown user')

  return (
    <div className='user-identity'>
      <div className='user-identity-avatar'>
        {avatar ? (
          <img src={avatarSource(avatar)} alt={`${displayName}'s avatar`} />
        ) : (
          <span>{displayName.trim().slice(0, 1).toUpperCase() || '?'}</span>
        )}
      </div>
      <div className='user-identity-details'>
        <strong>{displayName}</strong>
        {joinedAt && <small>Joined {new Date(joinedAt).toLocaleDateString()}</small>}
      </div>
    </div>
  )
}
