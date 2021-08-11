module.exports = {
  "extends": [
    "standard",
    "standard-jsx",
    "react-app",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:jest/recommended",
    "plugin:jsx-a11y/strict",
    "plugin:prettier/recommended",
    "prettier"
  ],
  "parser": "@typescript-eslint/parser",
  "plugins": [
    "@typescript-eslint",
    "sort-keys-fix",
    "import",
    "jest",
    "jsx-a11y",
    "react",
    "sort-destructure-keys"
  ],
  "rules": {
    "@typescript-eslint/member-delimiter-style": [
      "off",
      {
        "multiline": {
          "delimiter": "none",
          "requireLast": false
        },
        "singleline": {
          "delimiter": "comma",
          "requireLast": false
        }
      }
    ],
    "@typescript-eslint/no-var-requires": 0,
    "complexity": [
      "warn",
      12
    ],
    "import/order": [
      "warn",
      {
        "newlines-between": "always"
      }
    ],
    "jsx-a11y/label-has-for": [
      2,
      {
        "allowChildren": false,
        "components": [
          "Label"
        ],
        "required": {
          "every": [
            "id"
          ]
        }
      }
    ],
    "object-curly-spacing": 0,
    "prefer-const": [
      "warn",
      {
        "destructuring": "all",
        "ignoreReadBeforeAssign": false
      }
    ],
    "prettier/prettier": [
      "error",
      {
        "semi": false,
        "singleQuote": true,
        "trailingComma": "none"
      }
    ],
    "react/jsx-sort-props": [
      "error",
      {
        "ignoreCase": true
      }
    ],
    "sort-destructure-keys/sort-destructure-keys": [
      "error",
      {
        "caseSensitive": false
      }
    ],
    "sort-keys": [
      "error",
      "asc",
      {
        "caseSensitive": false
      }
    ],
    "sort-keys-fix/sort-keys-fix": "warn",
    "sort-vars": [
      "error",
      {
        "ignoreCase": true
      }
    ]
  },
  "settings": {
    "react": {
      "version": "detect"
    }
  }
}