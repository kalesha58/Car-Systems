export type UserRole = 'customer' | 'dealer';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar?: string;
  dealerType?: string;
  location: string;
}
