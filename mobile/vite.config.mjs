import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const androidFileAssetScripts = {
  name: 'android-file-asset-scripts',
  generateBundle: {
    order: 'post',
    handler(_, bundle) {
      const html = bundle['index.html']
      if (!html || html.type !== 'asset') {
        throw new Error('Android UI build did not emit index.html')
      }

      html.source = html.source
        .toString()
        .replace(/\s+crossorigin(?:="[^"]*")?/gi, '')
        .replace(/<script\s+type="module"/g, '<script defer')
    }
  }
}

export default defineConfig({
  base: './',
  root: path.resolve(__dirname, '../renderer'),
  plugins: [react(), androidFileAssetScripts],
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
