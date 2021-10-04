module.exports = {
  plugins: [
    // [
    //   '@babel/plugin-transform-modules-umd',
    //   {
    //     exactGlobals: true,
    //     globals: {
    //       index: 'analytics_aicactus_1',
    //     },
    //   },
    // ],
    '@babel/plugin-proposal-object-rest-spread',
    '@babel/plugin-transform-arrow-functions',
    '@babel/plugin-proposal-numeric-separator',
    '@babel/plugin-transform-template-literals',
    [
      '@babel/plugin-proposal-class-properties',
      {
        loose: true,
      },
    ],
    ['@babel/plugin-transform-runtime'],
    '@babel/plugin-proposal-optional-chaining',
    '@babel/plugin-proposal-nullish-coalescing-operator',
  ],
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: 'current',
          // browsers: ['last 2 versions', 'IE >= 9', 'safari >= 7'],
          browsers: ['>0.2%', 'not dead', 'not op_mini all'],
        },
        useBuiltIns: 'entry',
        corejs: 3,
        exclude: ['transform-typeof-symbol'],
      },
    ],
  ],
};
