/**
 * react-native-web ships no type declarations. Its public surface mirrors
 * react-native, so reuse those types for the web shims.
 */
declare module 'react-native-web' {
  export * from 'react-native';
}
