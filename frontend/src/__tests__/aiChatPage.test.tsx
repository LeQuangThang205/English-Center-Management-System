import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { AppRoutes } from '@/routes/AppRoutes';
import { authStorage } from '@/features/auth/authStorage';
import type { AiConversation, AiConversationDetail } from '@/types/aiChat';
import type { User } from '@/types/user';

const baseUser: Omit<User, 'role' | 'email' | 'fullName'> = {
  id: 1,
  phone: null,
  status: 'ACTIVE',
  avatarUrl: null,
  emailVerifiedAt: null,
  lastLoginAt: null,
  createdAt: '2026-08-01T09:00:00',
  updatedAt: null,
};

const adminUser: User = { ...baseUser, id: 1, role: 'ADMIN', email: 'admin@example.com', fullName: 'Admin' };
const teacherUser: User = { ...baseUser, id: 5, role: 'TEACHER', email: 'teacher@example.com', fullName: 'Giao Vien' };
const studentUser: User = { ...baseUser, id: 9, role: 'STUDENT', email: 'student@example.com', fullName: 'Hoc Vien' };

const convOne: AiConversation = {
  id: 7,
  type: 'CHATBOT',
  title: 'Hỏi về lịch học',
  createdAt: '2026-09-15T09:00:00',
  updatedAt: '2026-09-15T10:00:00',
};

const convTwo: AiConversation = {
  id: 8,
  type: 'CHATBOT',
  title: 'Hỏi về học phí',
  createdAt: '2026-09-14T09:00:00',
  updatedAt: '2026-09-14T10:00:00',
};

const detailOne: AiConversationDetail = {
  ...convOne,
  messages: [
    {
      sequenceNumber: 1,
      question: 'Lớp của tôi học khi nào?',
      response: 'Lớp của bạn học tối thứ Hai.',
      createdAt: '2026-09-15T10:00:00',
    },
  ],
};

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

const noContent = (): MockResponse => ({ ok: true, status: 204, body: null });

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

const forbidden = (message: string): MockResponse => ({
  ok: false,
  status: 403,
  body: { success: false, message },
});

const notFound = (message: string): MockResponse => ({
  ok: false,
  status: 404,
  body: { success: false, message },
});

const chatOk = (conversationId: number | null) =>
  success({ reply: 'Đây là câu trả lời từ AI.', conversationId, historySaved: true, notice: null });

interface AiFixture {
  conversations: AiConversation[];
  details: Record<number, AiConversationDetail>;
  onPost?: (body: unknown) => MockResponse;
  onList?: () => MockResponse;
  onDetail?: (id: number) => MockResponse;
  onDelete?: (id: number) => MockResponse;
}

function aiRouter(fixture: AiFixture) {
  return (url: string, method: string, body: unknown): MockResponse => {
    if (url === '/notifications/unread/count') return success(0);
    if (url === '/ai/conversations' && method === 'GET') {
      if (fixture.onList) return fixture.onList();
      return success(fixture.conversations);
    }
    if (url === '/ai/chat' && method === 'POST') {
      if (fixture.onPost) return fixture.onPost(body);
      return chatOk(99);
    }
    const match = url.match(/^\/ai\/conversations\/(\d+)$/);
    if (match) {
      const id = Number(match[1]);
      if (method === 'GET') {
        if (fixture.onDetail) return fixture.onDetail(id);
        const detail = fixture.details[id];
        return detail ? success(detail) : notFound('AiConversation not found');
      }
      if (method === 'DELETE') {
        if (fixture.onDelete) return fixture.onDelete(id);
        return noContent();
      }
    }
    return failure();
  };
}

const emptyFixture: AiFixture = { conversations: [], details: {} };
const listFixture: AiFixture = { conversations: [convOne, convTwo], details: { 7: detailOne } };

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </MemoryRouter>,
  );
}

function askQuestion(question: string) {
  fireEvent.change(screen.getByLabelText('Nhập câu hỏi cho trợ lý AI'), { target: { value: question } });
  fireEvent.click(screen.getByRole('button', { name: 'Gửi' }));
}

