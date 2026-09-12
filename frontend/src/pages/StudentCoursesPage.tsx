import { BookOpen } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { PageHeader } from '@/components/ui/PageHeader';
import { useStudentCourses } from '@/features/courses/useStudentCourses';
import { formatDate, formatVnd } from '@/utils/format';
import styles from './StudentCoursesPage.module.css';

function formatTuition(value?: number | null): string {
  if (value == null) return '—';
  return formatVnd(value);
}

export function StudentCoursesPage() {
  const { courses, status, error, reload } = useStudentCourses();
  const coursesList = courses ?? [];

  return (
    <div className={styles.page}>
      <PageHeader
        title="Khóa học của tôi"
        description="Các lớp bạn đã được duyệt và đang theo học."
      />

      {status === 'loading' && <StudentCoursesSkeleton />}

      {status === 'error' && (
        <ErrorState
          icon={BookOpen}
          title="Không thể tải danh sách khóa học"
          message={error ?? undefined}
          onRetry={reload}
        />
      )}

      {status === 'success' &&
        (coursesList.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="Chưa có khóa học nào"
            description="Bạn chưa có lớp nào được duyệt. Vui lòng sang trang Đăng ký để đăng ký khóa học."
          />
        ) : (
          <Card>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Tên lớp</th>
                    <th>Khóa học</th>
                    <th>Trạng thái</th>
                    <th className={styles.numberCol}>Học phí</th>
                    <th>Ngày đăng ký</th>
                  </tr>
                </thead>
                <tbody>
                  {coursesList.map((registration) => (
                    <tr key={registration.id}>
                      <td>
                        <span className={styles.className}>{registration.className}</span>
                      </td>
                      <td>{registration.courseName}</td>
                      <td>
                        {registration.status === 'PAID' ? (
                          <Badge tone="success" dot>
                            Đã thanh toán
                          </Badge>
                        ) : (
                          <Badge tone="primary" dot>
                            Đã duyệt
                          </Badge>
                        )}
                      </td>
                      <td className={styles.numberCol}>
                        {formatTuition(registration.tuitionAtRegistration)}
                      </td>
                      <td className={styles.dateCell}>
                        {formatDate(registration.registeredAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ))}
    </div>
  );
}

function StudentCoursesSkeleton() {
  return (
    <div className={styles.skeletonList} aria-label="Đang tải danh sách khóa học" role="status">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className={styles.skeletonRow} data-testid="skeleton-row">
          <span className={`${styles.skeletonLine} ${styles.skeletonLineName}`} />
          <span className={`${styles.skeletonLine} ${styles.skeletonLineCourse}`} />
          <span className={`${styles.skeletonLine} ${styles.skeletonLineStatus}`} />
          <span className={`${styles.skeletonLine} ${styles.skeletonLineTuition}`} />
          <span className={`${styles.skeletonLine} ${styles.skeletonLineDate}`} />
        </div>
      ))}
    </div>
  );
}
