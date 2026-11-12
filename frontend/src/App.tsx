import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowRight, ArrowUpRight, BookOpen, Check, CheckCheck, ChevronLeft, ChevronRight, CircleHelp, Clock3, CreditCard, FileText, GraduationCap, LayoutDashboard, Leaf, LockKeyhole, Menu, Plus, Search, ShieldCheck, Sparkles, Wallet, X } from 'lucide-react';
import { creditService, emptyProfile, readLocal, writeLocal, type Application, type Profile } from './services/credit';
import LiquidNav from './LiquidNav';
import GlassBackdrop from './GlassBackdrop';
import useGlassMotion from './useGlassMotion';
import AccountMenu, { initials, type Session, type Theme } from './AccountMenu';
import AuthScreen from './AuthScreen';
import { readSession, saveSession } from './services/api';

type Page = 'overview' | 'application' | 'history' | 'guide' | 'admin';
const money = (n?: number) => n == null ? 'API chưa cung cấp' : new Intl.NumberFormat('vi-VN').format(n) + ' ₫';
const date = (s?: string) => !s ? 'API chưa cung cấp' : new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Bangkok' }).format(new Date(s));
const statusNames = { pending: 'Chờ duyệt', approved: 'Đã phê duyệt', rejected: 'Đã từ chối' };
function Status({ value }: { value: Application['status'] }) { const Icon = value === 'pending' ? Clock3 : value === 'approved' ? CheckCheck : X; return <span className={`status ${value}`}><Icon size={13}/>{statusNames[value]}</span>; }
function Brand() { return <div className="brand"><span className="brand-symbol"><Leaf size={23} strokeWidth={2}/></span><span>credi<span className="brand-dot">.</span></span></div>; }
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const previous = document.activeElement as HTMLElement; ref.current?.showModal(); return () => { if (previous?.isConnected) previous.focus({ preventScroll: true }); }; }, []);
  return <dialog ref={ref} onCancel={e => { e.preventDefault(); onClose(); }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}><div className="modal-head"><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label="Đóng"><X size={20}/></button></div>{children}</dialog>;
}
function Score({ score }: { score?: number }) { const progress = Math.min(1, Math.max(0, ((score ?? 300) - 300) / 170)); return <div className="gauge"><svg viewBox="0 0 320 190" role="img" aria-label={score == null ? 'Chưa có điểm tín dụng' : `Điểm tín dụng ${score} trên 470`}><path className="gauge-track" d="M 35 155 A 125 125 0 0 1 285 155"/><path className="gauge-fill" pathLength="100" strokeDasharray={`${progress * 100} 100`} d="M 35 155 A 125 125 0 0 1 285 155"/></svg><div className="gauge-number"><strong>{score ?? '—'}</strong><span>trên 470 điểm</span></div><div className="gauge-labels"><span>300</span><span>470</span></div></div>; }

