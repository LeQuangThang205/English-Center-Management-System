import { useCallback, useEffect, useState } from 'react';
import { aiChatApi } from '@/services/api/aiChatApi';
import type { AiConversation, AiConversationDetail, AiMessage } from '@/types/aiChat';

export type LoadStatus = 'loading' | 'error' | 'success';

export interface UseAiChatResult {
  conversations: AiConversation[];
  listStatus: LoadStatus;
  reload: () => void;
  activeId: number | null;
  detail: AiConversationDetail | null;
  detailStatus: LoadStatus | 'idle';
  detailError: string | null;
  openConversation: (id: number) => void;
  startNew: () => void;
  draft: string;
  setDraft: (value: string) => void;
  sendPending: boolean;
  sendError: string | null;
  notice: string | null;
  send: (text?: string) => Promise<void>;
  retrySend: () => Promise<void>;
  confirmDelete: AiConversation | null;
  openDeleteConfirm: (conversation: AiConversation) => void;
  closeDeleteConfirm: () => void;
  deletePending: boolean;
  deleteError: boolean;
  remove: () => Promise<void>;
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return 'Đã xảy ra lỗi. Vui lòng thử lại.';
}

/**
 * S13 — state model cho AI Chat.
 * Server là source of truth: mở lại conversation thì GET detail và thay thế
 * local state. Tránh optimistic sync phức tạp và duplicate message.
 */
export function useAiChat(): UseAiChatResult {
  const [conversations, setConversations] = useState<AiConversation[]>([]);
  const [listStatus, setListStatus] = useState<LoadStatus>('loading');
  const [reloadKey, setReloadKey] = useState(0);

  const [activeId, setActiveId] = useState<number | null>(null);
  const [detail, setDetail] = useState<AiConversationDetail | null>(null);
  const [detailStatus, setDetailStatus] = useState<LoadStatus | 'idle'>('idle');
  const [detailError, setDetailError] = useState<string | null>(null);

  const [draft, setDraft] = useState('');
  const [sendPending, setSendPending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [lastDraft, setLastDraft] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [confirmDelete, setConfirmDelete] = useState<AiConversation | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [deleteError, setDeleteError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setListStatus('loading');
      try {
        const list = await aiChatApi.getConversations();
        if (cancelled) return;
        setConversations(list);
        setListStatus('success');
      } catch {
        if (!cancelled) {
          setListStatus('error');
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const reload = useCallback(() => {
    setReloadKey((value) => value + 1);
  }, []);

  const openConversation = useCallback(async (id: number) => {
    setActiveId(id);
    setDetailStatus('loading');
    setDetailError(null);
    setSendError(null);
    setNotice(null);
    try {
      const loaded = await aiChatApi.getConversation(id);
      setDetail(loaded);
      setDetailStatus('success');
    } catch (error) {
      // Giữ history sidebar, chỉ báo lỗi ở chat panel.
      setDetail(null);
      setDetailError(toErrorMessage(error));
      setDetailStatus('error');
    }
  }, []);

  const startNew = useCallback(() => {
    setActiveId(null);
    setDetail(null);
    setDetailStatus('idle');
    setDetailError(null);
    setSendError(null);
    setNotice(null);
  }, []);

  const sendWith = useCallback(
    async (text: string) => {
      if (sendPending) return;
      const message = text.trim();
      if (!message) return;
      setSendPending(true);
      setSendError(null);
      setNotice(null);
      try {
        const response = await aiChatApi.sendMessage(message, activeId);
        const now = new Date().toISOString();
        const userEntry: AiMessage = {
          sequenceNumber: -1,
          question: message,
          response: '',
          createdAt: now,
        };
        const assistantEntry: AiMessage = {
          sequenceNumber: -2,
          question: '',
          response: response.reply,
          createdAt: now,
        };
        const pair = [userEntry, assistantEntry];
        const returnedId = response.conversationId;
        setDetail((prev) => {
          if (returnedId !== null && prev && prev.id === returnedId) {
            return { ...prev, updatedAt: now, messages: [...prev.messages, ...pair] };
          }
          return {
            id: returnedId ?? prev?.id ?? 0,
            type: prev?.type ?? 'CHATBOT',
            title: prev?.title ?? message.slice(0, 100),
            createdAt: prev?.createdAt ?? now,
            updatedAt: now,
            messages: returnedId !== null ? pair : [...(prev?.messages ?? []), ...pair],
          };
        });
        if (returnedId !== null) {
          setActiveId(returnedId);
          setConversations((prev) => {
            const existing = prev.find((item) => item.id === returnedId);
            if (existing) {
              return prev.map((item) =>
                item.id === returnedId
                  ? { ...item, title: item.title ?? message.slice(0, 100), updatedAt: new Date().toISOString() }
                  : item,
              );
            }
            return [
              {
                id: returnedId,
                type: 'CHATBOT',
                title: message.slice(0, 100),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
              ...prev,
            ];
          });
        }
        if (!response.historySaved || response.notice) {
          setNotice(response.notice ?? 'AI đã trả lời nhưng không lưu được lịch sử hội thoại.');
        }
        setDraft('');
        setLastDraft(null);
      } catch (error) {
        setSendError(toErrorMessage(error));
        setLastDraft(message);
      } finally {
        setSendPending(false);
      }
    },
    [activeId, sendPending],
  );

  const send = useCallback(
    async (text?: string) => {
      await sendWith(text ?? draft);
    },
    [draft, sendWith],
  );

  const retrySend = useCallback(async () => {
    if (lastDraft) {
      await sendWith(lastDraft);
    }
  }, [lastDraft, sendWith]);

  const openDeleteConfirm = useCallback((conversation: AiConversation) => {
    setConfirmDelete(conversation);
    setDeleteError(false);
  }, []);

  const closeDeleteConfirm = useCallback(() => {
    setConfirmDelete(null);
    setDeletePending(false);
  }, []);

  const remove = useCallback(async () => {
    if (!confirmDelete || deletePending) return;
    setDeletePending(true);
    setDeleteError(false);
    try {
      await aiChatApi.deleteConversation(confirmDelete.id);
      const deletedId = confirmDelete.id;
      setConversations((prev) => prev.filter((item) => item.id !== deletedId));
      if (activeId === deletedId) {
        setActiveId(null);
        setDetail(null);
        setDetailStatus('idle');
        setDetailError(null);
      }
      setConfirmDelete(null);
    } catch (error) {
      if (error instanceof Error && 'status' in error && (error as { status?: number }).status === 404) {
        // Conversation đã không còn (xóa ở nơi khác) — đồng bộ list với server.
        const deletedId = confirmDelete.id;
        setConversations((prev) => prev.filter((item) => item.id !== deletedId));
        if (activeId === deletedId) {
          setActiveId(null);
          setDetail(null);
          setDetailStatus('idle');
          setDetailError(null);
        }
        setConfirmDelete(null);
      } else {
        setDeleteError(true);
      }
    } finally {
      setDeletePending(false);
    }
  }, [confirmDelete, deletePending, activeId]);

  return {
    conversations,
    listStatus,
    reload,
    activeId,
    detail,
    detailStatus,
    detailError,
    openConversation,
    startNew,
    draft,
    setDraft,
    sendPending,
    sendError,
    notice,
    send,
    retrySend,
    confirmDelete,
    openDeleteConfirm,
    closeDeleteConfirm,
    deletePending,
    deleteError,
    remove,
  };
}
