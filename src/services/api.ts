import type { Session } from '../AccountMenu';

const KEY = 'credi.api.session.v1';
export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}
export function readSession(): Session | null {
  try {
    const session = JSON.parse(sessionStorage.getItem(KEY) || 'null');
    if (!session?.token || !session?.id || !session?.username) return null;
    const payload = JSON.parse(atob(session.token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload.exp * 1000 > Date.now() ? session : null;
  } catch { return null; }
}
export function saveSession(session: Session | null) {
  if (session) sessionStorage.setItem(KEY, JSON.stringify(session));
  else sessionStorage.removeItem(KEY);
}
export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const session = readSession();
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      ...options, signal: AbortSignal.timeout(15000),
      headers: { 'Content-Type': 'application/json', ...(session ? { Authorization: `Bearer ${session.token}` } : {}), ...options.headers },
    });
  } catch { throw new ApiError('Không kết nối được backend. Kiểm tra máy chủ ở cổng 3000 rồi thử lại.', 0); }
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    if (path !== '/login' && (response.status === 401 || (response.status === 403 && /token/i.test(body?.message || '')))) {
      saveSession(null);
      window.dispatchEvent(new Event('credi:unauthorized'));
    }
    throw new ApiError(body?.message || `Yêu cầu thất bại (${response.status}).`, response.status);
  }
  return body as T;
}
export async function loginWithPassword(username: string, password: string): Promise<Session> {
  const data = await api<{ token: string; user: { id: number; username: string; role: 'USER' | 'ADMIN' } }>('/login', {
    method: 'POST', body: JSON.stringify({ username, password }),
  });
  const session: Session = { id: data.user.id, username: data.user.username, name: data.user.username, email: '', role: data.user.role === 'ADMIN' ? 'admin' : 'user', token: data.token };
  saveSession(session);
  return session;
}
