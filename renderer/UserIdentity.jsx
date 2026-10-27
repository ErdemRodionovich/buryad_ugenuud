import { useI18n } from './I18nContext'

function avatarSource(avatar) {
  return avatar ? `data:${avatar.mime};base64,${avatar.data}` : ''
}

export function UserIdentity({ nickname, avatar, joinedAt, fallbackKey, onOpenUser }) {
  const { locale, t } = useI18n()
  const displayName =
    nickname ||
    (fallbackKey ? `${t('Unknown user')} · ${fallbackKey.slice(0, 8)}` : t('Unknown user'))
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
        {joinedAt && (
          <small>
            {t('Joined {date}', {
              date: new Date(joinedAt).toLocaleDateString(
                locale === 'ru' ? 'ru-RU' : locale === 'bua' ? 'bua-RU' : 'en-US'
              )
            })}
          </small>
        )}
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
