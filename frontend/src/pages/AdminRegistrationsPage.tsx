import { useState } from 'react';
import { ClipboardList, Eye, Search } from 'lucide-react';
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
  useAdminRegistrations,
  type RegistrationClassFilter,
  type RegistrationStatusFilter,
} from '@/features/registrations/useAdminRegistrations';
import { validateRejectReason } from '@/features/registrations/registrationValidation';
import { registrationsApi } from '@/services/api/registrationsApi';
import { ApiError } from '@/services/api/httpClient';
import type { Registration, RegistrationStatus } from '@/types/registration';
import { formatDate, formatDateTime, formatVnd } from '@/utils/format';
import styles from './AdminRegistrationsPage.module.css';

const REGISTRATION_STATUSES: RegistrationStatus[] = [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'CANCELLED',
  'PAID',
];

const REGISTRATION_STATUS_LABELS: Record<RegistrationStatus, string> = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  CANCELLED: 'Đã hủy',
  PAID: 'Đã thanh toán',
};

const REGISTRATION_STATUS_TONES: Record<RegistrationStatus, BadgeTone> = {
  PENDING: 'warning',
  APPROVED: 'primary',
  REJECTED: 'danger',
  CANCELLED: 'neutral',
  PAID: 'success',
};

function toActionError(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    if (error.status === 403) return 'Không có quyền thực hiện thao tác này.';
    if (error.status === 404) return 'Không tìm thấy đăng ký.';
    if (error.message) return error.message;
  }
  return fallback;
}

function formatValue(value?: string | null): string {
  return value ? value : '—';
}

