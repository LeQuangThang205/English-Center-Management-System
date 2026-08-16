import { http } from '@/services/api/httpClient';
import type { AuthResponse, LoginRequest } from '@/types/user';

export const authApi = {
  login: (payload: LoginRequest) => http.post<AuthResponse>('/auth/login', payload),
  register: (payload: { email: string; password: string; fullName: string }) =>
    http.post<AuthResponse>('/auth/register', payload),
};
