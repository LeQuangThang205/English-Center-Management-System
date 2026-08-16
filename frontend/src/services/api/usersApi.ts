import { http } from '@/services/api/httpClient';
import type { Role, User, UserStatus } from '@/types/user';

export interface UsersQuery {
  role?: Role;
  status?: UserStatus;
}

export const usersApi = {
  getUsers: (query?: UsersQuery) => {
    const params = new URLSearchParams();
    if (query?.role) params.set('role', query.role);
    if (query?.status) params.set('status', query.status);
    const qs = params.toString();
    return http.get<User[]>(`/users${qs ? `?${qs}` : ''}`);
  },
};
