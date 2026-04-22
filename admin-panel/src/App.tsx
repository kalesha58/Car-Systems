import { ThemeProvider } from '@theme/ThemeContext';
import { BrowserRouter } from 'react-router-dom';

import { MobileAccessGate } from './components/MobileAccessGate/MobileAccessGate';
import { AppRouter } from './routes/AppRouter';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <MobileAccessGate>
          <AppRouter />
        </MobileAccessGate>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
