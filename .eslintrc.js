/** @type {import("eslint").Linter.Config } */
const config = {
  root: true,
  extends: [
    "@next/eslint-config-next",
  ],
  rules: {
    "@typescript-eslint/no-unused-vars": "off",
    "@typescript-eslint/no-explicit-any": "off",
  },
};

module.exports = config;