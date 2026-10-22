'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Lock,
  Loader2,
  Upload,
  Trash2,
  FileText,
  Eye,
  Download,
  ShieldCheck,
  Database,
  HandHeart,
  BadgeCheck,
  XCircle,
  Clock,
  Users,
  Globe2,
  Layers,
  BookOpen,
  LibraryBig,
  GraduationCap,
  Umbrella,
  LogOut,
  X,
  LayoutDashboard,
  Search,
  Sparkles,
} from 'lucide-react';
import type { BookItem, CountryItem, GradeItem, StageWithGrades, SubjectItem } from './types';
import { formatSize, formatDate } from './types';
import { STATUS_LABELS, packageByKey } from '@/lib/sponsor-packages';

interface AdminSponsorshipRequest {
  id: string;
  packageKey: string;
  amountUsd: number;
  studentsCount: number;
  orgName: string | null;
  contactNote: string | null;
  proofUrl: string | null;
  status: string;
  adminNote: string | null;
  createdAt: string;
  user: { name: string; email: string; role: string };
}

interface AdminBookRow {
  id: string;
  titleAr: string;
  fileName: string;
  mimeType?: string | null;
  size: number;
  createdAt: string;
  fileUrl: string;
  countryAr: string;
  countryFlag: string;
  stageAr: string;
  gradeAr: string;
  subjectAr: string;
}

interface AdminStats {
  countries: number;
  stages: number;
  grades: number;
  subjects: number;
  books: number;
  booksSize: number;
  students: number;
  sponsoredStudents: number;
  sponsors: number;
  requests: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    approvedUsd: number;
    fundedAccounts: number;
  };
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onViewBook: (book: BookItem) => void;
  onAdminAuthed?: (user: { id: string; name: string; email: string; role: string } | null) => void;
}

const ACCEPT = '.pdf,.doc,.docx,.ppt,.pptx,.epub,.png,.jpg,.jpeg,.txt';

const selectCls =
  'w-full h-11 rounded-md border border-white/15 bg-white/5 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-400/60 [&>option]:bg-[#241040] [&>option]:text-white';

// بطاقة إحصاء في النظرة العامة
function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof Globe2;
  label: string;
  value: number | string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5 sm:p-4 hover:border-amber-400/40 transition-colors">
      <div className="flex items-center gap-2.5">
        <span className="w-9 h-9 rounded-xl bg-amber-400/15 flex items-center justify-center shrink-0">
          <Icon className="w-4.5 h-4.5 text-amber-300" />
        </span>
        <div className="min-w-0">
          <p className="text-lg sm:text-xl font-black text-white leading-6">{value}</p>
          <p className="text-[9px] sm:text-[10px] text-violet-100/65 leading-3 truncate">{label}</p>
        </div>
      </div>
      {sub && <p className="text-[9px] text-violet-100/45 mt-2 truncate">{sub}</p>}
    </div>
  );
}

