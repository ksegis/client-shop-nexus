
import { useAuth } from '@/contexts/auth';

export function UserDisplay() {
  const { user, profile } = useAuth();

  if (!user || !profile) {
    return null;
  }

  const displayName = profile.first_name && profile.last_name 
    ? `${profile.first_name} ${profile.last_name}`.trim()
    : 'User';

  return (
    <div className="hidden md:flex flex-col text-right text-sm">
      <span className="font-medium text-gray-900">{displayName}</span>
      <span className="text-gray-500">{user.email}</span>
    </div>
  );
}