export function AdminRegistrationsPage() {
  const {
    registrations,
    visibleRegistrations,
    classes,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    classFilter,
    setClassFilter,
    status,
    error,
    reload,
    approveRegistration,
    rejectRegistration,
    cancelRegistration,
    markPaidRegistration,
  } = useAdminRegistrations();

  const [approving, setApproving] = useState<Registration | null>(null);
  const [approvePending, setApprovePending] = useState(false);
  const [approveError, setApproveError] = useState<string | null>(null);

  const [rejecting, setRejecting] = useState<Registration | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectFieldError, setRejectFieldError] = useState<string | null>(null);
  const [rejectPending, setRejectPending] = useState(false);
  const [rejectError, setRejectError] = useState<string | null>(null);

  const [cancelling, setCancelling] = useState<Registration | null>(null);
  const [cancelPending, setCancelPending] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const [markingPaid, setMarkingPaid] = useState<Registration | null>(null);
  const [markPaidPending, setMarkPaidPending] = useState(false);
  const [markPaidError, setMarkPaidError] = useState<string | null>(null);

  const [detail, setDetail] = useState<Registration | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const openDetail = async (registration: Registration) => {
    setDetail(null);
    setDetailError(null);
    setDetailLoading(true);
    try {
      const data = await registrationsApi.getRegistrationById(registration.id);
      setDetail(data);
    } catch (error) {
      setDetailError(toActionError(error, 'Không thể tải chi tiết đăng ký. Vui lòng thử lại.'));
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setDetail(null);
    setDetailError(null);
    setDetailLoading(false);
  };

  const handleConfirmApprove = async () => {
    if (!approving) return;
    setApprovePending(true);
    setApproveError(null);
    try {
      await approveRegistration(approving.id);
      setApproving(null);
    } catch (error) {
      setApproveError(toActionError(error, 'Không thể duyệt đăng ký. Vui lòng thử lại.'));
    } finally {
      setApprovePending(false);
    }
  };

  const openRejectModal = (registration: Registration) => {
    setRejecting(registration);
    setRejectReason('');
    setRejectFieldError(null);
    setRejectError(null);
    setRejectPending(false);
  };

  const handleConfirmReject = async () => {
    if (!rejecting) return;
    const fieldError = validateRejectReason(rejectReason);
    if (fieldError) {
      setRejectFieldError(fieldError);
      return;
    }
    setRejectFieldError(null);
    setRejectPending(true);
    setRejectError(null);
    try {
      await rejectRegistration(rejecting.id, rejectReason.trim());
      setRejecting(null);
    } catch (error) {
      setRejectError(toActionError(error, 'Không thể từ chối đăng ký. Vui lòng thử lại.'));
    } finally {
      setRejectPending(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelling) return;
    setCancelPending(true);
    setCancelError(null);
    try {
      await cancelRegistration(cancelling.id);
      setCancelling(null);
    } catch (error) {
      setCancelError(toActionError(error, 'Không thể hủy đăng ký. Vui lòng thử lại.'));
    } finally {
      setCancelPending(false);
    }
  };

  const handleConfirmMarkPaid = async () => {
    if (!markingPaid) return;
    setMarkPaidPending(true);
    setMarkPaidError(null);
    try {
      await markPaidRegistration(markingPaid.id);
      setMarkingPaid(null);
    } catch (error) {
      setMarkPaidError(toActionError(error, 'Không thể đánh dấu thanh toán. Vui lòng thử lại.'));
    } finally {
      setMarkPaidPending(false);
    }
  };

  return (
    <div className={styles.page}>
      <PageHeader
        title="Đăng ký"
        description="Xem và xử lý các yêu cầu đăng ký khóa học của học viên."
      />

      {status === 'success' && registrations.length > 0 && (
        <div className={styles.toolbar}>
          <div className={styles.search}>
            <Input
              type="search"
              placeholder="Tìm kiếm học viên, lớp học, khóa học..."
              aria-label="Tìm kiếm đăng ký"
              leftIcon={<Search size={16} aria-hidden="true" />}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className={styles.statusFilter}>
            <Select
              aria-label="Lọc theo trạng thái"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as RegistrationStatusFilter)}
            >
              <option value="ALL">Tất cả trạng thái</option>
              {REGISTRATION_STATUSES.map((item) => (
                <option key={item} value={item}>
                  {REGISTRATION_STATUS_LABELS[item]}
                </option>
              ))}
            </Select>
          </div>
          <div className={styles.statusFilter}>
            <Select
              aria-label="Lọc theo lớp học"
              value={classFilter}
              onChange={(event) => setClassFilter(event.target.value as RegistrationClassFilter)}
            >
              <option value="ALL">Tất cả lớp học</option>
              {classes.map((cls) => (
                <option key={cls.id} value={String(cls.id)}>
                  {cls.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
      )}

      {status === 'loading' && <RegistrationsSkeleton />}

      {status === 'error' && (
        <ErrorState
          icon={ClipboardList}
          title="Không thể tải danh sách đăng ký"
          message={error ?? undefined}
          onRetry={reload}
        />
      )}

      {status === 'success' &&
        (registrations.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="Chưa có đăng ký nào"
            description="Danh sách yêu cầu đăng ký sẽ hiển thị tại đây."
          />
        ) : visibleRegistrations.length === 0 ? (
          <EmptyState
            icon={Search}
            title="Không tìm thấy đăng ký phù hợp"
            description="Thử đổi từ khóa tìm kiếm hoặc bộ lọc."
          />
        ) : (
          <Card>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Học viên</th>
                    <th>Lớp học</th>
                    <th>Khóa học</th>
                    <th className={styles.numberCol}>Học phí</th>
                    <th>Ngày đăng ký</th>
                    <th>Trạng thái</th>
                    <th aria-label="Hành động" />
                  </tr>
                </thead>
                <tbody>
                  {visibleRegistrations.map((registration) => (
                    <tr key={registration.id}>
                      <td>
                        <span className={styles.studentName}>{registration.studentName}</span>
                      </td>
                      <td>{registration.className}</td>
                      <td>{registration.courseName}</td>
                      <td className={styles.numberCol}>
                        {formatVnd(registration.tuitionAtRegistration)}
                      </td>
                      <td>{formatDate(registration.registeredAt)}</td>
                      <td>
                        <Badge tone={REGISTRATION_STATUS_TONES[registration.status]} dot>
                          {REGISTRATION_STATUS_LABELS[registration.status]}
                        </Badge>
                      </td>
                      <td>
                        <div className={styles.rowActions}>
                          {registration.status === 'PENDING' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                aria-label={`Duyệt đơn đăng ký ${registration.id}`}
                                onClick={() => {
                                  setApproving(registration);
                                  setApproveError(null);
                                }}
                              >
                                Duyệt
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                aria-label={`Từ chối đơn đăng ký ${registration.id}`}
                                onClick={() => openRejectModal(registration)}
                              >
                                Từ chối
                              </Button>
                            </>
                          )}
                          {registration.status === 'APPROVED' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              aria-label={`Đánh dấu thanh toán đơn đăng ký ${registration.id}`}
                              onClick={() => {
                                setMarkingPaid(registration);
                                setMarkPaidError(null);
                              }}
                            >
                              Đánh dấu thanh toán
                            </Button>
                          )}
                          {registration.status !== 'PAID' &&
                            registration.status !== 'CANCELLED' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                aria-label={`Hủy đơn đăng ký ${registration.id}`}
                                onClick={() => {
                                  setCancelling(registration);
                                  setCancelError(null);
                                }}
                              >
                                Hủy
                              </Button>
                            )}
                          <Button
                            variant="ghost"
                            size="sm"
                            leftIcon={<Eye size={14} aria-hidden="true" />}
                            aria-label={`Xem đơn đăng ký ${registration.id}`}
                            onClick={() => void openDetail(registration)}
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
        open={approving !== null}
        title="Duyệt đăng ký?"
        size="sm"
        onClose={() => {
          setApproving(null);
          setApproveError(null);
        }}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setApproving(null);
                setApproveError(null);
              }}
              disabled={approvePending}
            >
              Hủy
            </Button>
            <Button loading={approvePending} onClick={() => void handleConfirmApprove()}>
              Xác nhận
            </Button>
          </>
        }
      >
        <p className={styles.confirmText}>
          Duyệt yêu cầu đăng ký của {approving?.studentName} vào lớp {approving?.className}?
        </p>
        {approveError && <p className={styles.inlineError}>{approveError}</p>}
      </Modal>

      <Modal
        open={rejecting !== null}
        title="Từ chối đăng ký"
        size="sm"
        onClose={() => {
          setRejecting(null);
          setRejectFieldError(null);
          setRejectError(null);
        }}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setRejecting(null);
                setRejectFieldError(null);
                setRejectError(null);
              }}
              disabled={rejectPending}
            >
              Hủy
            </Button>
            <Button
              variant="danger"
              loading={rejectPending}
              onClick={() => void handleConfirmReject()}
            >
              Xác nhận từ chối
            </Button>
          </>
        }
      >
        <div className={styles.form}>
          <p className={styles.confirmText}>
            Từ chối yêu cầu đăng ký của {rejecting?.studentName} vào lớp {rejecting?.className}?
          </p>
          <label className={styles.fieldLabel} htmlFor="reject-reason">
            Lý do từ chối
          </label>
          <textarea
            id="reject-reason"
            className={styles.textarea}
            rows={4}
            placeholder="Nhập lý do từ chối..."
            value={rejectReason}
            onChange={(event) => {
              setRejectReason(event.target.value);
              if (rejectFieldError) setRejectFieldError(null);
            }}
          />
          {rejectFieldError && <p className={styles.inlineError}>{rejectFieldError}</p>}
          {rejectError && <p className={styles.inlineError}>{rejectError}</p>}
        </div>
      </Modal>

      <Modal
        open={cancelling !== null}
        title="Hủy đăng ký?"
        size="sm"
        onClose={() => {
          setCancelling(null);
          setCancelError(null);
        }}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setCancelling(null);
                setCancelError(null);
              }}
              disabled={cancelPending}
            >
              Hủy
            </Button>
            <Button variant="danger" loading={cancelPending} onClick={() => void handleConfirmCancel()}>
              Xác nhận
            </Button>
          </>
        }
      >
        <p className={styles.confirmText}>
          Hủy yêu cầu đăng ký của {cancelling?.studentName} vào lớp {cancelling?.className}? Đăng
          ký sẽ chuyển sang trạng thái đã hủy.
        </p>
        {cancelError && <p className={styles.inlineError}>{cancelError}</p>}
      </Modal>

      <Modal
        open={markingPaid !== null}
        title="Đánh dấu đã thanh toán?"
        size="sm"
        onClose={() => {
          setMarkingPaid(null);
          setMarkPaidError(null);
        }}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setMarkingPaid(null);
                setMarkPaidError(null);
              }}
              disabled={markPaidPending}
            >
              Hủy
            </Button>
            <Button loading={markPaidPending} onClick={() => void handleConfirmMarkPaid()}>
              Xác nhận
            </Button>
          </>
        }
      >
        <p className={styles.confirmText}>
          Đánh dấu đăng ký này là đã thanh toán? Đăng ký sẽ chuyển sang trạng thái đã thanh toán.
        </p>
        {markPaidError && <p className={styles.inlineError}>{markPaidError}</p>}
      </Modal>

      <Modal open={detailLoading || detailError !== null || detail !== null} title="Chi tiết đăng ký" size="md" onClose={closeDetail}>
        {detailLoading && <p className={styles.confirmText}>Đang tải chi tiết đăng ký...</p>}
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
              <dt>Trạng thái</dt>
              <dd>
                <Badge tone={REGISTRATION_STATUS_TONES[detail.status]} dot>
                  {REGISTRATION_STATUS_LABELS[detail.status]}
                </Badge>
              </dd>
            </div>
            <div className={styles.detailRow}>
              <dt>Học phí</dt>
              <dd>{formatVnd(detail.tuitionAtRegistration)}</dd>
            </div>
            <div className={styles.detailRow}>
              <dt>Ngày đăng ký</dt>
              <dd>{formatDateTime(detail.registeredAt)}</dd>
            </div>
            <div className={styles.detailRow}>
              <dt>Ngày duyệt</dt>
              <dd>{formatDateTime(detail.approvedAt)}</dd>
            </div>
            <div className={styles.detailRow}>
              <dt>Người duyệt</dt>
              <dd>{formatValue(detail.approvedByName)}</dd>
            </div>
            <div className={styles.detailRow}>
              <dt>Ngày từ chối</dt>
              <dd>{formatDateTime(detail.rejectedAt)}</dd>
            </div>
            <div className={styles.detailRow}>
              <dt>Người từ chối</dt>
              <dd>{formatValue(detail.rejectedByName)}</dd>
            </div>
            <div className={styles.detailRow}>
              <dt>Lý do từ chối</dt>
              <dd>{formatValue(detail.rejectionReason)}</dd>
            </div>
            <div className={styles.detailRow}>
              <dt>Ngày thanh toán</dt>
              <dd>{formatDateTime(detail.paidAt)}</dd>
            </div>
            <div className={styles.detailRow}>
              <dt>Ngày tạo</dt>
              <dd>{formatDateTime(detail.createdAt)}</dd>
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

function RegistrationsSkeleton() {
  return (
    <div className={styles.skeletonList} aria-label="Đang tải danh sách đăng ký" role="status">
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
