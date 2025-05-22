import { UserRole } from '../schemas/user.schema';

export interface MockUserProfile {
  _id: string;
  email: string;
  displayName: string;
  role: UserRole;
  photoURL: string;
  phoneNumber: string | null;
  password: string;
  isVerified: boolean;
}

export const mockUsers: MockUserProfile[] = [
  {
    _id: 'dummy-admin-001',
    email: 'admin@dummy.com',
    displayName: 'Dummy Admin',
    role: UserRole.ADMIN,
    photoURL: 'https://picsum.photos/seed/admin001/40/40',
    phoneNumber: null,
    password: 'password123',
    isVerified: true,
  },
  {
    _id: 'dummy-user-002',
    email: 'user@dummy.com',
    displayName: 'Dummy User',
    role: UserRole.USER,
    photoURL: 'https://picsum.photos/seed/user002/40/40',
    phoneNumber: null,
    password: 'password123',
    isVerified: true,
  },
];
