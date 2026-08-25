import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { AppRoutes } from '@/routes/AppRoutes';
import { authStorage } from '@/features/auth/authStorage';
import {
  validateScoreField,
  validateScoreForm,
  toScorePayload,
  type ScoreEditForm,
} from '@/features/scores/scoreValidation';
import { scoresApi } from '@/services/api/scoresApi';
import type { Score } from '@/types/score';
import type { User } from '@/types/user';
import type { CourseClass } from '@/types/courseClass';
import type { Registration } from '@/types/registration';

/* ───────── helpers ───────── */

const teacherUser: User = {
  id: 2,
  role: 'TEACHER',
  email: 'teacher1@example.com',
  fullName: 'Cô Hà',
  phone: null,
  status: 'ACTIVE',
  avatarUrl: null,
  emailVerifiedAt: null,
  lastLoginAt: null,
  createdAt: null,
  updatedAt: null,
};

const studyingClass: CourseClass = {
  id: 1,
  courseId: 10,
  courseName: 'IELTS 6.0',
  name: 'Intermediate A',
  teacherId: 2,
  teacherName: 'Cô Hà',
  maxCapacity: 12,
  currentHeadcount: 3,
  scheduleDay: 'WED',
  startTime: '18:00',
  endTime: '20:30',
  room: 'A201',
  startDate: '2026-08-01',
  endDate: '2026-11-30',
  status: 'STUDYING',
  createdAt: null,
  updatedAt: null,
};

const upcomingClass: CourseClass = {
  ...studyingClass,
  id: 2,
  name: 'Beginner A',
  courseName: 'English Foundation',
  status: 'UPCOMING',
  startDate: '2026-10-01',
  endDate: '2027-01-31',
};

const cancelledClass: CourseClass = {
  ...studyingClass,
  id: 3,
  name: 'Advanced A',
  courseName: 'IELTS 7.0+',
  status: 'CANCELLED',
};

const registrationA: Registration = {
  id: 1,
  studentId: 10,
  studentName: 'Nguyễn An',
  classId: 1,
  className: 'Intermediate A',
  courseName: 'IELTS 6.0',
  status: 'APPROVED',
  tuitionAtRegistration: 5000000,
  registeredAt: null,
  createdAt: null,
  updatedAt: null,
};

const registrationB: Registration = {
  id: 2,
  studentId: 11,
  studentName: 'Trần Bình',
  classId: 1,
  className: 'Intermediate A',
  courseName: 'IELTS 6.0',
  status: 'PAID',
  tuitionAtRegistration: 5000000,
  registeredAt: null,
  createdAt: null,
  updatedAt: null,
};

const registrationC: Registration = {
  id: 3,
  studentId: 12,
  studentName: 'Lê Cúc',
  classId: 1,
  className: 'Intermediate A',
  courseName: 'IELTS 6.0',
  status: 'APPROVED',
  tuitionAtRegistration: 5000000,
  registeredAt: null,
  createdAt: null,
  updatedAt: null,
};

const scoreA: Score = {
  id: 100,
  studentId: 10,
  studentName: 'Nguyễn An',
  classId: 1,
  className: 'Intermediate A',
  courseName: 'IELTS 6.0',
  midtermScore: 8.0,
  finalScore: 7.0,
  totalScore: 7.4,
  comment: 'Good',
  createdById: 2,
  createdByName: 'Cô Hà',
  createdAt: null,
  updatedAt: null,
};

const scoreB: Score = {
  id: 101,
  studentId: 11,
  studentName: 'Trần Bình',
  classId: 1,
  className: 'Intermediate A',
  courseName: 'IELTS 6.0',
  midtermScore: 3.0,
  finalScore: 4.0,
  totalScore: 3.6,
  comment: null,
  createdById: 2,
  createdByName: 'Cô Hà',
  createdAt: null,
  updatedAt: null,
};

const emptyForm: ScoreEditForm = { midtermScore: '', finalScore: '', comment: '' };

/* ───────── unit tests: validation ───────── */

