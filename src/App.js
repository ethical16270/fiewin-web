import React, { useState, useMemo } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import LandingPage from './components/LandingPage';
import UTRVerification from './components/UTRVerification';
import WebsiteSelector from './components/WebsiteSelector';
import HackInterface from './components/HackInterface';
import AdminPanel from './components/AdminPanel';
import PlanVerification from './components/PlanVerification';
import { getTheme } from './theme';

// Create a theme context
export const ColorModeContext = React.createContext({ 
  toggleColorMode: () => {},
  mode: 'light'
});

function App() {
  const [mode, setMode] = useState(localStorage.getItem('themeMode') || 'light');

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => {
          const newMode = prevMode === 'light' ? 'dark' : 'light';
          localStorage.setItem('themeMode', newMode);
          return newMode;
        });
      },
      mode,
    }),
    [mode]
  );

  const theme = useMemo(() => getTheme(mode), [mode]);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/verify" element={<PlanVerification />} />
            <Route path="/select-website" element={<WebsiteSelector />} />
            <Route path="/hack" element={<HackInterface />} />
            <Route path="/admin" element={<AdminPanel />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export default App;
