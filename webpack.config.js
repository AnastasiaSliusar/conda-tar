const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

module.exports = {
  entry: './src/index.js',
  target: 'web',
  experiments: {
    asyncWebAssembly: true,
  },
  cache: false,
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    clean: true,
  },
  devServer: {
    static: path.join(__dirname, 'src'),
    compress: true,
    port: 9000,
    hot: false,
    liveReload: true,
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
    }),
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser',
    }),
  ],
  resolve: {
    fallback: {
      "path": require.resolve("path-browserify"),
      "crypto": require.resolve("crypto-browserify"),
      "stream": require.resolve("stream-browserify"),
      "buffer": require.resolve("buffer/"),
      "process": require.resolve("process/browser"),
      "assert": require.resolve("assert/"),
      "http": require.resolve("stream-http"),
      "https": require.resolve("https-browserify"),
      "os": require.resolve("os-browserify/browser"),
      "url": require.resolve("url/"),
      "fs": require.resolve("browserify-fs"),
      "vm": require.resolve("vm-browserify") 
    }
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /lib\.js$/,
        loader: 'exports-loader',
        options: {
          type: 'module',
          exports: 'unpackaging',
        },
      },
      {
        test: /\.wasm$/,
        type: 'asset/resource',
      },
      {
        test: /fib\.wasm$/,
        type: `javascript/auto`,
        loader: `file-loader`,
      },
    ],
  },
};