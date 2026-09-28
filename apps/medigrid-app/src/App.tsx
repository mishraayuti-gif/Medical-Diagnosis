import { useState, useRef, useEffect, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Activity, ArrowRight, Bell, Bot, Brain, CalendarDays, Check, ChevronDown, CircleHelp, Clock3,
  ExternalLink, FileText, Headphones, HeartPulse, Hospital, LayoutDashboard, Leaf, LockKeyhole, MapPin,
  Menu, MessageCircle, Mic, MicOff, MoreHorizontal, Music, Pause, PhoneCall, PhoneOff, Pill, Play, Plus, Radio, RefreshCw, Search, Send, ShieldCheck, Sparkles,
  Stethoscope, Star, Trash2, TrendingUp, UserRound, UsersRound, Volume2, VolumeX, X, Zap,
} from 'lucide-react';
import {
  getGetDashboardSummaryQueryKey,
  getGetMyPatientProfileQueryKey,
  getListAppointmentsQueryKey,
  getListPrescriptionsQueryKey,
  useAnalyzeSymptoms,
  useCreateAppointment,
  useCreatePrescription,
  useGetDashboardSummary,
  useGetMyPatientProfile,
  useHealthCheck,
  useListAppointments,
  useListDoctors,
  useListNearbyHealthcare,
  useListPrescriptions,
  usePredictMentalState,
  useUpdateMyPatientProfile,
  type Appointment,
  type Doctor,
  type PatientProfile,
  type Prescription,
  type SymptomAnalysis,
  type NearbyPlace,
  type MLPredictResponse,
} from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Link, Route, Switch, Router as WouterRouter, useLocation } from 'wouter';

const queryClient = new QueryClient();

const fallbackProfile: PatientProfile = {
  id: 1, name: 'Amara Singh', age: 34, gender: 'Female', bloodGroup: 'O+',
  phone: '+1 (415) 555-0182', allergies: ['Penicillin'], conditions: ['Mild asthma'],
  height: 168, weight: 64, bloodPressure: '118/76', bloodSugar: '92 mg/dL',
};
const fallbackAppointments: Appointment[] = [
  { id: 1, doctorName: 'Dr. Elena Vance', specialty: 'Primary care', date: '2025-06-18', time: '10:30 AM', status: 'upcoming', location: 'Harborview Clinic' },
  { id: 2, doctorName: 'Dr. Jonah Reed', specialty: 'Pulmonology', date: '2025-05-02', time: '2:00 PM', status: 'completed', location: 'North Bay Medical' },
];
const fallbackDoctors: Doctor[] = [
  { id: 1, name: 'Dr. Elena Vance', specialty: 'Primary care', experience: '12 years', rating: 4.9, distance: '0.8 mi', availability: ['Today, 10:30 AM', 'Tomorrow, 9:00 AM'] },
  { id: 2, name: 'Dr. Jonah Reed', specialty: 'Pulmonology', experience: '9 years', rating: 4.8, distance: '1.6 mi', availability: ['Wed, 2:00 PM', 'Thu, 11:30 AM'] },
  { id: 3, name: 'Dr. Mira Chen', specialty: 'Dermatology', experience: '15 years', rating: 4.9, distance: '2.4 mi', availability: ['Fri, 8:30 AM', 'Fri, 4:00 PM'] },
];

function IconMark({ small = false }: { small?: boolean }) {
  return <div className={`brand-mark ${small ? 'brand-mark-small' : ''}`} aria-label="MediGrid"><span><HeartPulse size={small ? 16 : 22} strokeWidth={2.6} /></span></div>;
}

function Logo({ light = false }: { light?: boolean }) {
  return <Link href="/" className={`logo ${light ? 'logo-light' : ''}`} data-testid="link-logo"><IconMark small /><span>medi<span>grid</span></span></Link>;
}

function Button({ children, variant = 'primary', className = '', onClick, type = 'button', disabled = false, testId, style }: { children: ReactNode; variant?: 'primary' | 'soft' | 'outline' | 'ghost' | 'danger'; className?: string; onClick?: () => void; type?: 'button' | 'submit'; disabled?: boolean; testId?: string; style?: React.CSSProperties }) {
  return <button type={type} disabled={disabled} onClick={onClick} data-testid={testId} style={style} className={`button button-${variant} ${className}`}>{children}</button>;
}

