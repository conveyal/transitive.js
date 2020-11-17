const path = require('path')
// your app's webpack.config.js
const custom = require('./webpack.config.js');

module.exports = {
  stories: ['../stories/*.stories.js'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/preset-create-react-app'
  ],
  // Ensures that, when running storybook, webpack rules (loaders for css, file,
  // etc.) from the custom config are used.
  webpackFinal: (config) => {
    return { ...config, module: { ...config.module, rules: custom.module.rules } };
  }
}
