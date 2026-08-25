import { http } from '@/services/api/httpClient';
import type { Score } from '@/types/score';

export interface ScoresQuery {
  studentId?: number;
  classId?: number;
}

export interface ScorePayload {
  studentId?: number;
  classId?: number;
  midtermScore?: number | null;
  finalScore?: number | null;
  comment?: string | null;
}

export const scoresApi = {
  getScores: (query?: ScoresQuery) => {
    const params = new URLSearchParams();
    if (query?.classId != null) params.set('classId', String(query.classId));
    if (query?.studentId != null) params.set('studentId', String(query.studentId));
    const qs = params.toString();
    return http.get<Score[]>(`/scores${qs ? `?${qs}` : ''}`);
  },
  getScore: (id: number) => http.get<Score>(`/scores/${id}`),
  createScore: (payload: ScorePayload) => http.post<Score>('/scores', payload),
  updateScore: (id: number, payload: Omit<ScorePayload, 'studentId' | 'classId'>) =>
    http.put<Score>(`/scores/${id}`, payload),
};
