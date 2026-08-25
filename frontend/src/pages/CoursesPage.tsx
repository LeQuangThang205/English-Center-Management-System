import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { AlertTriangle, BookOpen, Pencil, Plus, Search, Trash2 } from 'lucide-react';
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
  buildCoursePayload,
  COURSE_LEVELS,
  COURSE_LEVEL_LABELS,
  validateCourse,
  type CourseFieldErrors,
  type CourseFormValues,
} from '@/features/courses/courseValidation';
import { classesApi } from '@/services/api/classesApi';
import { coursesApi } from '@/services/api/coursesApi';
import type { ClassStatus } from '@/types/courseClass';
import type { Course, CourseLevel, CourseStatus } from '@/types/course';
import { formatVnd } from '@/utils/format';
import styles from './CoursesPage.module.css';

type ListStatus = 'loading' | 'error' | 'success';

interface CourseModalState {
  mode: 'create' | 'edit';
  course: Course | null;
}

const ACTIVE_CLASS_STATUSES: ReadonlySet<ClassStatus> = new Set<ClassStatus>(['UPCOMING', 'STUDYING']);

const COURSE_STATUS_META: Record<CourseStatus, { label: string; tone: BadgeTone }> = {
  ACTIVE: { label: 'Đang mở', tone: 'success' },
  DELETED: { label: 'Đã xóa', tone: 'danger' },
};

const EMPTY_FORM: CourseFormValues = {
  name: '',
  description: '',
  tuition: '',
  level: '',
  duration: '',
};

function formFromCourse(course: Course): CourseFormValues {
  return {
    name: course.name,
    description: course.description ?? '',
    tuition: String(course.tuition),
    level: course.level,
    duration: String(course.duration),
  };
}