describe('validateScoreField (UC-17/UC-19)', () => {
  it('accepts empty string as valid (optional field)', () => {
    expect(validateScoreField('')).toBeUndefined();
  });

  it('accepts whitespace-only as valid', () => {
    expect(validateScoreField('   ')).toBeUndefined();
  });

  it('accepts integer values from 0 to 10', () => {
    expect(validateScoreField('0')).toBeUndefined();
    expect(validateScoreField('5')).toBeUndefined();
    expect(validateScoreField('10')).toBeUndefined();
  });

  it('accepts decimal values with one decimal place (0.0 – 10.0)', () => {
    expect(validateScoreField('0.0')).toBeUndefined();
    expect(validateScoreField('7.5')).toBeUndefined();
    expect(validateScoreField('10.0')).toBeUndefined();
  });

  it('rejects negative numbers', () => {
    expect(validateScoreField('-1')).toBe('Điểm phải từ 0 đến 10');
    expect(validateScoreField('-0.5')).toBe('Điểm phải từ 0 đến 10');
  });

  it('rejects numbers greater than 10', () => {
    expect(validateScoreField('11')).toBe('Điểm phải từ 0 đến 10');
    expect(validateScoreField('10.5')).toBe('Điểm phải từ 0 đến 10');
  });

  it('rejects more than one decimal place', () => {
    expect(validateScoreField('7.55')).toBe('Điểm phải từ 0 đến 10');
    expect(validateScoreField('0.00')).toBe('Điểm phải từ 0 đến 10');
  });

  it('rejects non-numeric input', () => {
    expect(validateScoreField('abc')).toBe('Điểm phải từ 0 đến 10');
    expect(validateScoreField('NaN')).toBe('Điểm phải từ 0 đến 10');
  });
});

describe('validateScoreForm (UC-17/UC-19)', () => {
  it('returns no errors when both scores are empty (comment-only)', () => {
    expect(validateScoreForm(emptyForm)).toEqual({});
  });

  it('returns midtermScore error when midterm is invalid', () => {
    const errors = validateScoreForm({ ...emptyForm, midtermScore: '11' });
    expect(errors.midtermScore).toBe('Điểm phải từ 0 đến 10');
    expect(errors.finalScore).toBeUndefined();
  });

  it('returns finalScore error when final is invalid', () => {
    const errors = validateScoreForm({ ...emptyForm, finalScore: '-5' });
    expect(errors.midtermScore).toBeUndefined();
    expect(errors.finalScore).toBe('Điểm phải từ 0 đến 10');
  });

  it('returns both errors when both scores are invalid', () => {
    const errors = validateScoreForm({ midtermScore: 'abc', finalScore: '99', comment: '' });
    expect(errors.midtermScore).toBeTruthy();
    expect(errors.finalScore).toBeTruthy();
  });
});

describe('toScorePayload (UC-17/UC-19)', () => {
  it('converts empty strings to nulls', () => {
    expect(toScorePayload(emptyForm)).toEqual({
      midtermScore: null,
      finalScore: null,
      comment: null,
    });
  });

  it('converts valid score strings to numbers and trims comment', () => {
    expect(
      toScorePayload({ midtermScore: '8.0', finalScore: '7', comment: '  Tốt  ' }),
    ).toEqual({
      midtermScore: 8,
      finalScore: 7,
      comment: 'Tốt',
    });
  });

  it('keeps empty comment as null', () => {
    expect(toScorePayload({ midtermScore: '5', finalScore: '6', comment: '   ' })).toEqual({
      midtermScore: 5,
      finalScore: 6,
      comment: null,
    });
  });
});

/* ───────── unit tests: scoresApi ───────── */

interface FakeResponse {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
}

type FakeFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<FakeResponse>;

function jsonFetcher(body: unknown, ok = true, status = 200) {
  return vi.fn<FakeFetch>(() =>
    Promise.resolve({ ok, status, json: () => Promise.resolve(body) }),
  );
}

