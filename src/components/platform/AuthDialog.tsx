'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Loader2,
  LogIn,
  UserPlus,
  UserRound,
  HandHeart,
  GraduationCap,
  Umbrella,
  Users,
  BookOpen,
} from 'lucide-react';
import type { SponsorInfo } from './types';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export type AuthRole = 'STUDENT' | 'SPONSOR' | 'TEACHER' | 'ADMIN';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMode?: 'login' | 'register';
  initialRole?: AuthRole;
  /** مظلة الداعم مُختارة مسبقاً عند التسجيل من خلال داعم في لوحة الشرف */
  initialSponsorId?: string;
  onAuthed: (user: AuthUser) => void;
}

// أدوار بوابة الدخول — الطلاب والمعلمون فقط (الداعمون له بوابة مستقلة من «باقات دعم التعليم العربي»)
const LOGIN_ROLES = [
  { key: 'STUDENT', label: 'طالب', icon: GraduationCap },
  { key: 'TEACHER', label: 'معلم', icon: BookOpen },
] as const;

// أدوار التسجيل (الإدمن لا يُسجَّل من البوابة)
const REGISTER_ROLES = [
  { key: 'STUDENT', label: 'طالب', icon: GraduationCap },
  { key: 'TEACHER', label: 'معلم', icon: BookOpen },
] as const;

