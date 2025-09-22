module.exports = [
  // Files/folders to ignore (replaces deprecated .eslintignore behavior)
  {
    ignores: ['node_modules/**', 'dist/**', '.pnp/**', '.vite/**', '.git/**', '.vercel/**', '.astro/**'],
  },

  // Astro files: use astro-eslint-parser which delegates TS parsing internally
  {
    files: ['**/*.astro'],
    languageOptions: {
      parser: require('astro-eslint-parser'),
      parserOptions: {
        // delegate to TypeScript parser for script blocks and frontmatter
        parser: require('@typescript-eslint/parser'),
        extraFileExtensions: ['.astro'],
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: { globalReturn: false },
      },
    },
    plugins: {
      astro: require('eslint-plugin-astro'),
    },
    rules: {
      'no-unused-vars': 'warn',
    },
  },

  // JavaScript / TypeScript files
  {
    files: ['**/*.{js,cjs,mjs,ts,cts,mts}'],
    languageOptions: {
      parser: require('@typescript-eslint/parser'),
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
    },
    rules: {
      'no-unused-vars': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
  },
];
