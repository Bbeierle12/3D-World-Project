import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    react(),
    // Rewrite .js imports to .ts during incremental TypeScript migration
    {
      name: 'rewrite-js-to-ts',
      enforce: 'pre',
      resolveId(source, importer) {
        if (source.endsWith('.js') && importer) {
          const tsPath = source.replace(/\.js$/, '.ts')
          return this.resolve(tsPath, importer, { skipSelf: true })
            .then(resolved => resolved || null)
            .catch(() => null)
        }
        return null
      }
    }
  ],
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setupTests.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{js,jsx,ts,tsx}'],
      exclude: ['src/main.jsx', 'src/types/**'],
    },
  },
})
