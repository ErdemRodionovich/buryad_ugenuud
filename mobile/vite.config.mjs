import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const inlineLocalWebApp = {
  name: 'inline-local-web-app-assets',
  generateBundle: {
    order: 'post',
    handler(_, bundle) {
      const html = bundle['index.html']
      if (!html || html.type !== 'asset') {
        throw new Error('Mobile UI build did not emit index.html')
      }

      let source = html.source.toString()
      source = source.replace(/<link\b[^>]*\bhref=(['"])([^'"]+\.css)\1[^>]*>/gi, (tag, _, url) => {
        const asset = bundle[url.replace(/^\.\//, '')]
        if (!asset || asset.type !== 'asset') {
          throw new Error(`Mobile UI stylesheet was not emitted: ${url}`)
        }
        return `<style>${asset.source.toString()}</style>`
      })
      source = source.replace(
        /<script\b[^>]*\bsrc=(['"])([^'"]+\.js)\1[^>]*>\s*<\/script>/gi,
        (tag, _, url) => {
          const chunk = bundle[url.replace(/^\.\//, '')]
          if (!chunk || chunk.type !== 'chunk') {
            throw new Error(`Mobile UI script was not emitted: ${url}`)
          }
          const code = chunk.code.replace(/<\/script/gi, '<\\/script')
          return `<script>${code}</script>`
        }
      )
      const inlineScript = source.match(/<script>([\s\S]*?)<\/script>/i)?.[0]
      if (!inlineScript || !source.includes('</body>')) {
        throw new Error('Mobile UI script or body closing tag is missing.')
      }
      source = source.replace(inlineScript, '')
      source = source.replace('</body>', `${inlineScript}\n  </body>`)
      if (/<(?:script|link)\b[^>]*(?:src|href)=/i.test(source)) {
        throw new Error('Mobile UI still references an external script or stylesheet.')
      }
      html.source = source
    }
  }
}

export default defineConfig({
  base: './',
  root: path.resolve(__dirname, '../renderer'),
  plugins: [react(), inlineLocalWebApp],
  build: {
    emptyOutDir: true,
    outDir: path.resolve(__dirname, 'web'),
    cssCodeSplit: false,
    modulePreload: { polyfill: false },
    rollupOptions: {
      input: path.resolve(__dirname, '../renderer/index.html'),
      output: {
        format: 'iife',
        inlineDynamicImports: true
      }
    }
  }
})
