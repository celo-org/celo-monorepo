module.exports = {
  rules: {
    'import/no-extraneous-dependencies': 'off',
    'no-underscore-dangle': 'off',
    indent: ['off', 2],
    'dot-notation': 'off',
    '@typescript-eslint/dot-notation': ['error', { allowIndexSignaturePropertyAccess: true }],
  },
}