export default function AdminPanel({ open, onOpenChange, onViewBook, onAdminAuthed }: Props) {
  // جلسة الأدمن من بوابة الدخول الموحدة (حساب إدمن: بريد + كلمة مرور)
  const [authed, setAuthed] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // تبويبات الداشبورد
  const [tab, setTab] = useState<'overview' | 'books' | 'sponsorships'>('overview');

  // الإحصاءات الشاملة
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentBooks, setRecentBooks] = useState<AdminBookRow[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);

  // طلبات الرعاية
  const [sponsorReqs, setSponsorReqs] = useState<AdminSponsorshipRequest[]>([]);
  const [loadingSponsorReqs, setLoadingSponsorReqs] = useState(false);
  const [sponsorFilter, setSponsorFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState('');

  // اختيارات التسلسل الهرمي: دولة ← مرحلة ← صف ← مادة
  const [countries, setCountries] = useState<CountryItem[]>([]);
  const [stages, setStages] = useState<StageWithGrades[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);

  const [countryCode, setCountryCode] = useState('');
  const [stageId, setStageId] = useState('');
  const [gradeId, setGradeId] = useState('');
  const [subjectId, setSubjectId] = useState('');

  // كل الكتب (جدول الداشبورد)
  const [allBooks, setAllBooks] = useState<AdminBookRow[]>([]);
  const [loadingAllBooks, setLoadingAllBooks] = useState(false);
  const [bookSearch, setBookSearch] = useState('');

  // نموذج الرفع
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const stage = stages.find((s) => s.id === stageId);
  const grades: GradeItem[] = stage?.grades || [];
  const gradeName = grades.find((g) => g.id === gradeId)?.nameAr || '';

  // التحقق من جلسة الأدمن عند الفتح (نفس بوابة الدخول للجميع)
  useEffect(() => {
    if (!open) return;
    setCheckingSession(true);
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        if (d.user?.role === 'ADMIN') {
          setAuthed(true);
          onAdminAuthed?.(d.user);
        } else {
          setAuthed(false);
        }
      })
      .catch(() => setAuthed(false))
      .finally(() => setCheckingSession(false));
  }, [open]);

  // تفريغ الحالة عند الإغلاق
  useEffect(() => {
    if (!open) {
      setPassword('');
      setRejectingId(null);
      setRejectNote('');
    }
  }, [open]);

  // قفل تمرير الصفحة + الإغلاق بمفتاح Escape
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onOpenChange]);

  // الإحصاءات الشاملة
  const loadStats = useCallback(async () => {
    if (!authed) return;
    setLoadingStats(true);
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStats(data.stats || null);
      setRecentBooks(data.recentBooks || []);
    } catch {
      toast.error('تعذر تحميل الإحصاءات');
    } finally {
      setLoadingStats(false);
    }
  }, [authed]);

  // كل الكتب
  const loadAllBooks = useCallback(async () => {
    if (!authed) return;
    setLoadingAllBooks(true);
    try {
      const res = await fetch('/api/admin/books');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAllBooks(data.books || []);
    } catch {
      toast.error('تعذر تحميل الكتب');
    } finally {
      setLoadingAllBooks(false);
    }
  }, [authed]);

  // طلبات الرعاية
  const loadSponsorReqs = useCallback(async () => {
    if (!authed) return;
    setLoadingSponsorReqs(true);
    try {
      const res = await fetch('/api/admin/sponsorships');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSponsorReqs(data.requests || []);
    } catch {
      toast.error('تعذر تحميل طلبات الرعاية');
    } finally {
      setLoadingSponsorReqs(false);
    }
  }, [authed]);

  // تحميل كل بيانات الداشبورد عند الدخول
  useEffect(() => {
    if (!open || !authed) return;
    loadStats();
    loadAllBooks();
    loadSponsorReqs();
    if (countries.length === 0) {
      fetch('/api/countries')
        .then((r) => r.json())
        .then((d) => setCountries(d.countries || []))
        .catch(() => {});
    }
  }, [open, authed, loadStats, loadAllBooks, loadSponsorReqs]);

  // تحميل مراحل الدولة مع صفوفها
  useEffect(() => {
    if (!countryCode) return;
    setStageId('');
    setGradeId('');
    setSubjectId('');
    fetch(`/api/countries/${countryCode}/stages`)
      .then((r) => r.json())
      .then((d) => setStages(d.stages || []))
      .catch(() => toast.error('تعذر تحميل المراحل'));
  }, [countryCode]);

  // تحميل مواد الصف
  useEffect(() => {
    if (!gradeId) return;
    setSubjectId('');
    fetch(`/api/grades/${gradeId}/subjects`)
      .then((r) => r.json())
      .then((d) => setSubjects(d.subjects || []))
      .catch(() => toast.error('تعذر تحميل المواد'));
  }, [gradeId]);

  // دخول الأدمن — نفس بوابة الدخول الموحدة (حساب إدمن: بريد + كلمة مرور)
  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoggingIn(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: 'ADMIN' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطأ في الدخول');
      setAuthed(true);
      onAdminAuthed?.(data.user);
      setEmail('');
      setPassword('');
      toast.success(`مرحباً بك في لوحة التحكم ${data.user.name} 👋`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'خطأ في الدخول');
    } finally {
      setLoggingIn(false);
    }
  }

  async function logout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // نكمل تسجيل الخروج محلياً حتى لو فشل الطلب
    }
    setAuthed(false);
    setPassword('');
    onAdminAuthed?.(null);
    toast.success('تم تسجيل خروج المشرف');
  }

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    if (!subjectId || !title.trim() || !file) {
      toast.error('أكمل جميع الحقول: العنوان، المادة، والملف');
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('subjectId', subjectId);
      fd.append('titleAr', title.trim());
      fd.append('file', file);
      const res = await fetch('/api/admin/books', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل الرفع');
      toast.success('تم رفع الكتاب بنجاح ✅');
      setTitle('');
      setFile(null);
      const inputEl = document.getElementById('admin-file-input') as HTMLInputElement | null;
      if (inputEl) inputEl.value = '';
      await Promise.all([loadAllBooks(), loadStats()]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'فشل الرفع');
    } finally {
      setUploading(false);
    }
  }

  async function removeBook(id: string) {
    if (!confirm('هل أنت متأكد من حذف هذا الكتاب نهائياً؟')) return;
    try {
      const res = await fetch(`/api/admin/books/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل الحذف');
      toast.success('تم حذف الكتاب');
      await Promise.all([loadAllBooks(), loadStats()]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'فشل الحذف');
    }
  }

  async function reviewRequest(id: string, action: 'APPROVE' | 'REJECT', adminNote = '') {
    if (!authed) return;
    try {
      const res = await fetch('/api/admin/sponsorships/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action, adminNote }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل التحديث');
      toast.success(action === 'APPROVE' ? 'تم اعتماد طلب الرعاية ✅' : 'تم رفض الطلب');
      setRejectingId(null);
      setRejectNote('');
      await Promise.all([loadSponsorReqs(), loadStats()]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'فشل التحديث');
    }
  }

  const pendingCount = sponsorReqs.filter((r) => r.status === 'PENDING').length;
  const filteredReqs = sponsorFilter === 'ALL' ? sponsorReqs : sponsorReqs.filter((r) => r.status === sponsorFilter);

  const q = bookSearch.trim();
  const filteredBooks = q
    ? allBooks.filter(
        (b) =>
          b.titleAr.includes(q) ||
          b.subjectAr.includes(q) ||
          b.gradeAr.includes(q) ||
          b.stageAr.includes(q) ||
          b.countryAr.includes(q)
      )
    : allBooks;

  if (!open) return null;

  const tabs = [
    { key: 'overview', label: 'نظرة عامة', icon: LayoutDashboard },
    { key: 'books', label: 'الكتب والمواد', icon: Database, badge: 0 },
    { key: 'sponsorships', label: 'طلبات الرعاية', icon: HandHeart, badge: pendingCount },
  ] as const;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-[#150a20]"
      role="dialog"
      aria-modal="true"
      aria-label="لوحة تحكم الإدارة"
    >
      {/* نقشة خلفية */}
      <div className="fixed inset-0 pattern-arabesque-light pointer-events-none" style={{ opacity: 0.03 }} aria-hidden />

      {!authed ? (
        /* ═══ شاشة الدخول — نفس بوابة الدخول الموحدة ═══ */
        <div className="relative min-h-full flex items-center justify-center p-4">
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-4 end-4 w-9 h-9 rounded-xl glass-dark flex items-center justify-center text-white/70 hover:text-white transition-colors"
            aria-label="إغلاق"
          >
            <X className="w-4.5 h-4.5" />
          </button>
          <div className="w-full max-w-sm rounded-3xl border-2 border-[#c9992b]/50 bg-gradient-to-b from-[#1e0d2e] to-[#150a20] p-8 luxury-shadow-lg text-center">
            <div className="w-16 h-16 rounded-2xl gold-bar flex items-center justify-center mx-auto mb-3 shadow-md">
              <Lock className="w-8 h-8 text-[#2a1240]" />
            </div>
            <h1 className="text-xl font-black text-white">لوحة تحكم أرث</h1>
            <p className="text-xs text-violet-100/65 mt-1.5 leading-relaxed">
              داشبورد احترافي للمشرفين — إدارة الكتب والمواد وطلبات الرعاية ومتابعة إحصاءات المنصة
            </p>
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 text-[10px] font-bold text-amber-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              الدخول بنفس بوابة الدخول الموحّدة — حساب إدمن
            </p>
            {checkingSession ? (
              <div className="mt-6 flex justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-amber-300" />
              </div>
            ) : (
              <form onSubmit={login} className="mt-6 space-y-3">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="بريد حساب الإدمن"
                  className="h-11 text-center bg-white/5 border-white/15 text-white placeholder:text-violet-100/40"
                  dir="ltr"
                  autoFocus
                />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="كلمة المرور"
                  className="h-11 text-center bg-white/5 border-white/15 text-white placeholder:text-violet-100/40"
                  dir="ltr"
                />
                <Button
                  type="submit"
                  disabled={loggingIn || !email || !password}
                  className="w-full h-11 bg-gradient-to-br from-amber-300 to-[#c9992b] text-[#2a1240] hover:from-amber-200 hover:to-[#d4a72c] font-black disabled:opacity-50"
                >
                  {loggingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  دخول آمن كإدمن
                </Button>
              </form>
            )}
          </div>
        </div>
      ) : (
        /* ═══ الداشبورد الكامل ═══ */
        <div className="relative min-h-full flex flex-col">
          {/* الترويسة */}
          <header className="sticky top-0 z-10 bg-gradient-to-l from-[#150a20] via-[#2b1140] to-[#150a20] border-b-2 border-[#c9992b]/70 shadow-lg">
            <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl gold-bar flex items-center justify-center shadow-md shrink-0">
                <Database className="w-5.5 h-5.5 text-[#2a1240]" strokeWidth={2.2} />
              </span>
              <div className="min-w-0">
                <h1 className="font-extrabold text-base sm:text-lg leading-5 text-white">لوحة تحكم أرث</h1>
                <p className="text-[9px] sm:text-[10px] gold-text font-bold leading-3">داشبورد الإدارة الاحترافي</p>
              </div>
              <div className="ms-auto flex items-center gap-2">
                <button
                  onClick={logout}
                  className="glass-dark rounded-xl px-3 h-10 flex items-center gap-1.5 text-white text-xs font-bold hover:bg-white/20 transition-colors"
                >
                  <LogOut className="w-4 h-4 text-red-300" />
                  <span className="hidden sm:inline">خروج</span>
                </button>
                <button
                  onClick={() => onOpenChange(false)}
                  className="glass-dark rounded-xl px-3 h-10 flex items-center gap-1.5 text-white text-xs font-bold hover:bg-white/20 transition-colors"
                >
                  <X className="w-4 h-4" />
                  <span className="hidden sm:inline">إغلاق</span>
                </button>
              </div>
            </div>

            {/* التبويبات */}
            <div className="max-w-7xl mx-auto px-3 sm:px-6 flex gap-1.5 overflow-x-auto pb-2.5" role="tablist" aria-label="أقسام لوحة التحكم">
              {tabs.map((t) => {
                const active = tab === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setTab(t.key)}
                    className={`h-10 shrink-0 rounded-xl px-4 text-xs font-black flex items-center gap-1.5 transition-colors ${
                      active ? 'gold-bar text-[#2a1240] shadow' : 'glass-dark text-violet-100/60 hover:text-white'
                    }`}
                  >
                    <t.icon className="w-4 h-4" />
                    {t.label}
                    {'badge' in t && t.badge > 0 && (
                      <span className="text-[8px] bg-red-500 text-white rounded-full px-1.5 py-0.5 leading-none">{t.badge}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </header>

          <main className="relative flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 py-5 pb-28">
            {/* ═══ نظرة عامة ═══ */}
            {tab === 'overview' && (
              <div className="space-y-5">
                {loadingStats || !stats ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="h-24 rounded-2xl bg-white/5 animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <>
                    {/* شريط العطاء المعتمد */}
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-[#150a20] via-[#301552] to-[#150a20] luxury-shadow-lg ring-1 ring-amber-400/25 px-4 sm:px-8 py-5 flex flex-wrap items-center gap-4">
                      <div className="absolute inset-0 pattern-arabesque-light opacity-[0.06]" aria-hidden />
                      <span className="relative w-11 h-11 rounded-2xl gold-bar flex items-center justify-center shrink-0 shadow-md">
                        <Sparkles className="w-5.5 h-5.5 text-[#2a1240]" />
                      </span>
                      <div className="relative min-w-0 flex-1">
                        <p className="text-sm font-black text-white">عطاء الداعمين المعتمد</p>
                        <p className="text-[10px] text-violet-100/65">
                          {stats.requests.approved} طلب رعاية معتمد · {stats.requests.rejected} مرفوض
                        </p>
                      </div>
                      <div className="relative flex items-center gap-2.5 flex-wrap">
                        <span className="glass-dark rounded-2xl px-4 py-2 text-center">
                          <span className="block text-lg font-black gold-text leading-5">${stats.requests.approvedUsd}</span>
                          <span className="block text-[8.5px] text-violet-100/70">إجمالي الرعاية</span>
                        </span>
                        <span className="glass-dark rounded-2xl px-4 py-2 text-center">
                          <span className="block text-lg font-black text-emerald-300 leading-5">{stats.requests.fundedAccounts}</span>
                          <span className="block text-[8.5px] text-violet-100/70">حساب طالب مموّل</span>
                        </span>
                      </div>
                    </div>

                    {/* بطاقات الإحصاءات */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <KpiCard icon={Globe2} label="دولة عربية" value={stats.countries} sub={`ضمنها ${stats.stages} مرحلة تعليمية`} />
                      <KpiCard icon={Layers} label="صف دراسي" value={stats.grades} sub="متوسطة + ثانوية" />
                      <KpiCard icon={BookOpen} label="مادة دراسية" value={stats.subjects} sub="بكل الدول والصفوف" />
                      <KpiCard icon={LibraryBig} label="كتب ومرجع" value={stats.books} sub={`حجم ${formatSize(stats.booksSize)}`} />
                      <KpiCard icon={GraduationCap} label="حساب طالب" value={stats.students} sub="مسجّل في أرث" />
                      <KpiCard icon={Umbrella} label="طالب تحت مظلة داعم" value={stats.sponsoredStudents} sub="حسابات ممولة من الرعاية" />
                      <KpiCard icon={HandHeart} label="داعم منّ" value={stats.sponsors} sub="حسابات داعمة" />
                      <KpiCard icon={Clock} label="طلب رعاية معلّق" value={stats.requests.pending} sub="بانتظار مراجعتك" />
                    </div>

                    {/* أحدث الكتب */}
                    <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
                      <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
                        <LibraryBig className="w-4 h-4 text-amber-300" />
                        <p className="text-sm font-black text-white">أحدث الكتب المرفوعة</p>
                        <button
                          onClick={() => setTab('books')}
                          className="ms-auto text-[10px] font-black text-amber-300 hover:text-amber-200 transition-colors"
                        >
                          إدارة الكتب ←
                        </button>
                      </div>
                      {recentBooks.length === 0 ? (
                        <p className="text-center text-xs text-violet-100/50 py-8">لا توجد كتب مرفوعة بعد</p>
                      ) : (
                        <div className="divide-y divide-white/5 max-h-80 overflow-y-auto">
                          {recentBooks.map((b) => (
                            <div key={b.id} className="px-4 py-2.5 flex items-center gap-3">
                              <span className="text-lg shrink-0">{b.countryFlag}</span>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-black text-white truncate">{b.titleAr}</p>
                                <p className="text-[9px] text-violet-100/55 truncate">
                                  {b.countryAr} ← {b.stageAr} ← {b.gradeAr} ← {b.subjectAr}
                                </p>
                              </div>
                              <span className="text-[9px] text-violet-100/50 shrink-0">{formatSize(b.size)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {pendingCount > 0 && (
                      <button
                        onClick={() => setTab('sponsorships')}
                        className="w-full rounded-2xl border border-amber-400/40 bg-amber-400/10 px-4 py-3.5 flex items-center gap-3 hover:bg-amber-400/15 transition-colors"
                      >
                        <Clock className="w-5 h-5 text-amber-300 shrink-0" />
                        <span className="text-xs sm:text-sm font-black text-amber-200 flex-1 text-right">
                          لديك {pendingCount} طلب رعاية بانتظار المراجعة
                        </span>
                        <span className="text-[10px] font-black text-amber-300">مراجعة الآن ←</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ═══ الكتب والمواد ═══ */}
            {tab === 'books' && (
              <div className="space-y-5">
                {/* نموذج الرفع */}
                <form
                  onSubmit={upload}
                  className="rounded-2xl border border-amber-400/25 bg-gradient-to-br from-amber-400/10 to-white/[0.03] p-4 space-y-3 luxury-shadow"
                >
                  <p className="text-sm font-black text-amber-200 flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-amber-300" />
                    رفع كتاب جديد
                  </p>

                  {/* الاختيارات المتسلسلة */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                    <select value={countryCode} onChange={(e) => setCountryCode(e.target.value)} className={selectCls}>
                      <option value="">1️⃣ اختر الدولة...</option>
                      {countries.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.nameAr}
                        </option>
                      ))}
                    </select>
                    <select
                      value={stageId}
                      onChange={(e) => {
                        setStageId(e.target.value);
                        setGradeId('');
                      }}
                      disabled={!countryCode}
                      className={selectCls}
                    >
                      <option value="">2️⃣ اختر المرحلة...</option>
                      {stages.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.icon} {s.nameAr}
                        </option>
                      ))}
                    </select>
                    <select value={gradeId} onChange={(e) => setGradeId(e.target.value)} disabled={!stageId} className={selectCls}>
                      <option value="">3️⃣ اختر الصف...</option>
                      {grades.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.nameAr}
                        </option>
                      ))}
                    </select>
                    <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} disabled={!gradeId} className={selectCls}>
                      <option value="">4️⃣ اختر المادة...</option>
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.icon} {s.nameAr}{s.gender === 'GIRLS' ? ' (بنات)' : s.gender === 'BOYS' ? ' (بنين)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {countryCode && stageId && gradeId && (
                    <p className="text-[11px] font-bold text-amber-200 bg-amber-400/10 border border-amber-400/30 rounded-lg px-3 py-2">
                      المسار المحدد: {countries.find((c) => c.code === countryCode)?.nameAr} ← {stage?.nameAr} ← {gradeName}
                      {subjectId && <> ← {subjects.find((s) => s.id === subjectId)?.nameAr}</>}
                    </p>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="عنوان الكتاب (مثال: كتاب الرياضيات — الفصل الأول)"
                      className="h-11 flex-1 bg-white/5 border-white/15 text-white placeholder:text-violet-100/40"
                    />
                    <input
                      id="admin-file-input"
                      type="file"
                      accept={ACCEPT}
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="flex-1 text-sm text-violet-100/70 file:me-3 file:rounded-md file:border-0 file:bg-amber-400 file:text-[#2a1240] file:px-4 file:py-2 file:text-sm file:cursor-pointer file:font-bold"
                    />
                    <Button
                      type="submit"
                      disabled={uploading}
                      className="h-11 shrink-0 bg-gradient-to-br from-amber-300 to-[#c9992b] text-[#2a1240] hover:from-amber-200 hover:to-[#d4a72c] font-black"
                    >
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      رفع
                    </Button>
                  </div>
                  <p className="text-[11px] text-violet-100/50">
                    الصيغ المقبولة: PDF, Word, PowerPoint, EPUB, صور, نص — الحجم الأقصى 60 ميغابايت
                  </p>
                </form>

                {/* كل الكتب */}
                <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3 flex-wrap">
                    <LibraryBig className="w-4 h-4 text-amber-300 shrink-0" />
                    <p className="text-sm font-black text-white">
                      كل الكتب <span className="text-violet-100/50 font-normal">({filteredBooks.length})</span>
                    </p>
                    <div className="relative ms-auto min-w-[160px] flex-1 sm:max-w-xs">
                      <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-amber-300/60" />
                      <Input
                        value={bookSearch}
                        onChange={(e) => setBookSearch(e.target.value)}
                        placeholder="بحث في الكتب..."
                        className="h-9 ps-9 bg-white/5 border-white/15 text-white placeholder:text-violet-100/40 text-xs"
                      />
                    </div>
                  </div>

                  {loadingAllBooks ? (
                    <div className="flex justify-center py-10">
                      <Loader2 className="w-6 h-6 animate-spin text-amber-300" />
                    </div>
                  ) : filteredBooks.length === 0 ? (
                    <div className="text-center py-10 text-violet-100/50 text-sm">
                      <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      {q ? 'لا توجد نتائج مطابقة للبحث' : 'لا توجد كتب مرفوعة بعد — ابدأ برفع أول كتاب'}
                    </div>
                  ) : (
                    <div className="divide-y divide-white/5 max-h-[55vh] overflow-y-auto">
                      {filteredBooks.map((b) => (
                        <div key={b.id} className="px-4 py-3 flex items-center gap-3 hover:bg-white/[0.03] transition-colors">
                          <span className="text-lg shrink-0">{b.countryFlag}</span>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm font-black text-white truncate">{b.titleAr}</p>
                            <p className="text-[9px] sm:text-[10px] text-violet-100/55 truncate">
                              {b.countryAr} ← {b.stageAr} ← {b.gradeAr} ← {b.subjectAr} · {formatSize(b.size)} ·{' '}
                              {formatDate(b.createdAt)}
                            </p>
                          </div>
                          <button
                            onClick={() =>
                              onViewBook({
                                id: b.id,
                                titleAr: b.titleAr,
                                fileName: b.fileName,
                                mimeType: b.mimeType,
                                size: b.size,
                                createdAt: b.createdAt,
                                fileUrl: b.fileUrl,
                              })
                            }
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-amber-300 hover:bg-amber-400/15 transition-colors shrink-0"
                            title="عرض"
                            aria-label={`عرض ${b.titleAr}`}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <a
                            href={`${b.fileUrl}?download=1`}
                            download
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-violet-100/60 hover:bg-white/10 hover:text-white transition-colors shrink-0"
                            title="تنزيل"
                            aria-label={`تنزيل ${b.titleAr}`}
                          >
                            <Download className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => removeBook(b.id)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-500/15 transition-colors shrink-0"
                            title="حذف"
                            aria-label={`حذف ${b.titleAr}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ═══ طلبات الرعاية ═══ */}
            {tab === 'sponsorships' && (
              <div className="space-y-4">
                {/* فلاتر الحالة */}
                <div className="flex gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="تصفية طلبات الرعاية">
                  {(
                    [
                      { key: 'ALL', label: `الكل (${sponsorReqs.length})` },
                      { key: 'PENDING', label: `قيد المراجعة (${pendingCount})` },
                      { key: 'APPROVED', label: `مقبولة (${sponsorReqs.filter((r) => r.status === 'APPROVED').length})` },
                      { key: 'REJECTED', label: `مرفوضة (${sponsorReqs.filter((r) => r.status === 'REJECTED').length})` },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.key}
                      type="button"
                      role="tab"
                      aria-selected={sponsorFilter === f.key}
                      onClick={() => setSponsorFilter(f.key)}
                      className={`h-9 shrink-0 rounded-xl px-3.5 text-[11px] font-black transition-colors ${
                        sponsorFilter === f.key ? 'gold-bar text-[#2a1240] shadow' : 'glass-dark text-violet-100/60 hover:text-white'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {loadingSponsorReqs ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-amber-300" />
                  </div>
                ) : filteredReqs.length === 0 ? (
                  <div className="text-center py-12 text-violet-100/50 text-sm border rounded-2xl border-dashed border-white/15">
                    <HandHeart className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    لا توجد طلبات في هذه الحالة
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {filteredReqs.map((r) => {
                      const pkg = packageByKey(r.packageKey);
                      return (
                        <div key={r.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-lg">{pkg?.icon}</span>
                            <span className="font-black text-sm text-white">{r.user.name}</span>
                            <span className="text-[10px] text-violet-100/50" dir="ltr">
                              {r.user.email}
                            </span>
                            {r.orgName && <span className="text-[10px] font-bold text-amber-200">· {r.orgName}</span>}
                            <span className="ms-auto">
                              {r.status === 'APPROVED' ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-black rounded-full px-2.5 py-1 bg-emerald-400/15 text-emerald-300 border border-emerald-400/40">
                                  <BadgeCheck className="w-3 h-3" /> {STATUS_LABELS.APPROVED}
                                </span>
                              ) : r.status === 'REJECTED' ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-black rounded-full px-2.5 py-1 bg-red-400/15 text-red-300 border border-red-400/40">
                                  <XCircle className="w-3 h-3" /> {STATUS_LABELS.REJECTED}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-black rounded-full px-2.5 py-1 bg-amber-400/15 text-amber-300 border border-amber-400/40">
                                  <Clock className="w-3 h-3" /> {STATUS_LABELS.PENDING}
                                </span>
                              )}
                            </span>
                          </div>
                          <p className="text-[11px] text-violet-100/75 flex items-center gap-1.5 flex-wrap">
                            <span className="font-black gold-text">
                              {pkg?.nameAr} (${r.amountUsd})
                            </span>
                            <span className="inline-flex items-center gap-1 text-amber-200 font-bold">
                              <Users className="w-3 h-3" /> {r.studentsCount} حساب طالب
                            </span>
                            <span className="text-violet-100/45">· {formatDate(r.createdAt)}</span>
                            {r.proofUrl && (
                              <a href={r.proofUrl} target="_blank" rel="noreferrer" className="text-amber-300 underline" dir="ltr">
                                إثبات التحويل
                              </a>
                            )}
                          </p>
                          {r.contactNote && <p className="text-[10px] text-violet-100/60">ملاحظة الداعم: {r.contactNote}</p>}
                          {r.adminNote && <p className="text-[10px] text-violet-100/60">ملاحظة الإدارة: {r.adminNote}</p>}

                          {r.status === 'PENDING' && rejectingId === r.id ? (
                            <div className="rounded-xl border border-red-400/30 bg-red-500/5 p-3 space-y-2">
                              <Input
                                value={rejectNote}
                                onChange={(e) => setRejectNote(e.target.value)}
                                placeholder="سبب الرفض (يظهر للداعم — اختياري)"
                                className="h-9 bg-white/5 border-white/15 text-white placeholder:text-violet-100/40 text-xs"
                                autoFocus
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => reviewRequest(r.id, 'REJECT', rejectNote)}
                                  className="h-8 flex-1 bg-gradient-to-br from-red-400 to-red-600 text-white hover:from-red-300 hover:to-red-500 font-black text-[11px]"
                                >
                                  <XCircle className="w-3.5 h-3.5" /> تأكيد الرفض
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setRejectingId(null);
                                    setRejectNote('');
                                  }}
                                  className="h-8 flex-1 border-white/15 text-violet-100/70 hover:bg-white/10 font-black text-[11px]"
                                >
                                  إلغاء
                                </Button>
                              </div>
                            </div>
                          ) : r.status === 'PENDING' ? (
                            <div className="flex gap-2 pt-1">
                              <Button
                                size="sm"
                                onClick={() => reviewRequest(r.id, 'APPROVE')}
                                className="h-8 flex-1 bg-gradient-to-br from-emerald-400 to-emerald-600 text-white hover:from-emerald-300 hover:to-emerald-500 font-black text-[11px]"
                              >
                                <BadgeCheck className="w-3.5 h-3.5" /> اعتماد
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setRejectingId(r.id);
                                  setRejectNote('');
                                }}
                                className="h-8 flex-1 border-red-400/40 text-red-300 hover:bg-red-500/15 hover:text-red-200 font-black text-[11px]"
                              >
                                <XCircle className="w-3.5 h-3.5" /> رفض
                              </Button>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      )}
    </div>
  );
}