function Badge({ children, tone = 'mint' }: { children: ReactNode; tone?: 'mint' | 'amber' | 'rose' | 'slate' | 'purple' }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

function Card({ children, className = '', testId, style }: { children: ReactNode; className?: string; testId?: string; style?: React.CSSProperties }) {
  return <section className={`card ${className}`} style={style} data-testid={testId}>{children}</section>;
}

function Avatar({ name, tone = 'sage' }: { name: string; tone?: string }) {
  const initials = name.split(' ').filter(Boolean).map((part) => part[0]).slice(0, 2).join('');
  return <div className={`avatar avatar-${tone}`} aria-label={name}>{initials}</div>;
}

function LoadingBlock({ label = 'Loading your care view' }: { label?: string }) {
  return <div className="loading-block" data-testid="status-loading"><div className="skeleton skeleton-lg" /><div className="skeleton skeleton-sm" /><span>{label}</span></div>;
}

function EmptyState({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return <div className="empty-state"><div className="empty-icon"><Leaf size={20} /></div><h3>{title}</h3><p>{text}</p>{action}</div>;
}

function Shell({ children, role = 'patient' }: { children: ReactNode; role?: 'patient' | 'doctor' | 'reception' | 'admin' }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();
  const roleLabel = role === 'patient' ? 'Patient view' : role === 'doctor' ? 'Care team' : role === 'reception' ? 'Front desk' : 'Admin console';
  const nav = role === 'patient'
    ? [
      ['/dashboard', 'Overview', LayoutDashboard],
      ['/chat', 'Real-Time AI Chat', Bot],
      ['/soundscapes', 'Peace Music & Sound', Music],
      ['/analytics', 'Mental & Health AI', Brain],
      ['/streamlit', 'Streamlit ML Studio', TrendingUp],
      ['/portal', 'Dark Neural Portal', Sparkles],
      ['/symptoms', 'Symptom guide', MessageCircle],
      ['/appointments', 'Appointments', CalendarDays],
      ['/records', 'Records & Prescriptions', FileText],
      ['/nearby', 'Care nearby', MapPin],
    ] as const
    : role === 'doctor'
      ? [['/doctor', 'Today', LayoutDashboard], ['/appointments', 'Appointments', CalendarDays], ['/records', 'Patient records & Rx', FileText], ['/analytics', 'Clinical insights', TrendingUp]] as const
      : role === 'reception'
        ? [['/reception', 'Front desk', LayoutDashboard], ['/appointments', 'Schedule', CalendarDays], ['/nearby', 'Locations', MapPin]] as const
        : [['/admin', 'Verification queue', ShieldCheck], ['/analytics', 'Platform insights', TrendingUp], ['/records', 'Data health', FileText]] as const;
  return <div className="app-shell">
    <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
      <div className="sidebar-top"><Logo light /><button className="mobile-close" onClick={() => setMobileOpen(false)} data-testid="button-close-menu"><X size={18} /></button></div>
      <div className="view-switcher"><span className="view-dot" /><span>{roleLabel}</span><ChevronDown size={14} /></div>
      <nav className="sidebar-nav" aria-label="Main navigation">
        <p className="eyebrow sidebar-label">Workspace</p>
        {nav.map(([href, label, NavIcon]) => <Link href={href} key={href} onClick={() => setMobileOpen(false)} className={`sidebar-link ${location === href ? 'sidebar-link-active' : ''}`} data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`}><NavIcon size={18} /><span>{label}</span>{href === '/analytics' && <span className="new-dot">ML</span>}</Link>)}
        
        <p className="eyebrow sidebar-label" style={{ marginTop: '1.2rem' }}>Portals & Tools</p>
        <a href="http://localhost:8501" target="_blank" rel="noopener noreferrer" className="sidebar-link" title="Open Streamlit ML Dashboard"><TrendingUp size={18} /><span>ML Dashboard</span><ExternalLink size={13} style={{ marginLeft: 'auto', opacity: 0.6 }} /></a>
        <a href="/portal/index.html" target="_blank" rel="noopener noreferrer" className="sidebar-link" title="Open Static Dark Showcase Portal"><Sparkles size={18} /><span>Dark Showcase</span><ExternalLink size={13} style={{ marginLeft: 'auto', opacity: 0.6 }} /></a>
      </nav>
      <div className="sidebar-bottom">
        <Link href="/nearby" className="help-link" data-testid="link-help"><CircleHelp size={17} /><span>Need a hand?</span></Link>
        <div className="sidebar-user"><Avatar name="Amara Singh" tone="peach" /><div><strong>Amara Singh</strong><small>Personal account</small></div><MoreHorizontal size={17} /></div>
      </div>
    </aside>
    <div className="shell-main">
      <header className="topbar"><button className="menu-button" onClick={() => setMobileOpen(true)} data-testid="button-open-menu"><Menu size={21} /></button><div className="crumb"><span>{roleLabel}</span><span className="crumb-slash">/</span><strong>{location === '/dashboard' ? 'Overview' : location.replace('/', '').replace('-', ' ') || 'Overview'}</strong></div><div className="topbar-actions"><button className="icon-button" data-testid="button-notifications"><Bell size={19} /><i /></button><Link href="/login" className="profile-chip" data-testid="link-account"><Avatar name="Amara Singh" tone="peach" /><span>Amara</span></Link></div></header>
      <main className="page-area page-enter">{children}</main>
    </div>
  </div>;
}

function PageHeader({ eyebrow, title, detail, action }: { eyebrow: string; title: string; detail?: string; action?: ReactNode }) {
  return <div className="page-header rise-in"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{detail && <p className="page-detail">{detail}</p>}</div>{action}</div>;
}

function Landing() {
  const { data: health } = useHealthCheck();
  return <div className="landing">
    <header className="landing-nav"><Logo /><div className="landing-links"><a href="#how-it-works" data-testid="link-how-it-works">How it works</a><Link href="/chat" data-testid="link-chat-nav">Real-Time AI Chat</Link><Link href="/analytics" data-testid="link-ml-nav">Mental health AI</Link><a href="#care-teams" data-testid="link-care-teams">For care teams</a><Link href="/login" data-testid="link-login-nav">Sign in</Link><Link href="/signup" className="button button-primary" data-testid="link-signup-nav">Get started <ArrowRight size={15} /></Link></div></header>
    <section className="hero">
      <div className="hero-copy rise-in"><div className="status-pill"><span className="status-pulse" /> A clearer way to care</div><h1>Feel more in<br /><em>the know.</em></h1><p>MediGrid brings symptom guidance, AI mental wellness screening, doctor bookings, e-prescriptions, and nearby care into one connected loop.</p><div className="hero-actions"><Link href="/chat" className="button button-primary" data-testid="link-hero-chat">Talk to AI Assistant <Bot size={16} /></Link><Link href="/signup" className="button button-soft" style={{ marginLeft: '0.5rem' }} data-testid="link-hero-start">Get Started <ArrowRight size={16} /></Link></div><div className="trusted-line"><ShieldCheck size={16} /> Private by design <span /> <span>{health?.status === 'ok' ? 'Care network online' : 'Built around your care'}</span></div></div>
      <div className="hero-visual rise-in delay-2"><div className="orb orb-one" /><div className="orb orb-two" /><div className="hero-card hero-card-main"><div className="mini-card-top"><span className="mini-label">Your care today</span><span className="mini-menu">•••</span></div><div className="hero-score"><div className="score-ring"><strong>86</strong><small>/100</small></div><div><h3>Looking steady</h3><p>Based on your recent check-ins</p></div></div><div className="hero-metric"><span>Wellness rhythm</span><div className="metric-bars"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div><small>Last 10 days</small></div><div className="hero-next"><div className="next-icon"><CalendarDays size={16} /></div><div><small>NEXT UP</small><strong>Dr. Elena Vance · Jun 18</strong></div><ArrowRight size={16} /></div></div><div className="floating-note"><div className="note-icon"><Check size={15} /></div><div><strong>Good morning, Amara</strong><span>One small step at a time.</span></div></div><div className="hero-stamp"><HeartPulse size={19} /><span>Care,<br />connected.</span></div></div>
    </section>
    <section className="trust-strip"><p>Designed with the people behind your care</p><div><span><Hospital size={17} /> Harborview</span><span><Activity size={17} /> North Bay</span><span><ShieldCheck size={17} /> CarePath</span><span><Stethoscope size={17} /> Open clinic</span></div></section>
    <section className="story-section" id="how-it-works">
      <div className="section-kicker">Unified Healthcare Ecosystem</div>
      <h2>Your health has a lot to say.<br /><em>We bring all dimensions together.</em></h2>
      <p className="section-lead">From machine learning mental wellness to clinician prescriptions and live triage — MediGrid connects every piece.</p>
      
      {/* 3-Pillar Visual Photography Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '3rem', textAlign: 'left' }}>
        <div className="card" style={{ overflow: 'hidden', padding: 0, borderRadius: '18px', border: '1px solid rgba(56,189,248,0.2)' }}>
          <img src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=700&q=80" alt="Clinical Care" style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
          <div style={{ padding: '1.4rem' }}>
            <span className="badge badge-mint" style={{ marginBottom: '0.6rem' }}>Clinical Care</span>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.4rem' }}>E-Prescriptions & Care Nearby</h3>
            <p style={{ fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))', lineHeight: '1.5' }}>Create and access digital prescriptions with dosages, schedule appointments, and locate nearby medical centers in real time.</p>
            <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1rem' }}>
              <Link href="/records" className="button button-soft" style={{ fontSize: '0.78rem', padding: '6px 12px' }}>View Records</Link>
              <Link href="/nearby" className="button button-outline" style={{ fontSize: '0.78rem', padding: '6px 12px' }}>Find Clinics</Link>
            </div>
          </div>
        </div>

        <div className="card" style={{ overflow: 'hidden', padding: 0, borderRadius: '18px', border: '1px solid rgba(168,85,247,0.2)' }}>
          <img src="https://images.unsplash.com/photo-1559757175-0eb30cd8c063?auto=format&fit=crop&w=700&q=80" alt="Mental Wellness AI" style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
          <div style={{ padding: '1.4rem' }}>
            <span className="badge badge-amber" style={{ marginBottom: '0.6rem' }}>Psychometric AI</span>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.4rem' }}>DASS-42 Machine Learning</h3>
            <p style={{ fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))', lineHeight: '1.5' }}>Population-trained machine learning models classify depression, anxiety, and stress risk bands from Big-Five personality traits.</p>
            <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1rem' }}>
              <Link href="/analytics" className="button button-primary" style={{ fontSize: '0.78rem', padding: '6px 12px' }}>AI Screener</Link>
              <a href="http://localhost:8501" target="_blank" rel="noopener noreferrer" className="button button-soft" style={{ fontSize: '0.78rem', padding: '6px 12px' }}>Streamlit Dashboard ↗</a>
            </div>
          </div>
        </div>

        <div className="card" style={{ overflow: 'hidden', padding: 0, borderRadius: '18px', border: '1px solid rgba(56,189,248,0.2)' }}>
          <img src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=700&q=80" alt="Dark Neural Showcase" style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
          <div style={{ padding: '1.4rem' }}>
            <span className="badge badge-slate" style={{ marginBottom: '0.6rem' }}>Showcase</span>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.4rem' }}>Dark Canvas Neural Portal</h3>
            <p style={{ fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))', lineHeight: '1.5' }}>Interactive dark glassmorphism showcase with real-time 3D particle canvas neural brain and MindCare wellness check-in.</p>
            <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1rem' }}>
              <a href="/portal/index.html" target="_blank" rel="noopener noreferrer" className="button button-primary" style={{ fontSize: '0.78rem', padding: '6px 12px' }}>Open Showcase ↗</a>
            </div>
          </div>
        </div>
      </div>

      <div className="story-grid">
        <Card className="story-card story-card-tall"><span className="story-number">01</span><MessageCircle size={23} /><h3>Start with what<br />you know.</h3><p>Describe how you feel in plain language. Get thoughtful guidance on what to do next — never a diagnosis.</p><div className="story-chat"><span>You can say anything here.</span><ArrowRight size={15} /></div></Card>
        <Card className="story-card"><span className="story-number">02</span><Brain size={23} /><h3>DASS-42 Mental<br />Health AI.</h3><p>Screen for depression, anxiety, and stress risk factors with psychometric machine learning models.</p><div className="story-dots"><i /><i /><i /><i /><i /></div></Card>
        <Card className="story-card story-card-dark"><span className="story-number">03</span><HeartPulse size={23} /><h3>Keep the thread<br />between visits.</h3><p>Your records, trends, prescriptions, and care conversations stay connected — so nothing gets lost in the gaps.</p><div className="thread-line"><span /><span /><span /><span /></div></Card>
      </div>
    </section>
    <footer className="landing-footer"><Logo /><span>Care, connected.</span><div><Link href="/login" data-testid="link-footer-login">Sign in</Link><Link href="/signup" data-testid="link-footer-signup">Get started</Link></div></footer>
  </div>;
}

function DashboardPage() {
  const { data: summary, isLoading: summaryLoading, isError: summaryError, refetch: refetchSummary } = useGetDashboardSummary();
  const { data: profile, isLoading: profileLoading } = useGetMyPatientProfile();
  const { data: appointments } = useListAppointments({ status: 'all' });
  const [showProfile, setShowProfile] = useState(false);
  const activeProfile = profile ?? fallbackProfile;
  const activeAppointments = appointments?.length ? appointments : fallbackAppointments;
  const next = summary?.nextAppointment ?? activeAppointments[0];
  const update = useUpdateMyPatientProfile();
  const [phone, setPhone] = useState(activeProfile.phone);
  const saveProfile = () => { update.mutate({ data: { phone } }, { onSuccess: () => { setShowProfile(false); queryClient.invalidateQueries({ queryKey: getGetMyPatientProfileQueryKey() }); } }); };
  if (summaryLoading && profileLoading) return <Shell><LoadingBlock /></Shell>;
  return <Shell><div className="dashboard-content">
    <PageHeader eyebrow="Wednesday · June 11, 2025" title={`Good morning, ${activeProfile.name.split(' ')[0]}.`} detail="Here is your care picture at a glance." action={<Button variant="soft" onClick={() => setShowProfile(true)} testId="button-edit-profile"><UserRound size={16} /> Edit profile</Button>} />
    {summaryError && <div className="error-banner" data-testid="status-dashboard-error"><span>We could not refresh your latest care picture.</span><Button variant="outline" onClick={() => refetchSummary()} testId="button-retry-dashboard">Try again</Button></div>}
    <div className="dashboard-grid">
      <Card className="welcome-card rise-in delay-1"><div className="welcome-top"><div><p className="eyebrow">YOUR CARE SCORE</p><div className="big-score">{summary?.healthScore ?? 86}<span>/100</span></div><p className="score-copy"><span className="score-up">↑ 4 points</span> since your last check-in</p></div><div className="score-illustration"><div className="leaf-shape"><Leaf size={29} /></div><div className="score-spark"><Sparkles size={18} /></div></div></div><div className="score-foot"><span>steady rhythm</span><div className="score-track"><i style={{ width: `${summary?.healthScore ?? 86}%` }} /></div><span>great</span></div></Card>
      <Card className="next-card rise-in delay-2"><div className="card-heading"><div><p className="eyebrow">NEXT APPOINTMENT</p><h3>{next?.doctorName ?? 'Your care team'}</h3></div><Badge>Confirmed</Badge></div><p className="muted-line">{next?.specialty ?? 'Primary care'} <span>·</span> {next?.location ?? 'Harborview Clinic'}</p><div className="appointment-time"><div className="date-tile"><strong>{next ? new Date(next.date).getDate() : '18'}</strong><span>JUN</span></div><div><strong>{next?.time ?? '10:30 AM'}</strong><span>in 7 days · video visit</span></div><Button variant="ghost" className="round-button" onClick={() => {}} testId="button-open-appointment"><ArrowRight size={17} /></Button></div></Card>
      <Card className="notifications-card rise-in delay-3"><div className="card-heading"><div><p className="eyebrow">TO DO</p><h3>Small things, covered.</h3></div><span className="notification-count">{summary?.notifications ?? 3}</span></div><div className="todo-list"><div><span className="todo-check todo-done"><Check size={12} /></span><span>Share your pre-visit notes</span><small>Done</small></div><div><span className="todo-check" /><span>Log your evening medication</span><small>Tonight</small></div><div><span className="todo-check" /><span>Try DASS-42 Mental Screening</span><small>5 min</small></div></div><Link href="/analytics" className="card-link" data-testid="link-todo-checkin">Open AI screener <ArrowRight size={14} /></Link></Card>
    </div>
    <div className="section-row"><div><p className="eyebrow">YOUR SIGNALS</p><h2>What your body is telling you</h2></div><Link href="/analytics" className="text-link" data-testid="link-view-trends">View trends <ArrowRight size={15} /></Link></div>
    <div className="signals-grid"><MetricCard title="Blood pressure" value={summary?.metrics.bloodPressure ?? activeProfile.bloodPressure ?? '118/76'} caption="In your usual range" icon={<Activity size={18} />} tone="mint" /><MetricCard title="Blood sugar" value={summary?.metrics.bloodSugar ?? activeProfile.bloodSugar ?? '92 mg/dL'} caption="Last checked today" icon={<Zap size={18} />} tone="peach" /><MetricCard title="Weight" value={summary?.metrics.weight ?? `${activeProfile.weight ?? 64} kg`} caption="Stable this month" icon={<TrendingUp size={18} />} tone="blue" /><Card className="checkin-card"><div className="checkin-orbit"><Sparkles size={19} /></div><div><p className="eyebrow">A MOMENT FOR YOU</p><h3>How are you really feeling?</h3><p>It takes less than a minute.</p></div><Link href="/symptoms" className="arrow-circle" data-testid="link-start-checkin"><ArrowRight size={16} /></Link></Card></div>
    <div className="section-row section-row-latest"><div><p className="eyebrow">RECENT ACTIVITY</p><h2>Keep the thread</h2></div><Link href="/records" className="text-link" data-testid="link-all-records">See all records & prescriptions <ArrowRight size={15} /></Link></div>
    <Card className="activity-card"><ActivityRow icon={<FileText size={17} />} title="Wellness check-in added" detail="You shared how your sleep has been trending" date="Today, 9:42 AM" tone="mint" /><ActivityRow icon={<Pill size={17} />} title="Prescription ready" detail="Budesonide inhaler · 2 refills remaining" date="Jun 06, 2:10 PM" tone="peach" /><ActivityRow icon={<CalendarDays size={17} />} title="Appointment confirmed" detail="Dr. Elena Vance · Primary care" date="Jun 04, 11:20 AM" tone="blue" /></Card>
    {showProfile && <Modal title="Your profile" onClose={() => setShowProfile(false)}><div className="profile-modal"><Avatar name={activeProfile.name} tone="peach" /><h3>{activeProfile.name}</h3><p>{activeProfile.age} years · {activeProfile.gender} · {activeProfile.bloodGroup}</p><label>Phone number<input value={phone} onChange={(e) => setPhone(e.target.value)} data-testid="input-profile-phone" /></label><Button onClick={saveProfile} disabled={update.isPending} testId="button-save-profile">{update.isPending ? 'Saving…' : 'Save changes'}</Button></div></Modal>}
  </div></Shell>;
}

function MetricCard({ title, value, caption, icon, tone }: { title: string; value: string; caption: string; icon: ReactNode; tone: string }) {
  return <Card className="metric-card"><div className={`metric-icon metric-${tone}`}>{icon}</div><p>{title}</p><strong data-testid={`text-metric-${title.toLowerCase().replace(' ', '-')}`}>{value}</strong><span>{caption}</span><div className="mini-line"><i /><i /><i /><i /><i /><i /><i /></div></Card>;
}
function ActivityRow({ icon, title, detail, date, tone }: { icon: ReactNode; title: string; detail: string; date: string; tone: string }) {
  return <div className="activity-row"><div className={`activity-icon metric-${tone}`}>{icon}</div><div className="activity-copy"><strong>{title}</strong><span>{detail}</span></div><time>{date}</time><ArrowRight size={15} className="activity-arrow" /></div>;
}

function SymptomsPage() {
  const { data: profile } = useGetMyPatientProfile();
  const analyze = useAnalyzeSymptoms();
  const [text, setText] = useState('');
  const [result, setResult] = useState<SymptomAnalysis | null>(null);
  const [history, setHistory] = useState([{ role: 'assistant', text: 'Hi Amara. I can help you think through what you are feeling and suggest a sensible next step. I cannot diagnose, but I can help you decide what kind of care might be useful.' }]);
  const submit = () => { if (!text.trim()) return; const current = text.trim(); setHistory((items) => [...items, { role: 'user', text: current }, { role: 'assistant', text: 'Thanks for telling me. I am looking at the pattern and will share a few careful next steps.' }]); setText(''); analyze.mutate({ data: { symptoms: current, age: profile?.age ?? 34, gender: profile?.gender ?? 'Female', medicalHistory: profile?.conditions?.join(', ') } }, { onSuccess: setResult }); };
  return <Shell><div className="symptom-page"><PageHeader eyebrow="MediGrid guide" title="A place to start." detail="Tell us what is going on. We will help you think through the next best step." action={<div className="safety-note"><ShieldCheck size={15} /> Not a diagnosis</div>} /><div className="symptom-layout"><Card className="chat-card"><div className="chat-header"><div className="guide-avatar"><Sparkles size={18} /></div><div><strong>Care guide</strong><span>Usually replies in a few seconds</span></div><span className="online-label"><i /> online</span></div><div className="chat-messages">{history.map((item, index) => <div className={`chat-message ${item.role}`} key={`${item.role}-${index}`}><div className="message-avatar">{item.role === 'assistant' ? <Sparkles size={14} /> : 'AS'}</div><div className="message-bubble">{item.text}{item.role === 'assistant' && index === 0 && <div className="suggestion-row"><button onClick={() => setText('I have had a headache since yesterday')} data-testid="button-suggestion-headache">Headache</button><button onClick={() => setText('I feel unusually tired')} data-testid="button-suggestion-tired">Feeling tired</button></div>}</div></div>)}{analyze.isPending && <div className="chat-message assistant"><div className="message-avatar"><Sparkles size={14} /></div><div className="message-bubble typing"><i /><i /><i /></div></div>}</div><div className="chat-composer"><textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Share what you are noticing…" data-testid="input-symptoms" /><div><span>Press enter to send</span><Button onClick={submit} disabled={!text.trim() || analyze.isPending} testId="button-analyze-symptoms"><ArrowRight size={17} /></Button></div></div></Card><div className="analysis-side">{result ? <Card className="analysis-result"><div className="result-heading"><div><p className="eyebrow">YOUR GUIDANCE</p><h2>A thoughtful next step</h2></div><Badge tone={result.risk === 'High' ? 'rose' : result.risk === 'Medium' ? 'amber' : 'mint'}>{result.risk} attention</Badge></div>{result.emergency && <div className="emergency-callout"><strong>Seek urgent care now</strong><span>Your answers suggest speaking with emergency services or going to the nearest emergency department.</span></div>}<div className="result-section"><p className="eyebrow">POSSIBLE PATTERNS</p>{result.possibleConditions.map((item) => <div className="result-item" key={item}><Check size={14} />{item}</div>)}</div><div className="result-section"><p className="eyebrow">WHAT MAY HELP</p>{result.recommendations.map((item) => <div className="result-item" key={item}><ArrowRight size={14} />{item}</div>)}</div><Button variant="soft" onClick={() => { setResult(null); setHistory([{ role: 'assistant', text: 'What else would you like to share?' }]); }} testId="button-new-symptom-check">Start another check <Plus size={15} /></Button></Card> : <Card className="analysis-empty"><div className="analysis-art"><div /><div /><div /></div><p className="eyebrow">HOW IT WORKS</p><h2>Context over conclusions.</h2><p>I will ask about timing, intensity, and what has changed. The more context you share, the more useful your next-step guidance can be.</p><div className="privacy-line"><LockKeyhole size={14} /> Your answers stay in your care record</div></Card>}</div></div></div></Shell>;
}

function AppointmentsPage() {
  const { data: doctors, isLoading: doctorsLoading } = useListDoctors();
  const { data: appointments } = useListAppointments({ status: 'all' });
  const create = useCreateAppointment();
  const [specialty, setSpecialty] = useState('All specialties');
  const [selected, setSelected] = useState<Doctor | null>(null);
  const doctorList = (doctors?.length ? doctors : fallbackDoctors).filter((doctor) => specialty === 'All specialties' || doctor.specialty === specialty);
  const book = (doctor: Doctor, slot: string) => { const pieces = slot.split(', '); create.mutate({ data: { doctorName: doctor.name, specialty: doctor.specialty, date: '2025-06-18', time: pieces[1] ?? pieces[0] } }, { onSuccess: () => setSelected(null) }); };
  return <Shell><div className="appointments-page"><PageHeader eyebrow="Your care network" title="Find your next person." detail="Choose someone who fits your needs, schedule, and the way you like to be cared for." /><div className="search-row"><div className="search-box"><Search size={18} /><input placeholder="Search by name or specialty" data-testid="input-search-doctors" /></div><select value={specialty} onChange={(e) => setSpecialty(e.target.value)} data-testid="select-specialty"><option>All specialties</option><option>Primary care</option><option>Pulmonology</option><option>Dermatology</option></select><Button variant="soft" onClick={() => {}} testId="button-filter-doctors">More filters <ChevronDown size={15} /></Button></div><div className="appointment-columns"><div className="doctor-list"><div className="list-heading"><div><p className="eyebrow">NEAR YOU</p><h2>{doctorList.length} people ready to help</h2></div><span className="muted-line">Sorted by fit</span></div>{doctorsLoading && <LoadingBlock label="Finding nearby clinicians" />}{doctorList.map((doctor, index) => <DoctorCard doctor={doctor} key={doctor.id} index={index} onSelect={() => setSelected(doctor)} />)}</div><Card className="upcoming-side"><div className="card-heading"><div><p className="eyebrow">UPCOMING</p><h3>Your appointments</h3></div><Link href="/dashboard" className="icon-link" data-testid="link-appointments-overview"><ArrowRight size={16} /></Link></div>{(appointments?.length ? appointments : fallbackAppointments).map((appointment) => <div className="upcoming-item" key={appointment.id}><div className="date-tile small"><strong>{new Date(appointment.date).getDate()}</strong><span>JUN</span></div><div><strong>{appointment.doctorName}</strong><span>{appointment.time} · {appointment.specialty}</span></div><Badge tone={appointment.status === 'completed' ? 'slate' : 'mint'}>{appointment.status}</Badge></div>)}<Link href="/records" className="card-link" data-testid="link-appointment-records">View care history <ArrowRight size={14} /></Link></Card></div>{selected && <Modal title={`Book with ${selected.name}`} onClose={() => setSelected(null)}><div className="booking-modal"><p>{selected.specialty} · {selected.distance} away</p><div className="slot-list">{selected.availability.map((slot) => <button key={slot} onClick={() => book(selected, slot)} disabled={create.isPending} data-testid={`button-book-slot-${selected.id}`}><Clock3 size={15} /><span>{slot}</span><ArrowRight size={15} /></button>)}</div><div className="booking-note"><ShieldCheck size={15} /> You can change or cancel from your appointments view.</div></div></Modal>}</div></Shell>;
}
function DoctorCard({ doctor, index, onSelect }: { doctor: Doctor; index: number; onSelect: () => void }) {
  return <Card className={`doctor-card rise-in delay-${Math.min(index + 1, 3)}`} testId={`card-doctor-${doctor.id}`}><div className="doctor-avatar-wrap"><Avatar name={doctor.name} tone={index === 1 ? 'blue' : index === 2 ? 'lavender' : 'peach'} /><span className="verified"><Check size={10} /></span></div><div className="doctor-main"><div className="doctor-title"><h3>{doctor.name}</h3><span className="rating"><Star size={11} fill="currentColor" /> {doctor.rating}</span></div><p>{doctor.specialty} <span>·</span> {doctor.experience}</p><div className="doctor-meta"><span><MapPin size={14} /> {doctor.distance}</span><span><CalendarDays size={14} /> {doctor.availability.length} openings</span></div></div><Button variant="outline" onClick={onSelect} testId={`button-book-doctor-${doctor.id}`}>View times</Button></Card>;
}

function RecordsPage() {
  const [tab, setTab] = useState<'records' | 'prescriptions'>('records');
  const { data: prescriptions, isLoading: rxLoading } = useListPrescriptions();
  const [selectedRx, setSelectedRx] = useState<Prescription | null>(null);

  return <Shell><div className="records-page">
    <PageHeader eyebrow="Your health library" title="The whole picture, together." detail="Your clinical records and digital prescriptions in one trusted place." action={<Button variant="soft" onClick={() => alert('Exporting full clinical summary as PDF...')} testId="button-download-records"><ArrowRight size={15} /> Export summary</Button>} />
    <div className="tabs">
      <button className={tab === 'records' ? 'tab-active' : ''} onClick={() => setTab('records')} data-testid="button-tab-records">Medical records <span>3</span></button>
      <button className={tab === 'prescriptions' ? 'tab-active' : ''} onClick={() => setTab('prescriptions')} data-testid="button-tab-prescriptions">E-Prescriptions <span>{prescriptions?.length ?? 2}</span></button>
    </div>

    {tab === 'records' ? (
      <div className="records-layout">
        <Card className="records-timeline">
          <div className="list-heading"><div><p className="eyebrow">RECENT RECORDS</p><h2>Your care timeline</h2></div><button className="icon-button small" data-testid="button-record-filter"><MoreHorizontal size={18} /></button></div>
          <RecordItem date="Jun 06, 2025" title="Routine wellness visit" doctor="Dr. Elena Vance · Primary care" summary="Vitals within your usual range. Continue current medication plan." type="Visit" />
          <RecordItem date="May 02, 2025" title="Respiratory review" doctor="Dr. Jonah Reed · Pulmonology" summary="Breathing has been stable. Follow-up recommended in 3 months." type="Visit" />
          <RecordItem date="Mar 14, 2025" title="Complete blood panel" doctor="North Bay Medical Laboratory" summary="All markers reviewed by your care team." type="Lab result" />
        </Card>
        <div className="record-side">
          <Card className="profile-summary">
            <div className="card-heading"><div><p className="eyebrow">PATIENT PROFILE</p><h3>About you</h3></div></div>
            <div className="profile-id"><Avatar name="Amara Singh" tone="peach" /><div><strong>Amara Singh</strong><span>Patient ID · MG-20481</span></div></div>
            <div className="profile-facts"><span>Blood group <strong>O+</strong></span><span>Height <strong>168 cm</strong></span><span>Weight <strong>64 kg</strong></span></div>
            <div className="allergy-note"><ShieldCheck size={15} /><span><strong>Allergy noted</strong>Penicillin</span></div>
          </Card>
          <Card className="prescription-mini">
            <div className="card-heading"><div><p className="eyebrow">ACTIVE PRESCRIPTION</p><h3>{prescriptions?.[0]?.id ?? 'RX-2026-0001'}</h3></div><Pill size={19} /></div>
            {prescriptions?.[0]?.medicines.map((m) => (
              <div className="medication-line" key={m.name}><span className="med-pill">{m.name[0]}</span><div><strong>{m.name}</strong><span>{m.dosage} · {m.frequency}</span></div></div>
            ))}
            <button className="card-link" onClick={() => setTab('prescriptions')}>View full prescriptions →</button>
          </Card>
        </div>
      </div>
    ) : (
      <div className="prescriptions-layout">
        <Card className="prescriptions-page">
          <div className="list-heading">
            <div><p className="eyebrow">DIGITAL PRESCRIPTIONS</p><h2>Active & past medication plans</h2></div>
            <Badge tone="mint">{prescriptions?.length ?? 2} on file</Badge>
          </div>
          {rxLoading && <LoadingBlock label="Fetching your prescriptions" />}
          {prescriptions?.map((rx) => (
            <div className="prescription-row" key={rx.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1.2rem', marginBottom: '1rem', border: '1px solid var(--border-glass, #3b4662)', borderRadius: '14px', background: 'rgba(255,255,255,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ fontSize: '1.05rem', color: 'var(--cyan-accent, #38bdf8)' }}>{rx.id}</strong>
                  <span style={{ marginLeft: '0.75rem', fontSize: '0.85rem', opacity: 0.7 }}>Prescribed on {rx.date} by <strong>{rx.doctorName}</strong> ({rx.doctorSpecialization})</span>
                </div>
                <Badge tone={rx.status === 'ACTIVE' ? 'mint' : 'slate'}>{rx.status}</Badge>
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted, #aeb7cf)' }}>{rx.clinicalNotes}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.6rem', marginTop: '0.4rem' }}>
                {rx.medicines.map((med, idx) => (
                  <div key={idx} style={{ padding: '0.6rem 0.8rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', borderLeft: '3px solid #38bdf8' }}>
                    <strong style={{ display: 'block', fontSize: '0.95rem' }}>{med.name}</strong>
                    <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>{med.dosage} · {med.frequency} ({med.duration})</span>
                    {med.instructions && <small style={{ display: 'block', opacity: 0.7, marginTop: '2px' }}>{med.instructions}</small>}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>Instructions: {rx.generalInstructions} {rx.followUpDate ? `· Follow-up: ${rx.followUpDate}` : ''}</span>
                <Button variant="outline" onClick={() => setSelectedRx(rx)} testId={`button-view-rx-${rx.id}`}>View details</Button>
              </div>
            </div>
          ))}
        </Card>

        {selectedRx && (
          <Modal title={`Prescription ${selectedRx.id}`} onClose={() => setSelectedRx(null)}>
            <div style={{ padding: '1rem', lineHeight: 1.6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.8rem', marginBottom: '1rem' }}>
                <div><strong>Patient:</strong> {selectedRx.patientName} ({selectedRx.patientAge} yrs, {selectedRx.patientGender})</div>
                <div><strong>Doctor:</strong> {selectedRx.doctorName}</div>
              </div>
              <p><strong>Clinical Notes:</strong> {selectedRx.clinicalNotes}</p>
              <h4 style={{ margin: '1rem 0 0.5rem 0', color: '#38bdf8' }}>Prescribed Medicines</h4>
              <ul>
                {selectedRx.medicines.map((m, i) => (
                  <li key={i} style={{ marginBottom: '0.4rem' }}>
                    <strong>{m.name}</strong> ({m.dosage}) — {m.frequency} for {m.duration} [{m.route || 'Oral'}]. <em>{m.instructions || ''}</em>
                  </li>
                ))}
              </ul>
              <p style={{ marginTop: '1rem' }}><strong>General Advice:</strong> {selectedRx.generalInstructions}</p>
              {selectedRx.followUpDate && <p><strong>Follow-Up:</strong> {selectedRx.followUpDate}</p>}
              <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                <Button variant="primary" onClick={() => alert('PDF downloaded successfully!')}>Download PDF</Button>
                <Button variant="ghost" onClick={() => setSelectedRx(null)}>Close</Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    )}
  </div></Shell>;
}

function RecordItem({ date, title, doctor, summary, type }: { date: string; title: string; doctor: string; summary: string; type: string }) {
  return <div className="record-item"><div className="record-date">{date}</div><div className="record-marker"><i /></div><div className="record-content"><div className="record-title"><div><h3>{title}</h3><span>{doctor}</span></div><Badge tone="slate">{type}</Badge></div><p>{summary}</p><button className="text-link-button" data-testid={`button-open-record-${title.toLowerCase().replaceAll(' ', '-')}`}>Open note <ArrowRight size={14} /></button></div></div>;
}

function NearbyPage() {
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [maxDistance, setMaxDistance] = useState('25');

  const { data: places, isLoading } = useListNearbyHealthcare({
    category: category === 'All' ? undefined : category,
    search: search.trim() || undefined,
    maxDistance: maxDistance || undefined,
  });

  return <Shell><div className="nearby-page">
    <PageHeader eyebrow="Care, close by" title="When you need a place." detail="Find and filter nearby doctors, clinics, and hospitals in real time." action={<Button variant="soft" onClick={() => { setMaxDistance('5'); }} testId="button-use-location"><MapPin size={15} /> Within 5 km</Button>} />
    
    <div className="search-row" style={{ marginBottom: '1.5rem' }}>
      <div className="search-box">
        <Search size={18} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by doctor, clinic, or hospital name..." data-testid="input-search-nearby" />
      </div>
      <select value={maxDistance} onChange={(e) => setMaxDistance(e.target.value)} style={{ padding: '0.6rem 1rem', borderRadius: '10px', background: 'rgba(27,34,53,0.8)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>
        <option value="25">Within 25 km</option>
        <option value="10">Within 10 km</option>
        <option value="5">Within 5 km</option>
        <option value="2">Within 2 km</option>
      </select>
    </div>

    <div className="category-tabs">
      {['All', 'Doctors', 'Clinics', 'Hospitals'].map((item) => (
        <button className={category === item ? 'tab-active' : ''} key={item} onClick={() => setCategory(item)} data-testid={`button-nearby-${item.toLowerCase()}`}>
          {item}
        </button>
      ))}
    </div>

    {isLoading && <LoadingBlock label="Searching nearby healthcare facilities..." />}

    <div className="nearby-list">
      {places?.map((place) => (
        <Card className="nearby-row" key={place.id} testId={`card-nearby-${place.id}`}>
          <div className={`nearby-kind ${place.category.toLowerCase()}`}>
            {place.category === 'Doctors' ? <Stethoscope size={19} /> : place.category === 'Clinics' ? <Activity size={19} /> : <Hospital size={19} />}
          </div>
          <div className="nearby-main">
            <div>
              <h3>{place.name}</h3>
              <p>{place.specialty} · <span style={{ opacity: 0.8 }}>{place.address}</span></p>
              <small style={{ color: 'var(--cyan-accent, #38bdf8)' }}>{place.openHours}</small>
            </div>
            <span className="rating"><Star size={11} fill="currentColor" /> {place.rating}</span>
          </div>
          <div className="nearby-distance"><MapPin size={14} /> {place.distanceStr}</div>
          <Button variant="outline" onClick={() => alert(`Directions to ${place.name} (${place.address})\nContact: ${place.contact}`)} testId={`button-directions-${place.id}`}>
            {place.category === 'Doctors' ? 'View profile' : 'Directions'}
          </Button>
        </Card>
      ))}
      {places?.length === 0 && !isLoading && (
        <div style={{ textAlign: 'center', padding: '3rem', opacity: 0.7 }}>
          <p>No facilities matched your filters. Try widening your search distance.</p>
        </div>
      )}
    </div>
  </div></Shell>;
}

function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<'screener' | 'trends'>('screener');

  return <Shell><div className="analytics-page">
    <PageHeader
      eyebrow="AI & Health Intelligence"
      title="Understand patterns and mental wellness."
      detail="DASS-42 psychometric machine learning screening and longitudinal health vitals."
      action={
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <a href="http://localhost:8501" target="_blank" rel="noopener noreferrer" className="button button-soft" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <TrendingUp size={15} /> Streamlit ML Dashboard <ExternalLink size={13} />
          </a>
        </div>
      }
    />

    <div className="tabs" style={{ marginBottom: '1.5rem' }}>
      <button className={activeTab === 'screener' ? 'tab-active' : ''} onClick={() => setActiveTab('screener')}>
        <Brain size={16} style={{ display: 'inline', marginRight: '6px' }} /> DASS-42 Mental Health AI
      </button>
      <button className={activeTab === 'trends' ? 'tab-active' : ''} onClick={() => setActiveTab('trends')}>
        <Activity size={16} style={{ display: 'inline', marginRight: '6px' }} /> Health Vitals & Trends
      </button>
    </div>

    {activeTab === 'screener' ? <MentalHealthScreener /> : <HealthTrendsView />}
  </div></Shell>;
}

function MentalHealthScreener() {
  const predict = usePredictMentalState();
  const [tipi, setTipi] = useState({
    tipi1: 4, tipi2: 4, tipi3: 5, tipi4: 3, tipi5: 5,
    tipi6: 3, tipi7: 5, tipi8: 3, tipi9: 5, tipi10: 3,
  });
  const [age, setAge] = useState(25);
  const [gender, setGender] = useState(2);
  const [vocabScore, setVocabScore] = useState(8);
  const [education, setEducation] = useState(3);
  const [urban, setUrban] = useState(3);
  const [predictionResult, setPredictionResult] = useState<MLPredictResponse | null>(null);
  const [activePreset, setActivePreset] = useState<string | null>('balanced');

  const presetDefinitions = {
    balanced: {
      name: '🌟 Balanced',
      type: 'balanced',
      tipi: { tipi1: 5, tipi2: 6, tipi3: 6, tipi4: 2, tipi5: 6, tipi6: 3, tipi7: 6, tipi8: 2, tipi9: 6, tipi10: 2 },
      age: 28,
      vocab: 11,
      title: 'Balanced & Steady State Activated',
      quote: 'Emotional stability is high. Autonomic nervous system is calm with regular heart rate variability.',
      badge: 'Grounded Rhythm',
    },
    cool: {
      name: '❄️ Cool & Calm',
      type: 'cool',
      tipi: { tipi1: 4, tipi2: 6, tipi3: 5, tipi4: 1, tipi5: 5, tipi6: 4, tipi7: 6, tipi8: 2, tipi9: 7, tipi10: 3 },
      age: 29,
      vocab: 12,
      title: 'Cool & Zen State Activated',
      quote: 'Deep parasympathetic relaxation. Cortisol normalized, cognitive clarity high.',
      badge: 'Zen Flow',
    },
    anxiety: {
      name: '⚡ High Anxiety',
      type: 'anxiety',
      tipi: { tipi1: 2, tipi2: 4, tipi3: 4, tipi4: 7, tipi5: 4, tipi6: 6, tipi7: 4, tipi8: 5, tipi9: 1, tipi10: 5 },
      age: 22,
      vocab: 7,
      title: 'High Situational Anxiety Profile',
      quote: 'Elevated emotional sensitivity and autonomic nervous response detected.',
      badge: 'Alert State',
    },
    mood: {
      name: '🌧️ Low Mood',
      type: 'mood',
      tipi: { tipi1: 1, tipi2: 3, tipi3: 3, tipi4: 6, tipi5: 2, tipi6: 7, tipi7: 3, tipi8: 6, tipi9: 2, tipi10: 6 },
      age: 31,
      vocab: 6,
      title: 'Low Mood / Depressive Indicator',
      quote: 'Devaluation of positive affect and energy lethargy markers applied.',
      badge: 'Compassion Needed',
    },
    stress: {
      name: '🔥 High Stress',
      type: 'stress',
      tipi: { tipi1: 4, tipi2: 2, tipi3: 5, tipi4: 7, tipi5: 4, tipi6: 4, tipi7: 3, tipi8: 3, tipi9: 2, tipi10: 4 },
      age: 26,
      vocab: 8,
      title: 'Elevated Nervous Tension Profile',
      quote: 'Irritability, rapid response pacing, and workplace stress markers active.',
      badge: 'Tension Alert',
    },
    focus: {
      name: '✨ Focus & Flow',
      type: 'focus',
      tipi: { tipi1: 6, tipi2: 5, tipi3: 7, tipi4: 2, tipi5: 7, tipi6: 2, tipi7: 5, tipi8: 1, tipi9: 6, tipi10: 1 },
      age: 27,
      vocab: 13,
      title: 'High Conscientiousness & Flow State',
      quote: 'High openness to experience, disciplined focus, and emotional equilibrium.',
      badge: 'Peak Energy',
    },
  };

  const applyPreset = (key: keyof typeof presetDefinitions) => {
    const preset = presetDefinitions[key];
    setActivePreset(key);
    setTipi(preset.tipi);
    setAge(preset.age);
    setVocabScore(preset.vocab);
  };

  const currentPresetData = activePreset ? presetDefinitions[activePreset as keyof typeof presetDefinitions] : null;

  const tipiLabels = [
    { key: 'tipi1', label: 'Extraverted, enthusiastic' },
    { key: 'tipi2', label: 'Critical, quarrelsome (reverse)' },
    { key: 'tipi3', label: 'Dependable, self-disciplined' },
    { key: 'tipi4', label: 'Anxious, easily upset' },
    { key: 'tipi5', label: 'Open to new experiences, complex' },
    { key: 'tipi6', label: 'Reserved, quiet (reverse)' },
    { key: 'tipi7', label: 'Sympathetic, warm' },
    { key: 'tipi8', label: 'Disorganized, careless (reverse)' },
    { key: 'tipi9', label: 'Calm, emotionally stable' },
    { key: 'tipi10', label: 'Conventional, uncreative (reverse)' },
  ];

  const handlePredict = () => {
    predict.mutate({
      data: {
        tipi,
        vocab_score: vocabScore,
        age,
        gender,
        education,
        urban,
        engnat: 1,
        hand: 1,
        religion: 1,
        orientation: 1,
        race: 1,
        voted: 1,
        married: 1,
        familysize: 1,
        introelapse: 30,
        testelapse: 300,
        surveyelapse: 60,
      }
    }, {
      onSuccess: (data) => setPredictionResult(data),
    });
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '1.5rem' }}>
      <Card style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
          <div>
            <p className="eyebrow">PSYCHOMETRIC INPUTS</p>
            <h2 style={{ fontSize: '1.3rem' }}>Big-Five Personality & Demographics</h2>
          </div>
          <span style={{ fontSize: '0.8rem', padding: '4px 10px', background: 'rgba(56,189,248,0.1)', color: '#38bdf8', borderRadius: '999px', fontWeight: 600 }}>
            Leakage-Free ML
          </span>
        </div>

        {/* 1-Click Interactive Mood Reaction Bar */}
        <div style={{ marginBottom: '1rem' }}>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted, #aeb7cf)', marginBottom: '0.4rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            ⚡ 1-Click Mood Presets (Click to React):
          </p>
          <div className="preset-button-bar">
            {Object.entries(presetDefinitions).map(([key, item]) => (
              <button
                type="button"
                key={key}
                onClick={() => applyPreset(key as keyof typeof presetDefinitions)}
                className={`preset-chip ${activePreset === key ? `active-${item.type}` : ''}`}
                title={`Apply ${item.name} profile`}
              >
                <span>{item.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Reaction Showcase Banner */}
        {currentPresetData && (
          <div className={`reaction-banner ${currentPresetData.type}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <strong style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="vital-wave-group">
                  <span /><span /><span /><span /><span />
                </span>
                {currentPresetData.title}
              </strong>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '2px 8px', borderRadius: '99px', background: 'rgba(255,255,255,0.15)', textTransform: 'uppercase' }}>
                {currentPresetData.badge}
              </span>
            </div>
            <p style={{ fontSize: '0.82rem', margin: '4px 0 0 0', opacity: 0.9, lineHeight: 1.4 }}>
              {currentPresetData.quote}
            </p>
          </div>
        )}

        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted, #aeb7cf)', marginBottom: '1rem' }}>
          Rate how much each statement describes you (1 = strongly disagree, 7 = strongly agree).
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem 1.2rem', marginBottom: '1.2rem' }}>
          {tipiLabels.map((item) => (
            <div key={item.key} style={{ background: 'rgba(255,255,255,0.02)', padding: '0.6rem 0.8rem', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                <span>{item.label}</span>
                <strong style={{ color: '#38bdf8' }}>{tipi[item.key as keyof typeof tipi]}</strong>
              </div>
              <input
                type="range"
                min="1"
                max="7"
                value={tipi[item.key as keyof typeof tipi]}
                onChange={(e) => setTipi({ ...tipi, [item.key]: parseInt(e.target.value) })}
                style={{ width: '100%', accentColor: '#38bdf8' }}
              />
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.8rem', marginBottom: '1.2rem' }}>
          <div>
            <label style={{ fontSize: '0.8rem', opacity: 0.8, display: 'block', marginBottom: '4px' }}>Age ({age})</label>
            <input type="number" min="13" max="99" value={age} onChange={(e) => setAge(parseInt(e.target.value) || 25)} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', opacity: 0.8, display: 'block', marginBottom: '4px' }}>Gender</label>
            <select value={gender} onChange={(e) => setGender(parseInt(e.target.value))} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>
              <option value="1">Male</option>
              <option value="2">Female</option>
              <option value="3">Other</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', opacity: 0.8, display: 'block', marginBottom: '4px' }}>Vocab Score ({vocabScore}/14)</label>
            <input type="number" min="0" max="14" value={vocabScore} onChange={(e) => setVocabScore(parseInt(e.target.value) || 7)} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }} />
          </div>
        </div>

        <Button variant="primary" onClick={handlePredict} disabled={predict.isPending} style={{ width: '100%', padding: '0.8rem' }}>
          {predict.isPending ? 'Running ML Inference...' : 'Predict DASS-42 Mental State →'}
        </Button>
      </Card>

      <div>
        {predictionResult ? (
          <Card style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(30,41,59,0.7), rgba(15,23,42,0.9))' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <p className="eyebrow">ML PREDICTION RESULTS</p>
                <h3 style={{ fontSize: '1.2rem' }}>Severity & Risk Breakdown</h3>
              </div>
              <Badge tone="mint">Completed</Badge>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              <PredictionMetricBar title="Depression" prediction={predictionResult.depression} tone="blue" />
              <PredictionMetricBar title="Anxiety" prediction={predictionResult.anxiety} tone="amber" />
              <PredictionMetricBar title="Stress" prediction={predictionResult.stress} tone="rose" />
            </div>

            <div style={{ padding: '0.8rem 1rem', borderRadius: '10px', background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)', fontSize: '0.82rem', lineHeight: 1.5, color: '#e0f2fe' }}>
              <ShieldCheck size={16} style={{ display: 'inline', marginRight: '6px', color: '#38bdf8' }} />
              <strong>Responsible Medical Disclaimer:</strong> {predictionResult.disclaimer}
            </div>

            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.8rem' }}>
              <Link href="/symptoms" className="button button-soft" style={{ flex: 1, textAlign: 'center' }}>
                Discuss with Care Guide
              </Link>
              <Link href="/appointments" className="button button-outline" style={{ flex: 1, textAlign: 'center' }}>
                Book Consultation
              </Link>
            </div>
          </Card>
        ) : (
          <Card style={{ padding: '2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '380px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(56,189,248,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', color: '#38bdf8' }}>
              <Brain size={28} />
            </div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>DASS-42 Machine Learning Engine</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted, #aeb7cf)', maxWidth: '340px', lineHeight: 1.5 }}>
              Trained on 39,775 responses to predict Depression, Anxiety, and Stress severity bands from personality signals before clinical consultation.
            </p>
            <Button variant="soft" onClick={handlePredict} style={{ marginTop: '1.2rem' }}>
              Run Instant Assessment
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}

function PredictionMetricBar({ title, prediction, tone }: { title: string; prediction: MLPredictResponse['depression']; tone: 'blue' | 'amber' | 'rose' }) {
  const isHigh = prediction.severity === 'Severe' || prediction.severity === 'Extremely Severe';
  const badgeTone = isHigh ? 'rose' : prediction.severity === 'Moderate' ? 'amber' : 'mint';

  return (
    <div style={{ padding: '0.8rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
        <strong style={{ fontSize: '0.95rem' }}>{title}</strong>
        <Badge tone={badgeTone}>{prediction.severity}</Badge>
      </div>
      <div style={{ display: 'flex', gap: '3px', height: '6px', borderRadius: '3px', overflow: 'hidden', background: 'rgba(255,255,255,0.1)', margin: '6px 0' }}>
        {Object.entries(prediction.probabilities || {}).map(([band, prob]) => (
          <div
            key={band}
            title={`${band}: ${Math.round(prob * 100)}%`}
            style={{
              width: `${Math.max(4, prob * 100)}%`,
              background: band === 'Normal' ? '#10b981' : band === 'Mild' ? '#38bdf8' : band === 'Moderate' ? '#f59e0b' : '#ef4444',
            }}
          />
        ))}
      </div>
      <small style={{ fontSize: '0.72rem', opacity: 0.6 }}>Model: {prediction.model_used}</small>
    </div>
  );
}

function HealthTrendsView() {
  return (
    <div>
      <div className="analytics-top">
        <Card className="trend-card">
          <div className="trend-heading"><div><p className="eyebrow">WELLNESS RHYTHM</p><h2>Moving in a good direction</h2></div><Badge>+12% this month</Badge></div>
          <div className="trend-visual">
            <div className="y-labels"><span>100</span><span>75</span><span>50</span><span>25</span><span>0</span></div>
            <div className="chart-wrap">
              <div className="chart-grid"><i /><i /><i /><i /><i /></div>
              <svg viewBox="0 0 600 210" preserveAspectRatio="none" className="line-chart">
                <path d="M0 155 C34 145 40 130 73 141 S105 126 130 135 S170 116 190 122 S225 92 250 107 S290 84 315 94 S350 75 380 83 S425 54 450 69 S487 54 510 60 S555 30 600 35" fill="none" stroke="currentColor" strokeWidth="3" />
                <path d="M0 155 C34 145 40 130 73 141 S105 126 130 135 S170 116 190 122 S225 92 250 107 S290 84 315 94 S350 75 380 83 S425 54 450 69 S487 54 510 60 S555 30 600 35 L600 210 L0 210Z" fill="currentColor" opacity=".08" />
              </svg>
              <div className="x-labels"><span>May 13</span><span>May 20</span><span>May 27</span><span>Jun 03</span><span>Today</span></div>
            </div>
          </div>
          <div className="trend-key"><span><i /> Your wellness score</span><span>Last updated today</span></div>
        </Card>
        <Card className="streak-card">
          <div className="streak-orb"><div><strong>7</strong><span>days</span></div></div>
          <p className="eyebrow">CHECK-IN STREAK</p>
          <h3>You are building<br />a useful rhythm.</h3>
          <p>Consistency makes patterns easier for you and your care team to see.</p>
          <Link href="/symptoms" className="text-link" data-testid="link-analytics-checkin">Check in today <ArrowRight size={15} /></Link>
        </Card>
      </div>

      <div className="analytics-bottom">
        <Card className="signals-detail">
          <div className="list-heading"><div><p className="eyebrow">HEALTH SIGNALS</p><h2>Recent measurements</h2></div><span className="muted-line">Updated today</span></div>
          <div className="signal-table">
            <div className="signal-table-head"><span>Signal</span><span>Current</span><span>30 day view</span><span>Pattern</span></div>
            {[['Blood pressure', '118/76', 'Within range', 'Stable', 'mint'], ['Blood sugar', '92 mg/dL', 'Within range', 'Improving', 'peach'], ['Weight', '64 kg', 'Within range', 'Stable', 'blue']].map(([name, value, range, pattern, tone]) => (
              <div className="signal-table-row" key={name}>
                <span><i className={`metric-icon metric-${tone}`} />{name}</span>
                <strong>{value}</strong>
                <span>{range}</span>
                <Badge tone={pattern === 'Improving' ? 'mint' : 'slate'}>{pattern}</Badge>
              </div>
            ))}
          </div>
        </Card>
        <Card className="insight-card">
          <div className="insight-icon"><Sparkles size={17} /></div>
          <p className="eyebrow">A USEFUL OBSERVATION</p>
          <h3>Your check-ins are most consistent on weekday mornings.</h3>
          <p>That is a helpful window to bring up at your next visit.</p>
          <button className="text-link-button" data-testid="button-save-insight">Save to visit notes <Plus size={14} /></button>
        </Card>
      </div>
    </div>
  );
}

function DoctorPage() {
  const [showRxModal, setShowRxModal] = useState(false);
  const createRx = useCreatePrescription();
  const [patientName, setPatientName] = useState('Amara Singh');
  const [patientAge, setPatientAge] = useState(34);
  const [patientGender, setPatientGender] = useState('Female');
  const [notes, setNotes] = useState('Patient follow-up regarding respiratory allergies and sleep rhythm.');
  const [meds, setMeds] = useState([
    { name: 'Budesonide Inhaler', dosage: '200 mcg', frequency: 'Twice daily', duration: '10 days', route: 'Inhalation', instructions: 'Rinse mouth after use' }
  ]);

  const addMedRow = () => {
    setMeds([...meds, { name: '', dosage: '', frequency: 'Once daily', duration: '5 days', route: 'Oral', instructions: 'Take with food' }]);
  };

  const handleSaveRx = () => {
    createRx.mutate({
      data: {
        patientName,
        patientAge,
        patientGender,
        doctorName: 'Dr. Elena Vance',
        doctorSpecialization: 'Primary Care',
        clinicalNotes: notes,
        medicines: meds.filter(m => m.name.trim()),
        generalInstructions: 'Hydrate well and follow scheduled follow-up.',
        followUpDate: '2025-07-02',
      }
    }, {
      onSuccess: () => {
        setShowRxModal(false);
        queryClient.invalidateQueries({ queryKey: getListPrescriptionsQueryKey() });
        alert('E-Prescription successfully issued and signed!');
      }
    });
  };

  return <Shell role="doctor"><div className="role-page">
    <PageHeader
      eyebrow="Wednesday · June 11, 2025"
      title="Good morning, Dr. Vance."
      detail="You have 12 patient moments on your schedule today."
      action={
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <Button variant="primary" onClick={() => setShowRxModal(true)} testId="button-new-rx">
            <Plus size={16} /> Create E-Prescription
          </Button>
        </div>
      }
    />
    <div className="role-stats">
      <StatBox label="Today’s visits" value="12" detail="3 virtual" icon={<CalendarDays size={18} />} />
      <StatBox label="Needs review" value="04" detail="2 new results" icon={<FileText size={18} />} />
      <StatBox label="Care signals" value="08" detail="Since yesterday" icon={<Activity size={18} />} />
      <StatBox label="Avg. response" value="14m" detail="This week" icon={<Clock3 size={18} />} />
    </div>
    <div className="role-columns">
      <Card className="schedule-card">
        <div className="list-heading"><div><p className="eyebrow">YOUR DAY</p><h2>Wednesday, June 11</h2></div><Button variant="soft" onClick={() => {}} testId="button-doctor-calendar"><CalendarDays size={15} /> Calendar</Button></div>
        {[['9:00 AM', 'Amara Singh', 'Follow-up · Primary care', 'Video', 'mint'], ['10:30 AM', 'Theo Martinez', 'Medication review', 'Clinic room 3', 'peach'], ['11:45 AM', 'Lina Okafor', 'New patient consultation', 'Video', 'blue'], ['2:00 PM', 'Grace Kim', 'Results discussion', 'Clinic room 1', 'lavender']].map(([time, name, detail, location, tone], index) => (
          <div className={`schedule-row ${index === 0 ? 'schedule-active' : ''}`} key={name}>
            <time>{time}</time>
            <Avatar name={name} tone={tone} />
            <div><strong>{name}</strong><span>{detail}</span></div>
            <Badge tone={location === 'Video' ? 'mint' : 'slate'}>{location}</Badge>
            <MoreHorizontal size={17} />
          </div>
        ))}
      </Card>
      <Card className="review-card">
        <div className="card-heading"><div><p className="eyebrow">TO REVIEW</p><h3>Care signals</h3></div><Badge tone="amber">4 open</Badge></div>
        <div className="review-item"><div className="review-icon review-amber"><TrendingUp size={16} /></div><div><strong>Amara Singh</strong><span>Wellness score rose 12% this month</span></div><ArrowRight size={15} /></div>
        <div className="review-item"><div className="review-icon review-rose"><Activity size={16} /></div><div><strong>Theo Martinez</strong><span>New blood pressure reading</span></div><ArrowRight size={15} /></div>
        <div className="review-item"><div className="review-icon review-blue"><MessageCircle size={16} /></div><div><strong>Lina Okafor</strong><span>Shared a new check-in</span></div><ArrowRight size={15} /></div>
        <Button variant="soft" onClick={() => setShowRxModal(true)} testId="button-open-reviews">Write Prescription <ArrowRight size={15} /></Button>
      </Card>
    </div>

    {showRxModal && (
      <Modal title="Issue Digital E-Prescription" onClose={() => setShowRxModal(false)}>
        <div style={{ padding: '0.5rem', maxHeight: '75vh', overflowY: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', opacity: 0.8 }}>Patient Name</label>
              <input value={patientName} onChange={(e) => setPatientName(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', opacity: 0.8 }}>Age</label>
              <input type="number" value={patientAge} onChange={(e) => setPatientAge(parseInt(e.target.value) || 30)} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }} />
            </div>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.8rem', opacity: 0.8 }}>Clinical Assessment Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }} />
          </div>

          <h4 style={{ fontSize: '0.95rem', color: '#38bdf8', marginBottom: '0.6rem' }}>Medicines</h4>
          {meds.map((m, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input placeholder="Medicine Name (e.g. Paracetamol)" value={m.name} onChange={(e) => { const next = [...meds]; next[i].name = e.target.value; setMeds(next); }} style={{ padding: '0.4rem', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }} />
              <input placeholder="Dosage (500 mg)" value={m.dosage} onChange={(e) => { const next = [...meds]; next[i].dosage = e.target.value; setMeds(next); }} style={{ padding: '0.4rem', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }} />
              <input placeholder="Frequency (Twice daily)" value={m.frequency} onChange={(e) => { const next = [...meds]; next[i].frequency = e.target.value; setMeds(next); }} style={{ padding: '0.4rem', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }} />
            </div>
          ))}
          <Button variant="soft" onClick={addMedRow} style={{ marginBottom: '1.2rem', fontSize: '0.8rem' }}>+ Add Another Medicine</Button>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <Button variant="primary" onClick={handleSaveRx} disabled={createRx.isPending} style={{ flex: 1 }}>
              {createRx.isPending ? 'Generating...' : 'Sign & Issue Prescription'}
            </Button>
            <Button variant="ghost" onClick={() => setShowRxModal(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    )}
  </div></Shell>;
}
function StatBox({ label, value, detail, icon }: { label: string; value: string; detail: string; icon: ReactNode }) {
  return <Card className="stat-box"><div className="stat-icon">{icon}</div><p>{label}</p><strong>{value}</strong><span>{detail}</span></Card>;
}

function ReceptionPage() {
  const [checked, setChecked] = useState<string[]>([]);
  const toggle = (name: string) => setChecked((current) => current.includes(name) ? current.filter((item) => item !== name) : [...current, name]);
  return <Shell role="reception"><div className="role-page"><PageHeader eyebrow="Front desk · Harborview Clinic" title="The day, in one view." detail="Keep arrivals moving gently and the care team one step ahead." action={<Button variant="primary" onClick={() => {}} testId="button-new-appointment"><Plus size={16} /> New appointment</Button>} /><div className="reception-banner"><div className="banner-icon"><Clock3 size={20} /></div><div><strong>Next arrival in 12 minutes</strong><span>Amara Singh · 10:30 AM · Dr. Vance</span></div><Button variant="soft" onClick={() => {}} testId="button-view-arrival">View arrival</Button></div><div className="role-columns"><Card className="arrival-card"><div className="list-heading"><div><p className="eyebrow">TODAY’S FLOW</p><h2>Arrival board</h2></div><Badge>12 appointments</Badge></div>{[['Amara Singh', '10:30 AM', 'Dr. Elena Vance', 'Arriving'], ['Theo Martinez', '11:00 AM', 'Dr. Jonah Reed', 'Checked in'], ['Lina Okafor', '11:45 AM', 'Dr. Elena Vance', 'Upcoming'], ['Grace Kim', '2:00 PM', 'Dr. Mira Chen', 'Upcoming']].map(([name, time, doctor, status]) => <div className="arrival-row" key={name}><button className={`arrival-check ${checked.includes(name) ? 'checked' : ''}`} onClick={() => toggle(name)} data-testid={`button-checkin-${name.toLowerCase().replace(' ', '-')}`}>{checked.includes(name) && <Check size={13} />}</button><div><strong>{name}</strong><span>{doctor}</span></div><time>{time}</time><Badge tone={status === 'Checked in' ? 'mint' : status === 'Arriving' ? 'amber' : 'slate'}>{status}</Badge></div>)}</Card><Card className="frontdesk-card"><div className="card-heading"><div><p className="eyebrow">QUICK VIEW</p><h3>Clinic capacity</h3></div><Hospital size={20} /></div><div className="capacity-ring"><strong>68<span>%</span></strong><small>rooms in use</small></div><div className="capacity-lines"><span><i className="capacity-mint" /> 7 rooms active <strong>of 10</strong></span><span><i className="capacity-peach" /> 2 clinicians free <strong>now</strong></span></div><Button variant="soft" onClick={() => {}} testId="button-manage-rooms">Manage rooms <ArrowRight size={15} /></Button></Card></div></div></Shell>;
}

function AdminPage() {
  return <Shell role="admin"><div className="role-page"><PageHeader eyebrow="MediGrid operations" title="Keep the network trustworthy." detail="Verification, quality, and the signals that keep care connected." action={<Button variant="soft" onClick={() => {}} testId="button-export-admin"><ArrowRight size={15} /> Export report</Button>} /><div className="role-stats"><StatBox label="Verified clinicians" value="1,284" detail="+36 this month" icon={<ShieldCheck size={18} />} /><StatBox label="Pending review" value="18" detail="Oldest 2 days" icon={<Clock3 size={18} />} /><StatBox label="Active patients" value="24.8k" detail="+8.4% this quarter" icon={<UsersRound size={18} />} /><StatBox label="Platform health" value="99.8%" detail="All systems steady" icon={<Activity size={18} />} /></div><div className="role-columns"><Card className="verification-card"><div className="list-heading"><div><p className="eyebrow">VERIFICATION QUEUE</p><h2>People to review</h2></div><Badge tone="amber">18 pending</Badge></div>{[['Dr. Noor Patel', 'Cardiology', 'License · CA-48291', '2h ago'], ['Dr. Samuel Wright', 'Family medicine', 'License · CA-73910', '5h ago'], ['Dr. Hana Ito', 'Dermatology', 'License · CA-11582', 'Yesterday']].map(([name, specialty, license, time]) => <div className="verify-row" key={name}><Avatar name={name} tone="blue" /><div><strong>{name}</strong><span>{specialty} · {license}</span></div><time>{time}</time><Button variant="outline" onClick={() => {}} testId={`button-review-${name.toLowerCase().replaceAll(' ', '-')}`}>Review</Button></div>)}<button className="text-link-button" data-testid="button-view-all-verifications">View all verification requests <ArrowRight size={14} /></button></Card><Card className="admin-insight"><div className="insight-icon"><TrendingUp size={17} /></div><p className="eyebrow">NETWORK SIGNAL</p><h3>Care journeys are getting shorter.</h3><p>Median time from first check-in to booked appointment fell to 1.8 days this month.</p><div className="admin-bars">{[40, 48, 45, 60, 65, 58, 78, 84].map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}</div><span className="muted-line">May  ·  Jun</span></Card></div></div></Shell>;
}

function AuthPage({ mode }: { mode: 'login' | 'signup' }) {
  const [role, setRole] = useState<'patient' | 'care'>('patient');
  const [submitted, setSubmitted] = useState(false);
  return <div className="auth-page"><div className="auth-art"><div className="auth-art-top"><Logo light /><span>Care, connected.</span></div><div className="auth-quote"><div className="quote-mark">“</div><blockquote>Good care starts with feeling heard.</blockquote><p>One place for the questions, people, and moments that make up your health.</p></div><div className="auth-art-footer"><span>Private by design</span><span>·</span><span>Built for humans</span></div></div><div className="auth-form-wrap"><Link href="/" className="auth-back" data-testid="link-auth-back">← Back to home</Link><div className="auth-form"><p className="eyebrow">{mode === 'login' ? 'WELCOME BACK' : 'JOIN MEDIGRID'}</p><h1>{mode === 'login' ? 'Good to see you.' : 'Start with what matters.'}</h1><p className="auth-subtitle">{mode === 'login' ? 'Pick up where you left off.' : 'A clearer, calmer way to move through care.'}</p><div className="role-toggle"><button className={role === 'patient' ? 'role-active' : ''} onClick={() => setRole('patient')} data-testid="button-role-patient"><UserRound size={16} /> I’m a patient</button><button className={role === 'care' ? 'role-active' : ''} onClick={() => setRole('care')} data-testid="button-role-care"><Stethoscope size={16} /> I’m care team</button></div>{submitted ? <div className="auth-success"><div><Check size={22} /></div><h2>{mode === 'login' ? 'You are all set.' : 'Welcome to MediGrid.'}</h2><p>{mode === 'login' ? 'Your care view is ready.' : 'Let’s make your next step a little clearer.'}</p><Link href={role === 'patient' ? '/dashboard' : '/doctor'} className="button button-primary" data-testid="link-auth-continue">Continue to MediGrid <ArrowRight size={15} /></Link></div> : <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}><label>Email address<input type="email" required placeholder="you@example.com" data-testid="input-auth-email" /></label>{mode === 'signup' && <label>Your name<input required placeholder="What should we call you?" data-testid="input-auth-name" /></label>}<label>Password<input type="password" required placeholder="At least 8 characters" data-testid="input-auth-password" /></label>{mode === 'login' && <div className="auth-options"><label className="check-label"><input type="checkbox" /> <span>Keep me signed in</span></label><button type="button" className="text-link-button" data-testid="button-forgot-password">Forgot password?</button></div>}<Button type="submit" className="auth-submit" testId={mode === 'login' ? 'button-login' : 'button-signup'}>{mode === 'login' ? 'Sign in' : 'Create my account'} <ArrowRight size={16} /></Button><p className="form-legal">By continuing, you agree to MediGrid’s <button type="button" data-testid="button-terms">Terms</button> and <button type="button" data-testid="button-privacy">Privacy promise</button>.</p></form>}<div className="auth-switch">{mode === 'login' ? <>New to MediGrid? <Link href="/signup" data-testid="link-to-signup">Create an account</Link></> : <>Already have an account? <Link href="/login" data-testid="link-to-login">Sign in</Link></>}</div></div></div></div>;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return <div className="modal-overlay" role="dialog" aria-modal="true"><div className="modal"><div className="modal-header"><h2>{title}</h2><button className="icon-button small" onClick={onClose} data-testid="button-close-modal"><X size={18} /></button></div>{children}</div></div>;
}


function SoundscapesPage() {
  const [activeMood, setActiveMood] = useState<'cool' | 'balanced' | 'stress' | 'anxiety' | 'focus' | 'mood'>('balanced');
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeFreq, setActiveFreq] = useState(528);
  const [volume, setVolume] = useState(0.7);
  const [waveType, setWaveType] = useState<OscillatorType>('sine');
  const [binauralEnabled, setBinauralEnabled] = useState(true);
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold' | 'Exhale' | 'Pause'>('Inhale');
  const [breathCount, setBreathCount] = useState(4);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const synthCtxRef = useRef<AudioContext | null>(null);
  const synthNodesRef = useRef<{ osc1?: OscillatorNode; osc2?: OscillatorNode; gain?: GainNode } | null>(null);

  const moodPresets = [
    { id: 'cool', name: 'Cool & Serene', freq: 432, desc: 'Harmonic 432Hz Solfeggio • Ocean Waves', audioUrl: '/audio/ocean_432hz.wav', tag: 'Alpha 10Hz', color: '#38bdf8' },
    { id: 'balanced', name: 'Balanced Harmony', freq: 528, desc: '528Hz Transformation • Forest Songbirds', audioUrl: '/audio/forest_528hz.wav', tag: 'Alpha 8Hz', color: '#34d399' },
    { id: 'stress', name: 'Stress Relief & Rest', freq: 136.1, desc: 'Delta 3Hz Deep Rest • Gentle Forest Rain', audioUrl: '/audio/rain_delta.wav', tag: 'Delta 3Hz', color: '#818cf8' },
    { id: 'anxiety', name: 'Anxiety Release', freq: 200, desc: 'Theta 6Hz Calm Stream • Mountain Water', audioUrl: '/audio/stream_theta.wav', tag: 'Theta 6Hz', color: '#a78bfa' },
    { id: 'focus', name: 'Clarity & Gamma Focus', freq: 240, desc: 'Gamma 40Hz High Cognition • Meadow Breeze', audioUrl: '/audio/wind_gamma.wav', tag: 'Gamma 40Hz', color: '#fbbf24' },
    { id: 'mood', name: 'Nocturne Peace & Sleep', freq: 144, desc: 'Theta 4Hz Evening Restoration • Night Crickets', audioUrl: '/audio/night_theta.wav', tag: 'Theta 4Hz', color: '#f472b6' },
  ] as const;

  const currentPreset = moodPresets.find(m => m.id === activeMood) || moodPresets[1];

  const calmingPhotos = [
    { id: 'forest', title: 'Emerald Pine Sanctuary', subtitle: 'Deep oxygen, grounding green canopy', mood: 'balanced', freq: 528, url: 'https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=800&q=80' },
    { id: 'ocean', title: 'Sunset Pacific Shoreline', subtitle: '432Hz gentle rhythm, emotional stillness', mood: 'cool', freq: 432, url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80' },
    { id: 'rain', title: 'Misty Alpine Rainforest', subtitle: 'Delta frequencies for restorative peace', mood: 'stress', freq: 136.1, url: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=800&q=80' },
    { id: 'stream', title: 'Crystal Mountain Brook', subtitle: 'Theta flow, anxiety dissipation', mood: 'anxiety', freq: 200, url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80' },
    { id: 'meadow', title: 'Golden Dawn Meadow', subtitle: 'Gamma wave awakening and vibrant focus', mood: 'focus', freq: 240, url: 'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?auto=format&fit=crop&w=800&q=80' },
    { id: 'night', title: 'Milky Way Stargazing', subtitle: 'Subconscious theta drift & deep sleep', mood: 'mood', freq: 144, url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80' },
  ];

  useEffect(() => {
    const phases: Array<'Inhale' | 'Hold' | 'Exhale' | 'Pause'> = ['Inhale', 'Hold', 'Exhale', 'Pause'];
    let currentIdx = 0;
    let count = 4;
    const interval = setInterval(() => {
      count -= 1;
      if (count <= 0) {
        currentIdx = (currentIdx + 1) % 4;
        setBreathPhase(phases[currentIdx]);
        count = 4;
      }
      setBreathCount(count);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const stopSynth = () => {
    if (synthNodesRef.current) {
      try {
        synthNodesRef.current.osc1?.stop();
        synthNodesRef.current.osc2?.stop();
        synthNodesRef.current.gain?.disconnect();
      } catch {}
      synthNodesRef.current = null;
    }
  };

  const startSynth = (freq: number) => {
    stopSynth();
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!synthCtxRef.current) {
        synthCtxRef.current = new AudioCtx();
      }
      if (synthCtxRef.current.state === 'suspended') {
        synthCtxRef.current.resume();
      }
      const ctx = synthCtxRef.current;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      // Soft warm lowpass filter to remove any harsh highs
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(Math.min(freq * 1.4, 450), ctx.currentTime);
      filter.Q.setValueAtTime(0.8, ctx.currentTime);

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq, ctx.currentTime);

      osc2.type = 'sine';
      const beatOffset = binauralEnabled ? (activeMood === 'stress' ? 3 : activeMood === 'anxiety' ? 6 : activeMood === 'focus' ? 40 : 8) : 0;
      osc2.frequency.setValueAtTime(freq + beatOffset, ctx.currentTime);

      // Gentle, soothing, non-harsh gain
      gain.gain.setValueAtTime(volume * 0.045, ctx.currentTime);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      synthNodesRef.current = { osc1, osc2, gain };
    } catch (e) {
      console.warn('WebAudio Synth notice:', e);
    }
  };

  const selectMood = (preset: typeof moodPresets[number]) => {
    setActiveMood(preset.id as any);
    setActiveFreq(preset.freq);
    if (audioRef.current) {
      audioRef.current.src = preset.audioUrl;
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {
        startSynth(preset.freq);
        setIsPlaying(true);
      });
    } else {
      startSynth(preset.freq);
      setIsPlaying(true);
    }
  };

  const togglePlayback = () => {
    if (isPlaying) {
      if (audioRef.current) audioRef.current.pause();
      stopSynth();
      setIsPlaying(false);
    } else {
      if (audioRef.current) {
        audioRef.current.src = currentPreset.audioUrl;
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {
          startSynth(activeFreq);
          setIsPlaying(true);
        });
      } else {
        startSynth(activeFreq);
        setIsPlaying(true);
      }
    }
  };

  return (
    <Shell>
      <div className="soundscapes-page" style={{ paddingBottom: '4rem' }}>
        <audio ref={audioRef} src={currentPreset.audioUrl} loop onError={() => { if (isPlaying) startSynth(activeFreq); }} />

        <PageHeader
          eyebrow="Acoustic Medicine & Ambient Therapy"
          title="Mood-Based Peace Music & Soundscapes"
          detail="Instant mood frequency selection, harmonic solfeggio audio synthesis, and soothing natural resonance."
          action={
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
              <Button variant={isPlaying ? 'primary' : 'outline'} onClick={togglePlayback}>
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                <span>{isPlaying ? 'Pause Soundscape' : 'Play Soundscape'}</span>
              </Button>
            </div>
          }
        />

        <div style={{
          background: 'linear-gradient(135deg, rgba(15,23,42,0.9), rgba(30,41,59,0.85))',
          borderRadius: '24px',
          border: `1px solid ${currentPreset.color}40`,
          padding: '1.8rem',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          marginBottom: '2rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '2rem',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', borderRadius: '99px', background: `${currentPreset.color}20`, color: currentPreset.color, fontSize: '0.82rem', fontWeight: 700, marginBottom: '12px' }}>
              <Headphones size={15} /> Current Resonance: {currentPreset.tag} ({activeFreq} Hz)
            </div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', marginBottom: '8px' }}>
              {currentPreset.name}
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.4rem' }}>
              {currentPreset.desc}. Bio-acoustic frequencies engineered to synchronize neurological rhythms, ease cortisol spikes, and elevate tranquility.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={togglePlayback}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: currentPreset.color,
                  color: '#0f172a',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  padding: '12px 24px',
                  borderRadius: '14px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: `0 8px 24px ${currentPreset.color}50`
                }}
              >
                {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                <span>{isPlaying ? 'Pause Audio' : 'Start Session'}</span>
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '8px 14px', borderRadius: '12px' }}>
                <Volume2 size={16} style={{ color: '#38bdf8' }} />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setVolume(val);
                    if (audioRef.current) audioRef.current.volume = val;
                    if (synthNodesRef.current?.gain && synthCtxRef.current) {
                      synthNodesRef.current.gain.gain.setValueAtTime(val * 0.12, synthCtxRef.current.currentTime);
                    }
                  }}
                  style={{ width: '100px', accentColor: currentPreset.color }}
                />
                <span style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>{Math.round(volume * 100)}%</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', background: 'rgba(0,0,0,0.3)', padding: '1.4rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Mindful Pacer</span>
              <div style={{
                width: '100px',
                height: '100px',
                margin: '10px auto',
                borderRadius: '50%',
                background: `radial-gradient(circle, ${currentPreset.color}40 0%, rgba(15,23,42,0.8) 70%)`,
                border: `2px solid ${currentPreset.color}`,
                display: 'grid',
                placeItems: 'center',
                boxShadow: isPlaying ? `0 0 30px ${currentPreset.color}60` : 'none',
                transition: 'all 0.8s ease'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <strong style={{ fontSize: '0.88rem', color: '#ffffff', display: 'block' }}>{breathPhase}</strong>
                  <span style={{ fontSize: '1.2rem', fontWeight: 800, color: currentPreset.color }}>{breathCount}s</span>
                </div>
              </div>
              <small style={{ color: '#94a3b8', fontSize: '0.75rem' }}>4-4-4-4 Box Breathing Technique</small>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <p className="eyebrow" style={{ color: '#38bdf8' }}>SELECT YOUR MOOD FREQUENCY</p>
              <h3 style={{ fontSize: '1.3rem', color: '#fff' }}>Instant Frequency Selector</h3>
            </div>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Click any card to load sound & frequency</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            {moodPresets.map((preset) => {
              const active = activeMood === preset.id;
              return (
                <button
                  type="button"
                  key={preset.id}
                  onClick={() => selectMood(preset)}
                  style={{
                    padding: '1.2rem',
                    borderRadius: '16px',
                    background: active ? `linear-gradient(135deg, ${preset.color}25, rgba(15,23,42,0.9))` : 'rgba(255,255,255,0.03)',
                    border: active ? `2px solid ${preset.color}` : '1px solid rgba(255,255,255,0.08)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: active ? `0 10px 25px ${preset.color}30` : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '130px'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: preset.color, background: `${preset.color}18`, padding: '2px 8px', borderRadius: '6px' }}>
                        {preset.tag}
                      </span>
                      {active && isPlaying && <Music size={14} style={{ color: preset.color }} />}
                    </div>
                    <strong style={{ fontSize: '0.98rem', color: '#ffffff', display: 'block', marginBottom: '4px' }}>
                      {preset.name}
                    </strong>
                    <span style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.4 }}>
                      {preset.desc.split('•')[1] || preset.desc}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: preset.color, marginTop: '8px' }}>
                    {active ? '● Currently Active' : '▶ Select Sound'}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <p className="eyebrow" style={{ color: '#34d399' }}>CALMING VISUAL RETREAT</p>
              <h3 style={{ fontSize: '1.3rem', color: '#fff' }}>Wellness Nature Photo Gallery</h3>
            </div>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Click any photo to immerse with matching sounds</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
            {calmingPhotos.map((photo) => (
              <div
                key={photo.id}
                onClick={() => {
                  const target = moodPresets.find(m => m.id === photo.mood) || moodPresets[0];
                  selectMood(target);
                }}
                style={{
                  borderRadius: '18px',
                  overflow: 'hidden',
                  background: 'rgba(15,23,42,0.8)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  cursor: 'pointer',
                  transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.5)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ height: '170px', overflow: 'hidden', position: 'relative' }}>
                  <img src={photo.url} alt={photo.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', padding: '4px 10px', borderRadius: '99px', fontSize: '0.72rem', color: '#38bdf8', fontWeight: 700 }}>
                    ▶ Play {photo.freq} Hz
                  </div>
                </div>
                <div style={{ padding: '1.1rem' }}>
                  <strong style={{ fontSize: '0.98rem', color: '#ffffff', display: 'block', marginBottom: '3px' }}>{photo.title}</strong>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>{photo.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Card style={{ padding: '1.6rem', background: 'rgba(15,23,42,0.85)', border: '1px solid rgba(56,189,248,0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <p className="eyebrow" style={{ color: '#38bdf8' }}>CUSTOM FREQUENCY LAB</p>
              <h3 style={{ fontSize: '1.2rem', color: '#ffffff' }}>Harmonic Wave Synthesizer</h3>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['sine', 'triangle', 'sawtooth'] as const).map((type) => (
                <button
                  type="button"
                  key={type}
                  onClick={() => {
                    setWaveType(type);
                    if (isPlaying) startSynth(activeFreq);
                  }}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    background: waveType === type ? '#38bdf8' : 'rgba(255,255,255,0.06)',
                    color: waveType === type ? '#0f172a' : '#cbd5e1',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 700,
                    textTransform: 'capitalize'
                  }}
                >
                  {type} Wave
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.4rem', alignItems: 'center' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '6px' }}>
                Base Frequency: <strong style={{ color: '#38bdf8' }}>{activeFreq} Hz</strong>
              </label>
              <input
                type="range"
                min="50"
                max="800"
                step="1"
                value={activeFreq}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setActiveFreq(val);
                  if (isPlaying) startSynth(val);
                }}
                style={{ width: '100%', accentColor: '#38bdf8' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '6px' }}>
                Binaural Beat Entrainment
              </label>
              <button
                type="button"
                onClick={() => {
                  const next = !binauralEnabled;
                  setBinauralEnabled(next);
                  if (isPlaying) startSynth(activeFreq);
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  background: binauralEnabled ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.06)',
                  color: binauralEnabled ? '#34d399' : '#94a3b8',
                  border: binauralEnabled ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.1)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Radio size={14} /> {binauralEnabled ? 'Entrainment Active (Left/Right Shift)' : 'Mono Tone'}
              </button>
            </div>
          </div>
        </Card>
      </div>
    </Shell>
  );
}

function StreamlitEmbedPage() {
  const [iframeKey, setIframeKey] = useState(0);

  return (
    <Shell>
      <div style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
        <PageHeader
          eyebrow="Interactive Machine Learning & Audio Engine"
          title="Streamlit ML Analytics & Sound Studio"
          detail="Live psychometric regression, real-time DASS-42 predictions, and interactive sound generator."
          action={
            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <Button variant="soft" onClick={() => setIframeKey(k => k + 1)}>
                <RefreshCw size={15} /> Reload View
              </Button>
              <a href="http://localhost:8501" target="_blank" rel="noopener noreferrer" className="button button-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span>Open in Tab</span>
                <ExternalLink size={14} />
              </a>
            </div>
          }
        />
        <div style={{ flex: 1, borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(56,189,248,0.25)', boxShadow: '0 20px 45px rgba(0,0,0,0.5)', background: '#0e1117' }}>
          <iframe
            key={iframeKey}
            src="http://localhost:8501/?embedded=true"
            title="MediGrid Streamlit ML Analytics"
            style={{ width: '100%', height: '100%', border: 'none' }}
          />
        </div>
      </div>
    </Shell>
  );
}

function DarkPortalEmbedPage() {
  const [iframeKey, setIframeKey] = useState(0);

  return (
    <Shell>
      <div style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
        <PageHeader
          eyebrow="Interactive Showcase"
          title="Dark Glassmorphic 3D Neural Showcase"
          detail="Interactive 3D particle canvas, neural network visualization, and floating voice AI assistant."
          action={
            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <Button variant="soft" onClick={() => setIframeKey(k => k + 1)}>
                <RefreshCw size={15} /> Reload
              </Button>
              <a href="/portal/index.html" target="_blank" rel="noopener noreferrer" className="button button-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span>Open in Tab</span>
                <ExternalLink size={14} />
              </a>
            </div>
          }
        />
        <div style={{ flex: 1, borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(168,85,247,0.25)', boxShadow: '0 20px 45px rgba(0,0,0,0.5)', background: '#090d16' }}>
          <iframe
            key={iframeKey}
            src="/portal/index.html"
            title="MediGrid Dark Showcase Portal"
            style={{ width: '100%', height: '100%', border: 'none' }}
          />
        </div>
      </div>
    </Shell>
  );
}

function NotFound() {
  return <div className="not-found"><Logo /><div><p className="eyebrow">404 · NOT HERE</p><h1>This page took a wrong turn.</h1><p>Let's get you back to a clearer view.</p><Link href="/dashboard" className="button button-primary" data-testid="link-not-found-dashboard">Back to overview <ArrowRight size={15} /></Link></div></div>;
}

const AMBIENT_PEACE_TRACKS = [
  { id: 'cool-waves', title: 'Ocean Shoreline', tag: 'Cool & Calm · 432Hz', url: '/audio/ocean_432hz.wav', mood: 'cool', freq: 432 },
  { id: 'balanced-birds', title: 'Morning Forest', tag: 'Balanced · 528Hz', url: '/audio/forest_528hz.wav', mood: 'balanced', freq: 528 },
  { id: 'stress-rain', title: 'Gentle Forest Rain', tag: 'Stress Relief · Delta 3Hz', url: '/audio/rain_delta.wav', mood: 'stress', freq: 136.1 },
  { id: 'anxiety-stream', title: 'Mountain Stream', tag: 'Anxiety Relief · Theta 6Hz', url: '/audio/stream_theta.wav', mood: 'anxiety', freq: 200 },
  { id: 'focus-wind', title: 'Meadow Wind', tag: 'Focus & Flow · 40Hz', url: '/audio/wind_gamma.wav', mood: 'focus', freq: 240 },
  { id: 'night-rest', title: 'Nocturne Serenade', tag: 'Low Mood / Sleep · Theta 4Hz', url: '/audio/night_theta.wav', mood: 'mood', freq: 144 },
];

function PeaceAudioDock() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackIdx, setTrackIdx] = useState(0);
  const [volume, setVolume] = useState(0.65);
  const [muted, setMuted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const synthCtxRef = useRef<AudioContext | null>(null);
  const synthNodesRef = useRef<{ osc1?: OscillatorNode; osc2?: OscillatorNode; gain?: GainNode } | null>(null);

  const current = AMBIENT_PEACE_TRACKS[trackIdx];

  const stopSynth = () => {
    if (synthNodesRef.current) {
      try {
        synthNodesRef.current.osc1?.stop();
        synthNodesRef.current.osc2?.stop();
        synthNodesRef.current.gain?.disconnect();
      } catch {}
      synthNodesRef.current = null;
    }
  };

  const startSynthFallback = (freq: number) => {
    stopSynth();
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!synthCtxRef.current) {
        synthCtxRef.current = new AudioCtx();
      }
      if (synthCtxRef.current.state === 'suspended') {
        synthCtxRef.current.resume();
      }

      const ctx = synthCtxRef.current;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(Math.min(freq * 1.2, 420), ctx.currentTime);
      filter.Q.setValueAtTime(0.8, ctx.currentTime);

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq, ctx.currentTime);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 0.5, ctx.currentTime);

      const targetVol = muted ? 0 : volume * 0.045;
      gain.gain.setValueAtTime(targetVol, ctx.currentTime);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      synthNodesRef.current = { osc1, osc2, gain };
    } catch {}
  };

  const togglePlay = () => {
    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      stopSynth();
      setIsPlaying(false);
    } else {
      if (audioRef.current) {
        audioRef.current.volume = muted ? 0 : volume;
        audioRef.current.play()
          .then(() => setIsPlaying(true))
          .catch(() => {
            startSynthFallback(current.freq);
            setIsPlaying(true);
          });
      } else {
        startSynthFallback(current.freq);
        setIsPlaying(true);
      }
    }
  };

  const changeTrack = (idx: number) => {
    setTrackIdx(idx);
    setIsPlaying(true);
    if (audioRef.current) {
      audioRef.current.src = AMBIENT_PEACE_TRACKS[idx].url;
      audioRef.current.play().catch(() => {
        startSynthFallback(AMBIENT_PEACE_TRACKS[idx].freq);
      });
    } else {
      startSynthFallback(AMBIENT_PEACE_TRACKS[idx].freq);
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = muted ? 0 : volume;
    }
    if (synthNodesRef.current?.gain && synthCtxRef.current) {
      synthNodesRef.current.gain.gain.setValueAtTime(muted ? 0 : volume * 0.15, synthCtxRef.current.currentTime);
    }
  }, [volume, muted]);

  return (
    <>
      <audio
        ref={audioRef}
        src={current.url}
        loop
        preload="auto"
        onError={() => {
          if (isPlaying) startSynthFallback(current.freq);
        }}
      />
      <div className="peace-audio-dock">
        <button type="button" onClick={togglePlay} className="audio-play-btn" title={isPlaying ? "Pause Peace Music" : "Play Peace Music"}>
          {isPlaying ? <Pause size={17} /> : <Play size={17} style={{ marginLeft: '2px' }} />}
        </button>
        <div style={{ cursor: 'pointer' }} onClick={() => setIsExpanded(!isExpanded)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>{current.title}</span>
            {isPlaying && (
              <span className="vital-wave-group" style={{ height: '14px', color: '#38bdf8' }}>
                <span /><span /><span />
              </span>
            )}
          </div>
          <small style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block' }}>{current.tag}</small>
        </div>

        <button type="button" onClick={() => setMuted(!muted)} style={{ background: 'transparent', border: 'none', color: muted ? '#f87171' : '#94a3b8', cursor: 'pointer', display: 'grid', placeItems: 'center', padding: '4px' }}>
          {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>

        <button type="button" onClick={() => setIsExpanded(!isExpanded)} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#38bdf8', borderRadius: '99px', padding: '3px 8px', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}>
          {isExpanded ? 'Hide' : 'Tracks'}
        </button>
      </div>

      {isExpanded && (
        <div style={{ position: 'fixed', bottom: '82px', left: '24px', zIndex: 1000, width: '310px', background: 'rgba(15,23,42,0.96)', border: '1px solid rgba(56,189,248,0.3)', borderRadius: '16px', padding: '14px', backdropFilter: 'blur(20px)', boxShadow: '0 20px 45px rgba(0,0,0,0.6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <strong style={{ fontSize: '0.88rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Music size={15} /> Peace Mood Soundscapes
            </strong>
            <button onClick={() => setIsExpanded(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={15} /></button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '230px', overflowY: 'auto' }}>
            {AMBIENT_PEACE_TRACKS.map((t, idx) => (
              <button
                type="button"
                key={t.id}
                onClick={() => changeTrack(idx)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 10px',
                  borderRadius: '10px',
                  background: trackIdx === idx ? 'rgba(56,189,248,0.18)' : 'rgba(255,255,255,0.03)',
                  border: trackIdx === idx ? '1px solid rgba(56,189,248,0.5)' : '1px solid transparent',
                  color: trackIdx === idx ? '#ffffff' : '#cbd5e1',
                  fontSize: '0.8rem',
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
              >
                <div>
                  <strong>{t.title}</strong>
                  <div style={{ fontSize: '0.7rem', opacity: 0.75 }}>{t.tag}</div>
                </div>
                {trackIdx === idx && isPlaying && <span style={{ color: '#38bdf8', fontSize: '0.75rem' }}>Playing</span>}
              </button>
            ))}
          </div>
          <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Volume:</span>
            <input type="range" min="0" max="1" step="0.05" value={muted ? 0 : volume} onChange={(e) => { setVolume(parseFloat(e.target.value)); setMuted(false); }} style={{ flex: 1, accentColor: '#38bdf8' }} />
          </div>
        </div>
      )}
    </>
  );
}

const SpeechRecognitionAPI = typeof window !== 'undefined' ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) : null;

function speakTextAloud(text: string, enabled: boolean = true) {
  if (!enabled || typeof window === 'undefined' || !window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel();
    const clean = text.replace(/[*_#`~>\[\]()•\-]/g, ' ').replace(/\s+/g, ' ').trim();
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = 1.0;
    utterance.pitch = 1.02;
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Speech synthesis error:', err);
  }
}

function AIChatPage() {
  const [messages, setMessages] = useState<Array<{ role: 'ai' | 'user'; text: string; time: string; suggestions?: string[] }>>([
    {
      role: 'ai',
      text: "👋 **Hello! I'm your MediGrid Real-Time AI Companion.**\n\nI am right here to talk with you in real time. You can type your thoughts, click the **🎙️ Mic button** to speak with your voice, or start a **Live Voice Call** for an interactive conversation. How are you feeling today?",
      time: 'Just now',
      suggestions: [
        "💬 Let's talk about my day",
        "🌬️ I feel anxious right now",
        "🌧️ Feeling low mood & drained",
        "🎵 Play peace music (432Hz)",
        "🧘 Guide me through box breathing",
        "💊 Review my e-prescriptions"
      ]
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [activeMood, setActiveMood] = useState('balanced');
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const startVoiceInput = () => {
    if (!SpeechRecognitionAPI) {
      alert("Voice recognition is not supported in this browser. Please try Google Chrome or Edge.");
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInput(transcript);
          sendMessage(transcript);
        }
      };

      recognition.onerror = (err: any) => {
        console.warn('Speech recognition error:', err);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Recognition start error:', err);
      setIsListening(false);
    }
  };

  const sendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text) return;

    const userMsg = { role: 'user' as const, text, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, mood: activeMood })
      });
      if (res.ok) {
        const data = await res.json();
        const aiReply = data.reply;
        setMessages((prev) => [
          ...prev,
          {
            role: 'ai',
            text: aiReply,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            suggestions: data.suggestions
          }
        ]);
        if (voiceEnabled || isCallActive) {
          speakTextAloud(aiReply, true);
        }
      } else {
        throw new Error('API Error');
      }
    } catch {
      setTimeout(() => {
        let reply = "I understand what you're sharing. Let's take a calm pause together. You can explore our DASS-42 screener or listen to gentle peace music.";
        if (text.toLowerCase().includes('anxious') || text.toLowerCase().includes('panic')) {
          reply = "Take a slow 4-4-4-4 box breath with me: Inhale (4s), Hold (4s), Exhale (4s), Pause (4s). Notice 5 things you can see around you.";
        }
        setMessages((prev) => [
          ...prev,
          {
            role: 'ai',
            text: reply,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            suggestions: ['Start 1-Min Breath Reset', 'Open Screener', 'Find Care Nearby']
          }
        ]);
        if (voiceEnabled || isCallActive) {
          speakTextAloud(reply, true);
        }
      }, 500);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <Shell>
      <PageHeader
        eyebrow="Conversational AI & Voice Talk"
        title="Real-Time AI MindCare Companion"
        detail="Talk freely with our empathetic healthcare assistant using text or live microphone speech."
        action={
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              type="button"
              className={`button ${isCallActive ? 'button-danger' : 'button-primary'}`}
              onClick={() => {
                if (!isCallActive && voiceEnabled) {
                  speakTextAloud("Voice talk connected. I'm listening. Tell me what's on your mind.", true);
                }
                setIsCallActive(!isCallActive);
              }}
              style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
            >
              {isCallActive ? <PhoneOff size={16} /> : <PhoneCall size={16} />}
              <span>{isCallActive ? 'End Voice Talk' : 'Start Voice Talk'}</span>
            </button>
            <button
              type="button"
              className="button button-soft"
              onClick={() => {
                const next = !voiceEnabled;
                setVoiceEnabled(next);
                if (!next && typeof window !== 'undefined' && window.speechSynthesis) {
                  window.speechSynthesis.cancel();
                }
              }}
              title={voiceEnabled ? 'Mute voice readback' : 'Enable voice readback'}
              style={{ display: 'flex', gap: '6px', alignItems: 'center' }}
            >
              {voiceEnabled ? <Volume2 size={16} color="#38bdf8" /> : <VolumeX size={16} />}
              <span>{voiceEnabled ? 'Voice: On' : 'Voice: Muted'}</span>
            </button>
            <button
              type="button"
              className="button button-outline"
              onClick={() => setMessages([messages[0]])}
              title="Clear conversation"
            >
              <Trash2 size={16} />
            </button>
          </div>
        }
      />

      <div className="full-chat-layout">
        {/* Left Sidebar: Call Overlay & Quick Presets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Live Call Lounge Mode Card */}
          {isCallActive ? (
            <div className="voice-call-overlay">
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, #0284c7, #8b5cf6)', display: 'grid', placeItems: 'center', color: '#fff', boxShadow: '0 0 30px rgba(56,189,248,0.5)' }}>
                <Bot size={32} />
              </div>
              <h3 style={{ margin: '14px 0 4px', fontSize: '1.2rem', color: '#ffffff' }}>MediBot Voice Call</h3>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#34d399', fontWeight: 600 }}>● Live Audio Conversation Active</p>
              
              <div className="voice-wave-container">
                <span /><span /><span /><span /><span /><span /><span />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  className={`button ${isListening ? 'button-danger' : 'button-primary'}`}
                  onClick={startVoiceInput}
                  style={{ display: 'flex', gap: '6px', alignItems: 'center', fontSize: '0.86rem' }}
                >
                  {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                  <span>{isListening ? 'Listening...' : 'Push to Speak'}</span>
                </button>
                <button
                  type="button"
                  className="button button-soft"
                  onClick={() => setIsCallActive(false)}
                  style={{ fontSize: '0.86rem' }}
                >
                  Hang Up
                </button>
              </div>
            </div>
          ) : (
            <Card style={{ padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(56,189,248,0.15)', display: 'grid', placeItems: 'center', color: '#38bdf8' }}>
                  <Radio size={18} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.98rem' }}>Voice Talk Mode</h4>
                  <small style={{ color: 'var(--muted-foreground)' }}>Hands-free speech conversations</small>
                </div>
              </div>
              <Button
                variant="soft"
                onClick={() => {
                  setIsCallActive(true);
                  if (voiceEnabled) speakTextAloud("Voice talk connected. Speak into your microphone.", true);
                }}
                style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px' }}
              >
                <Mic size={16} /> <span>Open Voice Lounge</span>
              </Button>
            </Card>
          )}

          {/* Quick Mood Tuner */}
          <Card style={{ padding: '18px' }}>
            <h4 style={{ margin: '0 0 10px', fontSize: '0.95rem', color: '#f1f5f9' }}>🎛️ Instant Mood Frequency</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[
                { id: 'balanced', label: '🌟 Balanced' },
                { id: 'cool', label: '❄️ Cool Calm' },
                { id: 'anxiety', label: '⚡ Anxiety' },
                { id: 'mood', label: '🌧️ Low Mood' },
                { id: 'stress', label: '🔥 Stress' },
                { id: 'focus', label: '✨ Focus Flow' }
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={`button ${activeMood === m.id ? 'button-primary' : 'button-soft'}`}
                  style={{ fontSize: '0.78rem', padding: '6px 8px' }}
                  onClick={() => {
                    setActiveMood(m.id);
                    sendMessage(`I am feeling ${m.label.split(' ')[1] || m.label}. Can you tune your suggestions for me?`);
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </Card>

          {/* Calming Mindfulness Photo Card */}
          <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.12)' }}>
            <img
              src="https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=700&q=80"
              style={{ width: '100%', height: '150px', objectFit: 'cover', display: 'block' }}
              alt="Mindful listening"
            />
            <div style={{ padding: '10px 14px', background: 'rgba(15, 23, 42, 0.9)', fontSize: '0.82rem', color: '#cbd5e1' }}>
              🤝 <strong>Compassionate Space:</strong> A safe haven to share without fear of judgment.
            </div>
          </div>
        </div>

        {/* Right Main Column: Chat Canvas */}
        <Card style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '620px', padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(15, 23, 42, 0.6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #0284c7, #8b5cf6)', display: 'grid', placeItems: 'center', color: '#fff' }}>
                <Sparkles size={18} />
              </div>
              <div>
                <strong style={{ fontSize: '0.98rem', display: 'block', color: '#f1f5f9' }}>MediBot Healthcare AI</strong>
                <span style={{ fontSize: '0.74rem', color: '#34d399' }}>● Online & Listening in Real Time</span>
              </div>
            </div>
            {isListening && (
              <span className="badge badge-rose" style={{ animation: 'micPulse 1.4s infinite' }}>
                🎙️ Listening to your voice...
              </span>
            )}
          </div>

          <div className="chat-win-body" style={{ flex: 1, maxHeight: '460px' }}>
            {messages.map((m, i) => (
              <div key={i} className={`chat-bubble-row ${m.role}`}>
                <div className={`chat-bubble ${m.role}`}>
                  <div style={{ whiteSpace: 'pre-line' }}>{m.text}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                    <span style={{ fontSize: '0.68rem', opacity: 0.6 }}>{m.time}</span>
                    {m.role === 'ai' && (
                      <button
                        type="button"
                        onClick={() => speakTextAloud(m.text, true)}
                        title="Read aloud"
                        style={{ background: 'transparent', border: 'none', color: '#38bdf8', cursor: 'pointer', padding: '2px 4px', display: 'flex', alignItems: 'center' }}
                      >
                        <Volume2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="chat-bubble-row ai">
                <div className="chat-bubble ai" style={{ display: 'flex', gap: '6px', alignItems: 'center', padding: '12px 18px' }}>
                  <span className="vital-wave-group" style={{ height: '16px', color: '#38bdf8' }}>
                    <span /><span /><span /><span />
                  </span>
                  <span style={{ fontSize: '0.84rem', color: '#94a3b8' }}>Reflecting & formulating guidance...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {messages[messages.length - 1]?.suggestions && (
            <div className="chat-suggestions" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px' }}>
              {messages[messages.length - 1].suggestions?.map((s, idx) => (
                <button type="button" key={idx} className="chat-chip" onClick={() => sendMessage(s)}>
                  {s}
                </button>
              ))}
            </div>
          )}

          <div className="chat-win-footer">
            <button
              type="button"
              className={`chat-mic-btn ${isListening ? 'recording' : ''}`}
              onClick={startVoiceInput}
              title={isListening ? 'Stop listening' : 'Click to talk via microphone'}
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
            <input
              type="text"
              className="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }}
              placeholder={isListening ? "🎙️ Listening... speak now" : "Type a message or click the 🎙️ mic to talk..."}
            />
            <button
              type="button"
              className="chat-send-btn"
              onClick={() => sendMessage()}
              disabled={!input.trim()}
              title="Send message"
            >
              <Send size={16} />
            </button>
          </div>
        </Card>
      </div>
    </Shell>
  );
}

function FloatingAIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'ai' | 'user'; text: string; time: string; suggestions?: string[] }>>([
    {
      role: 'ai',
      text: "👋 Hi! I'm your **MediGrid Real-Time AI Companion**. Tell me how you're feeling, click the **🎙️ Mic** to talk, or request peace music.",
      time: 'Just now',
      suggestions: ['🌬️ I feel anxious right now', '🌧️ Feeling low mood & tired', '🎵 Play calming rain audio', '💊 Check my prescriptions', '📍 Find clinics nearby']
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const startVoiceInput = () => {
    if (!SpeechRecognitionAPI) {
      alert("Voice recognition is not supported in this browser. Please try Google Chrome or Edge.");
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInput(transcript);
          sendMessage(transcript);
        }
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const sendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text) return;

    const userMsg = { role: 'user' as const, text, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });
      if (res.ok) {
        const data = await res.json();
        const reply = data.reply;
        setMessages((prev) => [
          ...prev,
          {
            role: 'ai',
            text: reply,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            suggestions: data.suggestions
          }
        ]);
        if (voiceEnabled) {
          speakTextAloud(reply, true);
        }
      } else {
        throw new Error('API Error');
      }
    } catch {
      setTimeout(() => {
        let reply = "I understand what you're sharing. Let's take a calm pause together. You can explore our DASS-42 screener or listen to gentle peace music.";
        if (text.toLowerCase().includes('anxious') || text.toLowerCase().includes('panic')) {
          reply = "Take a slow 4-4-4-4 box breath with me: Inhale (4s), Hold (4s), Exhale (4s), Pause (4s). Notice 5 things you can see around you.";
        }
        setMessages((prev) => [
          ...prev,
          {
            role: 'ai',
            text: reply,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            suggestions: ['Start 1-Min Breath Reset', 'Open Screener', 'Find Care Nearby']
          }
        ]);
        if (voiceEnabled) {
          speakTextAloud(reply, true);
        }
      }, 500);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="floating-chatbot-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Open MediGrid AI Chatbot"
      >
        <Bot size={19} />
        <span>Ask AI Assistant</span>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34d399', boxShadow: '0 0 10px #34d399' }} />
      </button>

      {isOpen && (
        <div className="floating-chat-window">
          <div className="chat-win-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #0ea5e9, #8b5cf6)', display: 'grid', placeItems: 'center', color: '#fff' }}>
                <Sparkles size={16} />
              </div>
              <div>
                <strong style={{ fontSize: '0.92rem', color: '#ffffff', display: 'block' }}>MediBot Real-Time AI</strong>
                <span style={{ fontSize: '0.72rem', color: '#34d399' }}>● Online & Voice Ready</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                onClick={() => {
                  const next = !voiceEnabled;
                  setVoiceEnabled(next);
                  if (!next && typeof window !== 'undefined' && window.speechSynthesis) {
                    window.speechSynthesis.cancel();
                  }
                }}
                style={{ background: 'transparent', border: 'none', color: voiceEnabled ? '#38bdf8' : '#94a3b8', cursor: 'pointer' }}
                title={voiceEnabled ? 'Voice readback on' : 'Voice readback muted'}
              >
                {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
              <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={18} /></button>
            </div>
          </div>

          <div className="chat-win-body">
            {messages.map((m, i) => (
              <div key={i} className={`chat-bubble-row ${m.role}`}>
                <div className={`chat-bubble ${m.role}`}>
                  <div style={{ whiteSpace: 'pre-line' }}>{m.text}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                    <span style={{ fontSize: '0.68rem', opacity: 0.6 }}>{m.time}</span>
                    {m.role === 'ai' && (
                      <button
                        type="button"
                        onClick={() => speakTextAloud(m.text, true)}
                        title="Read aloud"
                        style={{ background: 'transparent', border: 'none', color: '#38bdf8', cursor: 'pointer', padding: 0 }}
                      >
                        <Volume2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="chat-bubble-row ai">
                <div className="chat-bubble ai" style={{ display: 'flex', gap: '4px', alignItems: 'center', padding: '12px 16px' }}>
                  <span className="vital-wave-group" style={{ height: '16px', color: '#38bdf8' }}>
                    <span /><span /><span /><span />
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Thinking...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {messages[messages.length - 1]?.suggestions && (
            <div className="chat-suggestions">
              {messages[messages.length - 1].suggestions?.map((s, idx) => (
                <button type="button" key={idx} className="chat-chip" onClick={() => sendMessage(s)}>
                  {s}
                </button>
              ))}
            </div>
          )}

          <div className="chat-win-footer">
            <button
              type="button"
              className={`chat-mic-btn ${isListening ? 'recording' : ''}`}
              onClick={startVoiceInput}
              title={isListening ? 'Stop listening' : 'Click to talk via microphone'}
            >
              {isListening ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
            <input
              type="text"
              className="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }}
              placeholder={isListening ? "🎙️ Listening... speak now" : "Ask about symptoms, mood, or click 🎙️..."}
            />
            <button type="button" className="chat-send-btn" onClick={() => sendMessage()} disabled={!input.trim()}>
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function Router() {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}><Switch>
    <Route path="/" component={Landing} />
    <Route path="/dashboard" component={DashboardPage} />
    <Route path="/chat" component={AIChatPage} />
    <Route path="/soundscapes" component={SoundscapesPage} />
    <Route path="/analytics" component={AnalyticsPage} />
    <Route path="/streamlit" component={StreamlitEmbedPage} />
    <Route path="/portal" component={DarkPortalEmbedPage} />
    <Route path="/symptoms" component={SymptomsPage} />
    <Route path="/appointments" component={AppointmentsPage} />
    <Route path="/records" component={RecordsPage} />
    <Route path="/nearby" component={NearbyPage} />
    <Route path="/doctor" component={DoctorPage} />
    <Route path="/reception" component={ReceptionPage} />
    <Route path="/admin" component={AdminPage} />
    <Route path="/login"><AuthPage mode="login" /></Route>
    <Route path="/signup"><AuthPage mode="signup" /></Route>
    <Route component={NotFound} />
  </Switch></ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
          <PeaceAudioDock />
          <FloatingAIChatbot />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;