import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

// Standalone test config: the app's vite.config.ts loads the nitro/start
// plugins which are incompatible with vitest's dev server.
export default defineConfig({
  test: { environment: 'node' },
  resolve: {
    alias: {
      '#': fileURLToPath(new URL('./src', import.meta.url)),
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
