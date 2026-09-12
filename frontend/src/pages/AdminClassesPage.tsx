import { useState } from 'react';
import { CalendarClock, Pencil, Plus, School, Search, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { Select } from '@/components/ui/Select';
import { ClassForm } from '@/features/classes/ClassForm';
import {
  CLASS_STATUSES,
  CLASS_STATUS_LABELS,
  CLASS_STATUS_TONES,
  buildClassPayload,
  formatSchedule,
  validateClass,
  type ClassFieldErrors,
  type ClassFormValues,
} from '@/features/classes/classValidation';
import {
  useAdminClasses,
  type ClassCourseFilter,
  type ClassStatusFilter,
} from '@/features/classes/useAdminClasses';
import { ApiError } from '@/services/api/httpClient';
import type { CourseClass } from '@/types/courseClass';
import { formatDateTime } from '@/utils/format';
import styles from './AdminClassesPage.module.css';

const EMPTY_FORM: ClassFormValues = {
  courseId: '',
  name: '',
  teacherId: '',
  maxCapacity: '',
  scheduleDay: '',
  startTime: '',
  endTime: '',
  room: '',
  startDate: '',
  endDate: '',
  status: 'UPCOMING',
};

function formFromClass(cls: CourseClass): ClassFormValues {
  return {
    courseId: String(cls.courseId),
    name: cls.name,
    teacherId: cls.teacherId != null ? String(cls.teacherId) : '',
    maxCapacity: String(cls.maxCapacity),
    scheduleDay: cls.scheduleDay,
    startTime: cls.startTime.slice(0, 5),
    endTime: cls.endTime.slice(0, 5),
    room: cls.room,
    startDate: cls.startDate.slice(0, 10),
    endDate: cls.endDate.slice(0, 10),
    status: cls.status,
  };
}

function toSubmitError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 403) return 'Không có quyền thực hiện thao tác này.';
    if (error.message) return error.message;
  }
  return 'Không thể lưu lớp học. Vui lòng thử lại.';
}

