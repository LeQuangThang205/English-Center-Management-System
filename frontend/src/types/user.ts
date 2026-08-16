export type Role = 'ADMIN' | 'TEACHER' | 'STUDENT';

export type UserStatus = 'ACTIVE' | 'INACTIVE';

export interface User {
  id: number;
  email: string;
  fullName: string;
  phone?: string | null;
  role: Role;
  status: UserStatus;
  avatarUrl?: string | null;
  emailVerifiedAt?: string | null;
  lastLoginAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}
