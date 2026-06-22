import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'
import eslintConfigPrettier from 'eslint-config-prettier'

const eslintConfig = [
  { ignores: ['.next/**', 'node_modules/**', 'public/**'] },
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      'no-var': 'error',
      'no-unused-vars': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
      'no-console': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  eslintConfigPrettier,
]

export default eslintConfig
