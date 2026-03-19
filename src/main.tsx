// ═══════════════════════════════════════════════════════════════════════
// HAVEN IDE — React Entry Point
// نقطة دخول React
// ═══════════════════════════════════════════════════════════════════════

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';
import { i18n } from './i18n';

// Set initial document direction
document.documentElement.lang = i18n.lang;
document.documentElement.dir = i18n.direction;

// Listen for language changes
i18n.onLanguageChange((lang) => {
  document.documentElement.lang = lang;
  document.documentElement.dir = i18n.direction;
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
