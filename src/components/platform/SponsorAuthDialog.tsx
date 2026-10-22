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
import { Loader2, LogIn, UserPlus, HandHeart } from 'lucide-react';
import type { AuthUser } from './AuthDialog';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMode?: 'login' | 'register';
  onAuthed: (user: AuthUser) => void;
}

// بوابة الداعمين المستقلة — تُفتح حصراً من «باقات دعم التعليم العربي»
// وليست ضمن بوابة الدخول الخاصة بالطلاب والمعلمين
export default function SponsorAuthDialog({ open, onOpenChange, initialMode = 'login', onAuthed }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) setMode(initialMode);
  }, [open, initialMode]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const url = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body =
        mode === 'login'
          ? { email, password, role: 'SPONSOR' }
          : { name, email, password, role: 'SPONSOR' };
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
          ? `أهلاً بعودتك ${data.user.name} — شكراً لوقوفك مع تعليم أمتنا 🌟`
          : `تم إنشاء حسابك الداعم ${data.user.name} — اختر باقتك وابدأ عطاءك 🌟`
      );
      onOpenChange(false);
      setPassword('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'حدث خطأ');
    } finally {
      setBusy(false);
    }
  }

  const inputCls = 'h-11 bg-white/5 border-white/15 text-white placeholder:text-violet-100/40 text-sm';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-sm rounded-3xl border-2 border-[#c9992b]/50 bg-gradient-to-b from-[#1e0d2e] to-[#150a20]">
        <DialogHeader className="items-center text-center">
          <span className="w-14 h-14 rounded-2xl gold-bar flex items-center justify-center shadow-md">
            <HandHeart className="w-7 h-7 text-[#2a1240]" strokeWidth={2.2} />
          </span>
          <DialogTitle className="text-lg font-black text-white">بوابة الداعمين</DialogTitle>
          <DialogDescription className="text-violet-100/65 text-xs">
            {mode === 'login'
              ? 'سجّل دخولك كداعم لمتابعة طلبات رعايتك وصفحتك في لوحة الشرف'
              : 'سجّل حساب داعم مجاناً — ثم اختر باقة الدعم التي ترعاها'}
          </DialogDescription>
        </DialogHeader>

        {/* تبويبات الدخول/التسجيل */}
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-white/5 border border-white/10 p-1" role="tablist">
          {(
            [
              { key: 'login', label: 'تسجيل دخول داعم', icon: LogIn },
              { key: 'register', label: 'سجل كداعم', icon: UserPlus },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={mode === t.key}
              onClick={() => setMode(t.key)}
              className={`h-9 rounded-xl text-[11px] font-black flex items-center justify-center gap-1.5 transition-colors ${
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
          {mode === 'register' && (
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="اسم الداعم (منظمة أو فرد)"
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
            disabled={busy}
            className="w-full h-11 bg-gradient-to-br from-amber-300 to-[#c9992b] text-[#2a1240] hover:from-amber-200 hover:to-[#d4a72c] font-black disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : mode === 'login' ? (
              <LogIn className="w-4 h-4" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
            {mode === 'login' ? 'دخول كداعم' : 'إنشاء حساب الداعم'}
          </Button>

          <p className="text-[9.5px] text-violet-100/50 leading-relaxed text-center">
            بوابة الداعمين مستقلة عن بوابة الطلاب والمعلمين — حسابك الداعم يُنشأ من هنا فقط
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
