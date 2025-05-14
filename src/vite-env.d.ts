
/// <reference types="vite/client" />

// Add any custom type declarations below

// Define environment types for TypeScript
interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string;
  readonly NODE_ENV: 'development' | 'production' | 'test';
  // Add other environment variables here
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