describe('scoresApi', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('getScores sends GET /api/scores with classId', async () => {
    const fetchMock = jsonFetcher({ success: true, data: [scoreA], message: 'OK' });
    vi.stubGlobal('fetch', fetchMock);

    const data = await scoresApi.getScores({ classId: 1 });

    expect(data).toEqual([scoreA]);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe('/api/scores?classId=1');
    expect(init?.method).toBe('GET');
  });

  it('createScore sends POST /api/scores with the payload', async () => {
    const fetchMock = jsonFetcher({ success: true, data: scoreA, message: 'OK' });
    vi.stubGlobal('fetch', fetchMock);
    const payload = { studentId: 10, classId: 1, midtermScore: 8.0, finalScore: 7.0, comment: 'Good' };

    await scoresApi.createScore(payload);

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe('/api/scores');
    expect(init?.method).toBe('POST');
    expect(JSON.parse(String(init?.body))).toEqual(payload);
  });

  it('updateScore sends PUT /api/scores/{id} with the payload', async () => {
    const fetchMock = jsonFetcher({ success: true, data: scoreA, message: 'OK' });
    vi.stubGlobal('fetch', fetchMock);
    const payload = { midtermScore: 9.0, finalScore: 8.0, comment: 'Excellent' };

    await scoresApi.updateScore(100, payload);

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe('/api/scores/100');
    expect(init?.method).toBe('PUT');
    expect(JSON.parse(String(init?.body))).toEqual(payload);
  });
});

/* ───────── mock fetch helpers ───────── */

interface MockResponse {
  ok: boolean;
  status: number;
  body: unknown;
}

type Handler = (url: string, method: string, body: unknown) => MockResponse | undefined;

function createFetchMock(handler: Handler) {
  return vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input).replace('/api', '');
    const method = init?.method ?? 'GET';
    let requestBody: unknown;
    if (typeof init?.body === 'string') {
      try {
        requestBody = JSON.parse(init.body);
      } catch {
        requestBody = init.body;
      }
    }
    const result = handler(url, method, requestBody);
    if (!result) {
      return Promise.resolve({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ success: false, message: 'Not found' }),
      });
    }
    return Promise.resolve({
      ok: result.ok,
      status: result.status,
      json: () =>
        result.status === 204
          ? Promise.reject(new Error('No content'))
          : Promise.resolve(result.body),
    });
  });
}

const success = (data: unknown): MockResponse => ({
  ok: true,
  status: 200,
  body: { success: true, data, message: 'OK' },
});

/* ───────── teacher scores router ───────── */

interface ScoresRouterState {
  classes: CourseClass[];
  registrations: Registration[];
  scores: Score[];
  nextScoreId: number;
}

function teacherScoresRouter(state: ScoresRouterState): Handler {
  return (url, method, body) => {
    if (url === '/notifications/unread/count') return success(0);

    if (url.startsWith('/classes')) {
      const params = new URLSearchParams(url.split('?')[1] ?? '');
      const teacherId = Number(params.get('teacherId'));
      return success(state.classes.filter((c) => c.teacherId === teacherId));
    }

    if (url.startsWith('/registrations')) {
      const params = new URLSearchParams(url.split('?')[1] ?? '');
      const classId = Number(params.get('classId'));
      return success(state.registrations.filter((r) => r.classId === classId));
    }

    if (url.startsWith('/scores') && method === 'GET') {
      const params = new URLSearchParams(url.split('?')[1] ?? '');
      const classId = Number(params.get('classId'));
      return success(state.scores.filter((s) => s.classId === classId));
    }

    if (url === '/scores' && method === 'POST') {
      const payload = body as { studentId: number; classId: number; midtermScore: number | null; finalScore: number | null; comment: string | null };
      const created: Score = {
        id: state.nextScoreId++,
        studentId: payload.studentId,
        studentName: '',
        classId: payload.classId,
        className: '',
        courseName: '',
        midtermScore: payload.midtermScore,
        finalScore: payload.finalScore,
        totalScore:
          payload.midtermScore != null && payload.finalScore != null
            ? Math.round((payload.midtermScore * 0.4 + payload.finalScore * 0.6) * 10) / 10
            : null,
        comment: payload.comment,
        createdById: 2,
        createdByName: 'Cô Hà',
        createdAt: null,
        updatedAt: null,
      };
      state.scores = [...state.scores, created];
      return success(created);
    }

    if (url.startsWith('/scores/') && method === 'PUT') {
      const id = Number(url.split('/')[2]);
      const index = state.scores.findIndex((s) => s.id === id);
      if (index < 0) return undefined;
      const payload = body as { midtermScore: number | null; finalScore: number | null; comment: string | null };
      const updated: Score = {
        ...state.scores[index],
        midtermScore: payload.midtermScore,
        finalScore: payload.finalScore,
        totalScore:
          payload.midtermScore != null && payload.finalScore != null
            ? Math.round((payload.midtermScore * 0.4 + payload.finalScore * 0.6) * 10) / 10
            : null,
        comment: payload.comment,
      };
      state.scores[index] = updated;
      return success(updated);
    }

    return undefined;
  };
}

