function avatarSource(avatar) {
  return avatar ? `data:${avatar.mime};base64,${avatar.data}` : ''
}

export function UserIdentity({ nickname, avatar, joinedAt, fallbackKey, onOpenUser }) {
  const displayName =
    nickname || (fallbackKey ? `Unknown user · ${fallbackKey.slice(0, 8)}` : 'Unknown user')
  const identity = (
    <>
      <div className='user-identity-avatar'>
        {avatar ? (
          <img src={avatarSource(avatar)} alt='' />
        ) : (
          <span>{displayName.trim().slice(0, 1).toUpperCase() || '?'}</span>
        )}
      </div>
      <div className='user-identity-details'>
        <strong>{displayName}</strong>
        {joinedAt && <small>Joined {new Date(joinedAt).toLocaleDateString()}</small>}
      </div>
    </>
  )

  return onOpenUser && fallbackKey ? (
    <button
      className='user-identity user-identity-link'
      type='button'
      onClick={() =>
        onOpenUser({
          userKey: fallbackKey.toLowerCase(),
          nickname,
          avatar,
          joinedAt
        })
      }
    >
      {identity}
    </button>
  ) : (
    <div className='user-identity'>{identity}</div>
  )
}
