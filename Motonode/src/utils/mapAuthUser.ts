import type { AuthUser } from '../types/auth';
import type { ServerUser } from '../types/api';

function resolveAppRole(role: ServerUser['role']): AuthUser['role'] {
  const roles = Array.isArray(role) ? role : [role];
  if (roles.includes('dealer')) {
    return 'dealer';
  }
  return 'customer';
}

export function mapServerUserToAuthUser(serverUser: ServerUser): AuthUser {
  const id = serverUser.id ?? serverUser._id ?? '';

  return {
    id,
    name: serverUser.name,
    email: serverUser.email,
    phone: serverUser.phone ?? '',
    role: resolveAppRole(serverUser.role),
    avatar: serverUser.profileImage,
    location: serverUser.address ?? '',
  };
}