export function AdminClassesPage() {
  const {
    classes,
    visibleClasses,
    activeCourses,
    teachers,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    courseFilter,
    setCourseFilter,
    status,
    error,
    reload,
    createClass,
    updateClass,
    cancelClass,
  } = useAdminClasses();

  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingClass, setEditingClass] = useState<CourseClass | null>(null);
  const [form, setForm] = useState<ClassFormValues>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<ClassFieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [cancellingClass, setCancellingClass] = useState<CourseClass | null>(null);
  const [cancelPending, setCancelPending] = useState(false);
  const [cancelError, setCancelError] = useState(false);

  const updateField = (field: keyof ClassFormValues, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const openCreateModal = () => {
    setModalMode('create');
    setEditingClass(null);
    setForm(EMPTY_FORM);
    setFieldErrors({});
    setSubmitError(null);
  };

  const openEditModal = (cls: CourseClass) => {
    setModalMode('edit');
    setEditingClass(cls);
    setForm(formFromClass(cls));
    setFieldErrors({});
    setSubmitError(null);
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingClass(null);
    setSubmitting(false);
    setSubmitError(null);
  };

  const handleSubmit = async () => {
    if (!modalMode) return;
    const errors = validateClass(form, {
      mode: modalMode,
      currentHeadcount: editingClass?.currentHeadcount,
    });
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload = buildClassPayload(form, modalMode);
      if (modalMode === 'create') {
        await createClass(payload);
      } else if (editingClass) {
        await updateClass(editingClass.id, payload);
      }
      closeModal();
    } catch (error) {
      setSubmitError(toSubmitError(error));
    } finally {
      setSubmitting(false);
    }
  };

  const openCancelConfirm = (cls: CourseClass) => {
    setCancellingClass(cls);
    setCancelError(false);
  };

  const closeCancelConfirm = () => {
    setCancellingClass(null);
    setCancelPending(false);
    setCancelError(false);
  };

  const handleConfirmCancel = async () => {
    if (!cancellingClass) return;
    setCancelPending(true);
    setCancelError(false);
    try {
      await cancelClass(cancellingClass.id);
      closeCancelConfirm();
    } catch {
      setCancelError(true);
    } finally {
      setCancelPending(false);
    }
  };

  return (
    <div className={styles.page}>
      <PageHeader
        title="Lớp học"
        description="Quản lý các lớp học của trung tâm."
        actions={
          <Button size="sm" leftIcon={<Plus size={16} aria-hidden="true" />} onClick={openCreateModal}>
            Thêm lớp học
          </Button>
        }
      />

      {status === 'success' && classes.length > 0 && (
        <div className={styles.toolbar}>
          <div className={styles.search}>
            <Input
              type="search"
              placeholder="Tìm kiếm lớp học..."
              aria-label="Tìm kiếm lớp học"
              leftIcon={<Search size={16} aria-hidden="true" />}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className={styles.statusFilter}>
            <Select
              aria-label="Lọc theo trạng thái"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as ClassStatusFilter)}
            >
              <option value="ALL">Tất cả trạng thái</option>
              {CLASS_STATUSES.map((item) => (
                <option key={item} value={item}>
                  {CLASS_STATUS_LABELS[item]}
                </option>
              ))}
            </Select>
          </div>
          <div className={styles.statusFilter}>
            <Select
              aria-label="Lọc theo khóa học"
              value={courseFilter}
              onChange={(event) => setCourseFilter(event.target.value as ClassCourseFilter)}
            >
              <option value="ALL">Tất cả khóa học</option>
              {activeCourses.map((course) => (
                <option key={course.id} value={String(course.id)}>
                  {course.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
      )}

      {status === 'loading' && <ClassesSkeleton />}

      {status === 'error' && (
        <ErrorState
          icon={School}
          title="Không thể tải danh sách lớp học"
          message={error ?? undefined}
          onRetry={reload}
        />
      )}

      {status === 'success' &&
        (classes.length === 0 ? (
          <EmptyState
            icon={School}
            title="Chưa có lớp học nào"
            description="Tạo lớp học đầu tiên để bắt đầu quản lý."
            action={
              <Button size="sm" leftIcon={<Plus size={16} aria-hidden="true" />} onClick={openCreateModal}>
                Thêm lớp học
              </Button>
            }
          />
        ) : visibleClasses.length === 0 ? (
          <EmptyState
            icon={Search}
            title="Không tìm thấy lớp phù hợp"
            description="Thử đổi từ khóa tìm kiếm hoặc bộ lọc."
          />
        ) : (
          <Card>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Tên lớp</th>
                    <th>Khóa học</th>
                    <th>Lịch học</th>
                    <th>Phòng</th>
                    <th className={styles.numberCol}>Sĩ số</th>
                    <th>Trạng thái</th>
                    <th aria-label="Hành động" />
                  </tr>
                </thead>
                <tbody>
                  {visibleClasses.map((cls) => (
                    <tr key={cls.id}>
                      <td>
                        <span className={styles.className}>{cls.name}</span>
                      </td>
                      <td>{cls.courseName}</td>
                      <td>
                        <div className={styles.scheduleCell}>
                          <CalendarClock size={14} aria-hidden="true" className={styles.scheduleIcon} />
                          {formatSchedule(cls.scheduleDay, cls.startTime, cls.endTime)}
                        </div>
                        <div className={styles.dateRange}>
                          {formatDateTime(cls.startDate)} – {formatDateTime(cls.endDate)}
                        </div>
                      </td>
                      <td>{cls.room}</td>
                      <td className={styles.numberCol}>
                        {cls.currentHeadcount} / {cls.maxCapacity}
                      </td>
                      <td>
                        <Badge tone={CLASS_STATUS_TONES[cls.status]} dot>
                          {CLASS_STATUS_LABELS[cls.status]}
                        </Badge>
                      </td>
                      <td>
                        <div className={styles.rowActions}>
                          <Button
                            variant="ghost"
                            size="sm"
                            leftIcon={<Pencil size={14} aria-hidden="true" />}
                            aria-label={`Sửa ${cls.name}`}
                            onClick={() => openEditModal(cls)}
                          >
                            Sửa
                          </Button>
                          {cls.status !== 'CANCELLED' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              leftIcon={<Trash2 size={14} aria-hidden="true" />}
                              aria-label={`Hủy ${cls.name}`}
                              onClick={() => openCancelConfirm(cls)}
                            >
                              Hủy lớp
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
        open={modalMode !== null}
        title={modalMode === 'create' ? 'Thêm lớp học' : 'Cập nhật lớp học'}
        size="md"
        onClose={closeModal}
        footer={
          <>
            <Button variant="secondary" onClick={closeModal} disabled={submitting}>
              Hủy
            </Button>
            <Button loading={submitting} onClick={() => void handleSubmit()}>
              {modalMode === 'create' ? 'Tạo lớp học' : 'Lưu thay đổi'}
            </Button>
          </>
        }
      >
        <form className={styles.form} onSubmit={(event) => event.preventDefault()} noValidate>
          <ClassForm
            mode={modalMode ?? 'create'}
            values={form}
            errors={fieldErrors}
            courses={activeCourses}
            teachers={teachers}
            courseName={editingClass?.courseName}
            onChange={updateField}
          />
          {submitError && <p className={styles.inlineError}>{submitError}</p>}
        </form>
      </Modal>

      <Modal
        open={cancellingClass !== null}
        title="Hủy lớp học?"
        size="sm"
        onClose={closeCancelConfirm}
        footer={
          <>
            <Button variant="secondary" onClick={closeCancelConfirm} disabled={cancelPending}>
              Hủy
            </Button>
            <Button variant="danger" loading={cancelPending} onClick={() => void handleConfirmCancel()}>
              Xác nhận
            </Button>
          </>
        }
      >
        <p className={styles.confirmText}>
          Hủy lớp học này? Lớp sẽ chuyển CANCELLED, dữ liệu đăng ký giữ nguyên.
        </p>
        {cancelError && (
          <p className={styles.inlineError}>Không thể hủy lớp học. Vui lòng thử lại.</p>
        )}
      </Modal>
    </div>
  );
}

function ClassesSkeleton() {
  return (
    <div className={styles.skeletonList} aria-label="Đang tải danh sách lớp học" role="status">
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
