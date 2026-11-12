import { useEffect, useRef, useState, type FormEvent, type PointerEvent } from 'react';
import { ArrowRight, ChevronDown, Eye, EyeOff, Leaf, LockKeyhole, UserRound } from 'lucide-react';
import { ThemeToggle, type Session, type Theme } from './AccountMenu';
import GlassBackdrop from './GlassBackdrop';
import { loginWithPassword } from './services/api';

export default function AuthScreen({ theme, onTheme, onLogin }: { theme: Theme; onTheme: (theme: Theme) => void; onLogin: (session: Session) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const shineFrame = useRef(0);
  useEffect(() => () => cancelAnimationFrame(shineFrame.current), []);
  function trackLight(event: PointerEvent<HTMLElement>) {
    if (event.pointerType !== 'mouse' || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const panel = event.currentTarget;
    const rect = panel.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    cancelAnimationFrame(shineFrame.current);
    shineFrame.current = requestAnimationFrame(() => {
      panel.style.setProperty('--shine-x', `${x}px`);
      panel.style.setProperty('--shine-y', `${y}px`);
    });
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    setError(''); setBusy(true);
    try { onLogin(await loginWithPassword(String(fields.get('username')).trim(), String(fields.get('password')))); }
    catch (reason) { setError((reason as Error).message); }
    finally { setBusy(false); }
  }
  return <div className="auth-screen">
    <GlassBackdrop/>
    <header><span className="auth-brand"><span className="auth-brand-mark"><Leaf size={25} aria-hidden="true"/></span>credi.</span><ThemeToggle theme={theme} onChange={onTheme}/></header>
    <main className="auth-layout">
      <section className="auth-intro">
        <span className="eyebrow">Mỗi khởi đầu đều xứng đáng</span>
        <h1>Tín nhiệm từ<br/>{' '}những điều nhỏ.</h1>
        <p>Học tập, thu nhập và thói quen mỗi ngày.<br/>Một góc nhìn mới về tiềm năng của bạn.</p>
        <div className="auth-intro-note"><span className="connection-dot"/><span>Kết nối ACSS Backend · Môi trường local.</span></div>
      </section>
      <section className="auth-panel card" onPointerMove={trackLight}>
        <div className="auth-panel-kicker"><span className="auth-panel-icon"><LockKeyhole size={20} aria-hidden="true"/></span><span className="overline">Tài khoản ACSS</span></div>
        <h2>Chào mừng trở lại.</h2>
        <p>Đăng nhập để tiếp tục hồ sơ của bạn.</p>
        <form className="auth-form" onSubmit={submit} aria-busy={busy}>
          {error && <div className="error-summary" role="alert">{error}</div>}
          <label htmlFor="login-username">Tên đăng nhập</label>
          <div className="auth-input-shell"><UserRound size={18} aria-hidden="true"/><input id="login-username" name="username" required autoComplete="username" placeholder="Nhập tên đăng nhập" disabled={busy}/></div>
          <label htmlFor="login-password">Mật khẩu</label>
          <div className="auth-input-shell"><LockKeyhole size={18} aria-hidden="true"/><input id="login-password" name="password" type={showPassword ? 'text' : 'password'} required autoComplete="current-password" placeholder="Nhập mật khẩu" disabled={busy}/><button className="password-reveal" type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} aria-pressed={showPassword} aria-controls="login-password">{showPassword ? <EyeOff size={18} aria-hidden="true"/> : <Eye size={18} aria-hidden="true"/>}</button></div>
          <button type="submit" className="button primary" disabled={busy}>{busy ? 'Đang đăng nhập…' : 'Đăng nhập'}<ArrowRight size={17} aria-hidden="true"/></button>
          <details className="local-accounts"><summary>Tài khoản thử local<ChevronDown size={15} aria-hidden="true"/></summary><div><p>Người dùng: <code>user1 / 123</code></p><p>Quản trị viên: <code>admin / 123</code></p><small>Backend hiện chưa có API đăng ký hoặc khôi phục mật khẩu.</small></div></details>
        </form>
      </section>
    </main>
  </div>;
}
