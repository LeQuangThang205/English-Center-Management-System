import { useState } from 'react';
import { CreditCard, Eye, Search } from 'lucide-react';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { Select } from '@/components/ui/Select';
import {
  useAdminTransactions,
  type TransactionStatusFilter,
} from '@/features/transactions/useAdminTransactions';
import { transactionsApi } from '@/services/api/transactionsApi';
import { ApiError } from '@/services/api/httpClient';
import type { Transaction, TransactionStatus } from '@/types/transaction';
import { formatDate, formatDateTime, formatVnd } from '@/utils/format';
import styles from './AdminTransactionsPage.module.css';

const TRANSACTION_STATUSES: TransactionStatus[] = ['PENDING_CONFIRMATION', 'SUCCESS', 'FAILED'];

const TRANSACTION_STATUS_LABELS: Record<TransactionStatus, string> = {
  PENDING_CONFIRMATION: 'Chờ xác nhận',
  SUCCESS: 'Thành công',
  FAILED: 'Thất bại',
};

const TRANSACTION_STATUS_TONES: Record<TransactionStatus, BadgeTone> = {
  PENDING_CONFIRMATION: 'warning',
  SUCCESS: 'success',
  FAILED: 'danger',
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  BANK_TRANSFER: 'Chuyển khoản',
};

function formatPaymentMethod(method: string): string {
  return PAYMENT_METHOD_LABELS[method] ?? method;
}

function toActionError(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    if (error.status === 403) return 'Không có quyền thực hiện thao tác này.';
    if (error.status === 404) return 'Không tìm thấy giao dịch.';
    if (error.message) return error.message;
  }
  return fallback;
}

function formatValue(value?: string | number | null): string {
  return value === null || value === undefined || value === '' ? '—' : String(value);
}