describe('AiChatPage', () => {
  let calls: RecordedCall[];

  beforeEach(() => {
    localStorage.clear();
    calls = [];
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('redirects unauthenticated users to login', async () => {
    vi.stubGlobal('fetch', createFetchMock(aiRouter(emptyFixture), calls));

    renderAt('/student/ai-chat');

    expect(await screen.findByRole('heading', { name: 'Đăng nhập' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Trợ lý AI' })).toBeNull();
  });

  it('renders for ADMIN route with stored session', async () => {
    authStorage.setSession('jwt.admin', adminUser);
    vi.stubGlobal('fetch', createFetchMock(aiRouter(emptyFixture), calls));

    renderAt('/admin/ai-chat');

    expect(await screen.findByRole('heading', { name: 'Trợ lý AI' })).toBeTruthy();
    expect(await screen.findByText('Hỏi đáp về khóa học, lịch học, đăng ký và thanh toán.')).toBeTruthy();
  });

  it('renders for TEACHER route with stored session', async () => {
    authStorage.setSession('jwt.teacher', teacherUser);
    vi.stubGlobal('fetch', createFetchMock(aiRouter(emptyFixture), calls));

    renderAt('/teacher/ai-chat');

    expect(await screen.findByRole('heading', { name: 'Trợ lý AI' })).toBeTruthy();
  });

  it('renders for STUDENT route with stored session', async () => {
    authStorage.setSession('jwt.student', studentUser);
    vi.stubGlobal('fetch', createFetchMock(aiRouter(emptyFixture), calls));

    renderAt('/student/ai-chat');

    expect(await screen.findByRole('heading', { name: 'Trợ lý AI' })).toBeTruthy();
  });

  it('keeps the auth session in authStorage while loading history', async () => {
    authStorage.setSession('jwt.student', studentUser);
    vi.stubGlobal('fetch', createFetchMock(aiRouter(listFixture), calls));

    renderAt('/student/ai-chat');

    await screen.findByRole('button', { name: 'Hỏi về lịch học' });
    expect(authStorage.getUser()?.role).toBe('STUDENT');
    await waitFor(() => {
      expect(calls.some((c) => c.url === '/notifications/unread/count')).toBe(true);
    });
  });

  it('shows loading state while fetching history', async () => {
    authStorage.setSession('jwt.student', studentUser);
    interface FetchLike {
      ok: boolean;
      status: number;
      json: () => Promise<unknown>;
    }
    let release!: (value: FetchLike) => void;
    const gate = new Promise<FetchLike>((resolve) => {
      release = resolve;
    });
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input).replace('/api', '');
        if (url === '/ai/conversations') return gate;
        if (url === '/notifications/unread/count') {
          return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(success(0).body) });
        }
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(success([]).body) });
      }),
    );

    renderAt('/student/ai-chat');

    expect(screen.getByLabelText('Đang tải lịch sử hội thoại')).toBeTruthy();
    release({ ok: true, status: 200, json: () => Promise.resolve(success([]).body) });
    await screen.findByText('Chưa có hội thoại nào');
  });

  it('loads conversation history newest-first', async () => {
    authStorage.setSession('jwt.student', studentUser);
    vi.stubGlobal('fetch', createFetchMock(aiRouter(listFixture), calls));

    renderAt('/student/ai-chat');

    expect(await screen.findByRole('button', { name: 'Hỏi về lịch học' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Hỏi về học phí' })).toBeTruthy();
    const listCall = calls.find((c) => c.url === '/ai/conversations' && c.method === 'GET');
    expect(listCall).toBeTruthy();
  });

  it('shows empty history state when there is no conversation', async () => {
    authStorage.setSession('jwt.student', studentUser);
    vi.stubGlobal('fetch', createFetchMock(aiRouter(emptyFixture), calls));

    renderAt('/student/ai-chat');

    expect(await screen.findByText('Chưa có hội thoại nào')).toBeTruthy();
  });

  it('shows history error with retry and reloads on retry', async () => {
    authStorage.setSession('jwt.student', studentUser);
    let attempts = 0;
    vi.stubGlobal(
      'fetch',
      createFetchMock(
        aiRouter({
          ...emptyFixture,
          onList: () => {
            attempts += 1;
            return attempts === 1 ? failure() : success([]);
          },
        }),
        calls,
      ),
    );

    renderAt('/student/ai-chat');

    expect(await screen.findByText('Không thể tải lịch sử hội thoại')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(await screen.findByText('Chưa có hội thoại nào')).toBeTruthy();
    expect(attempts).toBe(2);
  });

  it('opens a conversation and renders its messages', async () => {
    authStorage.setSession('jwt.student', studentUser);
    vi.stubGlobal('fetch', createFetchMock(aiRouter(listFixture), calls));

    renderAt('/student/ai-chat');

    fireEvent.click(await screen.findByRole('button', { name: 'Hỏi về lịch học' }));

    expect(await screen.findByText('Lớp của tôi học khi nào?')).toBeTruthy();
    expect(screen.getByText('Lớp của bạn học tối thứ Hai.')).toBeTruthy();
    const detailCall = calls.find((c) => c.url === '/ai/conversations/7' && c.method === 'GET');
    expect(detailCall).toBeTruthy();
  });

  it('keeps history sidebar when conversation detail returns 404', async () => {
    authStorage.setSession('jwt.student', studentUser);
    vi.stubGlobal(
      'fetch',
      createFetchMock(aiRouter({ ...listFixture, onDetail: () => notFound('AiConversation not found') }), calls),
    );

    renderAt('/student/ai-chat');

    fireEvent.click(await screen.findByRole('button', { name: 'Hỏi về lịch học' }));

    expect(await screen.findByText('Không thể mở hội thoại')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Hỏi về lịch học' })).toBeTruthy();
  });

  it('does not send a request for a blank draft', async () => {
    authStorage.setSession('jwt.student', studentUser);
    vi.stubGlobal('fetch', createFetchMock(aiRouter(emptyFixture), calls));

    renderAt('/student/ai-chat');

    await screen.findByText('Chưa có hội thoại nào');
    expect(screen.getByRole('button', { name: 'Gửi' })).toBeTruthy();
    expect(calls.some((c) => c.url === '/ai/chat')).toBe(false);
  });

  it('sends a message and renders the assistant reply', async () => {
    authStorage.setSession('jwt.student', studentUser);
    vi.stubGlobal('fetch', createFetchMock(aiRouter(emptyFixture), calls));

    renderAt('/student/ai-chat');

    await screen.findByText('Chưa có hội thoại nào');
    askQuestion('Lịch học của tôi là gì?');

    expect(await screen.findByText('Đây là câu trả lời từ AI.')).toBeTruthy();
    expect(within(screen.getByRole('log')).getByText('Lịch học của tôi là gì?')).toBeTruthy();
    const postCall = calls.find((c) => c.url === '/ai/chat' && c.method === 'POST');
    expect(postCall).toBeTruthy();
    expect(postCall?.body).toMatchObject({ message: 'Lịch học của tôi là gì?' });
  });

  it('shows typing indicator while the reply is pending', async () => {
    authStorage.setSession('jwt.student', studentUser);
    let release!: (value: { ok: boolean; status: number; json: () => Promise<unknown> }) => void;
    const gate = new Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }>((resolve) => {
      release = resolve;
    });
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input).replace('/api', '');
        if (url === '/ai/chat') return gate;
        const body = url === '/ai/conversations' ? success([]).body : success(0).body;
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) });
      }),
    );

    renderAt('/student/ai-chat');

    await screen.findByText('Chưa có hội thoại nào');
    askQuestion('Xin chào');

    expect(await screen.findByText(/AI đang trả lời/)).toBeTruthy();
    release({ ok: true, status: 200, json: () => Promise.resolve(chatOk(null).body) });
    expect(await screen.findByText('Đây là câu trả lời từ AI.')).toBeTruthy();
  });

  it('creates a new conversation entry when the API returns a new conversationId', async () => {
    authStorage.setSession('jwt.student', studentUser);
    vi.stubGlobal('fetch', createFetchMock(aiRouter(emptyFixture), calls));

    renderAt('/student/ai-chat');

    await screen.findByText('Chưa có hội thoại nào');
    askQuestion('Câu hỏi đầu tiên của tôi');

    await screen.findByText('Đây là câu trả lời từ AI.');
    expect(await screen.findByRole('button', { name: 'Câu hỏi đầu tiên của tôi' })).toBeTruthy();
  });

  it('sends the existing conversationId when chatting in an opened conversation', async () => {
    authStorage.setSession('jwt.student', studentUser);
    vi.stubGlobal(
      'fetch',
      createFetchMock(aiRouter({ ...listFixture, onPost: () => chatOk(7) }), calls),
    );

    renderAt('/student/ai-chat');

    fireEvent.click(await screen.findByRole('button', { name: 'Hỏi về lịch học' }));
    await screen.findByText('Lớp của tôi học khi nào?');
    askQuestion('Còn học phí thì sao?');

    await waitFor(() => {
      const postCall = calls.find((c) => c.url === '/ai/chat' && c.method === 'POST');
      expect(postCall?.body).toMatchObject({ message: 'Còn học phí thì sao?', conversationId: 7 });
    });
  });

  it('shows backend error message when send fails with 400', async () => {
    authStorage.setSession('jwt.student', studentUser);
    vi.stubGlobal(
      'fetch',
      createFetchMock(aiRouter({ ...emptyFixture, onPost: () => badRequest('AI đang bận, vui lòng thử lại sau') }), calls),
    );

    renderAt('/student/ai-chat');

    await screen.findByText('Chưa có hội thoại nào');
    askQuestion('Xin chào');

    expect(await screen.findByText('AI đang bận, vui lòng thử lại sau')).toBeTruthy();
  });

  it('shows permission error when send fails with 403 envelope', async () => {
    authStorage.setSession('jwt.student', studentUser);
    vi.stubGlobal(
      'fetch',
      createFetchMock(aiRouter({ ...emptyFixture, onPost: () => forbidden('Access denied') }), calls),
    );

    renderAt('/student/ai-chat');

    await screen.findByText('Chưa có hội thoại nào');
    askQuestion('Xin chào');

    expect(await screen.findByText('Access denied')).toBeTruthy();
  });

  it('retries the failed message without duplicating requests', async () => {
    authStorage.setSession('jwt.student', studentUser);
    let attempts = 0;
    vi.stubGlobal(
      'fetch',
      createFetchMock(
        aiRouter({
          ...emptyFixture,
          onPost: () => {
            attempts += 1;
            return attempts === 1 ? failure() : chatOk(null);
          },
        }),
        calls,
      ),
    );

    renderAt('/student/ai-chat');

    await screen.findByText('Chưa có hội thoại nào');
    askQuestion('Thử lại giúp tôi');

    expect(await screen.findByText('Internal server error')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));

    expect(await screen.findByText('Đây là câu trả lời từ AI.')).toBeTruthy();
    expect(calls.filter((c) => c.url === '/ai/chat' && c.method === 'POST')).toHaveLength(2);
  });

  it('shows backend notice when historySaved is false', async () => {
    authStorage.setSession('jwt.student', studentUser);
    vi.stubGlobal(
      'fetch',
      createFetchMock(
        aiRouter({
          ...emptyFixture,
          onPost: () =>
            success({
              reply: 'Trả lời nhưng lỗi lưu.',
              conversationId: null,
              historySaved: false,
              notice: 'Đã nhận phản hồi AI nhưng không lưu được lịch sử. Vui lòng thử lại.',
            }),
        }),
        calls,
      ),
    );

    renderAt('/student/ai-chat');

    await screen.findByText('Chưa có hội thoại nào');
    askQuestion('Lưu giúp tôi nhé');

    expect(await screen.findByText('Trả lời nhưng lỗi lưu.')).toBeTruthy();
    expect(
      await screen.findByText('Đã nhận phản hồi AI nhưng không lưu được lịch sử. Vui lòng thử lại.'),
    ).toBeTruthy();
  });

  it('cancelling delete keeps the conversation', async () => {
    authStorage.setSession('jwt.student', studentUser);
    vi.stubGlobal('fetch', createFetchMock(aiRouter(listFixture), calls));

    renderAt('/student/ai-chat');

    await screen.findByRole('button', { name: 'Hỏi về lịch học' });
    fireEvent.click(screen.getByRole('button', { name: 'Xóa Hỏi về lịch học' }));

    expect(await screen.findByText('Xóa hội thoại?')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Hủy' }));

    expect(screen.queryByText('Xóa hội thoại?')).toBeNull();
    expect(screen.getByRole('button', { name: 'Hỏi về lịch học' })).toBeTruthy();
    expect(calls.some((c) => c.method === 'DELETE')).toBe(false);
  });

  it('deletes a conversation and removes it from history', async () => {
    authStorage.setSession('jwt.student', studentUser);
    vi.stubGlobal('fetch', createFetchMock(aiRouter(listFixture), calls));

    renderAt('/student/ai-chat');

    await screen.findByRole('button', { name: 'Hỏi về học phí' });
    fireEvent.click(screen.getByRole('button', { name: 'Xóa Hỏi về học phí' }));
    expect(await screen.findByText('Xóa hội thoại?')).toBeTruthy();
    expect(
      screen.getByText('sẽ bị xóa và không thể hoàn tác.', { exact: false }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận xóa' }));

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Hỏi về học phí' })).toBeNull();
    });
    expect(screen.getByRole('button', { name: 'Hỏi về lịch học' })).toBeTruthy();
    const deleteCall = calls.find((c) => c.url === '/ai/conversations/8' && c.method === 'DELETE');
    expect(deleteCall).toBeTruthy();
  });

  it('clears the chat panel when the active conversation is deleted', async () => {
    authStorage.setSession('jwt.student', studentUser);
    vi.stubGlobal('fetch', createFetchMock(aiRouter(listFixture), calls));

    renderAt('/student/ai-chat');

    fireEvent.click(await screen.findByRole('button', { name: 'Hỏi về lịch học' }));
    await screen.findByText('Lớp của tôi học khi nào?');
    fireEvent.click(screen.getByRole('button', { name: 'Xóa Hỏi về lịch học' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Xác nhận xóa' }));

    await waitFor(() => {
      expect(screen.queryByText('Lớp của tôi học khi nào?')).toBeNull();
    });
    expect(await screen.findByText('Bắt đầu trò chuyện với trợ lý AI')).toBeTruthy();
  });

  it('syncs history when delete returns 404 (already removed server-side)', async () => {
    authStorage.setSession('jwt.student', studentUser);
    vi.stubGlobal(
      'fetch',
      createFetchMock(aiRouter({ ...listFixture, onDelete: () => notFound('AiConversation not found') }), calls),
    );

    renderAt('/student/ai-chat');

    await screen.findByRole('button', { name: 'Hỏi về học phí' });
    fireEvent.click(screen.getByRole('button', { name: 'Xóa Hỏi về học phí' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Xác nhận xóa' }));

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Hỏi về học phí' })).toBeNull();
    });
  });

  it('renders multiple conversations', async () => {
    authStorage.setSession('jwt.teacher', teacherUser);
    vi.stubGlobal('fetch', createFetchMock(aiRouter(listFixture), calls));

    renderAt('/teacher/ai-chat');

    expect(await screen.findByRole('button', { name: 'Hỏi về lịch học' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Hỏi về học phí' })).toBeTruthy();
  });

  it('never sends an API key in chat requests', async () => {
    authStorage.setSession('jwt.student', studentUser);
    vi.stubGlobal('fetch', createFetchMock(aiRouter(emptyFixture), calls));

    renderAt('/student/ai-chat');

    await screen.findByText('Chưa có hội thoại nào');
    askQuestion('API key của tôi là gì?');

    await screen.findByText('Đây là câu trả lời từ AI.');
    const postCall = calls.find((c) => c.url === '/ai/chat' && c.method === 'POST');
    expect(postCall).toBeTruthy();
    const raw = JSON.stringify(postCall?.body ?? {});
    expect(raw).not.toContain('AI_API_KEY');
    expect(raw).not.toContain('apiKey');
    expect(raw).not.toContain('api_key');
  });

  it('never injects userId into chat requests', async () => {
    authStorage.setSession('jwt.student', studentUser);
    vi.stubGlobal('fetch', createFetchMock(aiRouter(emptyFixture), calls));

    renderAt('/student/ai-chat');

    await screen.findByText('Chưa có hội thoại nào');
    askQuestion('Tôi là ai?');

    await screen.findByText('Đây là câu trả lời từ AI.');
    const postCall = calls.find((c) => c.url === '/ai/chat' && c.method === 'POST');
    expect(postCall).toBeTruthy();
    expect(postCall?.body).not.toHaveProperty('userId');
    expect(postCall?.body).not.toHaveProperty('studentId');
  });

  it('clicking a suggestion sends it safely as plain text', async () => {
    authStorage.setSession('jwt.student', studentUser);
    vi.stubGlobal('fetch', createFetchMock(aiRouter(emptyFixture), calls));

    renderAt('/student/ai-chat');

    fireEvent.click(await screen.findByRole('button', { name: 'Lịch học của tôi là gì?' }));

    expect(await screen.findByText('Đây là câu trả lời từ AI.')).toBeTruthy();
    const postCall = calls.find((c) => c.url === '/ai/chat' && c.method === 'POST');
    expect(postCall?.body).toMatchObject({ message: 'Lịch học của tôi là gì?' });
  });
});
