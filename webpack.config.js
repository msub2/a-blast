module.exports = {
  entry: './src/index.js',
  output: {
    path: __dirname,
    filename: 'build/build.js'
  },
  devServer: {
    historyApiFallback: true,
    allowedHosts: "all",
    static: {
      directory: __dirname,
      publicPath: '/'
    }
  }
};
