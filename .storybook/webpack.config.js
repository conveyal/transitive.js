const path = require('path');
const webpack = require('webpack');

/**
 * This is a (mostly) auto-generated webpack config that storybook created when
 * initializing the storybook.
 */

const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: '../lib/transitive.js',

  output: {
    path: path.resolve(__dirname, 'build'),
  },

  plugins: [new webpack.ProgressPlugin()],

  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        include: [path.resolve(__dirname, '../lib'), path.resolve(__dirname, '../stories')],
        loader: 'babel-loader',
      },
      {
        test: /\.(png|jpe?g|gif)$/i,
        use: [
          {
            loader: 'file-loader',
          },
        ],
      },
      {
        test: /.css$/,

        use: [
          {
            loader: 'style-loader',
          },
          {
            loader: 'css-loader',

            options: {
              sourceMap: true,
            },
          },
        ],
      },
    ],
  },

  optimization: {
    minimizer: [new TerserPlugin()],

    splitChunks: {
      cacheGroups: {
        vendors: {
          priority: -10,
          test: /[\\/]node_modules[\\/]/,
        },
      },

      chunks: 'async',
      minChunks: 1,
      minSize: 30000,
      name: false,
    },
  },
};
