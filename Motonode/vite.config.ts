import path from 'path';
import { defineConfig, transformWithEsbuild } from 'vite';
import react from '@vitejs/plugin-react';

const root = __dirname;
const shim = (name: string) => path.resolve(root, `src/web/shims/${name}`);

/** react-native-vector-icons ships JSX inside .js files — teach Vite to parse them. */
function jsxInJsPlugin() {
  return {
    name: 'jsx-in-node-modules',
    enforce: 'pre' as const,
    async transform(code: string, id: string) {
      if (!id.includes('node_modules/react-native-vector-icons') || !id.endsWith('.js')) {
        return null;
      }
      return transformWithEsbuild(code, id, {
        loader: 'jsx',
        jsx: 'automatic',
      });
    },
  };
}

export default defineConfig({
  root,
  publicDir: 'public',
  plugins: [
    jsxInJsPlugin(),
    react({
      babel: {
        plugins: [
          [
            'module-resolver',
            {
              root: ['./'],
              extensions: ['.web.tsx', '.web.ts', '.tsx', '.ts', '.web.js', '.js'],
              alias: {
                '@components': './src/components',
                '@screens': './src/screens',
                '@navigation': './src/navigation',
                '@services': './src/services',
                '@storage': './src/storage',
                '@context': './src/context',
                '@hooks': './src/hooks',
                '@utils': './src/utils',
                '@constants': './src/constants',
                '@types': './src/types',
                '@app-types': './src/types',
                '@theme': './src/theme',
                '@config': './src/config',
                '@assets': './src/assets',
                '@data': './src/data',
              },
            },
          ],
        ],
      },
    }),
  ],
  define: {
    global: 'window',
    __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'development'),
  },
  resolve: {
    extensions: [
      '.web.tsx',
      '.web.ts',
      '.web.jsx',
      '.web.js',
      '.tsx',
      '.ts',
      '.jsx',
      '.js',
      '.json',
    ],
    alias: [
      { find: 'react-native', replacement: shim('react-native.ts') },
      { find: 'react-native-web', replacement: 'react-native-web' },
      {
        find: 'react-native-linear-gradient',
        replacement: 'react-native-web-linear-gradient',
      },
      { find: '@react-native-firebase/app', replacement: shim('firebase-app.ts') },
      { find: '@react-native-firebase/auth', replacement: shim('firebase-auth.ts') },
      {
        find: '@react-native-firebase/firestore',
        replacement: shim('firebase-firestore.ts'),
      },
      {
        find: '@react-native-firebase/storage',
        replacement: shim('firebase-storage.ts'),
      },
      {
        find: '@react-native-firebase/messaging',
        replacement: shim('firebase-messaging.ts'),
      },
      { find: '@notifee/react-native', replacement: shim('notifee.ts') },
      { find: 'react-native-maps', replacement: shim('react-native-maps.tsx') },
      {
        find: 'react-native-geolocation-service',
        replacement: shim('geolocation.ts'),
      },
      {
        find: 'react-native-image-picker',
        replacement: shim('image-picker.ts'),
      },
      {
        find: 'react-native-document-picker',
        replacement: shim('document-picker.ts'),
      },
      { find: 'react-native-razorpay', replacement: shim('razorpay.ts') },
      {
        find: 'react-native-audio-recorder-player',
        replacement: shim('audio-recorder-player.ts'),
      },
      { find: 'react-native-blob-util', replacement: shim('blob-util.ts') },
      {
        find: 'react-native-haptic-feedback',
        replacement: shim('haptic-feedback.ts'),
      },
      { find: 'react-native-webview', replacement: shim('webview.tsx') },
      { find: /^@components\/(.*)/, replacement: path.resolve(root, 'src/components/$1') },
      { find: /^@screens\/(.*)/, replacement: path.resolve(root, 'src/screens/$1') },
      { find: /^@navigation\/(.*)/, replacement: path.resolve(root, 'src/navigation/$1') },
      { find: /^@services\/(.*)/, replacement: path.resolve(root, 'src/services/$1') },
      { find: /^@storage\/(.*)/, replacement: path.resolve(root, 'src/storage/$1') },
      { find: /^@context\/(.*)/, replacement: path.resolve(root, 'src/context/$1') },
      { find: /^@hooks\/(.*)/, replacement: path.resolve(root, 'src/hooks/$1') },
      { find: /^@utils\/(.*)/, replacement: path.resolve(root, 'src/utils/$1') },
      { find: /^@constants\/(.*)/, replacement: path.resolve(root, 'src/constants/$1') },
      { find: /^@app-types\/(.*)/, replacement: path.resolve(root, 'src/types/$1') },
      { find: /^@theme\/(.*)/, replacement: path.resolve(root, 'src/theme/$1') },
      { find: /^@config\/(.*)/, replacement: path.resolve(root, 'src/config/$1') },
      { find: /^@assets\/(.*)/, replacement: path.resolve(root, 'src/assets/$1') },
      { find: /^@data\/(.*)/, replacement: path.resolve(root, 'src/data/$1') },
      { find: '@components', replacement: path.resolve(root, 'src/components') },
      { find: '@navigation', replacement: path.resolve(root, 'src/navigation') },
      { find: '@services', replacement: path.resolve(root, 'src/services') },
      { find: '@storage', replacement: path.resolve(root, 'src/storage') },
      { find: '@context', replacement: path.resolve(root, 'src/context') },
      { find: '@hooks', replacement: path.resolve(root, 'src/hooks') },
      { find: '@utils', replacement: path.resolve(root, 'src/utils') },
      { find: '@constants', replacement: path.resolve(root, 'src/constants') },
      { find: '@theme', replacement: path.resolve(root, 'src/theme') },
      { find: '@config', replacement: path.resolve(root, 'src/config') },
      { find: '@assets', replacement: path.resolve(root, 'src/assets') },
      { find: '@data', replacement: path.resolve(root, 'src/data') },
    ],
  },
  server: {
    port: 8080,
    open: true,
  },
  build: {
    outDir: 'dist-web',
    sourcemap: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-native-web',
      'react-native-web-linear-gradient',
      'firebase/app',
      'firebase/auth',
      'firebase/firestore',
      'firebase/storage',
      'firebase/messaging',
    ],
    esbuildOptions: {
      resolveExtensions: [
        '.web.tsx',
        '.web.ts',
        '.web.jsx',
        '.web.js',
        '.tsx',
        '.ts',
        '.jsx',
        '.js',
      ],
      loader: {
        '.js': 'jsx',
      },
    },
  },
});
