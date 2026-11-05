async function readJson(response, provider) {
  const body = await response.json()
  if (!response.ok) {
    throw new Error(
      `${provider} returned HTTP ${response.status}: ${body.error?.message ?? body.message ?? 'Request failed'}`
    )
  }
  return body
}

export async function yTranslate({ text, apiKey, folderId, targetLang }) {
  const response = await fetch('https://translate.api.cloud.yandex.net/translate/v2/translate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Api-Key ${apiKey}`
    },
    body: JSON.stringify({
      texts: [text],
      targetLanguageCode: targetLang,
      folderId
    })
  })
  const body = await readJson(response, 'Yandex Translate')
  const translatedText = body.translations?.[0]?.text
  if (typeof translatedText !== 'string') {
    throw new Error('Received unsupported response from Yandex Translate')
  }
  return translatedText
}

export async function gTranslate({ text, apiKey, projectID, targetLang }) {
  const url = new URL('https://translation.googleapis.com/language/translate/v2')
  url.searchParams.set('key', apiKey)
  url.searchParams.set('q', text)
  url.searchParams.set('target', targetLang)
  if (projectID) url.searchParams.set('projectId', projectID)

  const body = await readJson(await fetch(url), 'Google Translate')
  const translatedText = body.data?.translations?.[0]?.translatedText
  if (typeof translatedText !== 'string') {
    throw new Error('Received unsupported response from Google Translate')
  }
  return translatedText
}

export async function burlangTranslate(text) {
  const url = new URL('https://burlang.ru/api/v1/russian-word/translate')
  url.searchParams.set('q', text)
  const response = await fetch(url)
  if (response.status === 404) return 'No translation found'
  const body = await readJson(response, 'Burlang')
  if (!Array.isArray(body.translations)) {
    throw new Error('Received unsupported response from Burlang')
  }
  return (
    body.translations
      .map(({ value }) => value)
      .filter(Boolean)
      .join(', ') || 'No translation found'
  )
}
