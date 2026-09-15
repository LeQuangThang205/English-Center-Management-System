import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { AppRoutes } from '@/routes/AppRoutes';
import { authStorage } from '@/features/auth/authStorage';
import type { AttendanceSheet } from '@/types/attendance';
import type { CourseClass } from '@/types/courseClass';
import type { Registration } from '@/types/registration';
import type { User } from '@/types/user';

const baseUser: Omit<User, 'role' | 'email' | 'fullName'> = {
  id: 5,
  phone: null,
  status: 'ACTIVE',
  avatarUrl: null,
  emailVerifiedAt: null,
  lastLoginAt: null,
  createdAt: '2026-08-01T09:00:00',
  updatedAt: null,
};

const teacherUser: User = {
  ...baseUser,
  role: 'TEACHER',
  email: 'teacher5@example.com',
  fullName: 'Giao Vien 5',
};

function makeClass(overrides: Partial<CourseClass> & { id: number }): CourseClass {
  return {
    courseId: 1,
    courseName: 'Tieng Anh Beginner',
    name: `Lop ${overrides.id}`,
    teacherId: 5,
    teacherName: 'Giao Vien 5',
    maxCapacity: 20,
    currentHeadcount: 8,
    scheduleDay: 'MON',
    startTime: '18:00:00',
    endTime: '19:30:00',
    room: 'P101',
    startDate: '2026-09-01',
    endDate: '2026-12-01',
    status: 'STUDYING',
    createdAt: '2026-08-01T09:00:00',
    updatedAt: null,
    ...overrides,
  };
}

const studyingClass = makeClass({ id: 10, name: 'Lop Sang 01' });
const upcomingClass = makeClass({ id: 11, name: 'Lop Toi 02', status: 'UPCOMING' });

function makeRegistration(
  overrides: Partial<Registration> & { id: number; studentName: string },
): Registration {
  return {
    studentId: 100 + overrides.id,
    classId: 10,
    className: 'Lop Sang 01',
    courseName: 'Tieng Anh Beginner',
    status: 'APPROVED',
    tuitionAtRegistration: 1500000,
    registeredAt: '2026-08-10T09:00:00',
    approvedAt: null,
    approvedById: null,
    approvedByName: null,
    rejectedAt: null,
    rejectedById: null,
    rejectedByName: null,
    rejectionReason: null,
    paidAt: null,
    createdAt: '2026-08-10T09:00:00',
    updatedAt: '2026-08-10T09:00:00',
    ...overrides,
  };
}

const approvedReg = makeRegistration({ id: 1, studentName: 'Nguyen Van A', status: 'APPROVED' });
const paidReg = makeRegistration({ id: 2, studentName: 'Tran Thi B', status: 'PAID' });
const pendingReg = makeRegistration({ id: 3, studentName: 'Le Van C', status: 'PENDING' });
const rejectedReg = makeRegistration({ id: 4, studentName: 'Pham Thi D', status: 'REJECTED' });
const cancelledReg = makeRegistration({ id: 5, studentName: 'Hoang Van E', status: 'CANCELLED' });

const allRegistrations = [approvedReg, paidReg, pendingReg, rejectedReg, cancelledReg];

function makeSheet(overrides: Partial<AttendanceSheet> & { id: number }): AttendanceSheet {
  return {
    classId: 10,
    className: 'Lop Sang 01',
    courseName: 'Tieng Anh Beginner',
    date: '2026-09-15',
    createdById: 5,
    createdByName: 'Giao Vien 5',
    records: [],
    createdAt: '2026-09-15T09:00:00',
    updatedAt: '2026-09-15T09:00:00',
    ...overrides,
  };
}

const existingSheet = makeSheet({
  id: 7,
  records: [
    { id: 71, studentId: 101, studentName: 'Nguyen Van A', status: 'ABSENT' },
    { id: 72, studentId: 102, studentName: 'Tran Thi B', status: 'EXCUSED' },
  ],
});

interface MockResponse {
  ok: boolean;
  status: number;
  body: unknown;
}

interface RecordedCall {
  url: string;
  method: string;
  body: unknown;
}

function createFetchMock(
  handler: (url: string, method: string, body: unknown) => MockResponse,
  calls: RecordedCall[],
) {
  return vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input).replace('/api', '');
    const method = init?.method ?? 'GET';
    let body: unknown;
    try {
      body = init?.body ? JSON.parse(String(init.body)) : undefined;
    } catch {
      body = undefined;
    }
    calls.push({ url, method, body });
    const result = handler(url, method, body);
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

