// Fix: Provide a standard React entry point implementation.
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// Fix: Correct path to LanguageContext based on provided file structure.
import { LanguageProvider } from '../context/LanguageContext';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    {/* Fix: Wrap App with LanguageProvider to provide context to all components. */}
    <LanguageProvider>
        <App />
    </LanguageProvider>
  </React.StrictMode>
);
