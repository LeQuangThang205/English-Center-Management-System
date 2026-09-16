import { useEffect, useRef } from 'react';
import { Bot, MessageSquareText, Plus, RotateCcw, Send, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { Spinner } from '@/components/ui/Spinner';
import { useAiChat } from '@/features/ai/useAiChat';
import { cn } from '@/utils/cn';
import { formatDateTime } from '@/utils/format';
import styles from './AiChatPage.module.css';

const SUGGESTIONS = ['Tôi đang học lớp nào?', 'Lịch học của tôi là gì?', 'Tôi có thể đăng ký lớp nào?'];

function conversationTitle(title: string | null, id: number): string {
  return title && title.trim() ? title : `Hội thoại #${id}`;
}

/**
 * S13 — Trang chat AI dùng chung cho STUDENT / TEACHER / ADMIN.
 * Backend là source of truth cho auth, ownership và role-based context.
 */
export function AiChatPage() {
  const {
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
  } = useAiChat();

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [detail?.messages.length, sendPending]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    void send();
  };

  const handleSuggestion = (suggestion: string) => {
    setDraft(suggestion);
    void send(suggestion);
  };

  const canSend = draft.trim().length > 0 && !sendPending;
  const showEmptyChat = detailStatus === 'idle' && !sendPending;

  return (
    <div className={styles.page}>
      <PageHeader title="Trợ lý AI" description="Hỏi đáp về khóa học, lịch học, đăng ký và thanh toán." />

      <div className={styles.layout}>
        <Card className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h2 className={styles.sidebarTitle}>Lịch sử hội thoại</h2>
            <Button variant="secondary" size="sm" leftIcon={<Plus size={16} aria-hidden="true" />} onClick={startNew}>
              Hội thoại mới
            </Button>
          </div>

          {listStatus === 'loading' && (
            <div className={styles.historyLoading} role="status" aria-label="Đang tải lịch sử hội thoại">
              <Spinner size="sm" />
              <span>Đang tải lịch sử…</span>
            </div>
          )}
          {listStatus === 'error' && (
            <ErrorState
              icon={MessageSquareText}
              title="Không thể tải lịch sử hội thoại"
              message="Vui lòng kiểm tra kết nối và thử lại."
              onRetry={reload}
            />
          )}
          {listStatus === 'success' &&
            (conversations.length === 0 ? (
              <EmptyState
                icon={MessageSquareText}
                title="Chưa có hội thoại nào"
                description="Hãy bắt đầu hội thoại mới với trợ lý AI."
              />
            ) : (
              <ul className={styles.historyList}>
                {conversations.map((item) => (
                  <li key={item.id} className={cn(styles.historyItem, item.id === activeId && styles.historyItemActive)}>
                    <button
                      type="button"
                      className={styles.historyButton}
                      aria-label={conversationTitle(item.title, item.id)}
                      aria-current={item.id === activeId ? 'true' : undefined}
                      onClick={() => void openConversation(item.id)}
                    >
                      <span className={styles.historyTitle}>{conversationTitle(item.title, item.id)}</span>
                      <span className={styles.historyDate}>{formatDateTime(item.updatedAt)}</span>
                    </button>
                    <button
                      type="button"
                      className={styles.historyDelete}
                      aria-label={`Xóa ${conversationTitle(item.title, item.id)}`}
                      onClick={() => openDeleteConfirm(item)}
                    >
                      <Trash2 size={15} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            ))}
        </Card>

        <Card className={styles.chat}>
          {detailStatus === 'error' && (
            <ErrorState
              icon={Bot}
              title="Không thể mở hội thoại"
              message={detailError ?? 'Vui lòng thử lại.'}
              onRetry={activeId !== null ? () => void openConversation(activeId) : undefined}
            />
          )}

          {showEmptyChat && (
            <EmptyState
              icon={Bot}
              title="Bắt đầu trò chuyện với trợ lý AI"
              description="Đặt câu hỏi về khóa học, lịch học, đăng ký hoặc học phí."
              action={
                <div className={styles.suggestions}>
                  {SUGGESTIONS.map((suggestion) => (
                    <Button key={suggestion} variant="secondary" size="sm" onClick={() => handleSuggestion(suggestion)}>
                      {suggestion}
                    </Button>
                  ))}
                </div>
              }
            />
          )}

          {(detailStatus === 'loading' || detailStatus === 'success' || sendPending || detail) && (
            <div ref={scrollRef} className={styles.messages} role="log" aria-label="Nội dung hội thoại">
              {detailStatus === 'loading' && (
                <div className={styles.historyLoading} role="status" aria-label="Đang tải hội thoại">
                  <Spinner size="sm" />
                  <span>Đang tải hội thoại…</span>
                </div>
              )}
              {detail?.messages.map((entry, index) => (
                <div key={`${entry.sequenceNumber}-${index}`} className={styles.turn}>
                  {entry.question && (
                    <div className={styles.userRow}>
                      <p className={cn(styles.bubble, styles.userBubble)}>{entry.question}</p>
                    </div>
                  )}
                  {entry.response && (
                    <div className={styles.assistantRow}>
                      <span className={styles.assistantAvatar} aria-hidden="true">
                        <Bot size={16} />
                      </span>
                      <div className={styles.assistantMain}>
                        <p className={cn(styles.bubble, styles.assistantBubble)}>{entry.response}</p>
                        {entry.createdAt && (
                          <span className={styles.messageTime}>{formatDateTime(entry.createdAt)}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {sendPending && (
                <div className={styles.assistantRow}>
                  <span className={styles.assistantAvatar} aria-hidden="true">
                    <Bot size={16} />
                  </span>
                  <p className={cn(styles.bubble, styles.assistantBubble, styles.typing)} role="status">
                    AI đang trả lời<span className={styles.typingDots} aria-hidden="true">…</span>
                  </p>
                </div>
              )}
            </div>
          )}

          {notice && (
            <p className={styles.notice} role="status">
              <Badge tone="warning">Lưu ý</Badge> {notice}
            </p>
          )}
          {sendError && (
            <div className={styles.sendError} role="alert">
              <span>{sendError}</span>
              <Button variant="secondary" size="sm" leftIcon={<RotateCcw size={14} aria-hidden="true" />} onClick={() => void retrySend()}>
                Thử lại
              </Button>
            </div>
          )}

          <form className={styles.composer} onSubmit={handleSubmit}>
            <Input
              aria-label="Nhập câu hỏi cho trợ lý AI"
              placeholder="Nhập câu hỏi…"
              value={draft}
              disabled={sendPending}
              onChange={(event) => setDraft(event.target.value)}
            />
            <Button type="submit" disabled={!canSend} loading={sendPending} rightIcon={<Send size={16} aria-hidden="true" />}>
              Gửi
            </Button>
          </form>
        </Card>
      </div>

      <Modal
        open={confirmDelete !== null}
        title="Xóa hội thoại?"
        size="sm"
        onClose={closeDeleteConfirm}
        footer={
          <>
            <Button variant="secondary" onClick={closeDeleteConfirm} disabled={deletePending}>
              Hủy
            </Button>
            <Button variant="danger" loading={deletePending} onClick={() => void remove()}>
              Xác nhận xóa
            </Button>
          </>
        }
      >
        <p className={styles.confirmText}>
          {confirmDelete && <>“{conversationTitle(confirmDelete.title, confirmDelete.id)}” </>}
          sẽ bị xóa và không thể hoàn tác.
        </p>
        {deleteError && <p className={styles.inlineError}>Không thể xóa hội thoại. Vui lòng thử lại.</p>}
      </Modal>
    </div>
  );
}
