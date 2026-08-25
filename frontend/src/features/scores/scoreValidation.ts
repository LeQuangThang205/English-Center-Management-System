export interface ScoreEditForm {
  midtermScore: string;
  finalScore: string;
  comment: string;
}

export type ScoreField = 'midtermScore' | 'finalScore';

export type ScoreFieldErrors = Partial<Record<ScoreField, string>>;

export function validateScoreField(value: string): string | undefined {
  const trimmed = value.trim();
  if (trimmed === '') return undefined;
  const num = Number(trimmed);
  if (!Number.isFinite(num) || num < 0 || num > 10) {
    return 'Điểm phải từ 0 đến 10';
  }
  const parts = trimmed.split('.');
  if (parts.length === 2 && parts[1].length > 1) {
    return 'Điểm phải từ 0 đến 10';
  }
  return undefined;
}

export function validateScoreForm(form: ScoreEditForm): ScoreFieldErrors {
  const errors: ScoreFieldErrors = {};
  const midtermErr = validateScoreField(form.midtermScore);
  if (midtermErr) errors.midtermScore = midtermErr;
  const finalErr = validateScoreField(form.finalScore);
  if (finalErr) errors.finalScore = finalErr;
  return errors;
}

export function toScorePayload(form: ScoreEditForm) {
  const midterm = form.midtermScore.trim();
  const final_ = form.finalScore.trim();
  const comment = form.comment.trim();
  return {
    midtermScore: midterm !== '' ? Number(midterm) : null,
    finalScore: final_ !== '' ? Number(final_) : null,
    comment: comment !== '' ? comment : null,
  };
}
