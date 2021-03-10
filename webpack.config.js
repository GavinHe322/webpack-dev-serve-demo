let webpack = require('webpack')
let HtmlWebpackPlugin = require('html-webpack-plugin')
let path = require('path')

module.exports = {
  mode: 'development',
  entry: path.resolve(__dirname, './src/index.js'),
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, './dist')
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: path.join(__dirname, './dist/index.html'),
      template: path.join(__dirname, './src/index.html')
    }),
    new webpack.HotModuleReplacementPlugin()
  ]
}
