import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Manage Service Worker for PWA (Only in production to avoid caching dev server modules)
if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    // Check for updates safely without disrupting active user sessions or forcing unprompted reloads
    window.addEventListener('load', () => {
      const swPath = `${import.meta.env.BASE_URL}sw.js`.replace(/\/\//g, '/');
      navigator.serviceWorker
        .register(swPath)
        .then((reg) => {
          // Check for updates gracefully on startup
          reg.update().catch(() => {});

          // Periodic check every 15 minutes (non-blocking)
          setInterval(() => {
            reg.update().catch(() => {});
          }, 15 * 60 * 1000);
        })
        .catch((err) => {
          console.warn('SW registration failed:', err);
        });
    });
  } else {
    // Unregister dev-mode service workers that could cause stale chunks or dual React copies
    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
        }
      })
      .catch(() => {});
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

