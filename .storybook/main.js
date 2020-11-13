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
  webpackFinal: (config) => {
    return { ...config, module: { ...config.module, rules: custom.module.rules } };
  }
}
