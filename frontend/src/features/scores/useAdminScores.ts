import { useCallback, useEffect, useState } from 'react';
import { classesApi } from '@/services/api/classesApi';
import { scoresApi } from '@/services/api/scoresApi';
import type { CourseClass } from '@/types/courseClass';
import type { Score } from '@/types/score';

type ScoresStatus = 'loading' | 'error' | 'success';

export function useAdminScores() {
  const [classes, setClasses] = useState<CourseClass[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [status, setStatus] = useState<ScoresStatus>('loading');
  const [error, setError] = useState<string | null>(null);

  const loadScores = useCallback(async (classId: number | null) => {
    setStatus('loading');
    setError(null);
    try {
      const [classList, scoreList] = await Promise.all([
        classesApi.getClasses(),
        scoresApi.getScores(classId != null ? { classId } : undefined),
      ]);
      setClasses(classList);
      setScores(scoreList);
      setStatus('success');
    } catch {
      setStatus('error');
      setError('Không thể tải bảng điểm. Vui lòng thử lại.');
    }
  }, []);

  useEffect(() => {
    void loadScores(selectedClassId);
  }, [loadScores, selectedClassId]);

  const reload = useCallback(() => {
    void loadScores(selectedClassId);
  }, [loadScores, selectedClassId]);

  return { classes, scores, selectedClassId, setSelectedClassId, status, error, reload };
}
