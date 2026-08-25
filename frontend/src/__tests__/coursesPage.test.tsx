import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { AppRoutes } from '@/routes/AppRoutes';
import { authStorage } from '@/features/auth/authStorage';
import {
  buildCoursePayload,
  validateCourse,
  type CourseFormValues,
} from '@/features/courses/courseValidation';
import { coursesApi } from '@/services/api/coursesApi';
import type { CourseClass } from '@/types/courseClass';
import type { Course } from '@/types/course';
import type { User } from '@/types/user';

const validForm: CourseFormValues = {
  name: 'IELTS 6.0',
  description: '',
  tuition: '5000000',
  level: 'INTERMEDIATE',
  duration: '12',
};

describe('validateCourse (UC-09)', () => {
  it('flags an empty name with the UC-09 message', () => {
    const errors = validateCourse({ ...validForm, name: '   ' });
    expect(errors.name).toBe('Tên khóa học không được để trống');
    expect(validateCourse({ ...validForm, name: '' }).name).toBe('Tên khóa học không được để trống');
  });

  it('flags tuition that is not greater than zero', () => {
    expect(validateCourse({ ...validForm, tuition: '0' }).tuition).toBe('Học phí phải lớn hơn 0');
    expect(validateCourse({ ...validForm, tuition: '-1000' }).tuition).toBe('Học phí phải lớn hơn 0');
    expect(validateCourse({ ...validForm, tuition: '' }).tuition).toBe('Học phí phải lớn hơn 0');
    expect(validateCourse({ ...validForm, tuition: 'abc' }).tuition).toBe('Học phí phải lớn hơn 0');
  });

  it('flags an invalid level', () => {
    expect(validateCourse({ ...validForm, level: 'PRE_IELTS' }).level).toBe('Cấp độ không hợp lệ');
    expect(validateCourse({ ...validForm, level: '' }).level).toBe('Cấp độ không hợp lệ');
  });

  it('flags a duration that is not a positive integer', () => {
    expect(validateCourse({ ...validForm, duration: '0' }).duration).toBeTruthy();
    expect(validateCourse({ ...validForm, duration: '-2' }).duration).toBeTruthy();
    expect(validateCourse({ ...validForm, duration: '2.5' }).duration).toBeTruthy();
    expect(validateCourse({ ...validForm, duration: '' }).duration).toBeTruthy();
  });

  it('accepts valid input without errors and builds the API payload', () => {
    const form: CourseFormValues = { ...validForm, description: '  Luyện thi  ', name: ' IELTS 6.0 ' };
    expect(validateCourse(form)).toEqual({});
    expect(buildCoursePayload(form)).toEqual({
      name: 'IELTS 6.0',
      description: 'Luyện thi',
      tuition: 5000000,
      level: 'INTERMEDIATE',
      duration: 12,
    });
  });
});

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