export default function App() {
  const [page, setPage] = useState<Page>(() => readSession()?.role === 'admin' ? 'admin' : 'overview');
  const [session, setSession] = useState<Session | null>(readSession);
  const [theme, setTheme] = useState<Theme>(() => readLocal<string>('credi.ui.theme', 'light') === 'dark' ? 'dark' : 'light');
  const [menu, setMenu] = useState(false);
  const [items, setItems] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [profile, setProfile] = useState<Profile>(() => { const saved = readLocal<Profile>(`credi.api.draft.${session?.id}`, emptyProfile); return session ? { ...saved, name: saved.name || session.name, email: saved.email || session.email } : emptyProfile; });
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [detail, setDetail] = useState<Application | null>(null);
  const [accountInfo, setAccountInfo] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const errorRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  useGlassMotion(shellRef, !!session);
  useEffect(() => { document.documentElement.dataset.theme = theme; document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#111914' : '#f4fbf6'); writeLocal('credi.ui.theme', theme); }, [theme]);
  useEffect(() => {
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    if (motion.matches || !mainRef.current) return;
    const surfaces = mainRef.current.querySelectorAll<HTMLElement>('.page-heading, .card, .limit-card, .insights');
    const transitions = Array.from(surfaces, (surface, index) => surface.animate([
      { opacity: 0, translate: '0 22px', scale: '.985' },
      { opacity: 1, translate: '0 -1px', scale: '1.002', offset: .75 },
      { opacity: 1, translate: '0 0', scale: '1' },
    ], { duration: 560, delay: Math.min(index * 65, 260), fill: 'backwards', easing: 'cubic-bezier(.16,1,.3,1)' }));
    const cancel = () => { if (motion.matches) transitions.forEach(transition => transition.cancel()); };
    motion.addEventListener('change', cancel);
    return () => { transitions.forEach(transition => transition.cancel()); motion.removeEventListener('change', cancel); };
  }, [page, session?.id]);
  async function refresh() {
    setLoading(true); setLoadError('');
    try { setItems(await creditService.list()); }
    catch (error) { setLoadError((error as Error).message); }
    finally { setLoading(false); }
  }
  useEffect(() => {
    let active = true;
    setItems([]); setLoadError('');
    if (!session) return;
    setLoading(true);
    creditService.list().then(rows => { if (active) setItems(rows); }).catch(error => { if (active) setLoadError(error.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [session?.id]);
  useEffect(() => {
    const expire = () => logout();
    window.addEventListener('credi:unauthorized', expire);
    return () => window.removeEventListener('credi:unauthorized', expire);
  }, []);
  const own = items.filter(i => i.userId === session?.id);
  const current = own[0];
  const displayScore = current?.score;
  const scoreRating = displayScore == null ? 'Chưa có điểm' : 'Đã tính điểm';
  const monthlyIncome = current?.profile ? Number(current.profile.income) : 0;
  const monthlySpending = current?.profile ? Number(current.profile.spending) : 0;
  const financialSource = current?.profile ? 'Từ hồ sơ đã gửi' : 'Chưa có dữ liệu';
  const admin = session?.role === 'admin';
  const nav = admin ? [{ id: 'admin', label: 'Quản lý hồ sơ', icon: LayoutDashboard }, { id: 'guide', label: 'Hướng dẫn', icon: BookOpen }] : [{ id: 'overview', label: 'Tổng quan', icon: LayoutDashboard }, { id: 'application', label: 'Hồ sơ tín dụng', icon: FileText }, { id: 'history', label: 'Lịch sử hồ sơ', icon: Clock3 }, { id: 'guide', label: 'Hướng dẫn', icon: BookOpen }];
  function navigate(next: Page) { setPage(next); setMenu(false); setNotice(''); setErrors({}); window.scrollTo(0, 0); requestAnimationFrame(() => mainRef.current?.focus({ preventScroll: true })); }
  function login(next: Session) {
    setSession(next); setItems([]); setLoadError('');
    const saved = readLocal<Profile>(`credi.api.draft.${next.id}`, emptyProfile);
    setProfile({ ...saved, name: saved.name || next.name, email: saved.email || next.email });
    navigate(next.role === 'admin' ? 'admin' : 'overview');
  }
  function logout() {
    saveSession(null); setSession(null); setItems([]); setLoadError(''); setMenu(false); setDetail(null); setAccountInfo(false); setNotice(''); setSuccess(false); setStep(0); setQuery(''); setFilter('all'); setProfile(emptyProfile); setPage('overview');
  }
  function update<K extends keyof Profile>(key: K, value: Profile[K]) { setProfile(p => ({ ...p, [key]: value })); setErrors(e => { const next = { ...e }; delete next[key]; return next; }); }
  function validate() {
    const e: Record<string, string> = {};
    if (step === 0) {
      if (!profile.name.trim()) e.name = 'Nhập họ và tên của bạn.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) e.email = 'Nhập địa chỉ email hợp lệ.';
      if (!profile.school.trim()) e.school = 'Nhập tên trường hoặc cơ sở đào tạo.';
      if (profile.gpa === '' || Number(profile.gpa) < 0 || Number(profile.gpa) > 4) e.gpa = 'Nhập GPA từ 0 đến 4.';
      if (profile.activities === '' || Number(profile.activities) < 0 || !Number.isInteger(Number(profile.activities))) e.activities = 'Nhập số hoạt động là số nguyên từ 0 trở lên.';
    }
    if (step === 1) {
      if (profile.income === '' || Number(profile.income) < 0) e.income = 'Nhập thu nhập từ 0 đồng trở lên.';
      if (profile.spending === '' || Number(profile.spending) < 0) e.spending = 'Nhập chi tiêu từ 0 đồng trở lên.';
      if (!profile.amount || Number(profile.amount) < 1000000 || Number(profile.amount) > 30000000) e.amount = 'Chọn hạn mức từ 1 đến 30 triệu đồng.';
    }
    if (step === 2 && !profile.consent) e.consent = 'Cần xác nhận trước khi gửi hồ sơ.';
    setErrors(e);
    if (Object.keys(e).length) requestAnimationFrame(() => errorRef.current?.focus());
    return !Object.keys(e).length;
  }
  async function next(e: React.FormEvent) {
    e.preventDefault(); if (!validate()) return;
    if (step < 2) { setStep(step + 1); return; }
    setBusy(true); try { const result = await creditService.submit(profile); setItems(rows => [result.item, ...rows.filter(row => row.id !== result.item.id)]); navigate('application'); setSuccess(true); if (!result.cached) setNotice('Hồ sơ đã được lưu trên máy chủ nhưng không thể lưu biên nhận trên trình duyệt. Không gửi lại hồ sơ.'); } catch (e) { setNotice((e as Error).message); } finally { setBusy(false); }
  }
  async function review(status: 'approved' | 'rejected') {
    if (!detail) return; setBusy(true);
    try { await creditService.review(detail.id, status); setItems(rows => rows.map(row => row.id === detail.id ? { ...row, status } : row)); setDetail(null); setNotice(`Đã ${status === 'approved' ? 'phê duyệt' : 'từ chối'} hồ sơ ${detail.id}.`); } catch (e) { setNotice((e as Error).message); } finally { setBusy(false); }
  }
  function field(key: keyof Profile, label: string, options: { type?: string; placeholder?: string; min?: number; max?: number; step?: string; hint?: string } = {}) {
    return <div className="field"><label htmlFor={key}>{label}</label><input id={key} name={key} value={String(profile[key])} type={options.type || 'text'} placeholder={options.placeholder} min={options.min} max={options.max} step={options.step} onChange={e => update(key, e.target.value)} aria-invalid={!!errors[key]} aria-describedby={errors[key] ? `${key}-error` : options.hint ? `${key}-hint` : undefined}/>{options.hint && <small id={`${key}-hint`}>{options.hint}</small>}{errors[key] && <small className="field-error" id={`${key}-error`}>{errors[key]}</small>}</div>;
  }
  function table(data: Application[]) { return <div className="table-wrap"><table><thead><tr><th>Hồ sơ</th>{admin && <th>Người nộp</th>}<th>Ngày nộp</th><th>Hạn mức đề xuất</th><th>Trạng thái</th><th><span className="sr-only">Chi tiết</span></th></tr></thead><tbody>{data.map(item => <tr key={item.id}><td><span className="table-id"><FileText size={17}/>{item.id}</span></td>{admin && <td>{item.name}</td>}<td>{date(item.date)}</td><td>{money(item.amount)}</td><td><Status value={item.status}/></td><td><button className="icon-button" onClick={() => setDetail(item)} aria-label={`Xem hồ sơ ${item.id}`}><ArrowUpRight size={17}/></button></td></tr>)}</tbody></table>{!data.length && <div className="empty"><Search size={32}/><h3>Chưa có hồ sơ phù hợp</h3><p>Hãy tạo hồ sơ hoặc kiểm tra bộ lọc.</p></div>}</div>; }

  if (!session) return <AuthScreen theme={theme} onTheme={setTheme} onLogin={login}/>;

  return <div className="app-shell" ref={shellRef}>
    <GlassBackdrop/>
    <a className="skip-link" href="#main">Đến nội dung chính</a>
    <aside className={`sidebar ${menu ? 'open' : ''}`}><Brand/><div className="workspace-label">{admin ? 'Không gian quản trị' : 'Không gian cá nhân'}</div><LiquidNav items={nav} active={page} onNavigate={id => navigate(id as Page)}/><div className="glass-side-note"><span className="sidebar-help-icon"><CircleHelp size={20}/></span><h3>Cần hỗ trợ?</h3><p>Tìm hiểu điểm tín dụng và cách hoàn thiện hồ sơ.</p><button className="text-button" onClick={() => navigate('guide')}>Xem hướng dẫn<ArrowUpRight size={14}/></button></div><div className="sidebar-foot"><LockKeyhole size={14}/><span>Kết nối ACSS Backend</span></div></aside>
    {menu && <button className="nav-scrim" aria-label="Đóng điều hướng" onClick={() => setMenu(false)}/>}
    <div className="main-shell"><header className="topbar"><div className="breadcrumb"><button className="icon-button mobile-menu" aria-label="Mở điều hướng" aria-expanded={menu} onClick={() => setMenu(!menu)}><Menu size={21}/></button><span>Không gian {admin ? 'quản trị' : 'cá nhân'}</span><ChevronRight size={13}/><strong>{nav.find(n => n.id === page)?.label}</strong></div><div className="top-actions"><span className="demo-badge"><span/>ACSS local</span><AccountMenu session={session} theme={theme} busy={busy} onTheme={setTheme} onAccount={() => setAccountInfo(true)} onHistory={() => navigate(admin ? 'admin' : 'history')} onHelp={() => navigate('guide')} onLogout={logout}/></div></header>
    <main id="main" ref={mainRef} tabIndex={-1} data-page={page} aria-busy={loading}>
      {loading && <div className="notice" role="status">Đang tải hồ sơ từ máy chủ…</div>}
      {loadError && <div className="notice" role="alert"><span>{loadError}</span><button className="text-button" onClick={refresh}>Thử lại</button></div>}
      {!admin && <div className="api-scope-note"><CircleHelp size={15}/><span>BE chưa có API lịch sử cá nhân. Danh sách hiển thị biên nhận gửi từ trình duyệt này; trạng thái là trạng thái lúc gửi.</span></div>}
      {notice && <div className="notice" role="status"><CircleHelp size={17}/><span>{notice}</span><button className="icon-button" onClick={() => setNotice('')} aria-label="Đóng thông báo"><X size={16}/></button></div>}
      {page === 'overview' && <>
        <div className="page-heading"><div><h1>Chào {session.name.split(' ').slice(-2).join(' ')}<span className="greeting-dot"/></h1><p>Một góc nhìn rõ hơn về sức khỏe tín dụng của bạn.</p></div><button className="button primary" onClick={() => { setSuccess(false); setStep(0); navigate('application'); }}><Plus size={18}/>Tạo hồ sơ mới</button></div>
        <div className="overview-top">
          <section className="card credit-score-card">
            <div className="section-heading"><div><h2>Điểm tín dụng</h2><p>Bức tranh tín nhiệm của bạn</p></div><span className="subtle-tag"><span className="sample-dot"/>Điểm từ máy chủ</span></div>
            <div className="score-content"><Score score={displayScore}/><div className="score-summary"><span className="score-rating"><span/>{scoreRating}</span><h3>Tín nhiệm từ dữ liệu</h3><p>Khám phá cách thông tin học tập, thu nhập và chi tiêu tạo nên hồ sơ tín nhiệm.</p><button className="text-button" onClick={() => navigate('guide')}>Tìm hiểu cách đánh giá<ArrowUpRight size={15}/></button></div></div>
            <div className="score-footer"><span><Clock3 size={14}/>{current ? `Hồ sơ ngày ${date(current.date)}` : 'Chưa có hồ sơ cá nhân'}</span><span>Thuật toán BE: 300–470</span></div>
          </section>
          <section className="limit-card">
            <div className="limit-top"><span className="overline">Hạn mức đề xuất</span><span className="limit-symbol"><CreditCard size={21}/></span></div>
            <div className="limit-amount">{current?.amount == null ? '—' : new Intl.NumberFormat('vi-VN').format(current.amount)} <span>₫</span></div>
            <p>Số tiền đã đề xuất, chưa phải hạn mức được cấp.</p>
            <div className="limit-details"><div><span>Hồ sơ gần nhất</span><strong>{current?.id ?? 'Chưa có hồ sơ'}</strong></div><div><span>Trạng thái</span>{current ? <Status value={current.status}/> : <strong>Chưa bắt đầu</strong>}</div></div>
            <button className="limit-link" onClick={() => navigate('history')}>Xem hồ sơ của tôi<ArrowUpRight size={17}/></button>
            <div className="limit-foot"><ShieldCheck size={14}/><span>Chưa phải đề nghị cấp tín dụng.</span></div>
          </section>
        </div>
        <section className="insights" aria-label="Thông tin tài chính và học tập">
          <div className="insight"><span className="insight-icon"><Wallet size={20}/></span><div><span>Thu nhập / tháng</span><strong>{current ? new Intl.NumberFormat('vi-VN').format(monthlyIncome) : '—'} <small>₫</small></strong><small className="muted">{financialSource}</small></div></div>
          <div className="insight"><span className="insight-icon"><ArrowUpRight size={20}/></span><div><span>Chi tiêu / tháng</span><strong>{current ? new Intl.NumberFormat('vi-VN').format(monthlySpending) : '—'} <small>₫</small></strong><small className="muted">{monthlyIncome > 0 ? `${Math.round(monthlySpending / monthlyIncome * 100)}% thu nhập` : 'Chưa có tỷ lệ thu nhập'} · {financialSource.toLocaleLowerCase('vi')}</small></div></div>
          <div className="insight"><span className="insight-icon"><GraduationCap size={21}/></span><div><span>Học tập & hoạt động</span><strong>{current?.profile?.gpa ?? '—'} <small>/ 4.0 GPA</small></strong><small className="muted">{current?.profile?.activities ?? '—'} hoạt động · {financialSource.toLocaleLowerCase('vi')}</small></div></div>
        </section>
        <div className="overview-bottom"><section className="card recent-card"><div className="section-heading"><div><h2>Hồ sơ gần đây</h2><p>Biên nhận hồ sơ trên thiết bị này.</p></div><button className="text-button neutral" onClick={() => navigate('history')}>Xem tất cả<ArrowRight size={15}/></button></div>{table(own.slice(0, 3))}</section><section className="card journey-card"><div className="section-heading"><h2>Hành trình tín nhiệm</h2><span className="step-counter">Quy trình</span></div><ol className="journey"><li className={current ? 'done' : ''}><span>{current ? <Check size={15}/> : '1'}</span><div><strong>Chia sẻ thông tin</strong><p>Học tập, thu nhập và chi tiêu.</p></div></li><li className={current ? 'done' : ''}><span>{current ? <Check size={15}/> : '2'}</span><div><strong>Khám phá điểm tín dụng</strong><p>Góc nhìn từ dữ liệu thay thế.</p></div></li><li className={current && current.status !== 'pending' ? 'done' : ''}><span>{current && current.status !== 'pending' ? <Check size={15}/> : '3'}</span><div><strong>Nhận kết quả xét duyệt</strong><p>{current ? statusNames[current.status] : 'Theo dõi sau khi gửi hồ sơ.'}</p></div></li></ol><button className="journey-link" onClick={() => navigate('guide')}>Hiểu thêm về quy trình<ArrowUpRight size={16}/></button></section></div>
        <div className="bottom-note"><LockKeyhole size={13}/><span>Hồ sơ được gửi đến ACSS Backend và lưu trong SQLite.</span></div>
      </>}
      {page === 'application' && <><div className="page-heading"><div><div className="eyebrow">Hồ sơ của bạn</div><h1>Khởi đầu từ những điều nhỏ.</h1><p>Chia sẻ một chút về bạn để hoàn thiện hồ sơ tín nhiệm.</p></div></div>{success ? <section className="card success-card"><span className="success-icon"><Check size={32}/></span><span className="overline">ĐÃ GỬI HỒ SƠ</span><h2>Thêm một bước tiến về phía trước.</h2><p>Máy chủ đã tiếp nhận và tính điểm. Quản trị viên đăng nhập để xét duyệt.</p><Status value="pending"/><button className="button primary" onClick={() => { setSuccess(false); setStep(0); navigate('history'); }}>Theo dõi hồ sơ<ArrowRight size={17}/></button></section> : <div className="form-layout"><section className="card form-card"><ol className="form-steps">{['Thông tin cá nhân', 'Tài chính', 'Xác nhận'].map((s, i) => <li key={s} aria-current={step === i ? 'step' : undefined} className={step >= i ? 'active' : ''}><span>{step > i ? <Check size={14}/> : i + 1}</span><strong>{s}</strong></li>)}</ol><form noValidate onSubmit={next}>{Object.keys(errors).length > 0 && <div className="error-summary" ref={errorRef} tabIndex={-1} role="alert"><strong>Kiểm tra lại thông tin</strong>{Object.entries(errors).map(([key, msg]) => <a key={key} href={`#${key}`}>{msg}</a>)}</div>}<div className="form-title"><span className="overline">BƯỚC 0{step + 1} / 03</span><h2>{['Làm quen một chút nhé.', 'Bức tranh tài chính của bạn.', 'Mọi thứ đã sẵn sàng?'][step]}</h2><p>{['Bắt đầu với thông tin học tập và liên hệ.', 'Nhập số tiền trung bình mỗi tháng, tính bằng VNĐ.', 'Kiểm tra thông tin trước khi gửi hồ sơ.'][step]}</p></div>{step === 0 && <div className="field-grid">{field('name', 'Họ và tên', { placeholder: 'Nguyễn Minh Anh' })}{field('email', 'Email', { type: 'email', placeholder: 'ban@example.com' })}<div className="span-2">{field('school', 'Trường / cơ sở đào tạo', { placeholder: 'Ví dụ: Đại học Công nghệ Thông tin' })}</div>{field('gpa', 'Điểm trung bình (GPA)', { type: 'number', min: 0, max: 4, step: '0.01', placeholder: '3.60', hint: 'Sử dụng thang điểm 4.0.' })}{field('activities', 'Số hoạt động / dự án đã tham gia', { type: 'number', min: 0, step: '1', placeholder: '4' })}</div>}{step === 1 && <div className="field-grid"><div className="field span-2"><label htmlFor="employment">Tình trạng công việc</label><select id="employment" value={profile.employment} onChange={e => update('employment', e.target.value)}><option value="part-time">Làm việc bán thời gian</option><option value="freelance">Làm việc tự do</option><option value="full-time">Làm việc toàn thời gian</option><option value="none">Chưa có công việc</option></select></div>{field('income', 'Thu nhập hàng tháng (VNĐ)', { type: 'number', min: 0, placeholder: '5000000' })}{field('spending', 'Chi tiêu hàng tháng (VNĐ)', { type: 'number', min: 0, placeholder: '3200000' })}<div className="field"><label htmlFor="purpose">Mục đích sử dụng</label><select id="purpose" value={profile.purpose} onChange={e => update('purpose', e.target.value)}>{['Học tập', 'Thiết bị học tập', 'Chi phí sinh hoạt', 'Khác'].map(p => <option key={p}>{p}</option>)}</select></div>{field('amount', 'Hạn mức mong muốn (VNĐ)', { type: 'number', min: 1000000, max: 30000000, step: '100000', hint: 'Từ 1.000.000 đến 30.000.000 đồng.' })}</div>}{step === 2 && <><dl className="review-list">{[['Họ và tên', profile.name], ['Email', profile.email], ['Trường', profile.school], ['GPA / Hoạt động', `${profile.gpa} / ${profile.activities} hoạt động`], ['Thu nhập / tháng', money(Number(profile.income))], ['Chi tiêu / tháng', money(Number(profile.spending))], ['Mục đích', profile.purpose], ['Hạn mức mong muốn', money(Number(profile.amount))]].map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl><label className="consent"><input id="consent" type="checkbox" checked={profile.consent} onChange={e => update('consent', e.target.checked)} aria-invalid={!!errors.consent}/><span>Tôi xác nhận thông tin và đồng ý gửi hồ sơ đến ACSS Backend đang chạy local.</span></label>{errors.consent && <p className="field-error">{errors.consent}</p>}</>}<div className="form-actions"><button type="button" className="button secondary" onClick={() => { if (step > 0) { setStep(step - 1); setErrors({}); } else { setNotice(writeLocal(`credi.api.draft.${session.id}`, profile) ? 'Đã lưu bản nháp trên trình duyệt này.' : 'Không thể lưu bản nháp. Vui lòng kiểm tra quyền lưu trữ.'); } }}>{step > 0 ? <><ChevronLeft size={16}/>Quay lại</> : 'Lưu bản nháp'}</button><button type="submit" className="button primary" disabled={busy}>{busy ? 'Đang gửi…' : step === 2 ? 'Gửi hồ sơ' : 'Tiếp tục'}<ArrowRight size={17}/></button></div></form></section><aside className="form-aside"><div className="aside-illustration"><FileText size={38}/><span><Check size={17}/></span></div><h3>Tín nhiệm không chỉ<br/>là lịch sử vay.</h3><p>Những thông tin quen thuộc mỗi ngày có thể mở ra một góc nhìn khác về tiềm năng của bạn.</p><hr/><div><ShieldCheck size={18}/><p>Chỉ dùng dữ liệu giả khi trải nghiệm bản mẫu này.</p></div><div><Clock3 size={18}/><p>Bạn có thể lưu bản nháp ở bước đầu để hoàn thiện sau.</p></div></aside></div>}</>}
      {(page === 'history' || page === 'admin') && <><div className="page-heading"><div><div className="eyebrow">{admin ? 'Không gian quản trị' : 'Hồ sơ của bạn'}</div><h1>{admin ? 'Quản lý hồ sơ.' : 'Lịch sử hồ sơ.'}</h1><p>{admin ? 'Danh sách và trạng thái được lấy trực tiếp từ máy chủ.' : 'Biên nhận các hồ sơ đã gửi từ trình duyệt này.'}</p></div>{admin && <button className="button secondary" onClick={refresh} disabled={loading}>{loading ? 'Đang tải…' : 'Làm mới'}</button>}{!admin && <button className="button primary" onClick={() => { setSuccess(false); setStep(0); navigate('application'); }}><Plus size={17}/>Tạo hồ sơ mới</button>}</div>{admin && <div className="admin-stats">{[['Tổng hồ sơ', items.length], ['Chờ duyệt', items.filter(i => i.status === 'pending').length], ['Đã phê duyệt', items.filter(i => i.status === 'approved').length]].map(([label, value]) => <div className="card" key={label}><span>{label}</span><strong>{value.toString().padStart(2, '0')}</strong></div>)}</div>}<section className="card"><div className="table-toolbar"><div className="search-field"><Search size={17}/><input aria-label="Tìm hồ sơ" placeholder={admin ? 'Tìm mã hồ sơ, người nộp…' : 'Tìm mã hồ sơ…'} value={query} onChange={e => setQuery(e.target.value)}/></div><label className="filter"><span className="sr-only">Lọc trạng thái</span><select value={filter} onChange={e => setFilter(e.target.value)}><option value="all">Tất cả trạng thái</option><option value="pending">Chờ duyệt</option><option value="approved">Đã phê duyệt</option><option value="rejected">Đã từ chối</option></select></label></div>{table((admin ? items : own).filter(i => (filter === 'all' || i.status === filter) && `${i.id} ${i.name}`.toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi'))))}<div className="table-foot">{admin ? 'API chỉ trả mã hồ sơ, tên đăng nhập, điểm và trạng thái. Ngày nộp, hạn mức và chi tiết chưa được API cung cấp.' : 'Biên nhận lưu trên thiết bị; trạng thái sau xét duyệt chưa có API để đồng bộ.'}</div></section></>}
      {page === 'guide' && <><div className="page-heading"><div><div className="eyebrow">Hướng dẫn sử dụng</div><h1>Tín nhiệm từ những điều nhỏ.</h1><p>Cách Credi kết nối dữ liệu thay thế với hồ sơ tín dụng.</p></div></div><div className="guide-hero card"><span className="guide-icon"><Leaf size={38}/></span><h2>Mỗi người có một câu chuyện.<br/>Điểm tín dụng cũng vậy.</h2><p>Hồ sơ được gửi đến backend. Điểm được máy chủ tính từ GPA, thu nhập, chi tiêu và hoạt động; số tiền đề xuất do bạn nhập, chưa phải hạn mức được cấp.</p></div><div className="guide-grid">{[{ icon: FileText, title: '01. Hoàn thiện hồ sơ', text: 'Nhập thông tin cá nhân, học tập và tài chính qua 3 bước. Kiểm tra lại trước khi gửi.' }, { icon: Sparkles, title: '02. Nhận điểm từ backend', text: 'Điểm gốc 300; GPA từ 3.6 cộng 100, từ 3.2 cộng 50; thu nhập trừ chi tiêu trên 1 triệu cộng 50; từ 2 hoạt động cộng 20. Tối đa hiện tại là 470.' }, { icon: ShieldCheck, title: '03. Thử quy trình duyệt', text: 'Đăng nhập bằng tài khoản quản trị để lấy danh sách và phê duyệt hoặc từ chối trên máy chủ.' }].map(({ icon: Icon, title, text }) => <section className="card" key={title}><Icon size={24}/><h3>{title}</h3><p>{text}</p></section>)}</div><div className="guide-note"><LockKeyhole size={21}/><div><h3>Về dữ liệu và tài khoản</h3><p>Đăng nhập sử dụng JWT. BE chưa cung cấp đăng ký, lịch sử cá nhân hoặc chi tiết hồ sơ. Dùng dữ liệu thử khi chạy local; đây chưa phải dịch vụ ngân hàng.</p></div></div></>}
      <footer><span>© 2026 Credi</span><span>Được tạo cho những khởi đầu.</span><span>ACSS ? Local</span></footer>
    </main></div>
    {detail && <Modal title={`Hồ sơ ${detail.id}`} onClose={() => { if (!busy) setDetail(null); }}><div className="detail-top"><span className="avatar">{detail.name.split(' ').slice(-2).map(n => n[0]).join('')}</span><div><h3>{detail.name}</h3><p>Nộp ngày {date(detail.date)}</p></div><Status value={detail.status}/></div><dl className="review-list"><div><dt>Điểm từ máy chủ</dt><dd>{detail.score} / 470</dd></div><div><dt>Hạn mức đề xuất</dt><dd>{money(detail.amount)}</dd></div>{detail.profile && <><div><dt>Trường</dt><dd>{detail.profile.school}</dd></div><div><dt>GPA / Hoạt động</dt><dd>{detail.profile.gpa} / {detail.profile.activities}</dd></div><div><dt>Thu nhập / tháng</dt><dd>{money(Number(detail.profile.income))}</dd></div><div><dt>Chi tiêu / tháng</dt><dd>{money(Number(detail.profile.spending))}</dd></div><div><dt>Mục đích</dt><dd>{detail.profile.purpose}</dd></div></>}</dl><p className="modal-note">{detail.source === 'server' ? 'Dữ liệu từ API quản trị. Các trường chưa có trong phản hồi được ghi rõ.' : 'Biên nhận gửi thành công. Trạng thái lúc gửi; BE chưa có API lịch sử cá nhân để đồng bộ xét duyệt.'}</p><div className="modal-actions"><button className="button secondary" disabled={busy} onClick={() => setDetail(null)}>Đóng</button>{admin && detail.status === 'pending' && <><button className="button destructive" disabled={busy} onClick={() => review('rejected')}>Từ chối</button><button className="button primary" disabled={busy} onClick={() => review('approved')}>{busy ? 'Đang lưu…' : 'Phê duyệt'}<Check size={16}/></button></>}</div></Modal>}
    {accountInfo && <Modal title="Thông tin tài khoản" onClose={() => setAccountInfo(false)}><div className="account-detail-identity"><span className="avatar">{initials(session.name)}</span><h3>{session.name}</h3><p>{session.email}</p><span className="subtle-tag">{admin ? 'Quản trị viên' : 'Tài khoản cá nhân'}</span></div><dl className="review-list"><div><dt>Tên đăng nhập</dt><dd>{session.username}</dd></div><div><dt>Email</dt><dd>{session.email || 'API chưa cung cấp'}</dd></div><div><dt>Vai trò</dt><dd>{admin ? 'Quản trị viên' : 'Người dùng'}</dd></div><div><dt>Số hồ sơ đã nộp</dt><dd>{own.length}</dd></div><div><dt>Phiên làm việc</dt><dd>JWT · ACSS Backend</dd></div></dl><p className="modal-note">Vai trò do backend trả về khi đăng nhập. Để đổi tài khoản, hãy đăng xuất rồi đăng nhập lại.</p><div className="modal-actions"><button className="button secondary" onClick={() => setAccountInfo(false)}>Đóng</button><button className="button primary" onClick={() => { setAccountInfo(false); navigate(admin ? 'admin' : 'history'); }}>Xem hồ sơ<ArrowRight size={16}/></button></div></Modal>}
  </div>;
}
