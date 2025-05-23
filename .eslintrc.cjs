/** @type {import("eslint").Linter.Config} */
const config = {
  // Root parser and plugins - these apply generally
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  extends: [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended", // Recommended TS rules (without type-checking)
  ],
  rules: {
    "@typescript-eslint/consistent-type-imports": [
      "warn",
      {
        prefer: "type-imports",
        fixStyle: "inline-type-imports",
      },
    ],
    "@next/next/no-img-element": "off",
    // You might want to disable rules that require type information for all files by default,
    // and only enable them in the *.ts, *.tsx override.
    // Example:
    // "@typescript-eslint/no-unsafe-assignment": "off",
    // "@typescript-eslint/no-unsafe-call": "off",
    // etc.
  },

  // Overrides for specific file patterns
  overrides: [
    {
      // For your TypeScript source files, enable type-checking rules
      files: ["./src/**/*.ts", "./src/**/*.tsx"], // Be specific about where your TS/TSX files are
      // You could also add other TS file locations like 'pages/**/*.ts', etc.
      extends: [
        "plugin:@typescript-eslint/recommended-requiring-type-checking",
      ],
      parserOptions: {
        project: "./tsconfig.json", // Use project for type-aware linting
        tsconfigRootDir: __dirname, // Important for resolving tsconfig.json correctly
      },
      rules: {
        // Enable or adjust type-aware rules here if needed
        // "@typescript-eslint/no-floating-promises": "error",
        // "@typescript-eslint/no-misused-promises": "error",
      }
    },
    {
      // For JavaScript config files at the root of your project
      files: [
        "./*.js", // e.g., next.config.js, tailwind.config.js, postcss.config.js
        "./next-sitemap.config.js", // Explicitly include it if not caught by ./*.js
      ],
      parser: "espree", // Use a standard JavaScript parser (ESLint's default)
      parserOptions: {
        project: null, // CRITICAL: Do not use tsconfig.json for these JS files
        ecmaVersion: "latest", // Or a specific version like 2020, 2021
        sourceType: "module",  // If your config files use ES modules (import/export)
                               // Or "script" if they use CommonJS (require/module.exports)
      },
      env: {
        node: true, // So it recognizes 'module.exports', 'require', '__dirname' etc.
        commonjs: true, // If using CommonJS
      },
      extends: [
        "eslint:recommended" // Basic recommended JS rules
      ],
      rules: {
        // Disable TypeScript specific rules that don't apply to JS
        "@typescript-eslint/no-var-requires": "off", // Allow require() in JS config files
        "@typescript-eslint/explicit-module-boundary-types": "off",
        // You might not need these if the parser is not @typescript-eslint/parser for these files
        // "@typescript-eslint/no-unsafe-assignment": "off",
        // "@typescript-eslint/no-unsafe-call": "off",
        // Add any other JS specific rules or disable TS rules
      },
    },
  ],
  // If you have a root parserOptions.project, ensure it's appropriate or remove it
  // if all project-based linting is handled in overrides.
  // If you keep it, it might still try to apply to all files before overrides.
  // It's often cleaner to remove root `parserOptions.project` and define it ONLY in overrides for TS files.
  // parserOptions: {
  //   // project: "./tsconfig.json", // Consider removing this from root
  //   // tsconfigRootDir: __dirname,
  // },
};

module.exports = config;