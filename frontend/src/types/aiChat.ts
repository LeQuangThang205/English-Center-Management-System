/**
 * Kiểu dữ liệu cho S13 — Frontend AI Chat.
 * Map 1-1 với backend DTO (`AiChatResponse`, `AiConversationResponse`,
 * `AiConversationDetailResponse`). Không thêm field ngoài backend response.
 */

export type ConversationType = 'CHATBOT' | 'ASSISTANT';

export interface AiChatResponse {
  reply: string;
  conversationId: number | null;
  historySaved: boolean;
  notice?: string | null;
}

export interface AiConversation {
  id: number;
  type: ConversationType;
  title: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AiMessage {
  sequenceNumber: number;
  question: string;
  response: string;
  createdAt: string;
}

export interface AiConversationDetail extends AiConversation {
  messages: AiMessage[];
}
