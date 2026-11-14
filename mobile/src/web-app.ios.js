import { Image } from 'react-native'

const htmlAsset = require('../web/index.html')
const htmlUri = Image.resolveAssetSource(htmlAsset)?.uri

if (!htmlUri) {
  throw new Error('The bundled mobile UI HTML asset could not be resolved.')
}

export const webViewSource = { uri: htmlUri }
export const webViewOriginWhitelist = ['file://*', 'http://*', 'https://*', 'about:blank']

export function isAllowedWebViewUrl(url) {
  return url === htmlUri || url === 'about:blank'
}