export function CoursesPage() {
  const [status, setStatus] = useState<ListStatus>('loading');
  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<'ALL' | CourseLevel>('ALL');

  const [modal, setModal] = useState<CourseModalState | null>(null);
  const [form, setForm] = useState<CourseFormValues>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<CourseFieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(false);

  const [deletingCourse, setDeletingCourse] = useState<Course | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [deleteError, setDeleteError] = useState(false);
  const [deleteBlockedMessage, setDeleteBlockedMessage] = useState<string | null>(null);

  const descriptionId = useId();

  const reload = useCallback(async () => {
    setStatus('loading');
    try {
      const data = await coursesApi.getCourses();
      setCourses(data);
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const visibleCourses = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword && levelFilter === 'ALL') return courses;
    return courses.filter((course) => {
      if (levelFilter !== 'ALL' && course.level !== levelFilter) return false;
      if (!keyword) return true;
      const haystack =
        `${course.name} ${course.description ?? ''} ${course.level} ${COURSE_LEVEL_LABELS[course.level]}`.toLowerCase();
      return haystack.includes(keyword);
    });
  }, [courses, search, levelFilter]);

  const updateField = useCallback((field: keyof CourseFormValues, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => {
      if (field === 'name' || field === 'tuition' || field === 'level' || field === 'duration') {
        const next = { ...prev };
        delete next[field];
        return next;
      }
      return prev;
    });
  }, []);

  const openCreateModal = () => {
    setForm(EMPTY_FORM);
    setFieldErrors({});
    setSubmitError(false);
    setModal({ mode: 'create', course: null });
  };

  const openEditModal = (course: Course) => {
    setForm(formFromCourse(course));
    setFieldErrors({});
    setSubmitError(false);
    setModal({ mode: 'edit', course });
  };

  const closeModal = () => {
    setModal(null);
  };

  const handleSubmit = async () => {
    if (!modal) return;
    const errors = validateCourse(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setSubmitting(true);
    setSubmitError(false);
    try {
      const payload = buildCoursePayload(form);
      if (modal.mode === 'create') {
        await coursesApi.createCourse({ ...payload, status: 'ACTIVE' });
      } else if (modal.course) {
        await coursesApi.updateCourse(modal.course.id, { ...payload, status: modal.course.status });
      }
      closeModal();
      await reload();
    } catch {
      setSubmitError(true);
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteConfirm = (course: Course) => {
    setDeletingCourse(course);
    setDeleteError(false);
    setDeleteBlockedMessage(null);
  };

  const closeDeleteConfirm = () => {
    setDeletingCourse(null);
    setDeletePending(false);
    setDeleteError(false);
    setDeleteBlockedMessage(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingCourse) return;
    setDeletePending(true);
    setDeleteError(false);
    setDeleteBlockedMessage(null);
    try {
      const courseClasses = await classesApi.getClasses({ courseId: deletingCourse.id });
      const activeClasses = courseClasses.filter((item) => ACTIVE_CLASS_STATUSES.has(item.status));
      if (activeClasses.length > 0) {
        setDeleteBlockedMessage(
          `Không thể xóa khóa học vì đang có lớp học hoạt động (${activeClasses.map((item) => item.name).join(', ')}).`,
        );
        return;
      }
      await coursesApi.deleteCourse(deletingCourse.id);
      closeDeleteConfirm();
      await reload();
    } catch {
      setDeleteError(true);
    } finally {
      setDeletePending(false);
    }
  };

  return (
    <div className={styles.page}>
      <PageHeader
        title="Khóa học"
        description="Quản lý danh mục khóa học của trung tâm."
        actions={
          <Button size="sm" leftIcon={<Plus size={16} aria-hidden="true" />} onClick={openCreateModal}>
            Thêm khóa học
          </Button>
        }
      />

      {status === 'success' && courses.length > 0 && (
        <div className={styles.toolbar}>
          <div className={styles.search}>
            <Input
              type="search"
              placeholder="Tìm kiếm khóa học..."
              aria-label="Tìm kiếm khóa học"
              leftIcon={<Search size={16} aria-hidden="true" />}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className={styles.levelFilter}>
            <Select
              aria-label="Lọc theo cấp độ"
              value={levelFilter}
              onChange={(event) => setLevelFilter(event.target.value as 'ALL' | CourseLevel)}
            >
              <option value="ALL">Tất cả cấp độ</option>
              {COURSE_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {COURSE_LEVEL_LABELS[level]}
                </option>
              ))}
            </Select>
          </div>
        </div>
      )}

      {status === 'loading' && <CoursesSkeleton />}

      {status === 'error' && (
        <ErrorState
          icon={BookOpen}
          title="Không thể tải danh sách khóa học"
          message="Vui lòng kiểm tra kết nối và thử lại."
          onRetry={() => void reload()}
        />
      )}

      {status === 'success' &&
        (courses.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="Chưa có khóa học nào"
            description="Tạo khóa học đầu tiên để bắt đầu quản lý danh mục."
            action={
              <Button size="sm" leftIcon={<Plus size={16} aria-hidden="true" />} onClick={openCreateModal}>
                Thêm khóa học
              </Button>
            }
          />
        ) : visibleCourses.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="Không tìm thấy khóa học phù hợp"
            description="Thử đổi từ khóa tìm kiếm hoặc bộ lọc cấp độ."
          />
        ) : (
          <Card>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Khóa học</th>
                    <th>Cấp độ</th>
                    <th className={styles.numberCol}>Học phí</th>
                    <th className={styles.numberCol}>Thời lượng</th>
                    <th>Trạng thái</th>
                    <th aria-label="Hành động" />
                  </tr>
                </thead>
                <tbody>
                  {visibleCourses.map((course) => (
                    <tr key={course.id}>
                      <td>
                        <span className={styles.courseName}>{course.name}</span>
                        {course.description && (
                          <span className={styles.courseDescription}>{course.description}</span>
                        )}
                      </td>
                      <td>{COURSE_LEVEL_LABELS[course.level]}</td>
                      <td className={styles.numberCol}>{formatVnd(course.tuition)}</td>
                      <td className={styles.numberCol}>{course.duration} buổi</td>
                      <td>
                        <Badge tone={COURSE_STATUS_META[course.status].tone} dot>
                          {COURSE_STATUS_META[course.status].label}
                        </Badge>
                      </td>
                      <td>
                        <div className={styles.rowActions}>
                          <Button
                            variant="ghost"
                            size="sm"
                            leftIcon={<Pencil size={14} aria-hidden="true" />}
                            aria-label={`Sửa ${course.name}`}
                            onClick={() => openEditModal(course)}
                          >
                            Sửa
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            leftIcon={<Trash2 size={14} aria-hidden="true" />}
                            aria-label={`Xóa ${course.name}`}
                            onClick={() => openDeleteConfirm(course)}
                          >
                            Xóa
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
        open={modal !== null}
        title={modal?.mode === 'edit' ? 'Cập nhật khóa học' : 'Thêm khóa học'}
        size="md"
        onClose={closeModal}
        footer={
          <>
            <Button variant="secondary" onClick={closeModal} disabled={submitting}>
              Hủy
            </Button>
            <Button loading={submitting} onClick={() => void handleSubmit()}>
              {modal?.mode === 'edit' ? 'Lưu thay đổi' : 'Tạo khóa học'}
            </Button>
          </>
        }
      >
        <form className={styles.form} onSubmit={(event) => event.preventDefault()} noValidate>
          <Input
            label="Tên khóa học"
            required
            value={form.name}
            error={fieldErrors.name}
            onChange={(event) => updateField('name', event.target.value)}
          />
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor={descriptionId}>
              Mô tả
            </label>
            <textarea
              id={descriptionId}
              className={styles.textarea}
              rows={3}
              value={form.description}
              onChange={(event) => updateField('description', event.target.value)}
            />
          </div>
          <Input
            label="Học phí (VNĐ)"
            required
            type="number"
            min="0"
            step="1000"
            value={form.tuition}
            error={fieldErrors.tuition}
            onChange={(event) => updateField('tuition', event.target.value)}
          />
          <Select
            label="Cấp độ"
            required
            value={form.level}
            error={fieldErrors.level}
            onChange={(event) => updateField('level', event.target.value)}
          >
            <option value="">Chọn cấp độ</option>
            {COURSE_LEVELS.map((level) => (
              <option key={level} value={level}>
                {COURSE_LEVEL_LABELS[level]}
              </option>
            ))}
          </Select>
          <Input
            label="Thời lượng (số buổi)"
            required
            type="number"
            min="1"
            step="1"
            value={form.duration}
            error={fieldErrors.duration}
            onChange={(event) => updateField('duration', event.target.value)}
          />
          {submitError && (
            <p className={styles.inlineError}>Không thể lưu khóa học. Vui lòng thử lại.</p>
          )}
        </form>
      </Modal>

      <Modal
        open={deletingCourse !== null}
        title="Xóa khóa học?"
        size="sm"
        onClose={closeDeleteConfirm}
        footer={
          <>
            <Button variant="secondary" onClick={closeDeleteConfirm} disabled={deletePending}>
              Hủy
            </Button>
            <Button variant="danger" loading={deletePending} onClick={() => void handleConfirmDelete()}>
              Xác nhận xóa
            </Button>
          </>
        }
      >
        <p className={styles.confirmText}>
          Khóa học “{deletingCourse?.name ?? ''}” sẽ bị xóa khỏi danh mục. Hành động này không thể hoàn tác.
        </p>
        {deleteBlockedMessage && (
          <p className={styles.blockedText} role="alert">
            <AlertTriangle size={16} aria-hidden="true" />
            {deleteBlockedMessage}
          </p>
        )}
        {deleteError && !deleteBlockedMessage && (
          <p className={styles.inlineError}>Không thể xóa khóa học. Vui lòng thử lại.</p>
        )}
      </Modal>
    </div>
  );
}

function CoursesSkeleton() {
  return (
    <div className={styles.skeletonList} aria-label="Đang tải danh sách khóa học" role="status">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className={styles.skeletonRow}>
          <span className={`${styles.skeletonLine} ${styles.skeletonLineName}`} />
          <span className={`${styles.skeletonLine} ${styles.skeletonLineLevel}`} />
          <span className={`${styles.skeletonLine} ${styles.skeletonLinePrice}`} />
          <span className={`${styles.skeletonLine} ${styles.skeletonLineDuration}`} />
          <span className={`${styles.skeletonLine} ${styles.skeletonLineStatus}`} />
          <span className={`${styles.skeletonLine} ${styles.skeletonLineAction}`} />
        </div>
      ))}
    </div>
  );
}
