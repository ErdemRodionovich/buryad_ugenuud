/* global window */

export async function burlangTranslate(text) {
  try {
    return await window.bridge.burlangTranslate(text)
  } catch (error) {
    console.error('Burlang Translate error:', error)
    return 'Translation failed'
  }
}
