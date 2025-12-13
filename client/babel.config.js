module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./'],
        extensions: ['.ios.js', '.android.js', '.js', '.jsx', '.json', '.tsx', '.ts'],
        alias: {
          '@components': './src/components',
          '@screens': './src/screens',
          '@utils': './src/utils',
          '@assets': './src/assets',
          '@types': './src/types',
          '@service': './src/service',
          '@services': './src/services',
          '@state': './src/state',
          '@hooks': './src/hooks',
          '@navigation': './src/navigation',
          '@context': './src/context',
          '@styles': './src/styles',
          '@config': './src/config',
          '@models': './src/models',
          '@api': './src/api',
          '@features': './src/features',
        },
      },
    ],
    'react-native-reanimated/plugin',
  ],
};
