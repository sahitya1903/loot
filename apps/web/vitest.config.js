import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [react()],
  test: {
    // Use jsdom for DOM testing with React
    environment: 'jsdom',

    // Setup files run before each test file
    setupFiles: ['./vitest.setup.js'],

    // Global test APIs (describe, it, expect)
    globals: true,

    // Include test files
    include: ['src/**/*.{test,spec}.{js,jsx}', 'tests/**/*.{test,spec}.{js,jsx}'],

    // Exclude node_modules and build directories
    exclude: ['node_modules', '.next', 'dist', 'e2e'],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/**/*.test.{js,jsx}', 'src/**/*.spec.{js,jsx}'],
    },

    // Timeout for async tests
    testTimeout: 10000,

    // Reporter
    reporters: ['verbose'],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
