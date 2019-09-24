module.exports = {
  extends: ["@spokedev/eslint-config-jigsaw/backend", "prettier"],
  plugins: ["prettier"],
  env: { es6: true },
  parserOptions: {
    sourceType: "module"
  },
  overrides: [
    {
      files: ["*config.js", "tests/**/*.js"],
      rules: {
        "no-process-env": 0, // Disallow process.env everywhere except tests.
        "prettier/prettier": ["error"]
      }
    }
  ]
};
