import { useCallback, useEffect, useMemo, useState } from 'react';
import { BookOpen, CalendarClock, Pencil, Plus, Save, X } from 'lucide-react';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { PageHeader } from '@/components/ui/PageHeader';
import { Select } from '@/components/ui/Select';
import { classesApi } from '@/services/api/classesApi';
import { registrationsApi } from '@/services/api/registrationsApi';
import { scoresApi } from '@/services/api/scoresApi';
import {
  toScorePayload,
  validateScoreForm,
  type ScoreEditForm,
  type ScoreFieldErrors,
} from '@/features/scores/scoreValidation';
import { useAuth } from '@/features/auth/useAuth';
import type { CourseClass } from '@/types/courseClass';
import type { Registration } from '@/types/registration';
import type { Score } from '@/types/score';
import type { ClassStatus } from '@/types/courseClass';
import { formatScore } from '@/utils/format';
import styles from './TeacherScoresPage.module.css';

type ListStatus = 'loading' | 'error' | 'success';

const CAN_SCORE_STATUSES: ReadonlySet<ClassStatus> = new Set<ClassStatus>(['STUDYING', 'FINISHED']);

const CLASS_STATUS_LABELS: Record<ClassStatus, string> = {
  UPCOMING: 'Sắp khai giảng',
  STUDYING: 'Đang học',
  FINISHED: 'Đã kết thúc',
  CANCELLED: 'Đã hủy',
};

const CLASS_STATUS_TONES: Record<ClassStatus, BadgeTone> = {
  UPCOMING: 'warning',
  STUDYING: 'primary',
  FINISHED: 'success',
  CANCELLED: 'danger',
};

function emptyForm(): ScoreEditForm {
  return { midtermScore: '', finalScore: '', comment: '' };
}

function formFromScore(score: Score | undefined): ScoreEditForm {
  return {
    midtermScore: score?.midtermScore != null ? String(score.midtermScore) : '',
    finalScore: score?.finalScore != null ? String(score.finalScore) : '',
    comment: score?.comment ?? '',
  };
}

interface RosterRow {
  studentId: number;
  studentName: string;
  score: Score | undefined;
}

