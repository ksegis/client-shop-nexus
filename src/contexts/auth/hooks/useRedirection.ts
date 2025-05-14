
import { useCallback } from 'react';

export function useRedirection() {
  const redirectUserBasedOnRole = useCallback(() => {
    // No redirections needed
  }, []);

  const getRedirectPathByRole = useCallback((): string => {
    return '/';
  }, []);

  return { redirectUserBasedOnRole, getRedirectPathByRole };
}