export function AdminTransactionsPage() {
  const {
    transactions,
    visibleTransactions,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    status,
    error,
    reload,
    confirmTransaction,
    rejectTransaction,
  } = useAdminTransactions();

  const [confirming, setConfirming] = useState<Transaction | null>(null);
  const [confirmPending, setConfirmPending] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const [rejecting, setRejecting] = useState<Transaction | null>(null);
  const [rejectPending, setRejectPending] = useState(false);
  const [rejectError, setRejectError] = useState<string | null>(null);

  const [detail, setDetail] = useState<Transaction | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const openDetail = async (transaction: Transaction) => {
    setDetail(null);
    setDetailError(null);
    setDetailLoading(true);
    try {
      const data = await transactionsApi.getTransactionById(transaction.id);
      setDetail(data);
    } catch (error) {
      setDetailError(toActionError(error, 'Không thể tải chi tiết giao dịch. Vui lòng thử lại.'));
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setDetail(null);
    setDetailError(null);
    setDetailLoading(false);
  };

  const handleConfirmConfirm = async () => {
    if (!confirming) return;
    setConfirmPending(true);
    setConfirmError(null);
    try {
      await confirmTransaction(confirming.id);
      setConfirming(null);
    } catch (error) {
      setConfirmError(toActionError(error, 'Không thể xác nhận giao dịch. Vui lòng thử lại.'));
    } finally {
      setConfirmPending(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejecting) return;
    setRejectPending(true);
    setRejectError(null);
    try {
      await rejectTransaction(rejecting.id);
      setRejecting(null);
    } catch (error) {
      setRejectError(toActionError(error, 'Không thể từ chối giao dịch. Vui lòng thử lại.'));
    } finally {
      setRejectPending(false);
    }
  };

  return (
    <div className={styles.page}>
      <PageHeader
        title="Giao dịch"
        description="Xem và xử lý các giao dịch thanh toán học phí của học viên."
      />

      {status === 'success' && transactions.length > 0 && (
        <div className={styles.toolbar}>
          <div className={styles.search}>
            <Input
              type="search"
              placeholder="Tìm kiếm mã GD, học viên, lớp học, khóa học..."
              aria-label="Tìm kiếm giao dịch"
              leftIcon={<Search size={16} aria-hidden="true" />}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className={styles.statusFilter}>
            <Select
              aria-label="Lọc theo trạng thái"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as TransactionStatusFilter)}
            >
              <option value="ALL">Tất cả trạng thái</option>
              {TRANSACTION_STATUSES.map((item) => (
                <option key={item} value={item}>
                  {TRANSACTION_STATUS_LABELS[item]}
                </option>
              ))}
            </Select>
          </div>
        </div>
      )}

      {status === 'loading' && <TransactionsSkeleton />}

      {status === 'error' && (
        <ErrorState
          icon={CreditCard}
          title="Không thể tải danh sách giao dịch"
          message={error ?? undefined}
          onRetry={reload}
        />
      )}

      {status === 'success' &&
        (transactions.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title="Chưa có giao dịch nào"
            description="Danh sách giao dịch thanh toán sẽ hiển thị tại đây."
          />
        ) : visibleTransactions.length === 0 ? (
          <EmptyState
            icon={Search}
            title="Không tìm thấy giao dịch phù hợp"
            description="Thử đổi từ khóa tìm kiếm hoặc bộ lọc."
          />
        ) : (
          <Card>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Mã GD</th>
                    <th>Học viên</th>
                    <th>Lớp học</th>
                    <th>Khóa học</th>
                    <th className={styles.numberCol}>Số tiền</th>
                    <th>Phương thức</th>
                    <th>Ngày tạo</th>
                    <th>Ngày báo thanh toán</th>
                    <th>Trạng thái</th>
                    <th aria-label="Hành động" />
                  </tr>
                </thead>
                <tbody>
                  {visibleTransactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td>
                        <span className={styles.code}>{transaction.transactionCode}</span>
                      </td>
                      <td>{transaction.studentName}</td>
                      <td>{transaction.className}</td>
                      <td>{transaction.courseName}</td>
                      <td className={styles.numberCol}>{formatVnd(transaction.amount)}</td>
                      <td>{formatPaymentMethod(transaction.paymentMethod)}</td>
                      <td>{formatDate(transaction.createdAt)}</td>
                      <td>{formatDateTime(transaction.paidAt)}</td>
                      <td>
                        <Badge tone={TRANSACTION_STATUS_TONES[transaction.status]} dot>
                          {TRANSACTION_STATUS_LABELS[transaction.status]}
                        </Badge>
                      </td>
                      <td>
                        <div className={styles.rowActions}>
                          {transaction.status === 'PENDING_CONFIRMATION' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                aria-label={`Xác nhận giao dịch ${transaction.id}`}
                                onClick={() => {
                                  setConfirming(transaction);
                                  setConfirmError(null);
                                }}
                              >
                                Xác nhận
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                aria-label={`Từ chối giao dịch ${transaction.id}`}
                                onClick={() => {
                                  setRejecting(transaction);
                                  setRejectError(null);
                                }}
                              >
                                Từ chối
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            leftIcon={<Eye size={14} aria-hidden="true" />}
                            aria-label={`Xem giao dịch ${transaction.id}`}
                            onClick={() => void openDetail(transaction)}
                          >
                            Xem
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ))}

      <Modal
        open={confirming !== null}
        title="Xác nhận giao dịch?"
        size="sm"
        onClose={() => {
          setConfirming(null);
          setConfirmError(null);
        }}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setConfirming(null);
                setConfirmError(null);
              }}
              disabled={confirmPending}
            >
              Hủy
            </Button>
            <Button loading={confirmPending} onClick={() => void handleConfirmConfirm()}>
              Xác nhận
            </Button>
          </>
        }
      >
        <p className={styles.confirmText}>
          Xác nhận đã nhận được {confirming ? formatVnd(confirming.amount) : ''} với nội dung{' '}
          {confirming?.transactionCode}?
        </p>
        {confirmError && <p className={styles.inlineError}>{confirmError}</p>}
      </Modal>

      <Modal
        open={rejecting !== null}
        title="Từ chối giao dịch?"
        size="sm"
        onClose={() => {
          setRejecting(null);
          setRejectError(null);
        }}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setRejecting(null);
                setRejectError(null);
              }}
              disabled={rejectPending}
            >
              Hủy
            </Button>
            <Button variant="danger" loading={rejectPending} onClick={() => void handleConfirmReject()}>
              Xác nhận
            </Button>
          </>
        }
      >
        <p className={styles.confirmText}>
          Từ chối giao dịch {rejecting?.transactionCode} của {rejecting?.studentName}? Giao dịch sẽ
          chuyển sang trạng thái thất bại.
        </p>
        {rejectError && <p className={styles.inlineError}>{rejectError}</p>}
      </Modal>

      <Modal open={detailLoading || detailError !== null || detail !== null} title="Chi tiết giao dịch" size="md" onClose={closeDetail}>
        {detailLoading && <p className={styles.confirmText}>Đang tải chi tiết giao dịch...</p>}
        {detailError && (
          <div className={styles.form}>
            <p className={styles.inlineError}>{detailError}</p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setDetailError(null);
                setDetailLoading(false);
              }}
            >
              Đóng
            </Button>
          </div>
        )}
        {detail && (
          <dl className={styles.detailList}>
            <div className={styles.detailRow}>
              <dt>Mã giao dịch</dt>
              <dd>{formatValue(detail.id)}</dd>
            </div>
            <div className={styles.detailRow}>
              <dt>Mã đăng ký</dt>
              <dd>{formatValue(detail.registrationId)}</dd>
            </div>
            <div className={styles.detailRow}>
              <dt>Học viên</dt>
              <dd>{formatValue(detail.studentName)}</dd>
            </div>
            <div className={styles.detailRow}>
              <dt>Lớp học</dt>
              <dd>{formatValue(detail.className)}</dd>
            </div>
            <div className={styles.detailRow}>
              <dt>Khóa học</dt>
              <dd>{formatValue(detail.courseName)}</dd>
            </div>
            <div className={styles.detailRow}>
              <dt>Số tiền</dt>
              <dd>{formatVnd(detail.amount)}</dd>
            </div>
            <div className={styles.detailRow}>
              <dt>Phương thức</dt>
              <dd>{formatPaymentMethod(detail.paymentMethod)}</dd>
            </div>
            <div className={styles.detailRow}>
              <dt>Nội dung chuyển khoản</dt>
              <dd>{formatValue(detail.transactionCode)}</dd>
            </div>
            <div className={styles.detailRow}>
              <dt>Trạng thái</dt>
              <dd>
                <Badge tone={TRANSACTION_STATUS_TONES[detail.status]} dot>
                  {TRANSACTION_STATUS_LABELS[detail.status]}
                </Badge>
              </dd>
            </div>
            <div className={styles.detailRow}>
              <dt>Ngày tạo</dt>
              <dd>{formatDateTime(detail.createdAt)}</dd>
            </div>
            <div className={styles.detailRow}>
              <dt>Ngày báo thanh toán</dt>
              <dd>{formatDateTime(detail.paidAt)}</dd>
            </div>
            <div className={styles.detailRow}>
              <dt>Ngày xác nhận</dt>
              <dd>{formatDateTime(detail.confirmedAt)}</dd>
            </div>
            <div className={styles.detailRow}>
              <dt>Người xác nhận</dt>
              <dd>{formatValue(detail.confirmedByName)}</dd>
            </div>
            <div className={styles.detailRow}>
              <dt>Ngày cập nhật</dt>
              <dd>{formatDateTime(detail.updatedAt)}</dd>
            </div>
          </dl>
        )}
      </Modal>
    </div>
  );
}

function TransactionsSkeleton() {
  return (
    <div className={styles.skeletonList} aria-label="Đang tải danh sách giao dịch" role="status">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className={styles.skeletonRow} data-testid="skeleton-row">
          <span className={`${styles.skeletonLine} ${styles.skeletonLineName}`} />
          <span className={`${styles.skeletonLine} ${styles.skeletonLineCourse}`} />
          <span className={`${styles.skeletonLine} ${styles.skeletonLineSchedule}`} />
          <span className={`${styles.skeletonLine} ${styles.skeletonLineRoom}`} />
          <span className={`${styles.skeletonLine} ${styles.skeletonLineStatus}`} />
          <span className={`${styles.skeletonLine} ${styles.skeletonLineAction}`} />
        </div>
      ))}
    </div>
  );
}
