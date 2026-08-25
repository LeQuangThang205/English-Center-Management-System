import { http } from '@/services/api/httpClient';
import type { NotificationRecipient } from '@/types/notification';

export const notificationsApi = {
  getAll: () => http.get<NotificationRecipient[]>('/notifications'),
  getById: (notificationId: number) => http.get<NotificationRecipient>(`/notifications/${notificationId}`),
  getUnreadCount: () => http.get<number>('/notifications/unread/count'),
  markAllAsRead: () => http.put<number>('/notifications/read-all'),
  remove: (notificationId: number) => http.delete<void>(`/notifications/${notificationId}`),
};
