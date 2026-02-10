import React from 'react';
import ReactDOMClient from 'react-dom/client';
import App from './App.tsx';
import './index.css';

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

  // Register Service Worker for offline support (Production only)
  if ('serviceWorker' in navigator) {
    if (import.meta.env.PROD) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(err => console.error('SW failed', err));
      });
    } else {
      // Unregister SW in development
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
          registration.unregister();
        });
      }
    }
  }

  root.render(
    // Disabled to prevent 'Map container is already initialized' error with React Leaflet
    <App />
  );
} else {
  console.error('Failed to find the root element to mount React application.');
}