export function TeacherScoresPage() {
  const { user } = useAuth();
  const teacherId = user?.id;

  const [classes, setClasses] = useState<CourseClass[]>([]);
  const [classesStatus, setClassesStatus] = useState<ListStatus>('loading');
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);

  const [roster, setRoster] = useState<Registration[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [tableStatus, setTableStatus] = useState<ListStatus>('loading');

  const [editingStudentId, setEditingStudentId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<ScoreEditForm>(emptyForm());
  const [fieldErrors, setFieldErrors] = useState<ScoreFieldErrors>({});
  const [savePending, setSavePending] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const selectedClass = useMemo(
    () => classes.find((c) => c.id === selectedClassId) ?? null,
    [classes, selectedClassId],
  );

  const canEdit = selectedClass != null && CAN_SCORE_STATUSES.has(selectedClass.status);

  const guardMessage = useMemo(() => {
    if (!selectedClass) return null;
    if (selectedClass.status === 'UPCOMING') return 'Lớp học chưa bắt đầu. Không thể nhập điểm.';
    if (selectedClass.status === 'CANCELLED') return 'Lớp học đã bị hủy.';
    return null;
  }, [selectedClass]);

  const loadClasses = useCallback(async () => {
    if (!teacherId) return;
    setClassesStatus('loading');
    try {
      const data = await classesApi.getClasses({ teacherId });
      setClasses(data);
      if (data.length > 0) {
        setSelectedClassId(data[0].id);
      } else {
        setSelectedClassId(null);
      }
      setClassesStatus('success');
    } catch {
      setClassesStatus('error');
    }
  }, [teacherId]);

  useEffect(() => {
    void loadClasses();
  }, [loadClasses]);

  const loadClassData = useCallback(async (classId: number) => {
    setTableStatus('loading');
    setEditingStudentId(null);
    setFieldErrors({});
    setSaveError(null);
    try {
      const [regData, scoreData] = await Promise.all([
        registrationsApi.getRegistrations({ classId }),
        scoresApi.getScores({ classId }),
      ]);
      setRoster(regData);
      setScores(scoreData);
      setTableStatus('success');
    } catch {
      setTableStatus('error');
    }
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      void loadClassData(selectedClassId);
    }
  }, [selectedClassId, loadClassData]);

  const rows: RosterRow[] = useMemo(() => {
    const enrolled = roster.filter(
      (r) => r.status === 'APPROVED' || r.status === 'PAID',
    );
    const scoreMap = new Map(scores.map((s) => [s.studentId, s]));
    return enrolled.map((r) => ({
      studentId: r.studentId,
      studentName: r.studentName,
      score: scoreMap.get(r.studentId),
    }));
  }, [roster, scores]);

  const startEdit = (studentId: number, score: Score | undefined) => {
    setEditingStudentId(studentId);
    setEditForm(formFromScore(score));
    setFieldErrors({});
    setSaveError(null);
  };

  const cancelEdit = () => {
    setEditingStudentId(null);
    setFieldErrors({});
    setSaveError(null);
  };

  const handleSave = async (studentId: number) => {
    if (!selectedClassId) return;
    const errors = validateScoreForm(editForm);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setSavePending(true);
    setSaveError(null);
    try {
      const payload = toScorePayload(editForm);
      const existingScore = scores.find((s) => s.studentId === studentId);
      if (existingScore) {
        await scoresApi.updateScore(existingScore.id, payload);
      } else {
        await scoresApi.createScore({ ...payload, studentId, classId: selectedClassId });
      }
      setEditingStudentId(null);
      setFieldErrors({});
      await loadClassData(selectedClassId);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Không thể lưu điểm. Vui lòng thử lại.');
    } finally {
      setSavePending(false);
    }
  };

  const updateField = (field: 'midtermScore' | 'finalScore' | 'comment', value: string) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
    if (field === 'midtermScore' || field === 'finalScore') {
      setFieldErrors((prev) => {
        if (!(field in prev)) return prev;
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    setSaveError(null);
  };

  const renderResult = (totalScore: number | null | undefined) => {
    if (totalScore == null) return '—';
    const tone: BadgeTone = totalScore >= 5 ? 'success' : 'danger';
    return (
      <Badge tone={tone} dot>
        {totalScore >= 5 ? 'Đạt' : 'Không đạt'}
      </Badge>
    );
  };

  return (
    <div className={styles.page}>
      <PageHeader title="Bảng điểm" description="Quản lý điểm số và nhận xét cho học viên trong lớp phụ trách." />

      {classesStatus === 'success' && classes.length === 0 && (
        <EmptyState
          icon={BookOpen}
          title="Chưa có lớp học nào được phân công"
          description="Bạn chưa được phân công dạy lớp nào. Vui lòng liên hệ quản trị viên."
        />
      )}

      {classesStatus === 'success' && classes.length > 0 && (
        <div className={styles.classBar}>
          <div className={styles.classSelect}>
            <Select
              aria-label="Chọn lớp học"
              value={selectedClassId != null ? String(selectedClassId) : ''}
              onChange={(e) => {
                setSelectedClassId(Number(e.target.value));
              }}
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} — {cls.courseName}
                </option>
              ))}
            </Select>
          </div>
          {selectedClass && (
            <Badge tone={CLASS_STATUS_TONES[selectedClass.status]}>
              {CLASS_STATUS_LABELS[selectedClass.status]}
            </Badge>
          )}
        </div>
      )}

      {classesStatus === 'loading' && <ScoresSkeleton />}

      {classesStatus === 'error' && (
        <ErrorState
          icon={BookOpen}
          title="Không thể tải danh sách lớp học"
          message="Vui lòng kiểm tra kết nối và thử lại."
          onRetry={() => void loadClasses()}
        />
      )}

      {classesStatus === 'success' && classes.length > 0 && selectedClassId != null && (
        <>
          {guardMessage && (
            <div className={styles.guardBanner} role="status">
              <CalendarClock size={16} aria-hidden="true" />
              {guardMessage}
            </div>
          )}

          {saveError && (
            <p className={styles.inlineError} role="alert">
              {saveError}
            </p>
          )}

          {tableStatus === 'loading' && <ScoresSkeleton />}

          {tableStatus === 'error' && (
            <ErrorState
              icon={BookOpen}
              title="Không thể tải danh sách học viên"
              message="Vui lòng kiểm tra kết nối và thử lại."
              onRetry={() => void loadClassData(selectedClassId)}
            />
          )}

          {tableStatus === 'success' && rows.length === 0 && (
            <EmptyState
              icon={BookOpen}
              title="Lớp chưa có học viên"
              description="Chưa có học viên nào đăng ký hoặc được duyệt vào lớp này."
            />
          )}

          {tableStatus === 'success' && rows.length > 0 && (
            <Card>
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Học viên</th>
                      <th className={styles.textCol}>Giữa kỳ</th>
                      <th className={styles.textCol}>Cuối kỳ</th>
                      <th className={styles.textCol}>Tổng kết</th>
                      <th>Kết quả</th>
                      <th>Nhận xét</th>
                      <th aria-label="Hành động" />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => {
                      const isEditing = editingStudentId === row.studentId;

                      return (
                        <tr key={row.studentId}>
                          <td>
                            <span className={styles.studentName}>{row.studentName}</span>
                          </td>
                          {isEditing ? (
                            <>
                              <td className={styles.textCol}>
                                <div className={styles.editCell}>
                                  <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="10"
                                    className={`${styles.inlineInput} ${fieldErrors.midtermScore ? styles.inlineInputInvalid : ''}`}
                                    value={editForm.midtermScore}
                                    onChange={(e) => updateField('midtermScore', e.target.value)}
                                    aria-label="Điểm giữa kỳ"
                                  />
                                  {fieldErrors.midtermScore && (
                                    <p className={styles.fieldErrorMsg}>{fieldErrors.midtermScore}</p>
                                  )}
                                </div>
                              </td>
                              <td className={styles.textCol}>
                                <div className={styles.editCell}>
                                  <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="10"
                                    className={`${styles.inlineInput} ${fieldErrors.finalScore ? styles.inlineInputInvalid : ''}`}
                                    value={editForm.finalScore}
                                    onChange={(e) => updateField('finalScore', e.target.value)}
                                    aria-label="Điểm cuối kỳ"
                                  />
                                  {fieldErrors.finalScore && (
                                    <p className={styles.fieldErrorMsg}>{fieldErrors.finalScore}</p>
                                  )}
                                </div>
                              </td>
                              <td className={styles.textCol}>{formatScore(row.score?.totalScore)}</td>
                              <td>{renderResult(row.score?.totalScore)}</td>
                              <td>
                                <input
                                  type="text"
                                  className={styles.commentInput}
                                  placeholder="Nhận xét..."
                                  value={editForm.comment}
                                  onChange={(e) => updateField('comment', e.target.value)}
                                  aria-label="Nhận xét"
                                />
                              </td>
                              <td>
                                <div className={styles.actionCell}>
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    loading={savePending}
                                    leftIcon={<Save size={14} aria-hidden="true" />}
                                    onClick={() => void handleSave(row.studentId)}
                                  >
                                    Lưu
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    leftIcon={<X size={14} aria-hidden="true" />}
                                    onClick={cancelEdit}
                                    disabled={savePending}
                                  >
                                    Hủy
                                  </Button>
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className={styles.textCol}>
                                {formatScore(row.score?.midtermScore)}
                              </td>
                              <td className={styles.textCol}>
                                {formatScore(row.score?.finalScore)}
                              </td>
                              <td className={styles.textCol}>
                                {formatScore(row.score?.totalScore)}
                              </td>
                              <td>{renderResult(row.score?.totalScore)}</td>
                              <td className={styles.commentCell} title={row.score?.comment ?? undefined}>
                                {row.score?.comment || '—'}
                              </td>
                              <td>
                                {canEdit && (
                                  <div className={styles.actionCell}>
                                    {row.score ? (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        leftIcon={<Pencil size={14} aria-hidden="true" />}
                                        aria-label={`Sửa điểm ${row.studentName}`}
                                        onClick={() => startEdit(row.studentId, row.score)}
                                      >
                                        Sửa
                                      </Button>
                                    ) : (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        leftIcon={<Plus size={14} aria-hidden="true" />}
                                        aria-label={`Nhập điểm ${row.studentName}`}
                                        onClick={() => startEdit(row.studentId, undefined)}
                                      >
                                        Nhập
                                      </Button>
                                    )}
                                  </div>
                                )}
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function ScoresSkeleton() {
  return (
    <div className={styles.skeletonList} aria-label="Đang tải dữ liệu" role="status">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className={styles.skeletonRow}>
          <span className={`${styles.skeletonLine} ${styles.skeletonLineName}`} />
          <span className={`${styles.skeletonLine} ${styles.skeletonLineSmall}`} />
          <span className={`${styles.skeletonLine} ${styles.skeletonLineSmall}`} />
          <span className={`${styles.skeletonLine} ${styles.skeletonLineSmall}`} />
        </div>
      ))}
    </div>
  );
}
