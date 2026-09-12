import { BookOpen } from 'lucide-react';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { PageHeader } from '@/components/ui/PageHeader';
import { Select } from '@/components/ui/Select';
import { useAdminScores } from '@/features/scores/useAdminScores';
import { formatScore } from '@/utils/format';
import styles from './AdminScoresPage.module.css';

function renderResult(totalScore: number | null | undefined) {
  if (totalScore == null) return '—';
  const tone: BadgeTone = totalScore >= 5 ? 'success' : 'danger';
  return (
    <Badge tone={tone} dot>
      {totalScore >= 5 ? 'Đạt' : 'Không đạt'}
    </Badge>
  );
}

export function AdminScoresPage() {
  const { classes, scores, selectedClassId, setSelectedClassId, status, error, reload } =
    useAdminScores();
  const scoresList = scores ?? [];

  return (
    <div className={styles.page}>
      <PageHeader
        title="Bảng điểm"
        description="Xem điểm số của học viên trên toàn hệ thống."
      />

      {status === 'success' && (
        <div className={styles.classBar}>
          <div className={styles.classSelect}>
            <Select
              aria-label="Lọc theo lớp học"
              value={selectedClassId != null ? String(selectedClassId) : ''}
              onChange={(e) => {
                setSelectedClassId(e.target.value === '' ? null : Number(e.target.value));
              }}
            >
              <option value="">Tất cả các lớp</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} — {cls.courseName}
                </option>
              ))}
            </Select>
          </div>
        </div>
      )}

      {status === 'loading' && <AdminScoresSkeleton />}

      {status === 'error' && (
        <ErrorState
          icon={BookOpen}
          title="Không thể tải bảng điểm"
          message={error ?? undefined}
          onRetry={reload}
        />
      )}

      {status === 'success' &&
        (scoresList.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title={selectedClassId != null ? 'Lớp này chưa có điểm số' : 'Chưa có điểm số'}
            description={
              selectedClassId != null
                ? 'Chưa có điểm nào được nhập cho lớp đã chọn.'
                : 'Chưa có điểm nào trong hệ thống.'
            }
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
                    <th className={styles.numberCol}>Giữa kỳ</th>
                    <th className={styles.numberCol}>Cuối kỳ</th>
                    <th className={styles.numberCol}>Tổng kết</th>
                    <th>Kết quả</th>
                    <th>Nhận xét</th>
                  </tr>
                </thead>
                <tbody>
                  {scoresList.map((score) => (
                    <tr key={score.id}>
                      <td>
                        <span className={styles.studentName}>{score.studentName}</span>
                      </td>
                      <td>{score.className}</td>
                      <td>{score.courseName}</td>
                      <td className={styles.numberCol}>{formatScore(score.midtermScore)}</td>
                      <td className={styles.numberCol}>{formatScore(score.finalScore)}</td>
                      <td className={styles.numberCol}>{formatScore(score.totalScore)}</td>
                      <td>{renderResult(score.totalScore)}</td>
                      <td className={styles.commentCell} title={score.comment ?? undefined}>
                        {score.comment || '—'}
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

function AdminScoresSkeleton() {
  return (
    <div className={styles.skeletonList} aria-label="Đang tải bảng điểm" role="status">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className={styles.skeletonRow} data-testid="skeleton-row">
          <span className={`${styles.skeletonLine} ${styles.skeletonLineStudent}`} />
          <span className={`${styles.skeletonLine} ${styles.skeletonLineClass}`} />
          <span className={`${styles.skeletonLine} ${styles.skeletonLineCourse}`} />
          <span className={`${styles.skeletonLine} ${styles.skeletonLineScore}`} />
          <span className={`${styles.skeletonLine} ${styles.skeletonLineScore}`} />
          <span className={`${styles.skeletonLine} ${styles.skeletonLineScore}`} />
          <span className={`${styles.skeletonLine} ${styles.skeletonLineResult}`} />
          <span className={`${styles.skeletonLine} ${styles.skeletonLineComment}`} />
        </div>
      ))}
    </div>
  );
}
