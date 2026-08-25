import { useCallback, useEffect, useState } from 'react';
import { BookOpen } from 'lucide-react';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { PageHeader } from '@/components/ui/PageHeader';
import { scoresApi } from '@/services/api/scoresApi';
import { useAuth } from '@/features/auth/useAuth';
import type { Score } from '@/types/score';
import { formatScore } from '@/utils/format';
import styles from './StudentScoresPage.module.css';

type ListStatus = 'loading' | 'error' | 'success';

function renderResult(totalScore: number | null | undefined) {
  if (totalScore == null) return '—';
  const tone: BadgeTone = totalScore >= 5 ? 'success' : 'danger';
  return (
    <Badge tone={tone} dot>
      {totalScore >= 5 ? 'Đạt' : 'Không đạt'}
    </Badge>
  );
}

export function StudentScoresPage() {
  const { user } = useAuth();
  const studentId = user?.id;

  const [scores, setScores] = useState<Score[]>([]);
  const [status, setStatus] = useState<ListStatus>('loading');

  const loadScores = useCallback(async () => {
    if (!studentId) return;
    setStatus('loading');
    try {
      const data = await scoresApi.getScores({ studentId });
      setScores(data);
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }, [studentId]);

  useEffect(() => {
    void loadScores();
  }, [loadScores]);

  return (
    <div className={styles.page}>
      <PageHeader
        title="Bảng điểm"
        description="Xem điểm số và nhận xét các lớp học."
      />

      {status === 'loading' && <ScoresSkeleton />}

      {status === 'error' && (
        <ErrorState
          icon={BookOpen}
          title="Không thể tải bảng điểm"
          message="Vui lòng kiểm tra kết nối và thử lại."
          onRetry={() => void loadScores()}
        />
      )}

      {status === 'success' && scores.length === 0 && (
        <EmptyState
          icon={BookOpen}
          title="Chưa có điểm số"
          description="Giáo viên chưa nhập điểm cho bạn."
        />
      )}

      {status === 'success' && scores.length > 0 && (
        <Card>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Lớp học</th>
                  <th>Khóa học</th>
                  <th className={styles.textCol}>Giữa kỳ</th>
                  <th className={styles.textCol}>Cuối kỳ</th>
                  <th className={styles.textCol}>Tổng kết</th>
                  <th>Kết quả</th>
                  <th>Nhận xét</th>
                </tr>
              </thead>
              <tbody>
                {scores.map((score) => (
                  <tr key={score.id}>
                    <td className={styles.classNameCell}>{score.className}</td>
                    <td className={styles.courseNameCell}>{score.courseName}</td>
                    <td className={styles.textCol}>{formatScore(score.midtermScore)}</td>
                    <td className={styles.textCol}>{formatScore(score.finalScore)}</td>
                    <td className={styles.textCol}>{formatScore(score.totalScore)}</td>
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
      )}
    </div>
  );
}

function ScoresSkeleton() {
  return (
    <div className={styles.skeletonList} aria-label="Đang tải dữ liệu" role="status">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className={styles.skeletonRow}>
          <span className={`${styles.skeletonLine} ${styles.skeletonLineWide}`} />
          <span className={`${styles.skeletonLine} ${styles.skeletonLineNarrow}`} />
          <span className={`${styles.skeletonLine} ${styles.skeletonLineNarrow}`} />
          <span className={`${styles.skeletonLine} ${styles.skeletonLineNarrow}`} />
        </div>
      ))}
    </div>
  );
}
