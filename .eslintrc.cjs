module.exports = {
  root: true,
  parser: 'astro-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
    extraFileExtensions: ['.astro'],
    ecmaVersion: 2020,
    sourceType: 'module'
  },
  plugins: ['astro', '@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:astro/recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier'
  ],
  rules: {
    // Project-specific tweaks go here. Keep minimal for now.
    'no-unused-vars': 'warn',
    '@typescript-eslint/no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }]
  }
};
