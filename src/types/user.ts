export type UserRole = 'admin' | 'institution' | 'student' | 'public';

export type UserStatus = 'active' | 'inactive' | 'pending';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  studentId?: string;
  institution: string;
  status: UserStatus;
  avatar?: string;
  createdAt: string;
  lastLogin: string;
}
