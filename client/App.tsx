import React from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import './src/config/i18n';
import Navigation from '@navigation/Navigation';

const App = () => {
  return (
    <SafeAreaProvider>
      <Navigation />
    </SafeAreaProvider>
  );
};

export default App;