const created = (data: unknown): MockResponse => ({
  ok: true,
  status: 201,
  body: { success: true, data, message: 'Attendance sheet created successfully' },
});

const failure = (): MockResponse => ({
  ok: false,
  status: 500,
  body: { success: false, message: 'Internal server error' },
});

const badRequest = (message: string): MockResponse => ({
  ok: false,
  status: 400,
  body: { success: false, message },
});

const forbidden = (): MockResponse => ({
  ok: false,
  status: 403,
  body: { success: false, message: 'Access denied' },
});

interface RouterData {
  classes: CourseClass[];
  registrations: Registration[];
  sheets: AttendanceSheet[];
}

interface RouterOverrides {
  onCreate?: (body: unknown) => MockResponse;
  onUpdate?: (body: unknown) => MockResponse;
  onSheets?: () => MockResponse;
  onClasses?: () => MockResponse;
}

function attendanceRouter(data: RouterData, overrides?: RouterOverrides) {
  return (url: string, method: string, body: unknown): MockResponse => {
    if (url === '/notifications/unread/count') return success(0);
    if (url.startsWith('/classes') && method === 'GET') {
      if (overrides?.onClasses) return overrides.onClasses();
      return success(data.classes);
    }
    if (url.startsWith('/registrations') && method === 'GET') return success(data.registrations);
    if (url.startsWith('/attendance/sheets') && method === 'GET') {
      if (overrides?.onSheets) return overrides.onSheets();
      return success(data.sheets);
    }
    if (url === '/attendance/sheets' && method === 'POST') {
      if (overrides?.onCreate) return overrides.onCreate(body);
      const payload = body as { classId: number; date: string; records: unknown[] };
      return created({ ...makeSheet({ id: 99 }), classId: payload.classId, date: payload.date });
    }
    const match = url.match(/^\/attendance\/sheets\/(\d+)$/);
    if (match && method === 'PUT') {
      if (overrides?.onUpdate) return overrides.onUpdate(body);
      return success({ ...existingSheet, id: Number(match[1]) });
    }
    return failure();
  };
}

function renderTeacherAttendance() {
  return render(
    <MemoryRouter initialEntries={['/teacher/attendance']}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </MemoryRouter>,
  );
}

const defaultData: RouterData = {
  classes: [studyingClass, upcomingClass],
  registrations: allRegistrations,
  sheets: [],
};

