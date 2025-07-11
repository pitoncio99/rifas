module.exports = {
  extends: ["next/core-web-vitals", "plugin:@typescript-eslint/recommended"],
  rules: {
    // ✍️ desactiva la regla de “no-explicit-any”
    "@typescript-eslint/no-explicit-any": "off",
    // ✍️ ignora variables que empiecen por guión bajo
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
  },
};
