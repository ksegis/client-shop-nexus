
/// <reference types="vite/client" />

// Add any custom type declarations below

// Define environment types for TypeScript
interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string;
  readonly NODE_ENV: 'development' | 'production' | 'test';
  readonly VITE_EGIS_CLIENT_ID: string;
  readonly VITE_EGIS_CLIENT_SECRET: string;
  readonly VITE_EGIS_AUTH_URL: string;
  readonly VITE_EGIS_TOKEN_URL: string;
  // Add other environment variables here
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
