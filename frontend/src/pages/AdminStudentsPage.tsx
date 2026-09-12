import { useState } from 'react';
import { Pencil, RotateCcw, Search, Trash2, Users } from 'lucide-react';
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
import { StudentForm } from '@/features/users/StudentForm';
import {
  isConflictError,
  validateStudent,
  type StudentFieldErrors,
  type StudentFormValues,
} from '@/features/users/studentValidation';
import { useAdminStudents, type StudentStatusFilter } from '@/features/users/useAdminStudents';
import type { User } from '@/types/user';
import { formatDate } from '@/utils/format';
import styles from './AdminStudentsPage.module.css';

function toFormValues(student: User): StudentFormValues {
  return {
    fullName: student.fullName,
    email: student.email,
    phone: student.phone ?? '',
    status: student.status,
  };
}

const EMPTY_FORM: StudentFormValues = { fullName: '', email: '', phone: '', status: 'ACTIVE' };

export function AdminStudentsPage() {
  const {
    students,
    visibleStudents,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    status,
    error,
    reload,
    updateStudent,
    deactivateStudent,
    reactivateStudent,
  } = useAdminStudents();

  const [editingStudent, setEditingStudent] = useState<User | null>(null);
  const [form, setForm] = useState<StudentFormValues>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<StudentFieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(false);

  const [deactivatingStudent, setDeactivatingStudent] = useState<User | null>(null);
  const [deactivatePending, setDeactivatePending] = useState(false);
  const [deactivateError, setDeactivateError] = useState(false);

  const [reactivatingId, setReactivatingId] = useState<number | null>(null);

  const updateField = (field: keyof StudentFormValues, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const openEditModal = (student: User) => {
    setEditingStudent(student);
    setForm(toFormValues(student));
    setFieldErrors({});
    setSubmitError(false);
  };

  const closeEditModal = () => {
    setEditingStudent(null);
    setSubmitting(false);
    setSubmitError(false);
  };

  const handleEditSubmit = async () => {
    if (!editingStudent) return;
    const errors = validateStudent(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setSubmitting(true);
    setSubmitError(false);
    try {
      const phone = form.phone.trim();
      await updateStudent(editingStudent.id, {
        email: form.email.trim(),
        fullName: form.fullName.trim(),
        phone: phone ? phone : null,
        role: 'STUDENT',
        status: form.status,
        avatarUrl: editingStudent.avatarUrl ?? null,
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

  const openDeactivateConfirm = (student: User) => {
    setDeactivatingStudent(student);
    setDeactivateError(false);
  };

  const closeDeactivateConfirm = () => {
    setDeactivatingStudent(null);
    setDeactivatePending(false);
    setDeactivateError(false);
  };

  const handleConfirmDeactivate = async () => {
    if (!deactivatingStudent) return;
    setDeactivatePending(true);
    setDeactivateError(false);
    try {
      await deactivateStudent(deactivatingStudent.id);
      closeDeactivateConfirm();
    } catch {
      setDeactivateError(true);
    } finally {
      setDeactivatePending(false);
    }
  };

  const handleReactivate = async (student: User) => {
    setReactivatingId(student.id);
    try {
      await reactivateStudent(student);
    } finally {
      setReactivatingId(null);
    }
  };

  return (
    <div className={styles.page}>
      <PageHeader
        title="Học viên"
        description="Quản lý tài khoản học viên của trung tâm."
      />

      {status === 'success' && students.length > 0 && (
        <div className={styles.toolbar}>
          <div className={styles.search}>
            <Input
              type="search"
              placeholder="Tìm kiếm học viên..."
              aria-label="Tìm kiếm học viên"
              leftIcon={<Search size={16} aria-hidden="true" />}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className={styles.statusFilter}>
            <Select
              aria-label="Lọc theo trạng thái"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as StudentStatusFilter)}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="INACTIVE">Vô hiệu hóa</option>
            </Select>
          </div>
        </div>
      )}

      {status === 'loading' && <StudentsSkeleton />}

      {status === 'error' && (
        <ErrorState
          icon={Users}
          title="Không thể tải danh sách học viên"
          message={error ?? undefined}
          onRetry={reload}
        />
      )}

      {status === 'success' &&
        (students.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Chưa có học viên nào"
            description="Chưa có tài khoản học viên nào trong hệ thống."
          />
        ) : visibleStudents.length === 0 ? (
          <EmptyState
            icon={Search}
            title="Không tìm thấy học viên phù hợp"
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
                  {visibleStudents.map((student) => (
                    <tr key={student.id}>
                      <td>
                        <span className={styles.nameCell}>
                          <Avatar name={student.fullName} src={student.avatarUrl} size="sm" />
                          <span className={styles.studentName}>{student.fullName}</span>
                        </span>
                      </td>
                      <td>{student.email}</td>
                      <td>{student.phone || '—'}</td>
                      <td>
                        <Badge tone={student.status === 'ACTIVE' ? 'success' : 'neutral'} dot>
                          {student.status === 'ACTIVE' ? 'Đang hoạt động' : 'Vô hiệu hóa'}
                        </Badge>
                      </td>
                      <td className={styles.dateCell}>{formatDate(student.createdAt)}</td>
                      <td>
                        <div className={styles.rowActions}>
                          <Button
                            variant="ghost"
                            size="sm"
                            leftIcon={<Pencil size={14} aria-hidden="true" />}
                            aria-label={`Sửa ${student.fullName}`}
                            onClick={() => openEditModal(student)}
                          >
                            Sửa
                          </Button>
                          {student.status === 'ACTIVE' ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              leftIcon={<Trash2 size={14} aria-hidden="true" />}
                              aria-label={`Vô hiệu hóa ${student.fullName}`}
                              onClick={() => openDeactivateConfirm(student)}
                            >
                              Vô hiệu hóa
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              leftIcon={<RotateCcw size={14} aria-hidden="true" />}
                              aria-label={`Kích hoạt lại ${student.fullName}`}
                              disabled={reactivatingId === student.id}
                              onClick={() => void handleReactivate(student)}
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
        open={editingStudent !== null}
        title="Cập nhật học viên"
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
          <StudentForm values={form} errors={fieldErrors} onChange={updateField} />
          {submitError && (
            <p className={styles.inlineError}>Không thể lưu học viên. Vui lòng thử lại.</p>
          )}
        </form>
      </Modal>

      <Modal
        open={deactivatingStudent !== null}
        title="Vô hiệu hóa học viên?"
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
          Vô hiệu hóa học viên này? Tài khoản sẽ chuyển INACTIVE, dữ liệu liên quan giữ nguyên.
        </p>
        {deactivateError && (
          <p className={styles.inlineError}>Không thể vô hiệu hóa học viên. Vui lòng thử lại.</p>
        )}
      </Modal>
    </div>
  );
}

function StudentsSkeleton() {
  return (
    <div className={styles.skeletonList} aria-label="Đang tải danh sách học viên" role="status">
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
