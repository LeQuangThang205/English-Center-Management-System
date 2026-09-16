import { http } from '@/services/api/httpClient';
import type { AiChatResponse, AiConversation, AiConversationDetail } from '@/types/aiChat';

/**
 * S13 — API client cho AI Chat (`/api/ai/*`).
 * Chỉ gửi `message` + `conversationId` — không gửi userId, không API key.
 * Auth + ownership do backend enforce qua JWT.
 */
export const aiChatApi = {
  sendMessage: (message: string, conversationId?: number | null) =>
    http.post<AiChatResponse>('/ai/chat', { message, conversationId: conversationId ?? null }),
  getConversations: () => http.get<AiConversation[]>('/ai/conversations'),
  getConversation: (id: number) => http.get<AiConversationDetail>(`/ai/conversations/${id}`),
  deleteConversation: (id: number) => http.delete<void>(`/ai/conversations/${id}`),
};
