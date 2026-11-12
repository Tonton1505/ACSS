import { api, readSession } from './api';

export type Profile = { name: string; email: string; school: string; gpa: string; activities: string; employment: string; income: string; spending: string; purpose: string; amount: string; consent: boolean };
export type Application = { id: string; userId?: number; name: string; date?: string; score: number; status: 'pending' | 'approved' | 'rejected'; amount?: number; profile?: Profile; source: 'server' | 'receipt' };
export const emptyProfile: Profile = { name: '', email: '', school: '', gpa: '', activities: '', employment: 'part-time', income: '', spending: '', purpose: 'Học tập', amount: '10000000', consent: false };
export function readLocal<T>(key: string, fallback: T): T { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; } }
export function writeLocal(key: string, data: unknown): boolean { try { localStorage.setItem(key, JSON.stringify(data)); return true; } catch { return false; } }
const receiptKey = (id: number) => `credi.api.receipts.${id}`;
type ServerApplication = { id: number; username: string; credit_score: number; status: 'PENDING' | 'APPROVED' | 'REJECTED' };
export const creditService = {
  async list(): Promise<Application[]> {
    const session = readSession();
    if (!session) return [];
    if (session.role !== 'admin') return readLocal<Application[]>(receiptKey(session.id), []);
    const rows = await api<ServerApplication[]>('/applications');
    return rows.map(row => ({ id: String(row.id), name: row.username, score: row.credit_score, status: row.status.toLowerCase() as Application['status'], source: 'server' }));
  },
  async submit(profile: Profile): Promise<{ item: Application; cached: boolean }> {
    const session = readSession();
    if (!session) throw new Error('Vui lòng đăng nhập lại.');
    const result = await api<{ applicationId: number; creditScore: number }>('/applications', {
      method: 'POST',
      body: JSON.stringify({ ...profile, gpa: Number(profile.gpa), income: Number(profile.income), expenses: Number(profile.spending), activities: Number(profile.activities) }),
    });
    const item: Application = { id: String(result.applicationId), userId: session.id, name: profile.name, date: new Date().toISOString(), score: result.creditScore, status: 'pending', amount: Number(profile.amount), profile: { ...profile }, source: 'receipt' };
    const previous = readLocal<Application[]>(receiptKey(session.id), []);
    return { item, cached: writeLocal(receiptKey(session.id), [item, ...previous.filter(row => row.id !== item.id)]) };
  },
  async review(id: string, status: 'approved' | 'rejected'): Promise<void> {
    await api(`/applications/${encodeURIComponent(id)}/status`, { method: 'PUT', body: JSON.stringify({ status: status.toUpperCase() }) });
  },
};
