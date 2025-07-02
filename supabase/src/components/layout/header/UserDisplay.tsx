
import { useAuth } from '@/contexts/auth';

export function UserDisplay() {
  const { user, profile } = useAuth();

  if (!user || !profile) {
    return null;
  }

  // Only show display name if both first and last name are present and not empty
  const hasValidName = profile.first_name && profile.last_name && 
                      profile.first_name.trim() !== '' && profile.last_name.trim() !== '';
  
  const displayName = hasValidName 
    ? `${profile.first_name} ${profile.last_name}`.trim()
    : user.email; // Fall back to email if no valid name

  return (
    <div className="hidden md:flex flex-col text-right text-sm">
      <span className="font-medium text-gray-900">{displayName}</span>
      <span className="text-gray-500">{user.email}</span>
    </div>
  );
}
