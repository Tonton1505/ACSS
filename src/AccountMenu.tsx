import { useRef, useState } from 'react';
import { BookOpen, ChevronDown, FileText, LogOut, Moon, Sun, UserRound } from 'lucide-react';

export type Theme = 'light' | 'dark';
export type Session = { id: number; username: string; name: string; email: string; role: 'user' | 'admin'; token: string };
export const initials = (name: string) => name.trim().split(/\s+/).slice(-2).map(part => part[0]).join('').toUpperCase();

export function ThemeToggle({ theme, onChange }: { theme: Theme; onChange: (theme: Theme) => void }) {
  const label = theme === 'light' ? 'Chuyển sang chế độ tối' : 'Chuyển sang chế độ sáng';
  return <button type="button" className="theme-toggle" data-appearance={theme} aria-label={label} title={label} onClick={() => onChange(theme === 'light' ? 'dark' : 'light')}><Sun className="theme-sun" size={19} strokeWidth={1.7} aria-hidden="true"/><Moon className="theme-moon" size={19} strokeWidth={1.7} aria-hidden="true"/></button>;
}

type Props = { session: Session; theme: Theme; busy: boolean; onTheme: (theme: Theme) => void; onAccount: () => void; onHistory: () => void; onHelp: () => void; onLogout: () => void };
export default function AccountMenu({ session, theme, busy, onTheme, onAccount, onHistory, onHelp, onLogout }: Props) {
  const panel = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const action = (callback: () => void) => { panel.current?.hidePopover(); callback(); };
  return <div className="account-control">
    <ThemeToggle theme={theme} onChange={onTheme}/>
    <button className="account-trigger" popoverTarget="account-menu" aria-expanded={open} aria-controls="account-menu" aria-label={`Tài khoản ${session.name}`}><span className="avatar">{initials(session.name)}</span><span className="account-trigger-name">{session.name}</span><ChevronDown className={open ? 'is-open' : ''} size={14} aria-hidden="true"/></button>
    <div id="account-menu" className="account-popover" popover="auto" ref={panel} onToggle={() => setOpen(panel.current?.matches(':popover-open') || false)} aria-label="Menu tài khoản">
      <div className="account-menu-heading"><span className="avatar">{initials(session.name)}</span><div><strong>{session.name}</strong><span>@{session.username}</span><small>{session.role === 'admin' ? 'Quản trị viên' : 'Tài khoản cá nhân'}<i/>Đã đăng nhập</small></div></div>
      <div className="account-menu-links"><button onClick={() => action(onAccount)}><UserRound size={17} aria-hidden="true"/><span>Thông tin tài khoản</span></button><button onClick={() => action(onHistory)}><FileText size={17} aria-hidden="true"/><span>{session.role === 'admin' ? 'Quản lý hồ sơ' : 'Hồ sơ của tôi'}</span></button><button onClick={() => action(onHelp)}><BookOpen size={17} aria-hidden="true"/><span>Hướng dẫn & hỗ trợ</span></button></div>
      <button className="account-logout" disabled={busy} onClick={() => action(onLogout)}><LogOut size={17} aria-hidden="true"/>Đăng xuất</button>
    </div>
  </div>;
}
