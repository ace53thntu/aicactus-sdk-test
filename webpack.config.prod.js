import TerserPlugin from 'terser-webpack-plugin';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import config from './webpack.config.base';

const webpackConfig = {
  ...config,
  mode: 'production',
  plugins: [new CleanWebpackPlugin(), ...config.plugins],
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true,
          },
        },
        extractComments: false,
      }),
    ],
  },
};

export default webpackConfig;