function renderApp(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </MemoryRouter>,
  );
}

function makeState(): ScoresRouterState {
  return {
    classes: [
      { ...studyingClass },
      { ...upcomingClass },
      { ...cancelledClass },
    ],
    registrations: [registrationA, registrationB, registrationC],
    scores: [{ ...scoreA }, { ...scoreB }],
    nextScoreId: 200,
  };
}

/* ───────── integration tests: TeacherScoresPage ───────── */

describe('TeacherScoresPage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('auto-selects first class and renders the score table', async () => {
    authStorage.setSession('jwt.teacher', teacherUser);
    vi.stubGlobal('fetch', createFetchMock(teacherScoresRouter(makeState())));

    renderApp('/teacher/scores');

    expect(await screen.findByText('Nguyễn An')).toBeTruthy();
    expect(screen.getByText('Trần Bình')).toBeTruthy();
    expect(screen.getByText('Lê Cúc')).toBeTruthy();
  });

  it('shows formatted scores with correct decimal display', async () => {
    authStorage.setSession('jwt.teacher', teacherUser);
    vi.stubGlobal('fetch', createFetchMock(teacherScoresRouter(makeState())));

    renderApp('/teacher/scores');
    expect(await screen.findByText('Nguyễn An')).toBeTruthy();

    expect(screen.getByText('8.0')).toBeTruthy();
    expect(screen.getByText('7.0')).toBeTruthy();
    expect(screen.getByText('7.4')).toBeTruthy();
  });

  it('shows "Đạt" badge for totalScore >= 5.0', async () => {
    authStorage.setSession('jwt.teacher', teacherUser);
    vi.stubGlobal('fetch', createFetchMock(teacherScoresRouter(makeState())));

    renderApp('/teacher/scores');
    expect(await screen.findByText('Nguyễn An')).toBeTruthy();

    const badges = screen.getAllByText('Đạt');
    expect(badges.length).toBeGreaterThanOrEqual(1);
  });

  it('shows "Không đạt" badge for totalScore < 5.0', async () => {
    authStorage.setSession('jwt.teacher', teacherUser);
    vi.stubGlobal('fetch', createFetchMock(teacherScoresRouter(makeState())));

    renderApp('/teacher/scores');
    expect(await screen.findByText('Trần Bình')).toBeTruthy();

    const badges = screen.getAllByText('Không đạt');
    expect(badges.length).toBeGreaterThanOrEqual(1);
  });

  it('shows "—" for students with no score', async () => {
    authStorage.setSession('jwt.teacher', teacherUser);
    vi.stubGlobal('fetch', createFetchMock(teacherScoresRouter(makeState())));

    renderApp('/teacher/scores');
    expect(await screen.findByText('Lê Cúc')).toBeTruthy();

    const dashCells = screen.getAllByText('—');
    expect(dashCells.length).toBeGreaterThanOrEqual(3);
  });

  it('shows "Nhập" button for students without a score', async () => {
    authStorage.setSession('jwt.teacher', teacherUser);
    vi.stubGlobal('fetch', createFetchMock(teacherScoresRouter(makeState())));

    renderApp('/teacher/scores');
    expect(await screen.findByText('Lê Cúc')).toBeTruthy();

    const row = screen.getByText('Lê Cúc').closest('tr');
    expect(within(row as HTMLElement).getByText('Nhập')).toBeTruthy();
  });

  it('shows "Sửa" button for students with an existing score', async () => {
    authStorage.setSession('jwt.teacher', teacherUser);
    vi.stubGlobal('fetch', createFetchMock(teacherScoresRouter(makeState())));

    renderApp('/teacher/scores');
    expect(await screen.findByText('Nguyễn An')).toBeTruthy();

    const row = screen.getByText('Nguyễn An').closest('tr');
    expect(within(row as HTMLElement).getByText('Sửa')).toBeTruthy();
  });

  it('shows guard banner for UPCOMING class and hides action buttons', async () => {
    authStorage.setSession('jwt.teacher', teacherUser);
    const state = makeState();
    state.classes = [{ ...upcomingClass }];
    state.registrations = [];
    state.scores = [];
    vi.stubGlobal('fetch', createFetchMock(teacherScoresRouter(state)));

    renderApp('/teacher/scores');

    expect(await screen.findByText(/Lớp học chưa bắt đầu/)).toBeTruthy();
    expect(screen.queryByText('Nhập')).toBeNull();
    expect(screen.queryByText('Sửa')).toBeNull();
  });

  it('shows guard banner for CANCELLED class', async () => {
    authStorage.setSession('jwt.teacher', teacherUser);
    const state = makeState();
    state.classes = [{ ...cancelledClass }];
    state.registrations = [];
    state.scores = [];
    vi.stubGlobal('fetch', createFetchMock(teacherScoresRouter(state)));

    renderApp('/teacher/scores');

    expect(await screen.findByText(/Lớp học đã bị hủy/)).toBeTruthy();
  });

  it('enters edit mode when clicking "Nhập" and shows inputs', async () => {
    authStorage.setSession('jwt.teacher', teacherUser);
    vi.stubGlobal('fetch', createFetchMock(teacherScoresRouter(makeState())));

    renderApp('/teacher/scores');
    expect(await screen.findByText('Lê Cúc')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Nhập điểm Lê Cúc' }));

    expect(screen.getByLabelText('Điểm giữa kỳ')).toBeTruthy();
    expect(screen.getByLabelText('Điểm cuối kỳ')).toBeTruthy();
    expect(screen.getByLabelText('Nhận xét')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Lưu' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Hủy' })).toBeTruthy();
  });

  it('enters edit mode when clicking "Sửa" and pre-fills existing scores', async () => {
    authStorage.setSession('jwt.teacher', teacherUser);
    vi.stubGlobal('fetch', createFetchMock(teacherScoresRouter(makeState())));

    renderApp('/teacher/scores');
    expect(await screen.findByText('Nguyễn An')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Sửa điểm Nguyễn An' }));

    const midtermInput = screen.getByLabelText('Điểm giữa kỳ') as HTMLInputElement;
    const finalInput = screen.getByLabelText('Điểm cuối kỳ') as HTMLInputElement;
    const commentInput = screen.getByLabelText('Nhận xét') as HTMLInputElement;

    expect(midtermInput.value).toBe('8');
    expect(finalInput.value).toBe('7');
    expect(commentInput.value).toBe('Good');
  });

  it('shows validation error when saving with invalid score', async () => {
    authStorage.setSession('jwt.teacher', teacherUser);
    vi.stubGlobal('fetch', createFetchMock(teacherScoresRouter(makeState())));

    renderApp('/teacher/scores');
    expect(await screen.findByText('Lê Cúc')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Nhập điểm Lê Cúc' }));
    fireEvent.change(screen.getByLabelText('Điểm giữa kỳ'), { target: { value: '11' } });
    fireEvent.click(screen.getByRole('button', { name: 'Lưu' }));

    expect(await screen.findByText('Điểm phải từ 0 đến 10')).toBeTruthy();

    const postCalls = vi.mocked(fetch).mock.calls.filter(([, init]) => init?.method === 'POST');
    expect(postCalls.length).toBe(0);
  });

  it('creates a new score via POST and reloads', async () => {
    authStorage.setSession('jwt.teacher', teacherUser);
    const state = makeState();
    const fetchMock = createFetchMock(teacherScoresRouter(state));
    vi.stubGlobal('fetch', fetchMock);

    renderApp('/teacher/scores');
    expect(await screen.findByText('Lê Cúc')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Nhập điểm Lê Cúc' }));
    fireEvent.change(screen.getByLabelText('Điểm giữa kỳ'), { target: { value: '9.0' } });
    fireEvent.change(screen.getByLabelText('Điểm cuối kỳ'), { target: { value: '8.5' } });
    fireEvent.change(screen.getByLabelText('Nhận xét'), { target: { value: 'Rất tốt' } });
    fireEvent.click(screen.getByRole('button', { name: 'Lưu' }));

    await waitFor(() => {
      const postCalls = fetchMock.mock.calls.filter(([, init]) => init?.method === 'POST');
      expect(postCalls.length).toBe(1);
    });

    const [, postInit] = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST')!;
    const body = JSON.parse(String(postInit?.body));
    expect(body.studentId).toBe(12);
    expect(body.classId).toBe(1);
    expect(body.midtermScore).toBe(9);
    expect(body.finalScore).toBe(8.5);
    expect(body.comment).toBe('Rất tốt');

    expect(await screen.findByText('Lê Cúc')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Lưu' })).toBeNull();
  });

  it('updates an existing score via PUT and reloads', async () => {
    authStorage.setSession('jwt.teacher', teacherUser);
    const state = makeState();
    const fetchMock = createFetchMock(teacherScoresRouter(state));
    vi.stubGlobal('fetch', fetchMock);

    renderApp('/teacher/scores');
    expect(await screen.findByText('Nguyễn An')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Sửa điểm Nguyễn An' }));
    fireEvent.change(screen.getByLabelText('Điểm giữa kỳ'), { target: { value: '9.5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Lưu' }));

    await waitFor(() => {
      const putCalls = fetchMock.mock.calls.filter(([, init]) => init?.method === 'PUT');
      expect(putCalls.length).toBe(1);
    });

    const [putUrl, putInit] = fetchMock.mock.calls.find(([, init]) => init?.method === 'PUT')!;
    expect(String(putUrl)).toBe('/api/scores/100');
    expect(JSON.parse(String(putInit?.body))).toEqual({
      midtermScore: 9.5,
      finalScore: 7,
      comment: 'Good',
    });

    expect(await screen.findByText('9.5')).toBeTruthy();
  });

  it('cancel edit restores original values and makes no API call', async () => {
    authStorage.setSession('jwt.teacher', teacherUser);
    const fetchMock = createFetchMock(teacherScoresRouter(makeState()));
    vi.stubGlobal('fetch', fetchMock);

    renderApp('/teacher/scores');
    expect(await screen.findByText('Nguyễn An')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Sửa điểm Nguyễn An' }));
    fireEvent.change(screen.getByLabelText('Điểm giữa kỳ'), { target: { value: '1.0' } });
    fireEvent.click(screen.getByRole('button', { name: 'Hủy' }));

    expect(screen.queryByRole('button', { name: 'Lưu' })).toBeNull();
    expect(screen.getByText('8.0')).toBeTruthy();

    const putCalls = fetchMock.mock.calls.filter(([, init]) => init?.method === 'PUT');
    expect(putCalls.length).toBe(0);
  });

  it('shows empty state when teacher has no classes', async () => {
    authStorage.setSession('jwt.teacher', teacherUser);
    const state = makeState();
    state.classes = [];
    vi.stubGlobal('fetch', createFetchMock(teacherScoresRouter(state)));

    renderApp('/teacher/scores');

    expect(await screen.findByText('Chưa có lớp học nào được phân công')).toBeTruthy();
  });

  it('shows empty state when class has no enrolled students', async () => {
    authStorage.setSession('jwt.teacher', teacherUser);
    const state = makeState();
    state.registrations = [];
    state.scores = [];
    vi.stubGlobal('fetch', createFetchMock(teacherScoresRouter(state)));

    renderApp('/teacher/scores');

    expect(await screen.findByText('Lớp chưa có học viên')).toBeTruthy();
  });

  it('switches class data when selecting a different class', async () => {
    authStorage.setSession('jwt.teacher', teacherUser);
    const state = makeState();
    vi.stubGlobal('fetch', createFetchMock(teacherScoresRouter(state)));

    renderApp('/teacher/scores');
    expect(await screen.findByText('Nguyễn An')).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Chọn lớp học'), {
      target: { value: String(upcomingClass.id) },
    });

    await waitFor(() => {
      expect(screen.queryByText('Nguyễn An')).toBeNull();
    });
    expect((screen.getByLabelText('Chọn lớp học') as HTMLSelectElement).value).toBe(
      String(upcomingClass.id),
    );
  });

  it('shows error state when classes fail to load and retries', async () => {
    authStorage.setSession('jwt.teacher', teacherUser);
    const state = makeState();
    let classFetched = false;
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input).replace('/api', '');
        const method = init?.method ?? 'GET';

        if (url === '/notifications/unread/count') {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ success: true, data: 0, message: 'OK' }),
          });
        }

        if (url.startsWith('/classes') && !classFetched) {
          classFetched = true;
          return Promise.resolve({
            ok: false,
            status: 500,
            json: () => Promise.resolve({ success: false, message: 'Server error' }),
          });
        }

        const body = { success: true, data: null as unknown, message: 'OK' };

        if (url.startsWith('/classes')) {
          body.data = state.classes.filter((c) => c.teacherId === 2);
        } else if (url.startsWith('/registrations')) {
          const params = new URLSearchParams(url.split('?')[1] ?? '');
          const classId = Number(params.get('classId'));
          body.data = state.registrations.filter((r) => r.classId === classId);
        } else if (url.startsWith('/scores') && method === 'GET') {
          const params = new URLSearchParams(url.split('?')[1] ?? '');
          const classId = Number(params.get('classId'));
          body.data = state.scores.filter((s) => s.classId === classId);
        } else {
          return Promise.resolve({
            ok: false,
            status: 404,
            json: () => Promise.resolve({ success: false, message: 'Not found' }),
          });
        }

        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(body),
        });
      }),
    );

    renderApp('/teacher/scores');

    expect(await screen.findByText('Không thể tải danh sách lớp học')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));

    expect(await screen.findByText('Nguyễn An')).toBeTruthy();
  });

  it('shows comment text in table for students with scores', async () => {
    authStorage.setSession('jwt.teacher', teacherUser);
    vi.stubGlobal('fetch', createFetchMock(teacherScoresRouter(makeState())));

    renderApp('/teacher/scores');
    expect(await screen.findByText('Nguyễn An')).toBeTruthy();

    expect(screen.getByText('Good')).toBeTruthy();
  });

  it('renders page header with correct title and description', async () => {
    authStorage.setSession('jwt.teacher', teacherUser);
    vi.stubGlobal('fetch', createFetchMock(teacherScoresRouter(makeState())));

    renderApp('/teacher/scores');

    expect(await screen.findByRole('heading', { name: 'Bảng điểm' })).toBeTruthy();
    expect(
      screen.getByText('Quản lý điểm số và nhận xét cho học viên trong lớp phụ trách.'),
    ).toBeTruthy();
  });

  it('renders TeacherScoresPage for /teacher/scores instead of PlaceholderPage', async () => {
    authStorage.setSession('jwt.teacher', teacherUser);
    vi.stubGlobal('fetch', createFetchMock(teacherScoresRouter(makeState())));

    renderApp('/teacher/scores');

    expect(await screen.findByRole('heading', { name: 'Bảng điểm' })).toBeTruthy();
    expect(screen.queryByText('Chức năng sẽ được triển khai ở các bước tiếp theo.')).toBeNull();
    expect(screen.queryByText('Tính năng chưa sẵn sàng')).toBeNull();
  });
});
