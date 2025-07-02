
// Simple rate limiting storage
const resetAttempts = new Map<string, { count: number; lastAttempt: number }>();
const RATE_LIMIT = 3; // Max attempts per email
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes

export function useRateLimit() {
  const checkRateLimit = (email: string): boolean => {
    const now = Date.now();
    const emailKey = email.toLowerCase();
    const attempts = resetAttempts.get(emailKey);
    
    if (!attempts) {
      resetAttempts.set(emailKey, { count: 1, lastAttempt: now });
      return true;
    }
    
    // Reset counter if window has passed
    if (now - attempts.lastAttempt > RATE_LIMIT_WINDOW) {
      resetAttempts.set(emailKey, { count: 1, lastAttempt: now });
      return true;
    }
    
    // Check if under rate limit
    if (attempts.count < RATE_LIMIT) {
      attempts.count++;
      attempts.lastAttempt = now;
      return true;
    }
    
    return false;
  };

  return { checkRateLimit };
}
