export const webViewSource = {
  uri: 'file:///android_asset/buryad-web/index.html'
}
export const webViewOriginWhitelist = ['file://*', 'about:blank']

export function isAllowedWebViewUrl(url) {
  return url.startsWith('file:///android_asset/buryad-web/') || url === 'about:blank'
}
