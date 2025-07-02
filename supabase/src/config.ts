// Environment configuration
type EnvironmentConfig = {
  siteUrl: string;
  apiBaseUrl: string;
  mode: 'development' | 'production' | 'test';
  egis: {
    clientId: string;
    clientSecret: string;
    authUrl: string;
    tokenUrl: string;
    redirectUri: string;
  };
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

/**
 * Builds the redirect URI using the site URL
 */
const getRedirectUri = (): string => {
  // Use the explicit redirect URI if provided in env vars
  if (import.meta.env.VITE_EGIS_REDIRECT_URI) {
    return import.meta.env.VITE_EGIS_REDIRECT_URI;
  }
  
  // Otherwise build it from the site URL
  const baseUrl = getSiteUrl();
  return `${baseUrl}/auth/callback`;
};

// Application configuration
export const config: EnvironmentConfig = {
  siteUrl: getSiteUrl(),
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
  mode: (import.meta.env.MODE || 'development') as 'development' | 'production' | 'test',
  egis: {
    clientId: import.meta.env.VITE_EGIS_CLIENT_ID || '',
    clientSecret: import.meta.env.VITE_EGIS_CLIENT_SECRET || '',
    authUrl: import.meta.env.VITE_EGIS_AUTH_URL || '',
    tokenUrl: import.meta.env.VITE_EGIS_TOKEN_URL || '',
    redirectUri: getRedirectUri()
  }
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

/**
 * Helper to get the OAuth URL for initiating the authentication flow
 * @param state Optional state parameter for CSRF protection
 */
export const getOAuthUrl = (state?: string): string => {
  const { clientId, authUrl, redirectUri } = config.egis;
  
  if (!clientId || !authUrl) {
    console.error('OAuth configuration is incomplete');
    return '';
  }
  
  const params: Record<string, string> = {
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid profile email',
  };
  
  // Add state parameter if provided
  if (state) {
    params.state = state;
  }
  
  return `${authUrl}?${new URLSearchParams(params).toString()}`;
};

/**
 * Alternative name for getOAuthUrl to match your preferred naming convention
 */
export const getEgisOAuthUrl = getOAuthUrl;
