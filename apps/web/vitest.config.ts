import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    // Use jsdom for DOM testing with React
    environment: 'jsdom',

    // Setup files run before each test file
    setupFiles: ['./vitest.setup.ts'],

    // Global test APIs (describe, it, expect)
    globals: true,

    // Include test files
    include: ['src/**/*.{test,spec}.{ts,tsx}', 'tests/**/*.{test,spec}.{ts,tsx}'],

    // Exclude node_modules and build directories
    exclude: ['node_modules', '.next', 'dist', 'e2e'],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/types/**',
        'src/**/*.d.ts',
      ],
    },

    // Timeout for async tests
    testTimeout: 10000,

    // Reporter
    reporters: ['verbose'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
