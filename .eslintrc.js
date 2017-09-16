module.exports = {
  env: {
    es6: true,
    node: true,
    mocha: true,
  },
  extends: 'eslint-config-standard',
  rules: { 'max-len': ['error', 110] },
};
