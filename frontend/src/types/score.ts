export interface Score {
  id: number;
  studentId: number;
  studentName: string;
  classId: number;
  className: string;
  courseName: string;
  midtermScore?: number | null;
  finalScore?: number | null;
  totalScore?: number | null;
  comment?: string | null;
  createdById?: number | null;
  createdByName?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}
