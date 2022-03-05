module.exports = {
  entry: './src/index.js',
  output: {
    path: __dirname,
    filename: 'build/build.js'
  },
  devServer: {
    disableHostCheck: true
  }
};
