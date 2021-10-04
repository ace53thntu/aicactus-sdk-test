import webpack from 'webpack';
import path from 'path';

const ENVIRONMENT = process.env.NODE_ENV;

const outputFileName =
  ENVIRONMENT === 'production'
    ? 'aicactus-sdk.min.js'
    : `aicactus-sdk.${ENVIRONMENT}.min.js`;

const webpackConfig = {
  entry: './index.js',
  module: {
    rules: [
      {
        enforce: 'pre',
        test: /\.js$/,
        exclude: /(node_modules|libs)/,
        loader: 'eslint-loader',
      },
      {
        test: /\.(js)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            configFile: path.resolve(__dirname, 'babel.config.js'),
          },
        },
      },
    ],
  },
  resolve: {
    extensions: ['.js'],
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: outputFileName,
    library: 'AicactusSDK',
    libraryExport: 'default',
    libraryTarget: 'umd',
    globalObject: 'this',
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(ENVIRONMENT),
    }),
  ],
};

export default webpackConfig;
