module.exports = {
  env: {
    node: true,
    es2021: true,
    mocha: true
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'commonjs'
  },
  globals: {
    get: 'readonly',
    post: 'readonly',
    postFormData: 'readonly',
    parseAndCheckLogin: 'readonly'
  },
  rules: {
    'no-console': 'off',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    'prefer-const': 'error',
    'no-var': 'warn',
    'no-prototype-builtins': 'off',
    'no-case-declarations': 'off',
    'no-irregular-whitespace': 'off', // Disabled - some files have intentional formatting
    'no-unreachable': 'warn',
    'no-useless-catch': 'warn',
    'no-undef': 'warn'
  }
};

