import { http } from '@/services/api/httpClient';

export const notificationsApi = {
  getUnreadCount: () => http.get<number>('/notifications/unread/count'),
};
