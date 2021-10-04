import webpack from 'webpack';
import config from './webpack.config.base';

const webpackConfig = {
  ...config,
  mode: 'development',
  watch: true,
  watchOptions: {
    ignored: ['./libs/**', './node_modules/**'],
  },
  plugins: [...config.plugins, new webpack.HotModuleReplacementPlugin()],
};

export default webpackConfig;
