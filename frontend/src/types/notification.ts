export type NotificationTargetType = 'ALL_STUDENTS' | 'ALL_TEACHERS' | 'SPECIFIC_CLASS' | 'SPECIFIC_USER';

export interface NotificationRecipient {
  id: number;
  notificationId: number;
  title: string;
  content: string;
  targetType: NotificationTargetType;
  targetId?: number | null;
  attachmentUrl?: string | null;
  createdAt?: string | null;
  isRead: boolean;
  readAt?: string | null;
}
