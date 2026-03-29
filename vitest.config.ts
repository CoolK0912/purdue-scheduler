import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'node',
    globals: true,
    include: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
    setupFiles: ['__tests__/setup.ts'],
    environmentMatchGlobs: [
      ['**/__tests__/components/**', 'happy-dom'],
    ],
  },
})
