module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'eslint:recommended',
    'prettier',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    // Enforce ES6+ standards (The Law: Modern Standards)
    'no-var': 'error',
    'prefer-const': 'error',
    'prefer-arrow-callback': 'error',
    'prefer-template': 'error',
    'object-shorthand': 'error',

    // Block jQuery (The Law: No jQuery)
    'no-restricted-imports': [
      'error',
      {
        patterns: ['jquery', '*jquery*', 'jQuery'],
      },
    ],
    'no-restricted-globals': [
      'error',
      {
        name: '$',
        message: 'jQuery is not allowed. Use vanilla JavaScript.',
      },
      {
        name: 'jQuery',
        message: 'jQuery is not allowed. Use vanilla JavaScript.',
      },
    ],

    // Code quality
    'no-console': 'warn',
    'no-debugger': 'warn',
    'no-unused-vars': 'error',
    'no-undef': 'error',

    // Enforce separation of concerns
    'max-lines-per-function': ['warn', { max: 100, skipBlankLines: true, skipComments: true }],
    'max-depth': ['warn', 4],
    'complexity': ['warn', 15],
  },
};
