import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Manage Service Worker for PWA (Only in production to avoid caching dev server modules)
if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    let refreshing = false;

    // When the service worker updates and takes control, reload cleanly to show fresh code
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });

    window.addEventListener('load', () => {
      const swPath = `${import.meta.env.BASE_URL}sw.js`.replace(/\/\//g, '/');
      navigator.serviceWorker
        .register(swPath)
        .then((reg) => {
          // Immediately check for updates
          reg.update().catch(() => {});

          // Check for updates every time user opens / switches back to the app on mobile
          document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
              reg.update().catch(() => {});
            }
          });

          // Periodic check every 60 seconds
          setInterval(() => {
            reg.update().catch(() => {});
          }, 60 * 1000);

          // If an update is detected, tell the new worker to skip waiting
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                }
              });
            }
          });
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

