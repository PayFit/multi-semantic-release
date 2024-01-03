const pluginSecurity = require('eslint-plugin-security')

module.exports = {
  env: {
    es2022: true,
    node: true,
    'vitest-globals/env': true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:@typescript-eslint/strict',
    'plugin:n/recommended',
    'plugin:security/recommended-legacy',
    'plugin:vitest-globals/recommended',
    'plugin:vitest/recommended',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  parserOptions: {
    ecmaVersion: 'latest',
    project: true,
    sourceType: 'module',
  },
  rules: {
    'security/detect-object-injection': 'off',
    /**
     * Disallow unused variables unless:
     * - for caught errors, the error is named "_e".
     * - for function arguments preceding used arguments.
     * - for function arguments prefixed with _e.
     * - when using destructuring for excluding properties of an object or array.
     */
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        args: 'after-used',
        ignoreRestSiblings: true,
        argsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '_e',
      },
    ],
    '@typescript-eslint/switch-exhaustiveness-check': 'error',
    /**
     * Disabling import node recommended rules because it is handled by typescript
     */
    'n/no-missing-import': 'off',
    'n/no-unpublished-import': 'off',
    'n/no-extraneous-import': 'off',
    'n/no-extraneous-require': 'off',

    'vitest/expect-expect': 'off',
    'vitest/valid-expect': 'off',
  },
  overrides: [
    {
      files: ['*.js'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
    {
      // Deactivate some rules in test
      files: [
        '*.test.{js,jsx,ts,tsx}',
        '*.spec.{js,jsx,ts,tsx}',
        'src/test/**/*',
      ],
      rules: {
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/unbound-method': 'off',

        '@typescript-eslint/no-unsafe-argument': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/non-nullable-type-assertion-style': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        'security/detect-non-literal-fs-filename': 'off',
      },
    },
  ],
}
