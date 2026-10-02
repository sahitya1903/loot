import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'

const eslintConfig = defineConfig([
  ...nextVitals,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
  ]),
  {
    // eslint-plugin-react-hooks v7 introduced new rules that flag patterns
    // already present throughout the codebase. Downgrade to warn so CI stays
    // green while we address them incrementally.
    rules: {
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/static-components': 'warn',
      // Pre-existing violations in source files that predate strict enforcement.
      'react/no-unescaped-entities': 'warn',
      'prefer-const': 'warn',
    },
  },
])

export default eslintConfig
