import type { ApiEnvelope } from '@/types/api';
import { TOKEN_KEY, USER_KEY } from '@/services/api/storageKeys';

const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? '/api';

/** Sự kiện toàn cục khi session hết hạn — AuthProvider lắng nghe để reset trạng thái. */
export const UNAUTHORIZED_EVENT = 'ecms:unauthorized';

export class ApiError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers();
  if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }
  const token = getAuthToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  let body: ApiEnvelope<T> | null = null;
  try {
    body = (await response.json()) as ApiEnvelope<T>;
  } catch {
    body = null;
  }

  const isAuthPath = path.startsWith('/auth/');
  const hasEnvelope = body !== null && typeof body.success === 'boolean';

  // Backend contract: protected endpoints trả 403 (body rỗng) khi token thiếu/hết hạn/không hợp lệ,
  // và 401 khi đăng nhập sai. 403 kèm envelope ("Access denied") là lỗi phân quyền — không clear session.
  if (!isAuthPath && (response.status === 401 || (response.status === 403 && !hasEnvelope))) {
    clearSession();
    window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
  }

  if (!response.ok) {
    throw new ApiError(body?.message ?? `Yêu cầu thất bại (HTTP ${response.status})`, response.status);
  }

  if (body && typeof body.success === 'boolean') {
    if (!body.success) {
      throw new ApiError(body.message ?? 'Yêu cầu thất bại', response.status);
    }
    return body.data as T;
  }

  return body as unknown as T;
}

export const http = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
