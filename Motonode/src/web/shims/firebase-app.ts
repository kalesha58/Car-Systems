import { getApps } from 'firebase/app';

import { getFirebaseApp } from '../firebase/init';

/**
 * Minimal RN Firebase app shim — ensures the JS SDK app is initialized.
 */
function firebaseApp() {
  getFirebaseApp();
  return getApps()[0];
}

firebaseApp.apps = getApps;

export default firebaseApp;
