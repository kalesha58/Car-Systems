/**
 * Web entry — no Notifee / FCM background handlers (native-only in index.js).
 */
import { AppRegistry } from 'react-native';

import App from './App';
import { name as appName } from './app.json';
import { loadWebFonts, loadWebIconFonts } from './src/web/loadIconFonts';

loadWebFonts();
loadWebIconFonts();

AppRegistry.registerComponent(appName, () => App);

const rootTag = document.getElementById('root');
if (!rootTag) {
  throw new Error('Root element #root not found');
}

AppRegistry.runApplication(appName, {
  rootTag,
  hydrate: false,
});
