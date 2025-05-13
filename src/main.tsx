
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './contexts/auth'

// Handle hash redirects at the entry point
if (window.location.hash === '#' && window.location.pathname === '/') {
  window.history.replaceState(null, '', '/auth');
}

// Initialize the application with proper routing setup
createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <AuthProvider>
      <App />
    </AuthProvider>
  </BrowserRouter>
);
