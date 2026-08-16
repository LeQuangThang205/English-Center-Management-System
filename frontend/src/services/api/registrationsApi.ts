import { http } from '@/services/api/httpClient';
import type { Registration, RegistrationStatus } from '@/types/registration';

export interface RegistrationsQuery {
  studentId?: number;
  classId?: number;
  status?: RegistrationStatus;
}

export const registrationsApi = {
  getRegistrations: (query?: RegistrationsQuery) => {
    const params = new URLSearchParams();
    if (query?.studentId != null) params.set('studentId', String(query.studentId));
    if (query?.classId != null) params.set('classId', String(query.classId));
    if (query?.status) params.set('status', query.status);
    const qs = params.toString();
    return http.get<Registration[]>(`/registrations${qs ? `?${qs}` : ''}`);
  },
};
