'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap,
  BookOpen,
  Search,
  ArrowRight,
  Loader2,
  ShieldCheck,
  FileText,
  Eye,
  Download,
  Bot,
  Globe2,
  Layers,
  LibraryBig,
  X,
  Sparkles,
  School,
  House,
  Info,
  HandHeart,
  Users,
  Umbrella,
  UserRound,
  LogOut,
  Lock,
  type LucideIcon,
} from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import AiTutorChat from './AiTutorChat';
import AdminPanel from './AdminPanel';
import AuthDialog, { type AuthUser, type AuthRole } from './AuthDialog';
import SponsorsPanel from './SponsorsPanel';
import SponsorAuthDialog from './SponsorAuthDialog';
import CountryFlag from './CountryFlag';
import type {
  BookItem,
  CountryFull,
  CountryItem,
  GradeItem,
  SponsorInfo,
  SponsorsTotals,
  StageWithGrades,
  SubjectItem,
  View,
} from './types';
import { formatDate, formatSize, streamBadgeLight, toArabicDigits } from './types';

const fadeIn = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -14 },
  transition: { duration: 0.3, ease: 'easeOut' as const },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.035 } },
};
const staggerItem = {
  initial: { opacity: 0, y: 16, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { duration: 0.35, ease: 'easeOut' as const },
};

// عنصر في شريط التنقل السفلي الثابت (نمط تطبيقات الموبايل)
function NavTab({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      className={`relative flex flex-col items-center justify-center gap-1 h-16 w-full transition-colors duration-200 ${
        active ? 'text-amber-300' : 'text-violet-100/55 hover:text-white active:bg-white/5'
      }`}
    >
      {active && (
        <span
          className="absolute top-0 inset-x-8 h-0.5 rounded-full bg-gradient-to-l from-transparent via-amber-400 to-transparent"
          aria-hidden
        />
      )}
      <Icon className="w-5 h-5" strokeWidth={active ? 2.4 : 2} />
      <span className="text-[10px] font-bold leading-none">{label}</span>
    </button>
  );
}

// رقم الصف بالأرقام العربية
function gradeMedal(stageKey: string, order: number): string {
  const arabicNums = ['١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩', '١٠', '١١', '١٢'];
  if (stageKey === 'secondary') return order === 0 ? '١٠' : order <= 2 ? '١١' : '١٢';
  return arabicNums[order] || String(order + 1);
}

export default function PlatformApp() {
  const [view, setView] = useState<View>({ name: 'home' });
  const [countries, setCountries] = useState<CountryItem[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [search, setSearch] = useState('');
  const [adminOpen, setAdminOpen] = useState(false);
  const [viewerBook, setViewerBook] = useState<BookItem | null>(null);

  // شريط التنقل السفلي: حوار «حول المنصة» وحقل البحث
  const [aboutOpen, setAboutOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // الحساب والجلسة: تسجيل الدخول (طلاب ومعلمون) + بوابة الداعمين المستقلة
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authRole, setAuthRole] = useState<AuthRole>('STUDENT');
  const [sponsorsOpen, setSponsorsOpen] = useState(false);
  const [sponsorAuthOpen, setSponsorAuthOpen] = useState(false);
  const [sponsorAuthMode, setSponsorAuthMode] = useState<'login' | 'register'>('register');
  const [preselectedSponsorId, setPreselectedSponsorId] = useState('');

  // بطاقة الداعم المفتوحة من لوحة الشرف
  const [selectedSponsorCard, setSelectedSponsorCard] = useState<SponsorInfo | null>(null);

  // بوابة الداعمين: قائمة الداعمين المعتمدين
  const [sponsorsList, setSponsorsList] = useState<SponsorInfo[]>([]);
  const [sponsorsTotals, setSponsorsTotals] = useState<SponsorsTotals | null>(null);
  const [loadingSponsors, setLoadingSponsors] = useState(false);

  // شاشة المراحل والصفوف
  const [stages, setStages] = useState<StageWithGrades[]>([]);
  const [stagesLoading, setStagesLoading] = useState(false);

  // شاشة مواد الصف
  const [gradeSubjects, setGradeSubjects] = useState<SubjectItem[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);

  // شاشة المادة (الكتب)
  const [books, setBooks] = useState<BookItem[]>([]);
  const [booksLoading, setBooksLoading] = useState(false);

  // تحميل الدول وجلب المستخدم الحالي
  useEffect(() => {
    fetch('/api/countries')
      .then((r) => r.json())
      .then((d) => setCountries(d.countries || []))
      .catch(() => toast.error('تعذر تحميل الدول'))
      .finally(() => setLoadingCountries(false));
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => setUser(d.user || null))
      .catch(() => {});
  }, []);

  const refreshBooks = useCallback(() => {
    if (view.name !== 'detail') return;
    setBooksLoading(true);
    fetch(`/api/subjects/${view.subject.id}/books`)
      .then((r) => r.json())
      .then((d) => setBooks(d.books || []))
      .catch(() => toast.error('تعذر تحديث الكتب'))
      .finally(() => setBooksLoading(false));
  }, [view]);

  // تحميل قائمة الداعمين (بوابة الداعمين)
  const loadSponsors = useCallback(() => {
    setLoadingSponsors(true);
    fetch('/api/sponsors')
      .then((r) => r.json())
      .then((d) => {
        setSponsorsList(d.sponsors || []);
        setSponsorsTotals(d.totals || null);
      })
      .catch(() => toast.error('تعذر تحميل قائمة الداعمين'))
      .finally(() => setLoadingSponsors(false));
  }, []);

  // فتح دولة: جلب مراحلها وصفوفها
  function openCountry(code: string) {
    setStagesLoading(true);
    setView({ name: 'stages', country: { id: '', code, nameAr: '', flag: '', region: '', culturePersona: '', curriculumNote: '' } });
    window.scrollTo({ top: 0 });
    fetch(`/api/countries/${code}/stages`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setStages(d.stages || []);
        setView({ name: 'stages', country: d.country });
      })
      .catch((e) => {
        toast.error(e instanceof Error ? e.message : 'تعذر تحميل المراحل');
        setView({ name: 'home' });
      })
      .finally(() => setStagesLoading(false));
  }

  // فتح صف: جلب موادّه
  function openGrade(country: CountryFull, stage: StageWithGrades, grade: GradeItem) {
    setSubjectsLoading(true);
    setView({ name: 'subjects', country, stage, grade });
    window.scrollTo({ top: 0 });
    fetch(`/api/grades/${grade.id}/subjects`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setGradeSubjects(d.subjects || []);
        setView({ name: 'subjects', country: d.country || country, stage: { ...stage, ...d.stage }, grade: d.grade || grade });
      })
      .catch((e) => {
        toast.error(e instanceof Error ? e.message : 'تعذر تحميل المواد');
        setView({ name: 'stages', country });
      })
      .finally(() => setSubjectsLoading(false));
  }

  // فتح مادة: جلب كتبها
  function openSubject(country: CountryFull, stage: StageWithGrades, grade: GradeItem, subject: SubjectItem) {
    setBooksLoading(true);
    setBooks([]);
    setView({ name: 'detail', country, stage, grade, subject });
    window.scrollTo({ top: 0 });
    fetch(`/api/subjects/${subject.id}/books`)
      .then((r) => r.json())
      .then((d) => setBooks(d.books || []))
      .catch(() => toast.error('تعذر تحميل الكتب'))
      .finally(() => setBooksLoading(false));
  }

  function goHome() {
    setView({ name: 'home' });
    setSearch('');
  }

  // فتح بوابة الداعمين (قائمة الداعمين)
  function goSponsors() {
    setView({ name: 'sponsors' });
    window.scrollTo({ top: 0 });
    loadSponsors();
  }

  // الانتقال إلى البحث من شريط التنقل السفلي
  function focusSearch() {
    window.scrollTo({ top: 0 });
    if (view.name !== 'home') {
      goHome();
      setTimeout(() => searchInputRef.current?.focus({ preventScroll: true }), 450);
    } else {
      searchInputRef.current?.focus({ preventScroll: true });
    }
  }

  // فتح حوار الدخول (طلاب ومعلمون فقط — الداعمون من بوابتهم المستقلة)
  function openAuth(mode: 'login' | 'register', role: AuthRole = 'STUDENT', sponsorId = '') {
    setAuthMode(mode);
    setAuthRole(role);
    setPreselectedSponsorId(sponsorId);
    setAuthOpen(true);
  }

  // تسمية الدور بالعربية
  function roleLabel(r: string): string {
    return r === 'SPONSOR' ? 'داعم' : r === 'TEACHER' ? 'معلم' : r === 'ADMIN' ? 'إدمن' : 'طالب';
  }

  async function logout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      toast.success('تم تسجيل الخروج — إلى اللقاء 🌟');
    } catch {
      toast.error('تعذر تسجيل الخروج');
    }
  }

  const filteredCountries = countries.filter(
    (c) => c.nameAr.includes(search.trim()) || c.region.includes(search.trim())
  );

  const totalBooks = countries.reduce((a, c) => a + c.booksCount, 0);

  return (
    <div className="min-h-screen flex flex-col bg-[#150a20]">
      {/* نقشة أرابيسك خلفية داكنة */}
      <div className="fixed inset-0 pattern-arabesque-light pointer-events-none" style={{ opacity: 0.035 }} aria-hidden />

      {/* ═══ الترويسة الفخمة ═══ */}
      <header className="sticky top-0 z-40 bg-gradient-to-l from-[#150a20] via-[#2b1140] to-[#150a20] border-b-2 border-[#c9992b]/70 shadow-lg">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 h-16 flex items-center gap-3">
          <button onClick={goHome} className="flex items-center gap-2.5 min-w-0 group" aria-label="الصفحة الرئيسية">
            <span className="w-10 h-10 rounded-xl gold-bar flex items-center justify-center shadow-md transition-shadow shrink-0">
              <GraduationCap className="w-6 h-6 text-[#2a1240]" strokeWidth={2.2} />
            </span>
            <span className="min-w-0 text-right">
              <span className="block font-extrabold text-base sm:text-lg leading-5 text-white tracking-tight">
                أرث التعليم العربي
              </span>
              <span className="block text-[10px] leading-3 gold-text font-bold">لكل طالب عربي معلم خصوصي يدعم مسيرته التعليمية</span>
            </span>
          </button>
          <div className="ms-auto flex items-center gap-2">
            {view.name !== 'home' && (
              <button
                onClick={() => setView({ name: 'home' })}
                className="glass-dark rounded-xl px-3 h-10 flex items-center gap-1.5 text-white text-xs font-bold hover:bg-white/20 transition-colors"
              >
                <ArrowRight className="w-4 h-4" />
                <span className="hidden sm:inline">الرئيسية</span>
              </button>
            )}
            {/* الحساب: دخول أو الاسم + خروج */}
            {!user ? (
              <button
                onClick={() => openAuth('login')}
                className="glass-dark rounded-xl px-3 h-10 flex items-center gap-1.5 text-white text-xs font-bold hover:bg-white/20 transition-colors"
              >
                <UserRound className="w-4 h-4 text-amber-300" />
                <span>دخول</span>
              </button>
            ) : (
              <div className="glass-dark rounded-xl ps-3 pe-1.5 h-10 flex items-center gap-2">
                <span className="text-[11px] font-black text-white hidden sm:inline max-w-[120px] truncate">
                  {user.name}
                  <span className="text-amber-300 font-bold"> · {roleLabel(user.role)}</span>
                </span>
                <button
                  onClick={logout}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-violet-100/60 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="تسجيل الخروج"
                  title="تسجيل الخروج"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ═══ المحتوى ═══ */}
      <main className="relative flex-1 w-full max-w-6xl mx-auto px-3 sm:px-6 py-6 sm:py-8">
        <AnimatePresence mode="wait">
          {/* ═══ شاشة الدول ═══ */}
          {view.name === 'home' && (
            <motion.section key="home" {...fadeIn} className="space-y-5">
              {/* البانر الفخم */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-[#150a20] via-[#301552] to-[#150a20] luxury-shadow-lg ring-1 ring-amber-400/25">
                <div className="absolute inset-0 pattern-arabesque-light opacity-[0.07]" aria-hidden />
                <div className="absolute -top-16 -start-16 w-56 h-56 rounded-full bg-amber-400/10 blur-3xl" aria-hidden />
                <div className="absolute -bottom-20 -end-10 w-64 h-64 rounded-full bg-violet-300/10 blur-3xl" aria-hidden />

                <div className="relative px-4 sm:px-10 py-8 sm:py-12 text-center">
                  <div className="flex justify-center mb-3">
                    <span className="glass-dark rounded-full px-4 py-1.5 text-[10px] sm:text-xs font-bold text-amber-200 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      إرثٌ تعليميٌّ موحّد للأمة العربية
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-4xl font-black text-white leading-snug">
                    اختر دولتك <span className="gold-shimmer">وابدأ رحلة التعلم</span>
                  </h1>
                  <div className="ornament-divider max-w-md mx-auto my-4">
                    <span className="text-amber-300/80 text-lg">✦</span>
                  </div>
                  <p className="text-[11px] sm:text-sm text-violet-100/80 max-w-xl mx-auto leading-relaxed">
                    كتبُ ومناهجُ المرحلتين المتوسطة والثانوية لجميع الدول العربية،
                    <br className="hidden sm:block" />
                    مع معلمٍ خصوصيٍّ من بلدك يراجع معك دروسك من كتاب مدرستك بلسان دولتك وثقافتها
                  </p>

                  <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
                    {[
                      { icon: Globe2, label: 'دولة عربية', value: countries.length },
                      { icon: Layers, label: 'صف دراسي لكل دولة', value: countries[0]?.gradesCount || 0 },
                      { icon: LibraryBig, label: 'كتب ومرجع', value: totalBooks },
                    ].map((s, i) => (
                      <div key={i} className="glass-dark rounded-2xl px-4 py-2.5 flex items-center gap-2.5 min-w-[130px]">
                        <span className="w-9 h-9 rounded-xl bg-amber-400/15 flex items-center justify-center shrink-0">
                          <s.icon className="w-4.5 h-4.5 text-amber-300" />
                        </span>
                        <span className="text-right">
                          <span className="block text-lg font-black text-white leading-5">{s.value}</span>
                          <span className="block text-[9px] text-violet-100/70 leading-3">{s.label}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* أرضية قسم الدول: بنفسجية متدرجة وعليها زخرفة شفافة */}
              <div className="relative overflow-hidden rounded-[2rem] section-royal luxury-shadow-lg ring-1 ring-amber-400/25">
                <div className="absolute inset-0 pattern-zakhrafa opacity-[0.09] pointer-events-none" aria-hidden />
                <div className="absolute -top-20 -start-16 w-56 h-56 rounded-full bg-violet-300/10 blur-3xl" aria-hidden />

                <div className="relative p-3 sm:p-5 space-y-4">
                  {/* البحث */}
                  <div className="relative max-w-lg mx-auto">
                    <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-amber-300/60" />
                    <input
                      ref={searchInputRef}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="ابحث عن دولتك بالاسم أو المنطقة..."
                      className="field-royal w-full h-12 rounded-2xl ps-11 pe-4 text-sm font-semibold luxury-shadow"
                    />
                  </div>

                  {/* شبكة الدول — 3 أعمدة دائماً */}
                  {loadingCountries ? (
                    <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="h-28 sm:h-36 rounded-2xl bg-white/10 animate-pulse" />
                      ))}
                    </div>
                  ) : filteredCountries.length === 0 ? (
                    <p className="text-center text-sm text-violet-100/60 py-12">لا توجد نتائج للبحث «{search}»</p>
                  ) : (
                    <motion.div
                      variants={staggerContainer}
                      initial="initial"
                      animate="animate"
                      className="grid grid-cols-3 gap-2.5 sm:gap-4"
                    >
                      {filteredCountries.map((c, i) => (
                        <motion.button
                          key={c.code}
                          variants={staggerItem}
                          whileHover={{ y: -4 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => openCountry(c.code)}
                          className="relative flex flex-col items-center justify-center gap-1.5 rounded-2xl card-paper p-3 sm:p-5 transition-all cursor-pointer min-h-[112px] sm:min-h-[140px] group overflow-hidden"
                        >
                          {/* لمسة ذهبية علوية */}
                          <span className="absolute top-0 inset-x-6 h-px bg-gradient-to-l from-transparent via-amber-500/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden />

                          {c.booksCount > 0 && (
                            <span className="absolute top-1.5 end-1.5 text-[7px] sm:text-[9px] bg-amber-100 text-amber-800 border border-amber-500/40 rounded-full px-1.5 py-0.5 font-black">
                              {c.booksCount} 📚
                            </span>
                          )}

                          <CountryFlag
                            code={c.code}
                            flag={c.flag}
                            alt={c.nameAr}
                            className="w-12 h-9 sm:w-16 sm:h-11.5 rounded-md ring-1 ring-violet-900/20 group-hover:ring-amber-500/70 transition-all"
                          />
                          <span className="text-xs sm:text-base font-black text-violet-950 mt-0.5 text-center leading-tight">
                            {c.nameAr}
                          </span>
                          <span className="text-[8px] sm:text-[11px] text-violet-800/70 text-center leading-tight flex items-center gap-1">
                            <span className="hidden sm:inline w-1 h-1 rounded-full bg-amber-500 inline-block" />
                            {c.region}
                          </span>
                        </motion.button>
                      ))}
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.section>
          )}

          {/* ═══ بوابة الداعمين: قائمة الداعمين ═══ */}
          {view.name === 'sponsors' && (
            <motion.section key="sponsors" {...fadeIn} className="space-y-5">
              {/* بانر البوابة */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-[#150a20] via-[#301552] to-[#150a20] luxury-shadow-lg ring-1 ring-amber-400/25">
                <div className="absolute inset-0 pattern-arabesque-light opacity-[0.07]" aria-hidden />
                <div className="absolute -top-16 -start-16 w-56 h-56 rounded-full bg-amber-400/10 blur-3xl" aria-hidden />
                <div className="absolute -bottom-20 -end-10 w-64 h-64 rounded-full bg-violet-300/10 blur-3xl" aria-hidden />

                <div className="relative px-4 sm:px-10 py-8 sm:py-10 text-center space-y-3">
                  <div className="flex justify-center mb-1">
                    <span className="w-14 h-14 rounded-2xl gold-bar flex items-center justify-center shadow-lg">
                      <HandHeart className="w-7 h-7 text-[#2a1240]" strokeWidth={2.2} />
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-4xl font-black text-white leading-snug">
                    لوحة الشرف <span className="gold-shimmer">للداعمين</span>
                  </h1>
                  <div className="ornament-divider max-w-md mx-auto">
                    <span className="text-amber-300/80 text-lg">✦</span>
                  </div>
                  <p className="text-[11px] sm:text-sm text-violet-100/80 max-w-xl mx-auto leading-relaxed">
                    سواعدُ خيرةِ الأمة تُبقي نورَ الأرث مشعاً — كل 100$ توفّر 200 حساب طالب،
                    <br className="hidden sm:block" />
                    ويُنشأ حسابُ كل طالبٍ تحت مظلة داعمٍ كريم من داعمي أرث التعليم العربي
                  </p>

                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    <button
                      onClick={() => setSponsorsOpen(true)}
                      className="rounded-xl px-4 h-11 gold-bar text-[#2a1240] text-xs font-black flex items-center gap-1.5 shadow-md hover:brightness-105 transition-all"
                    >
                      <HandHeart className="w-4 h-4" />
                      باقات دعم التعليم العربي
                    </button>
                  </div>
                </div>
              </div>

              {/* إحصاءات العطاء */}
              {sponsorsTotals && (
                <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
                  {[
                    { icon: Users, label: 'داعم كريم', value: sponsorsTotals.sponsorsCount },
                    { icon: Umbrella, label: 'مقاعد متاحة', value: sponsorsTotals.totalRemaining },
                    { icon: GraduationCap, label: 'طالب مستفيد', value: sponsorsTotals.totalFunded },
                  ].map((s, i) => (
                    <div key={i} className="glass-dark rounded-2xl px-3 py-3 sm:py-4 flex flex-col items-center gap-1.5 text-center">
                      <span className="w-9 h-9 rounded-xl bg-amber-400/15 flex items-center justify-center">
                        <s.icon className="w-4.5 h-4.5 text-amber-300" />
                      </span>
                      <span className="text-lg sm:text-2xl font-black text-white leading-6">{s.value}</span>
                      <span className="text-[8.5px] sm:text-[10px] text-violet-100/70 leading-3">{s.label}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* أرضية قائمة الداعمين */}
              <div className="relative overflow-hidden rounded-[2rem] section-royal luxury-shadow-lg ring-1 ring-amber-400/25">
                <div className="absolute inset-0 pattern-zakhrafa opacity-[0.09] pointer-events-none" aria-hidden />
                <div className="absolute -top-20 -end-16 w-56 h-56 rounded-full bg-violet-300/10 blur-3xl" aria-hidden />

                <div className="relative p-3 sm:p-5 space-y-4">
                  <h2 className="ornament-divider">
                    <span className="flex items-center gap-1.5 font-black text-sm sm:text-base text-white whitespace-nowrap">
                      <Umbrella className="w-4 h-4 text-amber-300" />
                      قائمة الداعمين — من الأعلى للأقل
                    </span>
                  </h2>

                  {loadingSponsors ? (
                    <div className="space-y-2">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-16 rounded-2xl bg-white/5 animate-pulse" />
                      ))}
                    </div>
                  ) : sponsorsList.length === 0 ? (
                    <div className="text-center py-10 border border-dashed border-white/15 rounded-2xl">
                      <HandHeart className="w-10 h-10 mx-auto mb-2 text-amber-300/40" />
                      <p className="text-sm font-black text-white mb-1">لم يُعتمد أي داعم بعد</p>
                      <p className="text-[10px] text-violet-100/60 leading-relaxed max-w-xs mx-auto">
                        كن أول من يحمل شعلة الدعم — افتح «باقات دعم التعليم العربي» وسجّل كداعم ليظهر اسمك على لوحة الشرف هذه
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {sponsorsList.map((s, i) => {
                        const rank = i + 1;
                        const podiumEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null;
                        const openForReg = s.remaining > 0;
                        return (
                          <button
                            key={s.id}
                            onClick={() => setSelectedSponsorCard(s)}
                            aria-label={`بطاقة الداعم ${s.name}`}
                            className={`w-full text-right rounded-2xl border p-3 sm:p-3.5 flex items-center gap-3 transition-all hover:border-amber-400/60 hover:bg-white/[0.07] ${
                              rank <= 3
                                ? 'border-amber-400/40 bg-gradient-to-l from-amber-400/10 to-white/[0.03] shadow-[0_0_22px_rgba(212,167,44,0.08)]'
                                : 'border-white/10 bg-white/5'
                            }`}
                          >
                            <span
                              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-base font-black ${
                                rank <= 3 ? 'gold-bar text-[#2a1240]' : 'bg-white/10 text-amber-200'
                              }`}
                            >
                              {podiumEmoji || toArabicDigits(rank)}
                            </span>
                            {s.imageUrl ? (
                              <img
                                src={s.imageUrl}
                                alt={s.name}
                                className="w-11 h-11 rounded-xl object-cover ring-2 ring-amber-400/40 shadow-sm shrink-0"
                              />
                            ) : (
                              <span className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-700 to-emerald-950 text-amber-300 flex items-center justify-center font-black ring-2 ring-amber-400/30 shrink-0">
                                {s.name.charAt(0)}
                              </span>
                            )}
                            <span className="min-w-0 flex-1">
                              <span className="block text-xs sm:text-sm font-black text-white truncate">{s.name}</span>
                              <span className="block text-[9px] sm:text-[11px] text-violet-100/60 truncate">
                                {s.bio || 'داعم كريم من داعمي أرث التعليم العربي'}
                              </span>
                            </span>
                            <span className="shrink-0 text-left space-y-1">
                              <span className="flex items-center justify-end gap-1.5 text-sm sm:text-base font-black gold-text leading-5 whitespace-nowrap">
                                <GraduationCap className="w-4 h-4 shrink-0" />
                                {toArabicDigits(s.used)}
                                <span className="text-[9px] sm:text-[10px] font-bold text-violet-100/70">طالب مستفيد</span>
                              </span>
                              <span
                                className={`inline-block text-[8px] font-black rounded-full px-2 py-0.5 border leading-3 ${
                                  openForReg
                                    ? 'bg-emerald-400/10 text-emerald-300 border-emerald-400/30'
                                    : 'bg-white/5 text-violet-100/50 border-white/15'
                                }`}
                              >
                                {openForReg ? 'التسجيل متاح من خلاله' : 'اكتملت مظلته'}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {/* دعوة التسجيل من خلال الداعم التالي */}
                  <div className="relative overflow-hidden rounded-2xl border border-amber-400/25 bg-amber-400/[0.07] p-3.5 sm:p-4 text-center">
                    <p className="text-[11px] sm:text-sm font-black text-amber-200 leading-relaxed">
                      سجّل مجاناً واحصل على حساب التعليم الخاص بك من خلال الداعم التالي ✦
                    </p>
                    <p className="text-[9.5px] sm:text-[11px] text-violet-100/65 mt-1 leading-relaxed">
                      اضغط على بطاقة أي داعم من لوحة الشرف لتتعرف عليه — ثم سجّل حسابك مجاناً تحت مظلته
                    </p>
                  </div>
                </div>
              </div>
            </motion.section>
          )}

          {/* ═══ شاشة المراحل والصفوف ═══ */}
          {view.name === 'stages' && (
            <motion.section key="stages" {...fadeIn} className="space-y-7">
              {view.country.flag ? (
                <>
                  {/* بانر الدولة */}
                  <div className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-[#150a20] via-[#301552] to-[#150a20] luxury-shadow-lg ring-1 ring-amber-400/25">
                    <div className="absolute inset-0 pattern-arabesque-light opacity-[0.07]" aria-hidden />
                    <div className="relative px-4 sm:px-8 py-6 sm:py-9 flex items-center gap-4 sm:gap-6">
                      <div className="rounded-2xl overflow-hidden gold-ring p-1 bg-white/95 shrink-0 shadow-xl">
                        <CountryFlag
                          code={view.country.code}
                          flag={view.country.flag}
                          alt={view.country.nameAr}
                          className="w-16 h-11 sm:w-24 sm:h-16 rounded-lg"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] sm:text-[11px] font-bold text-amber-300/90 mb-0.5">مرحباً بك في</p>
                        <h1 className="text-xl sm:text-3xl font-black text-white leading-tight">
                          دولة <span className="gold-text">{view.country.nameAr}</span>
                        </h1>
                        <p className="text-[10px] sm:text-xs text-violet-100/75 mt-1 truncate">{view.country.curriculumNote}</p>
                      </div>
                    </div>
                  </div>

                  {stagesLoading ? (
                    <div className="flex justify-center py-16">
                      <Loader2 className="w-8 h-8 animate-spin text-amber-300" />
                    </div>
                  ) : (
                    /* أرضية قسم المراحل التعليمية: بنفسجية متدرجة وعليها زخرفة شفافة */
                    <div className="relative overflow-hidden rounded-[2rem] section-royal luxury-shadow-lg ring-1 ring-amber-400/25">
                      <div className="absolute inset-0 pattern-zakhrafa opacity-[0.09] pointer-events-none" aria-hidden />
                      <div className="absolute -bottom-24 -end-16 w-64 h-64 rounded-full bg-violet-300/10 blur-3xl" aria-hidden />

                      <div className="relative p-3 sm:p-6 space-y-6 sm:space-y-8">
                        {stages.map((stage, si) => (
                          <div key={stage.id} className="space-y-3">
                            {/* ترويسة المرحلة */}
                            <div className="ornament-divider">
                              <div className="flex items-center gap-2.5">
                                <span className="w-10 h-10 rounded-xl gold-bar flex items-center justify-center text-xl shadow-md shrink-0">
                                  {stage.icon || '🏫'}
                                </span>
                                <div>
                                  <h2 className="font-black text-base sm:text-xl text-white leading-tight">{stage.nameAr}</h2>
                                  <p className="text-[9px] sm:text-[11px] text-violet-100/60 leading-tight">{stage.descAr}</p>
                                </div>
                              </div>
                            </div>

                            {/* شبكة الصفوف — 3 أعمدة دائماً */}
                            <motion.div
                              variants={staggerContainer}
                              initial="initial"
                              animate="animate"
                              key={si}
                              className="grid grid-cols-3 gap-2.5 sm:gap-4"
                            >
                              {stage.grades.map((g) => {
                                const badge = streamBadgeLight(g.stream);
                                return (
                                  <motion.button
                                    key={g.id}
                                    variants={staggerItem}
                                    whileHover={{ y: -4 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => openGrade(view.country, stage, g)}
                                    className="relative flex flex-col items-center justify-center gap-1.5 rounded-2xl card-paper p-3 sm:p-5 transition-all cursor-pointer min-h-[104px] sm:min-h-[128px] group overflow-hidden"
                                  >
                                    <span className="absolute top-0 inset-x-6 h-px bg-gradient-to-l from-transparent via-amber-500/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden />
                                    {badge && (
                                      <span className={`absolute top-1.5 end-1.5 text-[7px] sm:text-[9px] rounded-full px-1.5 py-0.5 font-black border ${badge.cls}`}>
                                        {badge.label}
                                      </span>
                                    )}
                                    <span className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl gold-bar text-[#2a1240] flex items-center justify-center text-base sm:text-xl font-black shadow-md group-hover:shadow-lg transition-shadow">
                                      {gradeMedal(stage.key, g.order)}
                                    </span>
                                    <span className="text-[11px] sm:text-sm font-black text-violet-950 text-center leading-tight px-0.5">
                                      {g.nameAr}
                                    </span>
                                    <span className="text-[8px] sm:text-[11px] text-violet-800/70 flex items-center gap-1">
                                      {g.subjectsCount} مواد
                                      {g.booksCount > 0 && (
                                        <span className="bg-amber-100 text-amber-800 rounded-full px-1.5 font-bold border border-amber-500/40">
                                          {g.booksCount} 📚
                                        </span>
                                      )}
                                    </span>
                                  </motion.button>
                                );
                              })}
                            </motion.div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex justify-center py-24">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-300" />
                </div>
              )}
            </motion.section>
          )}

          {/* ═══ شاشة مواد الصف ═══ */}
          {view.name === 'subjects' && (
            <motion.section key="subjects" {...fadeIn} className="space-y-5">
              <nav className="flex items-center gap-1.5 text-[10px] sm:text-xs text-violet-100/50 flex-wrap font-semibold">
                <button onClick={goHome} className="hover:text-amber-300 transition-colors">الرئيسية</button>
                <span className="text-amber-400/60">✦</span>
                <button onClick={() => setView({ name: 'stages', country: view.country })} className="hover:text-amber-300 transition-colors flex items-center gap-1">
                  <CountryFlag code={view.country.code} flag={view.country.flag} className="w-4 h-3 rounded-[2px] ring-1 ring-white/20" />
                  {view.country.nameAr}
                </button>
                <span className="text-amber-400/60">✦</span>
                <span className="text-white font-black">{view.stage.nameAr}</span>
              </nav>

              <div className="text-center space-y-1.5">
                <p className="text-[10px] sm:text-xs font-bold text-amber-300">اختر مادتك للدخول</p>
                <h1 className="text-xl sm:text-3xl font-black text-white leading-snug">
                  مواد <span className="gold-text">{view.grade.nameAr}</span>
                </h1>
                <p className="text-[10px] sm:text-xs text-violet-100/55 flex items-center justify-center gap-1.5">
                  <CountryFlag code={view.country.code} flag={view.country.flag} className="w-4 h-3 rounded-[2px] ring-1 ring-white/20" />
                  {view.country.nameAr} • {view.stage.nameAr}
                </p>
              </div>

              {/* أرضية قسم المواد: بنفسجية متدرجة وعليها زخرفة شفافة */}
              <div className="relative overflow-hidden rounded-[2rem] section-royal luxury-shadow-lg ring-1 ring-amber-400/25">
                <div className="absolute inset-0 pattern-zakhrafa opacity-[0.09] pointer-events-none" aria-hidden />
                <div className="absolute -top-20 -end-16 w-56 h-56 rounded-full bg-violet-300/10 blur-3xl" aria-hidden />

                <div className="relative p-3 sm:p-5">
                  {subjectsLoading ? (
                    <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
                      {Array.from({ length: 9 }).map((_, i) => (
                        <div key={i} className="h-28 sm:h-36 rounded-2xl bg-white/10 animate-pulse" />
                      ))}
                    </div>
                  ) : (
                    <motion.div
                      variants={staggerContainer}
                      initial="initial"
                      animate="animate"
                      className="grid grid-cols-3 gap-2.5 sm:gap-4"
                    >
                      {gradeSubjects.map((s) => (
                        <motion.button
                          key={s.id}
                          variants={staggerItem}
                          whileHover={{ y: -4 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => openSubject(view.country, view.stage, view.grade, s)}
                          className="relative flex flex-col items-center justify-center gap-1.5 rounded-2xl card-paper p-3 sm:p-5 transition-all cursor-pointer min-h-[112px] sm:min-h-[136px] group overflow-hidden"
                        >
                          <span className="absolute top-0 inset-x-8 h-px bg-gradient-to-l from-transparent via-amber-500/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden />
                          {(s.gender === 'GIRLS' || s.gender === 'BOYS') && (
                            <span
                              className={`absolute top-1.5 end-1.5 rounded-full px-1.5 py-0.5 text-[7px] sm:text-[9px] font-black border ${
                                s.gender === 'GIRLS'
                                  ? 'bg-rose-500/10 text-rose-600 border-rose-400/40'
                                  : 'bg-emerald-500/10 text-emerald-700 border-emerald-400/40'
                              }`}
                            >
                              {s.gender === 'GIRLS' ? '👧 بنات' : '👦 بنين'}
                            </span>
                          )}
                          <span
                            className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-xl sm:text-2xl group-hover:scale-105 transition-all"
                            style={{
                              backgroundColor: s.color ? `${s.color}1f` : 'rgba(91, 33, 182, 0.08)',
                              boxShadow: `inset 0 0 0 1px ${s.color ? `${s.color}55` : 'rgba(91, 33, 182, 0.16)'}`,
                            }}
                          >
                            {s.icon || '📚'}
                          </span>
                          <span className="text-[11px] sm:text-sm font-black text-violet-950 text-center leading-tight px-0.5">
                            {s.nameAr}
                          </span>
                          <span className="text-[8px] sm:text-[11px] text-violet-700/80 font-bold">ابدأ التعلم</span>
                        </motion.button>
                      ))}
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.section>
          )}

          {/* ═══ شاشة المادة: الكتب + المعلم الذكي ═══ */}
          {view.name === 'detail' && (
            <motion.section key="detail" {...fadeIn} className="space-y-5">
              <nav className="flex items-center gap-1.5 text-[10px] sm:text-xs text-violet-100/50 flex-wrap font-semibold">
                <button onClick={goHome} className="hover:text-amber-300 transition-colors">الرئيسية</button>
                <span className="text-amber-400/60">✦</span>
                <button onClick={() => setView({ name: 'stages', country: view.country })} className="hover:text-amber-300 transition-colors">
                  {view.country.nameAr}
                </button>
                <span className="text-amber-400/60">✦</span>
                <button
                  onClick={() => openGrade(view.country, view.stage, view.grade)}
                  className="hover:text-amber-300 transition-colors"
                >
                  {view.stage.nameAr}
                </button>
                <span className="text-amber-400/60">✦</span>
                <span className="text-white font-black">{view.grade.nameAr}</span>
              </nav>

              {/* بانر المادة */}
              <div
                className="relative overflow-hidden rounded-3xl luxury-shadow-lg p-4 sm:p-6 flex items-center gap-4"
                style={{
                  background: view.subject.color
                    ? `linear-gradient(120deg, ${view.subject.color}d9 0%, #150a20 85%)`
                    : 'linear-gradient(120deg, #301552 0%, #150a20 85%)',
                }}
              >
                <div className="absolute inset-0 pattern-arabesque-light opacity-[0.08]" aria-hidden />
                <span className="relative w-14 h-14 sm:w-20 sm:h-20 rounded-2xl bg-white/95 flex items-center justify-center text-3xl sm:text-4xl shadow-xl shrink-0">
                  {view.subject.icon || '📚'}
                </span>
                <div className="relative min-w-0">
                  <p className="text-[9px] sm:text-[11px] font-bold text-amber-200/90 mb-0.5">مادة</p>
                  <h1 className="text-xl sm:text-3xl font-black text-white leading-tight">{view.subject.nameAr}</h1>
                  <p className="text-[10px] sm:text-xs text-white/75 mt-1 truncate">
                    {view.country.nameAr} • {view.stage.nameAr} • {view.grade.nameAr}
                  </p>
                </div>
              </div>

              <div className={`grid gap-5 items-start ${booksLoading || books.length > 0 ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
                {/* الكتب — لا تُعرض إطلاقاً إن لم توجد كتب (بلا أي إفصاح عن غيابها) */}
                {(booksLoading || books.length > 0) && (
                  <div className="space-y-3">
                    {!booksLoading && (
                      <h2 className="ornament-divider">
                        <span className="flex items-center gap-1.5 font-black text-sm sm:text-base text-white whitespace-nowrap">
                          <BookOpen className="w-4 h-4 text-amber-300" />
                          كتب المادة
                          <span className="text-violet-100/50 font-bold text-xs">({books.length})</span>
                        </span>
                      </h2>
                    )}
                    {booksLoading ? (
                      <div className="grid grid-cols-3 gap-2.5">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="h-36 rounded-2xl bg-white/5 animate-pulse" />
                        ))}
                      </div>
                    ) : (
                      <motion.div
                        variants={staggerContainer}
                        initial="initial"
                        animate="animate"
                        className="grid grid-cols-3 gap-2.5"
                      >
                        {books.map((b) => (
                          <motion.div
                            key={b.id}
                            variants={staggerItem}
                            className="flex flex-col items-center gap-1.5 rounded-2xl card-royal p-2.5 luxury-shadow hover:luxury-shadow-lg transition-all group"
                          >
                            <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400/25 to-amber-400/5 text-amber-300 flex items-center justify-center shrink-0 ring-1 ring-amber-400/35 group-hover:scale-105 transition-transform">
                              <FileText className="w-5 h-5" />
                            </span>
                            <p className="text-[10px] sm:text-xs font-black text-white text-center leading-tight line-clamp-2 w-full min-h-[2.2em]">
                              {b.titleAr}
                            </p>
                            <span className="text-[8px] sm:text-[9px] text-violet-100/60 bg-white/10 rounded-full px-2 py-0.5">
                              {formatSize(b.size)}
                            </span>
                            <div className="flex items-center gap-1.5 w-full justify-center pt-0.5">
                              <button
                                onClick={() => setViewerBook(b)}
                                className="h-8 px-3 rounded-lg gold-bar text-[#2a1240] text-[10px] font-black flex items-center gap-1 hover:brightness-105 shadow-sm"
                                title="عرض"
                              >
                                <Eye className="w-3.5 h-3.5" /> عرض
                              </button>
                              <a
                                href={`${b.fileUrl}?download=1`}
                                download
                                className="h-8 w-8 rounded-lg bg-white/10 text-amber-300 flex items-center justify-center hover:bg-amber-400/25 transition-colors"
                                title="تنزيل"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </div>
                )}

                {/* المعلم الذكي */}
                <div className="space-y-3">
                  <h2 className="ornament-divider">
                    <span className="flex items-center gap-1.5 font-black text-sm sm:text-base text-white whitespace-nowrap">
                      <Bot className="w-4 h-4 text-amber-300" />
                      معلمك الخصوصي من {view.country.nameAr}
                    </span>
                  </h2>
                  <AiTutorChat
                    countryCode={view.country.code}
                    countryName={view.country.nameAr}
                    stageKey={view.stage.key}
                    stageName={view.stage.nameAr}
                    gradeName={view.grade.nameAr}
                    subjectName={view.subject.nameAr}
                    requiresBookPhoto={!booksLoading && books.length === 0}
                  />
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      {/* ═══ التذييل الفخم ═══ */}
      <footer className="mt-auto relative bg-gradient-to-l from-[#150a20] via-[#2b1140] to-[#150a20] border-t-2 border-[#c9992b]/70">
        <div className="max-w-6xl mx-auto px-4 pt-5 pb-[calc(5.5rem+env(safe-area-inset-bottom))] text-center space-y-1.5">
          <div className="flex items-center justify-center gap-2">
            <span className="w-7 h-7 rounded-lg gold-bar flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-[#2a1240]" />
            </span>
            <span className="font-black text-sm text-white">أرث التعليم العربي</span>
          </div>
          <p className="text-[10px] sm:text-xs text-violet-100/60">
            لكل طالب عربي معلم خصوصي يدعم مسيرته التعليمية 🌍 يراجع معه دروسه من كتاب مدرسته بلسان دولته — وبرعاية داعمي الأمة
          </p>
          <p className="text-[9px] text-amber-300/50 font-bold">✦ التعليم جسر المستقبل ✦</p>
        </div>
      </footer>

      {/* ═══ شريط التطبيق السفلي الثابت ═══ */}
      <nav
        className="fixed bottom-0 inset-x-0 z-40 bg-gradient-to-l from-[#150a20] via-[#2b1140] to-[#150a20] border-t-2 border-[#c9992b]/70 shadow-[0_-10px_35px_rgba(0,0,0,0.5)]"
        aria-label="التنقل الرئيسي"
      >
        <div className="max-w-6xl mx-auto grid grid-cols-4 pb-[env(safe-area-inset-bottom)]">
          <NavTab icon={House} label="الرئيسية" active={view.name === 'home'} onClick={goHome} />
          <NavTab icon={Search} label="البحث" active={false} onClick={focusSearch} />
          <NavTab
            icon={HandHeart}
            label="الداعمون"
            active={view.name === 'sponsors'}
            onClick={goSponsors}
          />
          <NavTab icon={Info} label="عن أرث" active={false} onClick={() => setAboutOpen(true)} />
        </div>
      </nav>

      {/* لوحة الأدمن */}
      <AdminPanel
        open={adminOpen}
        onOpenChange={(o) => {
          setAdminOpen(o);
          if (!o && view.name === 'detail') refreshBooks();
        }}
        onViewBook={(b) => setViewerBook(b)}
        onAdminAuthed={(u) => setUser(u)}
      />

      {/* حوار تسجيل الدخول / إنشاء الحساب */}
      <AuthDialog
        open={authOpen}
        onOpenChange={setAuthOpen}
        initialMode={authMode}
        initialRole={authRole}
        initialSponsorId={preselectedSponsorId}
        onAuthed={(u) => {
          setUser(u);
          // الإدمن يدخل من بوابة الدخول الموحدة ثم تُفتح له لوحة التحكم الاحترافية
          if (u.role === 'ADMIN') {
            setTimeout(() => setAdminOpen(true), 350);
          }
          if (view.name === 'sponsors') loadSponsors();
        }}
      />

      {/* باقات دعم التعليم العربي — بوابة الداعمين المستقلة */}
      <SponsorsPanel
        open={sponsorsOpen}
        onOpenChange={setSponsorsOpen}
        user={user}
        onNeedSponsorAuth={(mode) => {
          setSponsorsOpen(false);
          setTimeout(() => {
            setSponsorAuthMode(mode);
            setSponsorAuthOpen(true);
          }, 250);
        }}
        onProfileSaved={loadSponsors}
      />

      {/* بوابة الداعمين المستقلة — سجّل أو تسجيل دخول داعم (تظهر من باقات الدعم فقط) */}
      <SponsorAuthDialog
        open={sponsorAuthOpen}
        onOpenChange={setSponsorAuthOpen}
        initialMode={sponsorAuthMode}
        onAuthed={(u) => {
          setUser(u);
          if (view.name === 'sponsors') loadSponsors();
        }}
      />

      {/* بطاقة الداعم من لوحة الشرف — صورته واسمه ونبذته وعدد المستفيدين فقط */}
      <Dialog open={!!selectedSponsorCard} onOpenChange={(o) => !o && setSelectedSponsorCard(null)}>
        <DialogContent dir="rtl" aria-describedby={undefined} className="max-w-sm rounded-3xl border-2 border-[#c9992b]/60 bg-gradient-to-b from-[#1e0d2e] to-[#150a20]">
          {selectedSponsorCard && (
            <div className="space-y-4 text-center">
              <DialogTitle className="sr-only">بطاقة الداعم {selectedSponsorCard.name}</DialogTitle>
              <div className="flex justify-center">
                {selectedSponsorCard.imageUrl ? (
                  <img
                    src={selectedSponsorCard.imageUrl}
                    alt={selectedSponsorCard.name}
                    className="w-24 h-24 rounded-3xl object-cover ring-2 ring-[#d4a72c]/70 shadow-[0_0_30px_rgba(212,167,44,0.25)]"
                  />
                ) : (
                  <span className="w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-700 to-emerald-950 text-amber-300 flex items-center justify-center text-4xl font-black ring-2 ring-[#d4a72c]/70 shadow-[0_0_30px_rgba(212,167,44,0.25)]">
                    {selectedSponsorCard.name.charAt(0)}
                  </span>
                )}
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-black text-white leading-6">{selectedSponsorCard.name}</h3>
                <div className="ornament-divider max-w-[220px] mx-auto">
                  <span className="text-amber-300/80 text-sm">✦</span>
                </div>
                <p className="text-xs text-violet-100/75 leading-relaxed min-h-[40px] px-2">
                  {selectedSponsorCard.bio || 'داعم كريم من داعمي أرث التعليم العربي — سواعدُه تُبقي نورَ العلم مشعاً'}
                </p>
              </div>
              <div className="glass-dark rounded-2xl px-4 py-3 flex items-center justify-center gap-2.5 mx-auto max-w-[280px]">
                <span className="w-10 h-10 rounded-xl bg-amber-400/15 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-5 h-5 text-amber-300" />
                </span>
                <span className="text-right">
                  <span className="block text-xl font-black text-white leading-6">{toArabicDigits(selectedSponsorCard.used)}</span>
                  <span className="block text-[9px] text-violet-100/70 leading-3">طالب مستفيد من خلال هذا الداعم</span>
                </span>
              </div>
              {selectedSponsorCard.remaining > 0 ? (
                <Button
                  onClick={() => {
                    const sid = selectedSponsorCard.id;
                    setSelectedSponsorCard(null);
                    setTimeout(() => openAuth('register', 'STUDENT', sid), 250);
                  }}
                  className="w-full h-11 bg-gradient-to-br from-amber-300 to-[#c9992b] text-[#2a1240] hover:from-amber-200 hover:to-[#d4a72c] font-black"
                >
                  <HandHeart className="w-4 h-4" />
                  سجّل مجاناً من خلال هذا الداعم
                </Button>
              ) : (
                <p className="text-[10px] text-violet-100/55 leading-relaxed rounded-xl bg-white/5 border border-white/10 p-2.5">
                  اكتملت مقاعد التسجيل تحت مظلة هذا الداعم — تابع لوحة الشرف لاختيار داعمٍ آخر
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* عارض الكتب */}
      <Dialog open={!!viewerBook} onOpenChange={(o) => !o && setViewerBook(null)}>
        <DialogContent className="max-w-4xl h-[85vh] p-0 overflow-hidden flex flex-col" dir="rtl">
          {viewerBook && (
            <>
              <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-l from-[#150a20] to-[#301552] shrink-0">
                <span className="w-8 h-8 rounded-lg gold-bar flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-[#2a1240]" />
                </span>
                <DialogTitle className="text-sm font-black text-white truncate">{viewerBook.titleAr}</DialogTitle>
                <div className="ms-auto flex items-center gap-2 shrink-0">
                  <a
                    href={`${viewerBook.fileUrl}?download=1`}
                    download
                    className="inline-flex items-center gap-1 text-xs font-black text-amber-300 hover:text-amber-200"
                  >
                    <Download className="w-3.5 h-3.5" /> تنزيل
                  </a>
                  <button onClick={() => setViewerBook(null)} className="text-white/60 hover:text-white" aria-label="إغلاق">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex-1 min-h-0 bg-[#0f0718]">
                {viewerBook.mimeType === 'application/pdf' ? (
                  <iframe src={viewerBook.fileUrl} className="w-full h-full" title={viewerBook.titleAr} />
                ) : viewerBook.mimeType?.startsWith('image/') ? (
                  <img src={viewerBook.fileUrl} alt={viewerBook.titleAr} className="max-w-full max-h-full mx-auto" />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center gap-3 text-violet-100/60 text-sm p-6 text-center">
                    <FileText className="w-12 h-12 opacity-30" />
                    <p>هذا النوع من الملفات لا يمكن معاينته داخل المتصفح</p>
                    <a
                      href={`${viewerBook.fileUrl}?download=1`}
                      download
                      className="inline-flex items-center gap-1.5 rounded-lg gold-bar px-4 py-2 text-[#2a1240] text-xs font-black"
                    >
                      <Download className="w-3.5 h-3.5" /> تنزيل الملف
                    </a>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* حوار «حول المنصة» من شريط التنقل */}
      <Dialog open={aboutOpen} onOpenChange={setAboutOpen}>
        <DialogContent
          dir="rtl"
          aria-describedby={undefined}
          className="max-w-md rounded-3xl border-2 border-[#c9992b]/60 bg-gradient-to-b from-[#1e0d2e] to-[#150a20] gap-0"
        >
          <DialogTitle className="sr-only">حول أرث التعليم العربي</DialogTitle>
          <div className="space-y-4 pt-1">
            <div className="flex items-center gap-3">
              <span className="w-12 h-12 rounded-2xl gold-bar flex items-center justify-center shrink-0 shadow-md">
                <GraduationCap className="w-7 h-7 text-[#2a1240]" strokeWidth={2.2} />
              </span>
              <div className="text-right">
                <h2 className="font-black text-lg text-white leading-6">أرث التعليم العربي</h2>
                <p className="text-[11px] gold-text font-bold">لكل طالب عربي معلم خصوصي يدعم مسيرته التعليمية</p>
              </div>
            </div>

            <div className="ornament-divider">
              <span className="text-amber-300/80 text-sm">✦</span>
            </div>

            <p className="text-xs sm:text-sm text-violet-100/85 leading-relaxed text-right">
              منصةٌ تعليميةٌ عربيةٌ موحّدة تجمع كتبَ ومناهجَ المرحلتين المتوسطة والثانوية لجميع الدول العربية،
              وترافق الطالب بمعلمٍ خصوصيٍّ ذكيٍّ من بلده يتحدث بثقافته ولهجته ويشرح دروسه وفق منهجها المعتمد.
              التطبيق لا يُلغي المدرسة ولا المعلمَ الحقيقي — بل هو سندٌ ومعينٌ كمدرسِ خصوصيٍّ يراجع مع الطالب دروسه من كتاب مدرسته،
              ويظل نورُه مستمراً برعاية داعمي الأمة.
            </p>

            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: Globe2, label: 'دولة عربية', value: countries.length },
                { icon: Layers, label: 'صف لكل دولة', value: countries[0]?.gradesCount || 0 },
                { icon: LibraryBig, label: 'كتب ومرجع', value: totalBooks },
              ].map((s, i) => (
                <div key={i} className="glass-dark rounded-2xl px-2 py-2.5 flex flex-col items-center gap-1 text-center">
                  <s.icon className="w-4 h-4 text-amber-300" />
                  <span className="text-base font-black text-white leading-5">{s.value}</span>
                  <span className="text-[8.5px] text-violet-100/70 leading-3">{s.label}</span>
                </div>
              ))}
            </div>

            <div className="rounded-2xl bg-white/5 border border-white/10 p-3 space-y-1.5 text-right">
              <p className="text-[11px] font-black text-amber-200 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                الخصوصية والاستخدام
              </p>
              <p className="text-[10px] text-violet-100/70 leading-relaxed">
                بياناتُ الطالب وصورُ صفحات الكتب وتسجيلاتُه الصوتية تُستخدم حصراً لخدمة الدرس ولا تُشارك مع أي طرف
                ثالث، والمحتوى المقدَّم تعليميٌّ بحت موافقٌ للمناهج المعتمدة في كل دولة.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2">
              <p className="text-[9px] text-amber-300/50 font-bold">
                © {new Date().getFullYear()} أرث التعليم العربي — جميع الحقوق محفوظة · ✦ التعليم جسر المستقبل ✦
              </p>
              {/* رمز قفل صغير خفي لدخول المشرفين — لوحة الأدمن بجلسة دخول خاصة */}
              <button
                type="button"
                onClick={() => {
                  setAboutOpen(false);
                  setTimeout(() => setAdminOpen(true), 250);
                }}
                aria-label="دخول المشرفين"
                title="دخول المشرفين"
                className="w-6 h-6 rounded-lg flex items-center justify-center text-violet-100/25 hover:text-amber-300 hover:bg-white/10 transition-colors shrink-0"
              >
                <Lock className="w-3 h-3" />
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
