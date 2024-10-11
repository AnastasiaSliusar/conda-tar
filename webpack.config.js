const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

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
  ],
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
          exports: 'libarchive',
        },
      },
      {
        test: /\.wasm$/,
        type: 'asset/resource',
      },
    ],
  },
};
