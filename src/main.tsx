
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'
import { Toaster } from '@/components/ui/toaster'

// Handle hash redirects at the entry point
if (window.location.hash && window.location.pathname === '/') {
  window.history.replaceState(null, '', '/auth');
}

// Make sure localStorage is available before initializing
const isStorageAvailable = (type: string): boolean => {
  try {
    const storage = window[type as keyof Window] as Storage;
    const x = '__storage_test__';
    storage.setItem(x, x);
    storage.removeItem(x);
    return true;
  } catch (e) {
    return false;
  }
};

// Initialize the application with proper routing setup
const rootElement = document.getElementById("root");

if (rootElement) {
  // Check if localStorage is available
  if (!isStorageAvailable('localStorage')) {
    // Fallback for when localStorage is not available (like in incognito mode)
    rootElement.innerHTML = `
      <div style="padding: 20px; text-align: center;">
        <h2>Storage Access Required</h2>
        <p>This application requires access to browser storage to function properly.</p>
        <p>If you're in incognito/private browsing mode, please switch to regular browsing or enable third-party cookies.</p>
      </div>
    `;
  } else {
    createRoot(rootElement).render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
  }
}