export default function AuthDialog({
  open,
  onOpenChange,
  initialMode = 'login',
  initialRole = 'STUDENT',
  initialSponsorId = '',
  onAuthed,
}: Props) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [role, setRole] = useState<AuthRole>(initialRole);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  // مظلة الداعم: قائمة الداعمين المتاحين واختيار الطالب أحدهم
  const [sponsors, setSponsors] = useState<SponsorInfo[]>([]);
  const [loadingSponsors, setLoadingSponsors] = useState(false);
  const [sponsorId, setSponsorId] = useState('');

  // مزامنة الحالة مع خصائص الفتح (مع داعمٍ مُختار مسبقاً إن وُجد)
  useEffect(() => {
    if (open) {
      setMode(initialMode);
      setRole(initialRole);
      if (initialSponsorId) setSponsorId(initialSponsorId);
    }
  }, [open, initialMode, initialRole, initialSponsorId]);

  // تحميل الداعمين المتاحين عند التسجيل كطالب (لإلزامية المظلة)
  useEffect(() => {
    if (!open || mode !== 'register' || role !== 'STUDENT') return;
    setLoadingSponsors(true);
    fetch('/api/sponsors?available=1')
      .then((r) => r.json())
      .then((d) => setSponsors(d.sponsors || []))
      .catch(() => {
        setSponsors([]);
        toast.error('تعذر تحميل قائمة الداعمين');
      })
      .finally(() => setLoadingSponsors(false));
  }, [open, mode, role]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === 'register' && role === 'STUDENT' && !sponsorId) {
      toast.error('اختر الداعم الذي تحت مظلته لإنشاء حسابك');
      return;
    }
    setBusy(true);
    try {
      const url = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body =
        mode === 'login'
          ? { email, password, role }
          : role === 'STUDENT'
            ? { name, email, password, role, sponsorId }
            : { name, email, password, role };
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'حدث خطأ');
      onAuthed(data.user);
      toast.success(
        mode === 'login'
          ? `أهلاً بعودتك ${data.user.name} 🌟`
          : `أهلاً بك في أرث التعليم العربي ${data.user.name} 🌟`
      );
      onOpenChange(false);
      setPassword('');
      setSponsorId('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'حدث خطأ');
    } finally {
      setBusy(false);
    }
  }

  const inputCls = 'h-11 bg-white/5 border-white/15 text-white placeholder:text-violet-100/40 text-sm';
  const selectedSponsor = sponsors.find((s) => s.id === sponsorId);
  const roleList = mode === 'login' ? LOGIN_ROLES : REGISTER_ROLES;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-sm rounded-3xl border-2 border-[#c9992b]/50 bg-gradient-to-b from-[#1e0d2e] to-[#150a20]">
        <DialogHeader className="items-center text-center">
          <span className="w-14 h-14 rounded-2xl gold-bar flex items-center justify-center shadow-md">
            <UserRound className="w-7 h-7 text-[#2a1240]" strokeWidth={2.2} />
          </span>
          <DialogTitle className="text-lg font-black text-white">
            {mode === 'login' ? 'بوابة الطلاب والمعلمين' : 'إنشاء حساب جديد'}
          </DialogTitle>
          <DialogDescription className="text-violet-100/65 text-xs">
            {mode === 'login'
              ? 'خاص بالطلاب والمعلمين — اختر نوع حسابك ثم سجّل دخولك'
              : 'حسابك في أرث التعليم العربي — مجاناً تحت مظلة داعم كريم'}
          </DialogDescription>
        </DialogHeader>

        {/* تبويبات الدخول/التسجيل */}
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-white/5 border border-white/10 p-1" role="tablist">
          {(
            [
              { key: 'login', label: 'دخول', icon: LogIn },
              { key: 'register', label: 'حساب جديد', icon: UserPlus },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={mode === t.key}
              onClick={() => setMode(t.key)}
              className={`h-9 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-colors ${
                mode === t.key
                  ? 'gold-bar text-[#2a1240] shadow'
                  : 'text-violet-100/60 hover:text-white'
              }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-3">
          {/* اختيار نوع الحساب — بوابة موحدة للجميع */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 space-y-2">
            <p className="text-[10.5px] font-black text-violet-100/75 flex items-center gap-1.5">
              <UserRound className="w-3.5 h-3.5 text-amber-300" />
              {mode === 'login' ? 'اختر نوع الحساب' : 'نوع الحساب الجديد'}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {roleList.map((r) => {
                const active = role === r.key;
                return (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => {
                      setRole(r.key);
                      if (r.key !== 'STUDENT') setSponsorId('');
                    }}
                    aria-pressed={active}
                    className={`rounded-xl border py-2.5 px-1 flex flex-col items-center gap-1 transition-all ${
                      active
                        ? 'border-amber-400/70 bg-amber-400/10 text-amber-200 shadow-[0_0_14px_rgba(212,167,44,0.12)]'
                        : 'border-white/10 bg-white/5 text-violet-100/60 hover:border-white/25 hover:text-white'
                    }`}
                  >
                    <r.icon className="w-4.5 h-4.5" />
                    <span className="text-[10px] font-black">{r.label}</span>
                  </button>
                );
              })}
            </div>
            {mode === 'register' && (
              <p className="text-[9px] text-violet-100/50 leading-relaxed">
                حسابات الداعمين لها بوابة مستقلة — تُفتح من «باقات دعم التعليم العربي» في صفحة الداعمين
              </p>
            )}
          </div>

          {/* مظلة الداعم — إلزامية لحساب الطالب */}
          {mode === 'register' && role === 'STUDENT' && (
            <div className="rounded-2xl border border-amber-400/25 bg-amber-400/[0.06] p-3 space-y-2">
              <p className="text-[11px] font-black text-amber-200 flex items-center gap-1.5">
                <Umbrella className="w-3.5 h-3.5" />
                اختر الداعم الذي تحت مظلته <span className="text-red-300">*</span>
              </p>
              <p className="text-[9.5px] text-violet-100/60 leading-relaxed">
                حسابات الطلاب مُموّلة من رعاية الداعمين — يُنشأ حسابك تحت مظلة الداعم الذي تختاره
              </p>

              {loadingSponsors ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-amber-300" />
                </div>
              ) : sponsors.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/15 bg-white/5 p-3 text-center">
                  <Users className="w-5 h-5 mx-auto mb-1 text-violet-100/40" />
                  <p className="text-[10px] text-violet-100/60 leading-relaxed">
                    لا توجد مقاعد داعمين متاحة حالياً — تُفتح التسجيلات فور اعتماد رعاية جديدة
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pe-1" role="radiogroup" aria-label="قائمة الداعمين">
                  {sponsors.map((s) => {
                    const active = sponsorId === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setSponsorId(s.id)}
                        className={`w-full rounded-xl border p-2.5 flex items-center gap-2.5 text-right transition-all ${
                          active
                            ? 'border-amber-400/80 bg-gradient-to-l from-amber-400/15 to-white/[0.03] shadow-[0_0_18px_rgba(212,167,44,0.12)]'
                            : 'border-white/10 bg-white/5 hover:border-amber-400/40'
                        }`}
                      >
                        <span
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            active ? 'gold-bar' : 'bg-white/10'
                          }`}
                        >
                          <HandHeart className={`w-4 h-4 ${active ? 'text-[#2a1240]' : 'text-amber-300'}`} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-xs font-black text-white truncate">{s.name}</span>
                          {s.orgName && <span className="block text-[9px] text-violet-100/55 truncate">{s.orgName}</span>}
                        </span>
                        <span className="shrink-0 text-[9px] font-black rounded-full px-2 py-1 bg-emerald-400/10 text-emerald-300 border border-emerald-400/30">
                          {s.remaining} مقعد
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {selectedSponsor && (
                <p className="text-[9.5px] font-bold text-emerald-300 flex items-center gap-1">
                  <Umbrella className="w-3 h-3" />
                  سيُنشأ حسابك تحت مظلة {selectedSponsor.name}
                </p>
              )}
            </div>
          )}

          {mode === 'register' && (
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="الاسم الكامل"
              className={inputCls}
              required
              minLength={2}
            />
          )}

          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="البريد الإلكتروني"
            className={inputCls}
            required
            dir="ltr"
          />
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === 'register' ? 'كلمة المرور (6 أحرف على الأقل)' : 'كلمة المرور'}
            className={inputCls}
            required
            minLength={6}
            dir="ltr"
          />

          <Button
            type="submit"
            disabled={busy || (mode === 'register' && role === 'STUDENT' && !sponsorId)}
            className="w-full h-11 bg-gradient-to-br from-amber-300 to-[#c9992b] text-[#2a1240] hover:from-amber-200 hover:to-[#d4a72c] font-black disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : mode === 'login' ? (
              <LogIn className="w-4 h-4" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
            {mode === 'login' ? (role === 'TEACHER' ? 'دخول كمعلم' : 'دخول كطالب') : 'إنشاء الحساب'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
