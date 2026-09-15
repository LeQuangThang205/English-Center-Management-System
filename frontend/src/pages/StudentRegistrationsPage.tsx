import { useState } from 'react';
import { BookOpen, ClipboardList } from 'lucide-react';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import {
  latestRelevantTransaction,
  useStudentRegistrations,
} from '@/features/registrations/useStudentRegistrations';
import { ApiError } from '@/services/api/httpClient';
import type { CourseClass } from '@/types/courseClass';
import type { Registration, RegistrationStatus } from '@/types/registration';
import { formatDate, formatVnd } from '@/utils/format';
import styles from './StudentRegistrationsPage.module.css';

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

const SCHEDULE_DAY_LABELS: Record<string, string> = {
  MON: 'Thứ 2',
  TUE: 'Thứ 3',
  WED: 'Thứ 4',
  THU: 'Thứ 5',
  FRI: 'Thứ 6',
  SAT: 'Thứ 7',
  SUN: 'Chủ nhật',
};

function formatSchedule(cls: CourseClass): string {
  const day = SCHEDULE_DAY_LABELS[cls.scheduleDay] ?? cls.scheduleDay;
  return `${day} ${cls.startTime.slice(0, 5)}–${cls.endTime.slice(0, 5)}`;
}

function toActionError(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    if (error.status === 403) return 'Không có quyền thực hiện thao tác này.';
    if (error.status === 404) return 'Không tìm thấy đăng ký.';
    if (error.message) return error.message;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function toTransactionError(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    if (error.status === 403) return 'Không có quyền thực hiện thao tác này.';
    if (error.status === 404) return 'Không tìm thấy giao dịch.';
    if (error.message) return error.message;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export function StudentRegistrationsPage() {
  const {
    enrollableClasses,
    registrations,
    transactionsByRegistration,
    activeRegistrationByClass,
    status,
    error,
    reload,
    createRegistration,
    cancelRegistration,
    createTransaction,
    reportPaid,
  } = useStudentRegistrations();

  const [registeringClass, setRegisteringClass] = useState<CourseClass | null>(null);
  const [registerPending, setRegisterPending] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);

  const [cancelling, setCancelling] = useState<Registration | null>(null);
  const [cancelPending, setCancelPending] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const [creatingTx, setCreatingTx] = useState<Registration | null>(null);
  const [createTxPending, setCreateTxPending] = useState(false);
  const [createTxError, setCreateTxError] = useState<string | null>(null);

  const [reportingTx, setReportingTx] = useState<{ registration: Registration; transactionId: number } | null>(null);
  const [reportPending, setReportPending] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  const handleConfirmRegister = async () => {
    if (!registeringClass) return;
    setRegisterPending(true);
    setRegisterError(null);
    try {
      await createRegistration(registeringClass.id);
      setRegisteringClass(null);
    } catch (err) {
      setRegisterError(toActionError(err, 'Không thể đăng ký lớp học. Vui lòng thử lại.'));
    } finally {
      setRegisterPending(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelling) return;
    setCancelPending(true);
    setCancelError(null);
    try {
      await cancelRegistration(cancelling.id);
      setCancelling(null);
    } catch (err) {
      setCancelError(toActionError(err, 'Không thể hủy đăng ký. Vui lòng thử lại.'));
    } finally {
      setCancelPending(false);
    }
  };

  const handleConfirmCreateTx = async () => {
    if (!creatingTx) return;
    setCreateTxPending(true);
    setCreateTxError(null);
    try {
      await createTransaction(creatingTx.id);
      setCreatingTx(null);
    } catch (err) {
      setCreateTxError(toTransactionError(err, 'Không thể tạo giao dịch. Vui lòng thử lại.'));
    } finally {
      setCreateTxPending(false);
    }
  };

  const handleConfirmReport = async () => {
    if (!reportingTx) return;
    setReportPending(true);
    setReportError(null);
    try {
      await reportPaid(reportingTx.transactionId);
      setReportingTx(null);
    } catch (err) {
      setReportError(toTransactionError(err, 'Không thể báo thanh toán. Vui lòng thử lại.'));
    } finally {
      setReportPending(false);
    }
  };

  return (
    <div className={styles.page}>
      <PageHeader title="Đăng ký" description="Đăng ký lớp học và theo dõi trạng thái thanh toán." />

      {status === 'loading' && <RegistrationsSkeleton />}

      {status === 'error' && (
        <ErrorState
          icon={ClipboardList}
          title="Không thể tải dữ liệu đăng ký"
          message={error ?? undefined}
          onRetry={reload}
        />
      )}

      {status === 'success' && (
        <>
          <section aria-labelledby="enrollable-classes-heading">
            <h2 id="enrollable-classes-heading" className={styles.sectionTitle}>
              Lớp có thể đăng ký
            </h2>
            {enrollableClasses.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="Không có lớp phù hợp để đăng ký."
                description="Hiện chưa có lớp nào đang tuyển sinh."
              />
            ) : (
              <Card>
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Tên lớp</th>
                        <th>Khóa học</th>
                        <th>Giáo viên</th>
                        <th>Lịch học</th>
                        <th className={styles.numberCol}>Sĩ số</th>
                        <th aria-label="Hành động" />
                      </tr>
                    </thead>
                    <tbody>
                      {enrollableClasses.map((cls) => {
                        const isFull = cls.currentHeadcount >= cls.maxCapacity;
                        const active = activeRegistrationByClass.get(cls.id);
                        return (
                          <tr key={cls.id}>
                            <td>
                              <span className={styles.className}>{cls.name}</span>
                            </td>
                            <td>{cls.courseName}</td>
                            <td>{cls.teacherName ?? '—'}</td>
                            <td>{formatSchedule(cls)}</td>
                            <td className={styles.numberCol}>
                              {cls.currentHeadcount} / {cls.maxCapacity}
                              {isFull && (
                                <span className={styles.fullLabel}>Đã đầy</span>
                              )}
                            </td>
                            <td>
                              <div className={styles.rowActions}>
                                {active ? (
                                  <Badge tone={REGISTRATION_STATUS_TONES[active.status]} dot>
                                    {REGISTRATION_STATUS_LABELS[active.status]}
                                  </Badge>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    aria-label={`Đăng ký lớp ${cls.name}`}
                                    onClick={() => {
                                      setRegisteringClass(cls);
                                      setRegisterError(null);
                                    }}
                                  >
                                    Đăng ký
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </section>

          <section aria-labelledby="my-registrations-heading">
            <h2 id="my-registrations-heading" className={styles.sectionTitle}>
              Đăng ký của tôi
            </h2>
            {registrations.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title="Chưa có đăng ký nào."
                description="Chọn một lớp ở danh sách trên để bắt đầu đăng ký."
              />
            ) : (
              <Card>
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Lớp học</th>
                        <th>Khóa học</th>
                        <th className={styles.numberCol}>Học phí</th>
                        <th>Ngày đăng ký</th>
                        <th>Trạng thái</th>
                        <th>Thanh toán</th>
                        <th aria-label="Hành động" />
                      </tr>
                    </thead>
                    <tbody>
                      {registrations.map((registration) => {
                        const latestTx = latestRelevantTransaction(
                          transactionsByRegistration.get(registration.id) ?? [],
                        );
                        return (
                          <tr key={registration.id}>
                            <td>
                              <span className={styles.className}>{registration.className}</span>
                            </td>
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
                              <PaymentCell registration={registration} paidAt={latestTx?.paidAt ?? null} txStatus={latestTx?.status ?? null} />
                            </td>
                            <td>
                              <div className={styles.rowActions}>
                                {(registration.status === 'PENDING' ||
                                  registration.status === 'APPROVED') && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    aria-label={`Hủy đăng ký ${registration.id}`}
                                    onClick={() => {
                                      setCancelling(registration);
                                      setCancelError(null);
                                    }}
                                  >
                                    Hủy
                                  </Button>
                                )}
                                {registration.status === 'APPROVED' && !latestTx && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    aria-label={`Tạo giao dịch cho đăng ký ${registration.id}`}
                                    onClick={() => {
                                      setCreatingTx(registration);
                                      setCreateTxError(null);
                                    }}
                                  >
                                    Tạo giao dịch
                                  </Button>
                                )}
                                {registration.status === 'APPROVED' &&
                                  latestTx?.status === 'PENDING_CONFIRMATION' &&
                                  latestTx.paidAt == null && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      aria-label={`Báo đã thanh toán giao dịch ${latestTx.id}`}
                                      onClick={() => {
                                        setReportingTx({ registration, transactionId: latestTx.id });
                                        setReportError(null);
                                      }}
                                    >
                                      Báo đã thanh toán
                                    </Button>
                                  )}
                                {registration.status === 'APPROVED' &&
                                  latestTx?.status === 'FAILED' && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      aria-label={`Tạo giao dịch lại cho đăng ký ${registration.id}`}
                                      onClick={() => {
                                        setCreatingTx(registration);
                                        setCreateTxError(null);
                                      }}
                                    >
                                      Tạo giao dịch lại
                                    </Button>
                                  )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </section>
        </>
      )}

      <Modal
        open={registeringClass !== null}
        title="Xác nhận đăng ký"
        size="sm"
        onClose={() => {
          setRegisteringClass(null);
          setRegisterError(null);
        }}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setRegisteringClass(null);
                setRegisterError(null);
              }}
              disabled={registerPending}
            >
              Hủy
            </Button>
            <Button loading={registerPending} onClick={() => void handleConfirmRegister()}>
              Xác nhận
            </Button>
          </>
        }
      >
        <p className={styles.confirmText}>
          Đăng ký lớp {registeringClass?.name} — khóa {registeringClass?.courseName}?
        </p>
        {registerError && <p className={styles.inlineError}>{registerError}</p>}
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
          Hủy đăng ký lớp {cancelling?.className}? Đăng ký sẽ chuyển sang trạng thái đã hủy.
        </p>
        {cancelError && <p className={styles.inlineError}>{cancelError}</p>}
      </Modal>

      <Modal
        open={creatingTx !== null}
        title="Tạo giao dịch thanh toán"
        size="sm"
        onClose={() => {
          setCreatingTx(null);
          setCreateTxError(null);
        }}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setCreatingTx(null);
                setCreateTxError(null);
              }}
              disabled={createTxPending}
            >
              Hủy
            </Button>
            <Button loading={createTxPending} onClick={() => void handleConfirmCreateTx()}>
              Xác nhận
            </Button>
          </>
        }
      >
        <p className={styles.confirmText}>
          Tạo giao dịch thanh toán {creatingTx ? formatVnd(creatingTx.tuitionAtRegistration) : ''} cho
          lớp {creatingTx?.className}?
        </p>
        {createTxError && <p className={styles.inlineError}>{createTxError}</p>}
      </Modal>

      <Modal
        open={reportingTx !== null}
        title="Báo đã thanh toán"
        size="sm"
        onClose={() => {
          setReportingTx(null);
          setReportError(null);
        }}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setReportingTx(null);
                setReportError(null);
              }}
              disabled={reportPending}
            >
              Hủy
            </Button>
            <Button loading={reportPending} onClick={() => void handleConfirmReport()}>
              Xác nhận
            </Button>
          </>
        }
      >
        <p className={styles.confirmText}>Bạn đã chuyển khoản giao dịch này?</p>
        {reportError && <p className={styles.inlineError}>{reportError}</p>}
      </Modal>
    </div>
  );
}

function PaymentCell({
  registration,
  paidAt,
  txStatus,
}: {
  registration: Registration;
  paidAt: string | null;
  txStatus: 'PENDING_CONFIRMATION' | 'SUCCESS' | 'FAILED' | null;
}) {
  if (registration.status === 'PAID' || txStatus === 'SUCCESS') {
    return (
      <Badge tone="success" dot>
        Đã thanh toán
      </Badge>
    );
  }
  if (registration.status !== 'APPROVED') {
    return <span className={styles.mutedText}>—</span>;
  }
  if (txStatus === 'PENDING_CONFIRMATION' && paidAt != null) {
    return <span className={styles.mutedText}>Đã báo, chờ Admin xác nhận</span>;
  }
  if (txStatus === 'PENDING_CONFIRMATION') {
    return <span className={styles.mutedText}>Chưa thanh toán</span>;
  }
  if (txStatus === 'FAILED') {
    return (
      <Badge tone="danger" dot>
        Thất bại
      </Badge>
    );
  }
  return <span className={styles.mutedText}>Chưa thanh toán</span>;
}

function RegistrationsSkeleton() {
  return (
    <div className={styles.skeletonList} aria-label="Đang tải dữ liệu đăng ký" role="status">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className={styles.skeletonRow} data-testid="skeleton-row">
          <span className={`${styles.skeletonLine} ${styles.skeletonLineName}`} />
          <span className={`${styles.skeletonLine} ${styles.skeletonLineCourse}`} />
          <span className={`${styles.skeletonLine} ${styles.skeletonLineStatus}`} />
        </div>
      ))}
    </div>
  );
}
