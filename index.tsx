
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

/**
 * Root entry point for the Dunhuang Color application.
 * Bootstraps the main App component.
 */
const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
