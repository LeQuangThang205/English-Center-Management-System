import { useState } from 'react';
import { Bell, CheckCheck, Paperclip } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { useNotificationsList } from '@/features/notifications/useNotificationsList';
import { cn } from '@/utils/cn';
import { formatDateTime } from '@/utils/format';
import type { NotificationRecipient } from '@/types/notification';
import styles from './NotificationsPage.module.css';

export function NotificationsPage() {
  const {
    status,
    items,
    filter,
    setFilter,
    totalCount,
    unreadCount,
    reload,
    markAsRead,
    markAllAsRead,
    remove,
  } = useNotificationsList();
  const [detail, setDetail] = useState<NotificationRecipient | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<NotificationRecipient | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [deleteError, setDeleteError] = useState(false);
  const [markAllPending, setMarkAllPending] = useState(false);
  const [markAllError, setMarkAllError] = useState(false);

  const openDetail = (item: NotificationRecipient) => {
    setDetail(item);
    if (!item.isRead) {
      void markAsRead(item.notificationId);
    }
  };

  const handleMarkAllAsRead = async () => {
    setMarkAllPending(true);
    setMarkAllError(false);
    const ok = await markAllAsRead();
    setMarkAllPending(false);
    if (!ok) {
      setMarkAllError(true);
    }
  };

  const openDeleteConfirm = () => {
    setConfirmDelete(detail);
    setDeleteError(false);
  };

  const closeDeleteConfirm = () => {
    setConfirmDelete(null);
    setDeletePending(false);
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeletePending(true);
    setDeleteError(false);
    const ok = await remove(confirmDelete.notificationId);
    setDeletePending(false);
    if (ok) {
      setConfirmDelete(null);
      setDetail(null);
    } else {
      setDeleteError(true);
    }
  };

  return (
    <div className={styles.page}>
      <PageHeader
        title="Thông báo"
        description="Thông báo từ trung tâm dành cho bạn."
        actions={
          unreadCount > 0 ? (
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<CheckCheck size={16} aria-hidden="true" />}
              loading={markAllPending}
              onClick={handleMarkAllAsRead}
            >
              Đánh dấu tất cả đã đọc
            </Button>
          ) : undefined
        }
      />

      {status === 'success' && totalCount > 0 && (
        <div className={styles.toolbar}>
          <div className={styles.filter} role="group" aria-label="Lọc thông báo">
            <Button
              variant={filter === 'all' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              Tất cả ({totalCount})
            </Button>
            <Button
              variant={filter === 'unread' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilter('unread')}
            >
              Chưa đọc ({unreadCount})
            </Button>
          </div>
          {markAllError && <p className={styles.inlineError}>Không thể đánh dấu đã đọc. Vui lòng thử lại.</p>}
        </div>
      )}

      {status === 'loading' && <NotificationsSkeleton />}
      {status === 'error' && (
        <ErrorState
          icon={Bell}
          title="Không thể tải thông báo"
          message="Vui lòng kiểm tra kết nối và thử lại."
          onRetry={reload}
        />
      )}

      {status === 'success' &&
        (totalCount === 0 ? (
          <EmptyState
            icon={Bell}
            title="Không có thông báo nào"
            description="Bạn sẽ nhận được thông báo từ trung tâm khi có thông tin mới."
          />
        ) : (
          <Card>
            {items.length === 0 ? (
              <EmptyState
                icon={Bell}
                title="Không có thông báo chưa đọc"
                description="Bạn đã đọc hết các thông báo."
              />
            ) : (
              <ul className={styles.list}>
                {items.map((item) => (
                  <li key={item.id} className={styles.row}>
                    <button
                      type="button"
                      className={styles.rowButton}
                      aria-label={item.isRead ? item.title : `${item.title}, chưa đọc`}
                      onClick={() => openDetail(item)}
                    >
                      <span
                        className={cn(styles.rowStatus, !item.isRead && styles.rowStatusUnread)}
                        aria-hidden="true"
                      />
                      <span className={styles.rowMain}>
                        <span className={cn(styles.rowTitle, !item.isRead && styles.rowTitleUnread)}>
                          {item.title}
                        </span>
                        <span className={styles.rowExcerpt}>{item.content}</span>
                        <span className={styles.rowMeta}>
                          {!item.isRead && <Badge tone="primary">Chưa đọc</Badge>}
                          <span className={styles.rowDate}>{formatDateTime(item.createdAt)}</span>
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        ))}

      <Modal
        open={detail !== null}
        title={detail?.title ?? 'Thông báo'}
        size="md"
        onClose={() => setDetail(null)}
        footer={
          detail && (
            <>
              <Button variant="secondary" onClick={() => setDetail(null)}>
                Đóng
              </Button>
              <Button variant="danger" onClick={openDeleteConfirm}>
                Xóa
              </Button>
            </>
          )
        }
      >
        {detail && (
          <div>
            <p className={styles.detailMeta}>{formatDateTime(detail.createdAt)}</p>
            <p className={styles.detailContent}>{detail.content}</p>
            {detail.attachmentUrl && (
              <a
                href={detail.attachmentUrl}
                target="_blank"
                rel="noreferrer"
                className={styles.detailAttachment}
              >
                <Paperclip size={14} aria-hidden="true" />
                Tệp đính kèm
              </a>
            )}
          </div>
        )}
      </Modal>

      <Modal
        open={confirmDelete !== null}
        title="Xóa thông báo?"
        size="sm"
        onClose={closeDeleteConfirm}
        footer={
          <>
            <Button variant="secondary" onClick={closeDeleteConfirm} disabled={deletePending}>
              Hủy
            </Button>
            <Button variant="danger" loading={deletePending} onClick={handleDelete}>
              Xác nhận xóa
            </Button>
          </>
        }
      >
        <p className={styles.confirmText}>
          Thông báo này sẽ bị xóa khỏi danh sách của bạn. Hành động này không thể hoàn tác.
        </p>
        {deleteError && <p className={styles.inlineError}>Không thể xóa thông báo. Vui lòng thử lại.</p>}
      </Modal>
    </div>
  );
}

function NotificationsSkeleton() {
  return (
    <div className={styles.skeletonList} aria-label="Đang tải thông báo" role="status">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className={styles.skeletonRow}>
          <span className={styles.skeletonDot} />
          <div className={styles.skeletonLines}>
            <div className={styles.skeletonTitle} />
            <div className={styles.skeletonExcerpt} />
            <div className={styles.skeletonMeta} />
          </div>
        </div>
      ))}
    </div>
  );
}