describe('TeacherAttendancePage', () => {
  let calls: RecordedCall[];

  beforeEach(() => {
    localStorage.clear();
    calls = [];
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('redirects unauthenticated users to login via ProtectedRoute', async () => {
    vi.stubGlobal('fetch', createFetchMock(attendanceRouter(defaultData), calls));

    renderTeacherAttendance();

    expect(await screen.findByRole('heading', { name: 'Đăng nhập' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Điểm danh' })).toBeNull();
  });

  it('renders page header as TEACHER with stored session and fetches notification count', async () => {
    authStorage.setSession('jwt.teacher', teacherUser);
    vi.stubGlobal('fetch', createFetchMock(attendanceRouter(defaultData), calls));

    renderTeacherAttendance();

    expect(await screen.findByRole('heading', { name: 'Điểm danh' })).toBeTruthy();
    expect(await screen.findByText('Nguyen Van A')).toBeTruthy();
    await waitFor(() => {
      expect(calls.some((c) => c.url === '/notifications/unread/count')).toBe(true);
    });
  });

  it('loads assigned classes with teacherId only and no status param', async () => {
    authStorage.setSession('jwt.teacher', teacherUser);
    vi.stubGlobal('fetch', createFetchMock(attendanceRouter(defaultData), calls));

    renderTeacherAttendance();

    await screen.findByText('Nguyen Van A');
    const classCall = calls.find((c) => c.url.startsWith('/classes') && c.method === 'GET');
    expect(classCall).toBeTruthy();
    expect(classCall?.url).toContain('teacherId=5');
    expect(classCall?.url).not.toContain('status=');
  });

  it('shows only STUDYING classes in the class selector', async () => {
    authStorage.setSession('jwt.teacher', teacherUser);
    vi.stubGlobal('fetch', createFetchMock(attendanceRouter(defaultData), calls));

    renderTeacherAttendance();

    await screen.findByText('Nguyen Van A');
    const selector = within(screen.getByLabelText('Chọn lớp học'));
    expect(selector.getByRole('option', { name: 'Lop Sang 01' })).toBeTruthy();
    expect(selector.queryByRole('option', { name: 'Lop Toi 02' })).toBeNull();
  });

  it('shows empty state when teacher has no STUDYING class', async () => {
    authStorage.setSession('jwt.teacher', teacherUser);
    vi.stubGlobal(
      'fetch',
      createFetchMock(attendanceRouter({ ...defaultData, classes: [upcomingClass] }), calls),
    );

    renderTeacherAttendance();

    expect(await screen.findByText('Bạn chưa được phân công lớp đang học nào')).toBeTruthy();
  });

  it('loads registrations and sheets when class and date are selected', async () => {
    authStorage.setSession('jwt.teacher', teacherUser);
    vi.stubGlobal('fetch', createFetchMock(attendanceRouter(defaultData), calls));

    renderTeacherAttendance();

    await screen.findByText('Nguyen Van A');
    expect(
      calls.some((c) => c.url.startsWith('/registrations') && c.url.includes('classId=10')),
    ).toBe(true);
    expect(
      calls.some(
        (c) =>
          c.url.startsWith('/attendance/sheets') &&
          c.url.includes('classId=10') &&
          c.url.includes('date='),
      ),
    ).toBe(true);
  });

  it('roster shows only APPROVED and PAID students', async () => {
    authStorage.setSession('jwt.teacher', teacherUser);
    vi.stubGlobal('fetch', createFetchMock(attendanceRouter(defaultData), calls));

    renderTeacherAttendance();

    await screen.findByText('Nguyen Van A');
    expect(screen.getByText('Tran Thi B')).toBeTruthy();
    expect(screen.queryByText('Le Van C')).toBeNull();
    expect(screen.queryByText('Pham Thi D')).toBeNull();
    expect(screen.queryByText('Hoang Van E')).toBeNull();
  });

  it('shows create mode with save action when no sheet exists', async () => {
    authStorage.setSession('jwt.teacher', teacherUser);
    vi.stubGlobal('fetch', createFetchMock(attendanceRouter(defaultData), calls));

    renderTeacherAttendance();

    await screen.findByText('Nguyen Van A');
    expect(screen.getByText('Chưa điểm danh')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Lưu điểm danh' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Cập nhật điểm danh' })).toBeNull();
  });

  it('shows edit mode with existing statuses when a sheet exists', async () => {
    authStorage.setSession('jwt.teacher', teacherUser);
    vi.stubGlobal(
      'fetch',
      createFetchMock(attendanceRouter({ ...defaultData, sheets: [existingSheet] }), calls),
    );

    renderTeacherAttendance();

    await screen.findByText('Nguyen Van A');
    expect(screen.getByText('Đã điểm danh — đang sửa')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Cập nhật điểm danh' })).toBeTruthy();
    expect(
      (screen.getByLabelText('Trạng thái điểm danh của Nguyen Van A') as HTMLSelectElement).value,
    ).toBe('ABSENT');
    expect(
      (screen.getByLabelText('Trạng thái điểm danh của Tran Thi B') as HTMLSelectElement).value,
    ).toBe('EXCUSED');
  });

  it('defaults new eligible students to PRESENT', async () => {
    authStorage.setSession('jwt.teacher', teacherUser);
    vi.stubGlobal('fetch', createFetchMock(attendanceRouter(defaultData), calls));

    renderTeacherAttendance();

    await screen.findByText('Nguyen Van A');
    expect(
      (screen.getByLabelText('Trạng thái điểm danh của Nguyen Van A') as HTMLSelectElement).value,
    ).toBe('PRESENT');
  });

  it('changes a student status via the row select', async () => {
    authStorage.setSession('jwt.teacher', teacherUser);
    vi.stubGlobal('fetch', createFetchMock(attendanceRouter(defaultData), calls));

    renderTeacherAttendance();

    await screen.findByText('Nguyen Van A');
    fireEvent.change(screen.getByLabelText('Trạng thái điểm danh của Nguyen Van A'), {
      target: { value: 'EXCUSED' },
    });
    expect(
      (screen.getByLabelText('Trạng thái điểm danh của Nguyen Van A') as HTMLSelectElement).value,
    ).toBe('EXCUSED');
  });

  it('marks all students present with the all-present action', async () => {
    authStorage.setSession('jwt.teacher', teacherUser);
    vi.stubGlobal(
      'fetch',
      createFetchMock(attendanceRouter({ ...defaultData, sheets: [existingSheet] }), calls),
    );

    renderTeacherAttendance();

    await screen.findByText('Nguyen Van A');
    fireEvent.click(screen.getByRole('button', { name: 'Tất cả có mặt' }));
    expect(
      (screen.getByLabelText('Trạng thái điểm danh của Nguyen Van A') as HTMLSelectElement).value,
    ).toBe('PRESENT');
    expect(
      (screen.getByLabelText('Trạng thái điểm danh của Tran Thi B') as HTMLSelectElement).value,
    ).toBe('PRESENT');
  });

  it('create sends POST with classId, date and records', async () => {
    authStorage.setSession('jwt.teacher', teacherUser);
    vi.stubGlobal('fetch', createFetchMock(attendanceRouter(defaultData), calls));

    renderTeacherAttendance();

    await screen.findByText('Nguyen Van A');
    fireEvent.change(screen.getByLabelText('Trạng thái điểm danh của Tran Thi B'), {
      target: { value: 'ABSENT' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Lưu điểm danh' }));

    await waitFor(() => {
      const post = calls.find((c) => c.url === '/attendance/sheets' && c.method === 'POST');
      expect(post).toBeTruthy();
      const body = post?.body as { classId: number; date: string; records: Array<{ studentId: number; status: string }> };
      expect(body.classId).toBe(10);
      expect(typeof body.date).toBe('string');
      expect(body).not.toHaveProperty('teacherId');
      expect(body.records).toEqual([
        { studentId: 101, status: 'PRESENT' },
        { studentId: 102, status: 'ABSENT' },
      ]);
    });
    expect(await screen.findByText('Điểm danh thành công.')).toBeTruthy();
  });

  it('update sends PUT with records only and no classId or date', async () => {
    authStorage.setSession('jwt.teacher', teacherUser);
    vi.stubGlobal(
      'fetch',
      createFetchMock(attendanceRouter({ ...defaultData, sheets: [existingSheet] }), calls),
    );

    renderTeacherAttendance();

    await screen.findByText('Nguyen Van A');
    fireEvent.click(screen.getByRole('button', { name: 'Cập nhật điểm danh' }));

    await waitFor(() => {
      const put = calls.find((c) => c.url === '/attendance/sheets/7' && c.method === 'PUT');
      expect(put).toBeTruthy();
      const body = put?.body as { records: unknown[] };
      expect(body).toHaveProperty('records');
      expect(body).not.toHaveProperty('classId');
      expect(body).not.toHaveProperty('date');
      expect(body).not.toHaveProperty('teacherId');
    });
    expect(await screen.findByText('Cập nhật điểm danh thành công.')).toBeTruthy();
  });

  it('blocks submit for a future date without sending a request', async () => {
    authStorage.setSession('jwt.teacher', teacherUser);
    vi.stubGlobal('fetch', createFetchMock(attendanceRouter(defaultData), calls));

    renderTeacherAttendance();

    await screen.findByText('Nguyen Van A');
    fireEvent.change(screen.getByLabelText('Chọn ngày điểm danh'), { target: { value: '2099-01-01' } });
    await waitFor(() => {
      expect(
        calls.some((c) => c.url.startsWith('/attendance/sheets') && c.url.includes('date=2099-01-01')),
      ).toBe(true);
    });
    fireEvent.click(screen.getByRole('button', { name: 'Lưu điểm danh' }));

    expect(await screen.findByText('Ngày điểm danh không được là ngày tương lai.')).toBeTruthy();
    expect(calls.some((c) => c.url === '/attendance/sheets' && c.method === 'POST')).toBe(false);
  });

  it('blocks submit when the roster is empty without sending a request', async () => {
    authStorage.setSession('jwt.teacher', teacherUser);
    vi.stubGlobal(
      'fetch',
      createFetchMock(attendanceRouter({ ...defaultData, registrations: [pendingReg] }), calls),
    );

    renderTeacherAttendance();

    expect(
      await screen.findByText('Lớp hiện chưa có học viên đủ điều kiện điểm danh.'),
    ).toBeTruthy();
    expect(calls.some((c) => c.url === '/attendance/sheets' && c.method === 'POST')).toBe(false);
  });

  it('duplicate create recovers by refetching into edit mode without a second POST', async () => {
    authStorage.setSession('jwt.teacher', teacherUser);
    let sheetCalls = 0;
    vi.stubGlobal(
      'fetch',
      createFetchMock(
        attendanceRouter(
          { ...defaultData, sheets: [] },
          {
            onCreate: () => badRequest('Attendance sheet already exists for this class and date'),
            onSheets: () => {
              sheetCalls += 1;
              return sheetCalls === 1 ? success([]) : success([existingSheet]);
            },
          },
        ),
        calls,
      ),
    );

    renderTeacherAttendance();

    await screen.findByText('Nguyen Van A');
    fireEvent.click(screen.getByRole('button', { name: 'Lưu điểm danh' }));

    expect(
      await screen.findByText('Phiếu điểm danh đã tồn tại, đã tải bản mới nhất để sửa.'),
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Cập nhật điểm danh' })).toBeTruthy();
    const posts = calls.filter((c) => c.url === '/attendance/sheets' && c.method === 'POST');
    expect(posts.length).toBe(1);
  });

  it('shows backend 400 message and keeps the form', async () => {
    authStorage.setSession('jwt.teacher', teacherUser);
    vi.stubGlobal(
      'fetch',
      createFetchMock(
        attendanceRouter(
          { ...defaultData },
          { onCreate: () => badRequest('Student is not enrolled in this class') },
        ),
        calls,
      ),
    );

    renderTeacherAttendance();

    await screen.findByText('Nguyen Van A');
    fireEvent.click(screen.getByRole('button', { name: 'Lưu điểm danh' }));

    expect(await screen.findByText('Student is not enrolled in this class')).toBeTruthy();
    expect(screen.getByText('Nguyen Van A')).toBeTruthy();
  });

  it('shows permission error on 403', async () => {
    authStorage.setSession('jwt.teacher', teacherUser);
    vi.stubGlobal(
      'fetch',
      createFetchMock(
        attendanceRouter({ ...defaultData }, { onCreate: () => forbidden() }),
        calls,
      ),
    );

    renderTeacherAttendance();

    await screen.findByText('Nguyen Van A');
    fireEvent.click(screen.getByRole('button', { name: 'Lưu điểm danh' }));

    expect(await screen.findByText('Không có quyền thực hiện thao tác này.')).toBeTruthy();
  });

  it('shows loading state and retries data load after error', async () => {
    authStorage.setSession('jwt.teacher', teacherUser);
    let sheetCalls = 0;
    vi.stubGlobal(
      'fetch',
      createFetchMock(
        attendanceRouter(defaultData, {
          onSheets: () => {
            sheetCalls += 1;
            return sheetCalls === 1 ? failure() : success([]);
          },
        }),
        calls,
      ),
    );

    renderTeacherAttendance();

    expect(screen.getByLabelText('Đang tải danh sách điểm danh')).toBeTruthy();
    expect(await screen.findByText('Không thể tải danh sách điểm danh')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));

    expect(await screen.findByText('Nguyen Van A')).toBeTruthy();
  });

  it('retries loading classes after classes error', async () => {
    authStorage.setSession('jwt.teacher', teacherUser);
    let classCalls = 0;
    vi.stubGlobal(
      'fetch',
      createFetchMock(
        attendanceRouter(defaultData, {
          onClasses: () => {
            classCalls += 1;
            return classCalls === 1 ? failure() : success([studyingClass, upcomingClass]);
          },
        }),
        calls,
      ),
    );

    renderTeacherAttendance();

    expect(await screen.findByText('Không thể tải danh sách lớp học')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));

    expect(await screen.findByText('Nguyen Van A')).toBeTruthy();
  });

  it('never sends DELETE and has no note field or percentage', async () => {
    authStorage.setSession('jwt.teacher', teacherUser);
    vi.stubGlobal('fetch', createFetchMock(attendanceRouter(defaultData), calls));

    renderTeacherAttendance();

    await screen.findByText('Nguyen Van A');
    fireEvent.click(screen.getByRole('button', { name: 'Lưu điểm danh' }));
    await screen.findByText('Điểm danh thành công.');

    expect(calls.some((c) => c.method === 'DELETE')).toBe(false);
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.queryByText(/chuyên cần/i)).toBeNull();
    expect(screen.queryByText(/%/)).toBeNull();
  });
});
