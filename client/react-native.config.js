module.exports = {
  project: {
    ios: {},
    android: {},
  },
  'react-native-vector-icons': {
    platforms: {
      ios: null,
    },
  },
  getTransformModulePath() {
    return require.resolve('react-native-typescript-transformer');
  },
  getSourceExts() {
    return ['ts', 'tsx'];
  },
};
