import React from 'react';
import ReactDOM from 'react-dom/client';
// Fix: Use relative path for import
import App from './App';
// Fix: Removed unused LanguageProvider import

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
