import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import tanstackQuery from '@tanstack/eslint-plugin-query'

const eslintConfig = defineConfig([
  ...nextVitals,
  {
    plugins: {
      '@tanstack/query': tanstackQuery
    },
    rules: {
      ...tanstackQuery.configs.recommended.rules
    }
  },
  globalIgnores(['.next/**', 'out/**', 'build/**', 'coverage/**', 'next-env.d.ts'])
])

export default eslintConfig

