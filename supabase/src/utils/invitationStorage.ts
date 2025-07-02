
interface InvitationData {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  token: string;
}

export const storeInvitationData = (data: InvitationData) => {
  localStorage.setItem(`invite_${data.email}`, JSON.stringify(data));
  console.log('Stored invitation data for:', data.email, 'with role:', data.role);
};

export const getInvitationData = (email: string): InvitationData | null => {
  const stored = localStorage.getItem(`invite_${email}`);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Error parsing stored invitation data:', e);
    }
  }
  return null;
};

export const clearInvitationData = (email: string) => {
  localStorage.removeItem(`invite_${email}`);
  console.log('Cleared invitation data for:', email);
};
