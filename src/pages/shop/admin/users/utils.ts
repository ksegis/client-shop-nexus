
/**
 * Checks if a role is an inactive role
 */
export const isRoleInactive = (role: string): boolean => {
  return role.startsWith('inactive_');
};

/**
 * Generates a strong password with at least 12 characters including uppercase, lowercase, numbers, and special characters
 */
export const generateStrongPassword = (): string => {
  const uppercaseChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // removed confusing I and O
  const lowercaseChars = 'abcdefghijkmnopqrstuvwxyz'; // removed confusing l
  const numberChars = '23456789'; // removed confusing 0 and 1
  const specialChars = '!@#$%^&*-_=+';
  
  const allChars = uppercaseChars + lowercaseChars + numberChars + specialChars;
  
  // Start with one of each required character type
  let password = 
    uppercaseChars.charAt(Math.floor(Math.random() * uppercaseChars.length)) +
    lowercaseChars.charAt(Math.floor(Math.random() * lowercaseChars.length)) +
    numberChars.charAt(Math.floor(Math.random() * numberChars.length)) +
    specialChars.charAt(Math.floor(Math.random() * specialChars.length));
  
  // Add 8 more random characters for a total of 12 characters
  for (let i = 0; i < 8; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }
  
  // Shuffle the password characters
  return password
    .split('')
    .sort(() => 0.5 - Math.random())
    .join('');
};
