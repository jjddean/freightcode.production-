import React from 'react';
import ReactDOMClient from 'react-dom/client';
import App from './App.tsx';
import './index.css';

async function cleanupServiceWorkersAndCaches() {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  }

  if ('caches' in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  }
}

// Find the DOM element where your React app will be mounted
const container = document.getElementById('root');

// Ensure the container exists and create a root only if it doesn't already have one
if (container) {
  // If you are using React 18's new client APIs, avoid calling createRoot multiple times
  // Get the existing root if it was created previously, or create a new one
  // Note: There isn't a direct public API to check if a container *already* has a root
  // via ReactDOMClient. The warning itself helps identify this.
  // The most robust solution is to ensure the initialization code runs only once.

  const root = ReactDOMClient.createRoot(container);

  // Service worker is opt-in to avoid stale-cache flashes during active development/deploys.
  const enableServiceWorker = import.meta.env.VITE_ENABLE_SW === 'true';
  if ('serviceWorker' in navigator) {
    if (import.meta.env.PROD && enableServiceWorker) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(err => console.error('SW failed', err));
      });
    } else {
      cleanupServiceWorkersAndCaches().catch((err) => console.error('SW cleanup failed', err));
    }
  }

  root.render(
    // Disabled to prevent 'Map container is already initialized' error with React Leaflet
    <App />
  );
} else {
  console.error('Failed to find the root element to mount React application.');
}
