import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  {
    files: ['apps/**/*.{ts,mts,cts}', 'packages/**/*.{ts,mts,cts}'],
  },
  {
    files: ['**/*.{mjs,cjs}'],
    languageOptions: {
      globals: globals.node,
    },
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  prettierConfig,
  {
    ignores: ['**/dist/**', '**/node_modules/**', '**/coverage/**'],
  },
);
