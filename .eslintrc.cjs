module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
  ],
  env: {
    es2022: true,
    node: true,
  },
  ignorePatterns: ['node_modules/', 'playwright-report/', 'test-results/', 'reports/', '.auth/'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
  },
};