describe('coursesApi', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const course: Course = {
    id: 5,
    name: 'IELTS 7.0',
    description: null,
    tuition: 6000000,
    level: 'ADVANCED',
    duration: 14,
    status: 'ACTIVE',
    createdAt: null,
    updatedAt: null,
  };

  it('getCourses sends GET /api/courses and returns the list', async () => {
    const fetchMock = jsonFetcher({ success: true, data: [course], message: 'OK' });
    vi.stubGlobal('fetch', fetchMock);

    const data = await coursesApi.getCourses();

    expect(data).toEqual([course]);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe('/api/courses');
    expect(init?.method).toBe('GET');
  });

  it('getCourse sends GET /api/courses/{id}', async () => {
    const fetchMock = jsonFetcher({ success: true, data: course, message: 'OK' });
    vi.stubGlobal('fetch', fetchMock);

    const data = await coursesApi.getCourse(5);

    expect(data).toEqual(course);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe('/api/courses/5');
    expect(init?.method).toBe('GET');
  });

  it('createCourse sends POST /api/courses with the payload', async () => {
    const fetchMock = jsonFetcher({ success: true, data: course, message: 'OK' });
    vi.stubGlobal('fetch', fetchMock);
    const payload = {
      name: 'TOEIC 600',
      description: null,
      tuition: 3500000,
      level: 'BEGINNER' as const,
      duration: 24,
      status: 'ACTIVE' as const,
    };

    await coursesApi.createCourse(payload);

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe('/api/courses');
    expect(init?.method).toBe('POST');
    expect(JSON.parse(String(init?.body))).toEqual(payload);
  });

  it('updateCourse sends PUT /api/courses/{id} with the payload', async () => {
    const fetchMock = jsonFetcher({ success: true, data: course, message: 'OK' });
    vi.stubGlobal('fetch', fetchMock);
    const payload = {
      name: 'IELTS 7.0+',
      description: null,
      tuition: 6500000,
      level: 'ADVANCED' as const,
      duration: 16,
      status: 'ACTIVE' as const,
    };

    await coursesApi.updateCourse(5, payload);

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe('/api/courses/5');
    expect(init?.method).toBe('PUT');
    expect(JSON.parse(String(init?.body))).toEqual(payload);
  });

  it('deleteCourse sends DELETE /api/courses/{id}', async () => {
    const fetchMock = vi.fn<FakeFetch>(() =>
      Promise.resolve({
        ok: true,
        status: 204,
        json: () => Promise.reject(new Error('No content')),
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await coursesApi.deleteCourse(9);

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe('/api/courses/9');
    expect(init?.method).toBe('DELETE');
    expect(init?.body).toBeUndefined();
  });
});

const baseUser: Omit<User, 'role' | 'email' | 'fullName'> = {
  id: 1,
  phone: null,
  status: 'ACTIVE',
  avatarUrl: null,
  emailVerifiedAt: null,
  lastLoginAt: null,
  createdAt: null,
  updatedAt: null,
};

const adminUser: User = {
  ...baseUser,
  role: 'ADMIN',
  email: 'admin@example.com',
  fullName: 'Quản trị viên',
};

const courseA: Course = {
  id: 1,
  name: 'IELTS 6.0',
  description: 'Luyện thi IELTS mục tiêu band 6.0',
  tuition: 5000000,
  level: 'INTERMEDIATE',
  duration: 12,
  status: 'ACTIVE',
  createdAt: null,
  updatedAt: null,
};

const courseB: Course = {
  id: 2,
  name: 'Giao tiếp A1',
  description: null,
  tuition: 4000000,
  level: 'BEGINNER',
  duration: 10,
  status: 'ACTIVE',
  createdAt: null,
  updatedAt: null,
};

const courseC: Course = {
  id: 3,
  name: 'IELTS 7.0',
  description: null,
  tuition: 6000000,
  level: 'ADVANCED',
  duration: 14,
  status: 'ACTIVE',
  createdAt: null,
  updatedAt: null,
};

function makeClass(overrides: Partial<CourseClass> & { id: number }): CourseClass {
  return {
    courseId: 1,
    courseName: 'IELTS 6.0',
    name: `Lớp ${overrides.id}`,
    teacherId: null,
    teacherName: null,
    maxCapacity: 15,
    currentHeadcount: 5,
    scheduleDay: 'MON',
    startTime: '18:00',
    endTime: '20:00',
    room: 'A101',
    startDate: '2026-09-01',
    endDate: '2026-12-15',
    status: 'STUDYING',
    createdAt: null,
    updatedAt: null,
    ...overrides,
  };
}

interface CoursesState {
  nextId: number;
  courses: Course[];
  classesByCourseId: Record<number, CourseClass[]>;
}

function makeState(): CoursesState {
  return {
    nextId: 100,
    courses: [{ ...courseA }, { ...courseB }, { ...courseC }],
    classesByCourseId: {},
  };
}

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

const noContent = (): MockResponse => ({ ok: true, status: 204, body: null });

function coursesRouter(state: CoursesState): Handler {
  return (url, method, body) => {
    if (url === '/notifications/unread/count') return success(0);
    if (url === '/courses') {
      if (method === 'GET') return success(state.courses.map((item) => ({ ...item })));
      if (method === 'POST') {
        const created: Course = {
          ...(body as Omit<Course, 'id'>),
          id: state.nextId++,
        };
        state.courses = [...state.courses, created];
        return success(created);
      }
    }
    if (url.startsWith('/courses/')) {
      const courseId = Number(url.split('/')[2]);
      const index = state.courses.findIndex((item) => item.id === courseId);
      if (method === 'GET') return index >= 0 ? success(state.courses[index]) : undefined;
      if (method === 'PUT') {
        if (index < 0) return undefined;
        state.courses[index] = { ...state.courses[index], ...(body as Partial<Course>) };
        return success(state.courses[index]);
      }
      if (method === 'DELETE') {
        state.courses = state.courses.filter((item) => item.id !== courseId);
        return noContent();
      }
    }
    if (url.startsWith('/classes')) {
      const params = new URLSearchParams(url.split('?')[1] ?? '');
      const courseId = Number(params.get('courseId'));
      return success(state.classesByCourseId[courseId] ?? []);
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

describe('CoursesPage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the course list with level, tuition and duration columns', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(coursesRouter(makeState())));

    renderApp('/admin/courses');

    expect(await screen.findByText('IELTS 6.0')).toBeTruthy();
    const firstRow = screen.getByText('IELTS 6.0').closest('tr');
    expect(firstRow).not.toBeNull();
    expect(within(firstRow as HTMLElement).getByText('Trung cấp')).toBeTruthy();
    expect(within(firstRow as HTMLElement).getByText('5.000.000 ₫')).toBeTruthy();
    expect(within(firstRow as HTMLElement).getByText('12 buổi')).toBeTruthy();
    expect(screen.getAllByText('Đang mở').length).toBeGreaterThanOrEqual(1);
  });

  it('shows an empty state when there are no courses', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    const state = makeState();
    state.courses = [];
    vi.stubGlobal('fetch', createFetchMock(coursesRouter(state)));

    renderApp('/admin/courses');

    expect(await screen.findByText('Chưa có khóa học nào')).toBeTruthy();
  });

  it('shows an error state and refetches when retrying', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ success: false, message: 'Internal server error' }),
        }),
      ),
    );

    renderApp('/admin/courses');

    expect(await screen.findByText('Không thể tải danh sách khóa học')).toBeTruthy();

    vi.stubGlobal('fetch', createFetchMock(coursesRouter(makeState())));
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));

    expect(await screen.findByText('IELTS 6.0')).toBeTruthy();
  });

  it('filters courses by search keyword and level client-side', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(coursesRouter(makeState())));

    renderApp('/admin/courses');
    await screen.findByText('IELTS 6.0');

    fireEvent.change(screen.getByLabelText('Tìm kiếm khóa học'), {
      target: { value: 'giao tiếp' },
    });
    await waitFor(() => {
      expect(screen.queryByText('IELTS 6.0')).toBeNull();
    });
    expect(screen.getByText('Giao tiếp A1')).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Tìm kiếm khóa học'), { target: { value: '' } });
    await waitFor(() => {
      expect(screen.getByText('IELTS 6.0')).toBeTruthy();
    });

    fireEvent.change(screen.getByLabelText('Lọc theo cấp độ'), { target: { value: 'ADVANCED' } });
    await waitFor(() => {
      expect(screen.queryByText('Giao tiếp A1')).toBeNull();
    });
    expect(screen.getByText('IELTS 7.0')).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Tìm kiếm khóa học'), {
      target: { value: 'không có thật' },
    });
    expect(await screen.findByText('Không tìm thấy khóa học phù hợp')).toBeTruthy();
  });

  it('opens the create modal from the header action', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(coursesRouter(makeState())));

    renderApp('/admin/courses');
    await screen.findByText('IELTS 6.0');

    fireEvent.click(screen.getByRole('button', { name: 'Thêm khóa học' }));

    const dialog = await screen.findByRole('dialog', { name: 'Thêm khóa học' });
    expect(within(dialog).getByLabelText('Tên khóa học')).toBeTruthy();
    expect(within(dialog).getByLabelText('Học phí (VNĐ)')).toBeTruthy();
    expect(within(dialog).getByLabelText('Cấp độ')).toBeTruthy();
    expect(within(dialog).getByLabelText('Thời lượng (số buổi)')).toBeTruthy();
  });

  it('shows validation errors and does not call POST when the form is empty', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    const fetchMock = createFetchMock(coursesRouter(makeState()));
    vi.stubGlobal('fetch', fetchMock);

    renderApp('/admin/courses');
    await screen.findByText('IELTS 6.0');

    fireEvent.click(screen.getByRole('button', { name: 'Thêm khóa học' }));
    const dialog = await screen.findByRole('dialog', { name: 'Thêm khóa học' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Tạo khóa học' }));

    expect(await screen.findByText('Tên khóa học không được để trống')).toBeTruthy();
    expect(screen.getByText('Học phí phải lớn hơn 0')).toBeTruthy();
    expect(screen.getByText('Cấp độ không hợp lệ')).toBeTruthy();
    expect(screen.getByText('Thời lượng phải là số nguyên dương')).toBeTruthy();

    const postCalls = fetchMock.mock.calls.filter(([, init]) => init?.method === 'POST');
    expect(postCalls.length).toBe(0);
  });

  it('creates a course with the correct payload and reloads the list', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    const fetchMock = createFetchMock(coursesRouter(makeState()));
    vi.stubGlobal('fetch', fetchMock);

    renderApp('/admin/courses');
    await screen.findByText('IELTS 6.0');

    fireEvent.click(screen.getByRole('button', { name: 'Thêm khóa học' }));
    const dialog = await screen.findByRole('dialog', { name: 'Thêm khóa học' });
    fireEvent.change(within(dialog).getByLabelText('Tên khóa học'), {
      target: { value: 'TOEIC 600' },
    });
    fireEvent.change(within(dialog).getByLabelText('Học phí (VNĐ)'), {
      target: { value: '3500000' },
    });
    fireEvent.change(within(dialog).getByLabelText('Cấp độ'), {
      target: { value: 'BEGINNER' },
    });
    fireEvent.change(within(dialog).getByLabelText('Thời lượng (số buổi)'), {
      target: { value: '24' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Tạo khóa học' }));

    await waitFor(() => {
      const postCalls = fetchMock.mock.calls.filter(([, init]) => init?.method === 'POST');
      expect(postCalls.length).toBe(1);
    });
    const [, postInit] = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST')!;
    expect(String(fetchMock.mock.calls.find(([, init]) => init?.method === 'POST')![0])).toBe(
      '/api/courses',
    );
    expect(JSON.parse(String(postInit?.body))).toEqual({
      name: 'TOEIC 600',
      description: null,
      tuition: 3500000,
      level: 'BEGINNER',
      duration: 24,
      status: 'ACTIVE',
    });

    expect(await screen.findByText('TOEIC 600')).toBeTruthy();
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Thêm khóa học' })).toBeNull();
    });
  });

  it('pre-fills the edit modal and updates via PUT', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    const fetchMock = createFetchMock(coursesRouter(makeState()));
    vi.stubGlobal('fetch', fetchMock);

    renderApp('/admin/courses');
    await screen.findByText('IELTS 6.0');

    fireEvent.click(screen.getByRole('button', { name: 'Sửa IELTS 6.0' }));
    const dialog = await screen.findByRole('dialog', { name: 'Cập nhật khóa học' });

    const nameInput = within(dialog).getByLabelText('Tên khóa học') as HTMLInputElement;
    expect(nameInput.value).toBe('IELTS 6.0');
    const tuitionInput = within(dialog).getByLabelText('Học phí (VNĐ)') as HTMLInputElement;
    expect(tuitionInput.value).toBe('5000000');
    const levelSelect = within(dialog).getByLabelText('Cấp độ') as HTMLSelectElement;
    expect(levelSelect.value).toBe('INTERMEDIATE');
    const durationInput = within(dialog).getByLabelText('Thời lượng (số buổi)') as HTMLInputElement;
    expect(durationInput.value).toBe('12');

    fireEvent.change(nameInput, { target: { value: 'IELTS 6.5' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Lưu thay đổi' }));

    await waitFor(() => {
      const putCalls = fetchMock.mock.calls.filter(([, init]) => init?.method === 'PUT');
      expect(putCalls.length).toBe(1);
    });
    const [putUrl, putInit] = fetchMock.mock.calls.find(([, init]) => init?.method === 'PUT')!;
    expect(String(putUrl)).toBe('/api/courses/1');
    expect(JSON.parse(String(putInit?.body))).toEqual({
      name: 'IELTS 6.5',
      description: 'Luyện thi IELTS mục tiêu band 6.0',
      tuition: 5000000,
      level: 'INTERMEDIATE',
      duration: 12,
      status: 'ACTIVE',
    });

    expect(await screen.findByText('IELTS 6.5')).toBeTruthy();
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Cập nhật khóa học' })).toBeNull();
    });
  });

  it('checks active classes then deletes a course after confirmation', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    const state = makeState();
    state.classesByCourseId[1] = [
      makeClass({
        id: 11,
        courseId: 1,
        courseName: 'IELTS 6.0',
        name: 'IELTS 6.0-01',
        status: 'FINISHED',
      }),
    ];
    const fetchMock = createFetchMock(coursesRouter(state));
    vi.stubGlobal('fetch', fetchMock);

    renderApp('/admin/courses');
    await screen.findByText('IELTS 6.0');

    fireEvent.click(screen.getByRole('button', { name: 'Xóa IELTS 6.0' }));
    expect(await screen.findByText('Xóa khóa học?')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận xóa' }));

    await waitFor(() => {
      const deleteIndex = fetchMock.mock.calls.findIndex(([, init]) => init?.method === 'DELETE');
      expect(deleteIndex).toBeGreaterThanOrEqual(0);
    });
    const classesGetIndex = fetchMock.mock.calls.findIndex(([input]) =>
      String(input).includes('/classes?courseId=1'),
    );
    const deleteIndex = fetchMock.mock.calls.findIndex(([, init]) => init?.method === 'DELETE');
    expect(classesGetIndex).toBeGreaterThanOrEqual(0);
    expect(deleteIndex).toBeGreaterThan(classesGetIndex);
    const [deleteUrl] = fetchMock.mock.calls.find(([, init]) => init?.method === 'DELETE')!;
    expect(String(deleteUrl)).toBe('/api/courses/1');

    await waitFor(() => {
      expect(screen.queryByText('Xóa khóa học?')).toBeNull();
    });
    await waitFor(() => {
      expect(screen.queryByText('IELTS 6.0')).toBeNull();
    });
  });

  it('blocks deletion when the course has an UPCOMING class', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    const state = makeState();
    state.classesByCourseId[2] = [
      makeClass({
        id: 21,
        courseId: 2,
        courseName: 'Giao tiếp A1',
        name: 'Giao tiếp A1-01',
        status: 'UPCOMING',
      }),
    ];
    const fetchMock = createFetchMock(coursesRouter(state));
    vi.stubGlobal('fetch', fetchMock);

    renderApp('/admin/courses');
    await screen.findByText('Giao tiếp A1');

    fireEvent.click(screen.getByRole('button', { name: 'Xóa Giao tiếp A1' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Xác nhận xóa' }));

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('Không thể xóa khóa học vì đang có lớp học hoạt động');
    expect(alert.textContent).toContain('Giao tiếp A1-01');
    expect(screen.getByText('Xóa khóa học?')).toBeTruthy();
    const deleteCalls = fetchMock.mock.calls.filter(([, init]) => init?.method === 'DELETE');
    expect(deleteCalls.length).toBe(0);
  });

  it('blocks deletion when the course has a STUDYING class', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    const state = makeState();
    state.classesByCourseId[3] = [
      makeClass({
        id: 31,
        courseId: 3,
        courseName: 'IELTS 7.0',
        name: 'IELTS 7.0-01',
        status: 'STUDYING',
      }),
    ];
    const fetchMock = createFetchMock(coursesRouter(state));
    vi.stubGlobal('fetch', fetchMock);

    renderApp('/admin/courses');
    await screen.findByText('IELTS 7.0');

    fireEvent.click(screen.getByRole('button', { name: 'Xóa IELTS 7.0' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Xác nhận xóa' }));

    expect(await screen.findByRole('alert')).toBeTruthy();
    const deleteCalls = fetchMock.mock.calls.filter(([, init]) => init?.method === 'DELETE');
    expect(deleteCalls.length).toBe(0);
    expect(screen.getByText('IELTS 7.0')).toBeTruthy();
  });

  it('renders CoursesPage for /admin/courses instead of PlaceholderPage', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(coursesRouter(makeState())));

    renderApp('/admin/courses');

    expect(await screen.findByText('Quản lý danh mục khóa học của trung tâm.')).toBeTruthy();
    expect(await screen.findByText('IELTS 6.0')).toBeTruthy();
    expect(screen.queryByText('Chức năng sẽ được triển khai ở các bước tiếp theo.')).toBeNull();
    expect(screen.queryByText('Khóa học chưa sẵn sàng')).toBeNull();
  });
});
