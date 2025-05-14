
export const generateStrongPassword = (length: number = 12): string => {
  const lowerCase = 'abcdefghijklmnopqrstuvwxyz';
  const upperCase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+{}[]|:;<>,.?/~';
  
  const allChars = lowerCase + upperCase + numbers + special;
  
  // Ensure at least one character from each category
  let password = '';
  password += lowerCase.charAt(Math.floor(Math.random() * lowerCase.length));
  password += upperCase.charAt(Math.floor(Math.random() * upperCase.length));
  password += numbers.charAt(Math.floor(Math.random() * numbers.length));
  password += special.charAt(Math.floor(Math.random() * special.length));
  
  // Fill the rest with random characters
  for (let i = 4; i < length; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }
  
  // Shuffle the password
  return password.split('').sort(() => 0.5 - Math.random()).join('');
};

// Format user role for display
export const formatUserRole = (role: string): string => {
  // Handle inactive roles by removing the "inactive_" prefix
  const roleWithoutPrefix = role.replace('inactive_', '');
  
  // Capitalize first letter
  return roleWithoutPrefix.charAt(0).toUpperCase() + roleWithoutPrefix.slice(1);
};

// Format date for display
export const formatDate = (dateString: string): string => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid Date';
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};
