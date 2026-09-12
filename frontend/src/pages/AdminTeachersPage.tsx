import { useState } from 'react';
import { Pencil, RotateCcw, Search, Trash2, UserCog } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { Select } from '@/components/ui/Select';
import { TeacherForm } from '@/features/users/TeacherForm';
import {
  isConflictError,
  validateTeacher,
  type TeacherFieldErrors,
  type TeacherFormValues,
} from '@/features/users/teacherValidation';
import { useAdminTeachers, type TeacherStatusFilter } from '@/features/users/useAdminTeachers';
import type { User } from '@/types/user';
import { formatDate } from '@/utils/format';
import styles from './AdminTeachersPage.module.css';

function toFormValues(teacher: User): TeacherFormValues {
  return {
    fullName: teacher.fullName,
    email: teacher.email,
    phone: teacher.phone ?? '',
    status: teacher.status,
  };
}

const EMPTY_FORM: TeacherFormValues = { fullName: '', email: '', phone: '', status: 'ACTIVE' };

export function AdminTeachersPage() {
  const {
    teachers,
    visibleTeachers,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    status,
    error,
    reload,
    updateTeacher,
    deactivateTeacher,
    reactivateTeacher,
  } = useAdminTeachers();

  const [editingTeacher, setEditingTeacher] = useState<User | null>(null);
  const [form, setForm] = useState<TeacherFormValues>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<TeacherFieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(false);

  const [deactivatingTeacher, setDeactivatingTeacher] = useState<User | null>(null);
  const [deactivatePending, setDeactivatePending] = useState(false);
  const [deactivateError, setDeactivateError] = useState(false);

  const [reactivatingId, setReactivatingId] = useState<number | null>(null);

  const updateField = (field: keyof TeacherFormValues, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const openEditModal = (teacher: User) => {
    setEditingTeacher(teacher);
    setForm(toFormValues(teacher));
    setFieldErrors({});
    setSubmitError(false);
  };

  const closeEditModal = () => {
    setEditingTeacher(null);
    setSubmitting(false);
    setSubmitError(false);
  };

  const handleEditSubmit = async () => {
    if (!editingTeacher) return;
    const errors = validateTeacher(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setSubmitting(true);
    setSubmitError(false);
    try {
      const phone = form.phone.trim();
      await updateTeacher(editingTeacher.id, {
        email: form.email.trim(),
        fullName: form.fullName.trim(),
        phone: phone ? phone : null,
        role: 'TEACHER',
        status: form.status,
        avatarUrl: editingTeacher.avatarUrl ?? null,
      });
      closeEditModal();
    } catch (error) {
      if (isConflictError(error)) {
        setFieldErrors({ email: 'Email đã tồn tại' });
      } else {
        setSubmitError(true);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const openDeactivateConfirm = (teacher: User) => {
    setDeactivatingTeacher(teacher);
    setDeactivateError(false);
  };

  const closeDeactivateConfirm = () => {
    setDeactivatingTeacher(null);
    setDeactivatePending(false);
    setDeactivateError(false);
  };

  const handleConfirmDeactivate = async () => {
    if (!deactivatingTeacher) return;
    setDeactivatePending(true);
    setDeactivateError(false);
    try {
      await deactivateTeacher(deactivatingTeacher.id);
      closeDeactivateConfirm();
    } catch {
      setDeactivateError(true);
    } finally {
      setDeactivatePending(false);
    }
  };

  const handleReactivate = async (teacher: User) => {
    setReactivatingId(teacher.id);
    try {
      await reactivateTeacher(teacher);
    } finally {
      setReactivatingId(null);
    }
  };

  return (
    <div className={styles.page}>
      <PageHeader
        title="Giáo viên"
        description="Quản lý tài khoản giáo viên của trung tâm."
      />

      {status === 'success' && teachers.length > 0 && (
        <div className={styles.toolbar}>
          <div className={styles.search}>
            <Input
              type="search"
              placeholder="Tìm kiếm giáo viên..."
              aria-label="Tìm kiếm giáo viên"
              leftIcon={<Search size={16} aria-hidden="true" />}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className={styles.statusFilter}>
            <Select
              aria-label="Lọc theo trạng thái"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as TeacherStatusFilter)}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="INACTIVE">Vô hiệu hóa</option>
            </Select>
          </div>
        </div>
      )}

      {status === 'loading' && <TeachersSkeleton />}

      {status === 'error' && (
        <ErrorState
          icon={UserCog}
          title="Không thể tải danh sách giáo viên"
          message={error ?? undefined}
          onRetry={reload}
        />
      )}

      {status === 'success' &&
        (teachers.length === 0 ? (
          <EmptyState
            icon={UserCog}
            title="Chưa có giáo viên nào"
            description="Chưa có tài khoản giáo viên nào trong hệ thống."
          />
        ) : visibleTeachers.length === 0 ? (
          <EmptyState
            icon={Search}
            title="Không tìm thấy giáo viên phù hợp"
            description="Thử đổi từ khóa tìm kiếm hoặc bộ lọc trạng thái."
          />
        ) : (
          <Card>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Họ tên</th>
                    <th>Email</th>
                    <th>SĐT</th>
                    <th>Trạng thái</th>
                    <th>Ngày tạo</th>
                    <th aria-label="Hành động" />
                  </tr>
                </thead>
                <tbody>
                  {visibleTeachers.map((teacher) => (
                    <tr key={teacher.id}>
                      <td>
                        <span className={styles.nameCell}>
                          <Avatar name={teacher.fullName} src={teacher.avatarUrl} size="sm" />
                          <span className={styles.teacherName}>{teacher.fullName}</span>
                        </span>
                      </td>
                      <td>{teacher.email}</td>
                      <td>{teacher.phone || '—'}</td>
                      <td>
                        <Badge tone={teacher.status === 'ACTIVE' ? 'success' : 'neutral'} dot>
                          {teacher.status === 'ACTIVE' ? 'Đang hoạt động' : 'Vô hiệu hóa'}
                        </Badge>
                      </td>
                      <td className={styles.dateCell}>{formatDate(teacher.createdAt)}</td>
                      <td>
                        <div className={styles.rowActions}>
                          <Button
                            variant="ghost"
                            size="sm"
                            leftIcon={<Pencil size={14} aria-hidden="true" />}
                            aria-label={`Sửa ${teacher.fullName}`}
                            onClick={() => openEditModal(teacher)}
                          >
                            Sửa
                          </Button>
                          {teacher.status === 'ACTIVE' ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              leftIcon={<Trash2 size={14} aria-hidden="true" />}
                              aria-label={`Vô hiệu hóa ${teacher.fullName}`}
                              onClick={() => openDeactivateConfirm(teacher)}
                            >
                              Vô hiệu hóa
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              leftIcon={<RotateCcw size={14} aria-hidden="true" />}
                              aria-label={`Kích hoạt lại ${teacher.fullName}`}
                              disabled={reactivatingId === teacher.id}
                              onClick={() => void handleReactivate(teacher)}
                            >
                              Kích hoạt lại
                            </Button>
                          )}
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
        open={editingTeacher !== null}
        title="Cập nhật giáo viên"
        size="md"
        onClose={closeEditModal}
        footer={
          <>
            <Button variant="secondary" onClick={closeEditModal} disabled={submitting}>
              Hủy
            </Button>
            <Button loading={submitting} onClick={() => void handleEditSubmit()}>
              Lưu thay đổi
            </Button>
          </>
        }
      >
        <form className={styles.form} onSubmit={(event) => event.preventDefault()} noValidate>
          <TeacherForm values={form} errors={fieldErrors} onChange={updateField} />
          {submitError && (
            <p className={styles.inlineError}>Không thể lưu giáo viên. Vui lòng thử lại.</p>
          )}
        </form>
      </Modal>

      <Modal
        open={deactivatingTeacher !== null}
        title="Vô hiệu hóa giáo viên?"
        size="sm"
        onClose={closeDeactivateConfirm}
        footer={
          <>
            <Button variant="secondary" onClick={closeDeactivateConfirm} disabled={deactivatePending}>
              Hủy
            </Button>
            <Button variant="danger" loading={deactivatePending} onClick={() => void handleConfirmDeactivate()}>
              Xác nhận
            </Button>
          </>
        }
      >
        <p className={styles.confirmText}>
          Vô hiệu hóa giáo viên này? Tài khoản sẽ chuyển INACTIVE, dữ liệu liên quan giữ nguyên.
        </p>
        {deactivateError && (
          <p className={styles.inlineError}>Không thể vô hiệu hóa giáo viên. Vui lòng thử lại.</p>
        )}
      </Modal>
    </div>
  );
}

function TeachersSkeleton() {
  return (
    <div className={styles.skeletonList} aria-label="Đang tải danh sách giáo viên" role="status">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className={styles.skeletonRow} data-testid="skeleton-row">
          <span className={`${styles.skeletonLine} ${styles.skeletonLineName}`} />
          <span className={`${styles.skeletonLine} ${styles.skeletonLineEmail}`} />
          <span className={`${styles.skeletonLine} ${styles.skeletonLinePhone}`} />
          <span className={`${styles.skeletonLine} ${styles.skeletonLineStatus}`} />
          <span className={`${styles.skeletonLine} ${styles.skeletonLineDate}`} />
          <span className={`${styles.skeletonLine} ${styles.skeletonLineAction}`} />
        </div>
      ))}
    </div>
  );
}
