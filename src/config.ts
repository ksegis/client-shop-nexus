
// Environment configuration
type EnvironmentConfig = {
  siteUrl: string;
  apiBaseUrl: string;
  mode: 'development' | 'production' | 'test';
};

/**
 * Gets site URL from environment variables or defaults to relative paths
 * which will work regardless of deployment environment
 */
const getSiteUrl = (): string => {
  if (import.meta.env.VITE_SITE_URL) {
    return import.meta.env.VITE_SITE_URL;
  }
  
  // Default to relative paths when no environment variable is set
  return '';
};

// Application configuration
export const config: EnvironmentConfig = {
  siteUrl: getSiteUrl(),
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
  mode: (import.meta.env.MODE || 'development') as 'development' | 'production' | 'test',
};

/**
 * Helper to generate full URLs using the environment-aware base URL
 * 
 * @param path - The path to append to the base URL
 * @returns Full URL with proper environment awareness
 */
export const getFullUrl = (path: string): string => {
  // Remove leading slash for proper URL construction
  const formattedPath = path.startsWith('/') ? path.substring(1) : path;
  
  // If we have a site URL, use it, otherwise just return the relative path
  // This ensures links work correctly in any environment
  return config.siteUrl 
    ? `${config.siteUrl}/${formattedPath}`.replace(/([^:]\/)\/+/g, '$1') // Avoid double slashes
    : `/${formattedPath}`;
};
