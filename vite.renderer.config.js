const path = require('path')
const { defineConfig } = require('vite')
const react = require('@vitejs/plugin-react')

module.exports = defineConfig({
    root: path.join(__dirname, 'renderer'),
    plugins: [react()],
    build: {
        emptyOutDir: false,
        outDir: path.join(__dirname, '.vite', 'renderer', 'main_window'),
        rollupOptions: {
            input: path.join(__dirname, 'renderer', 'index.html')
        }
    }
})
