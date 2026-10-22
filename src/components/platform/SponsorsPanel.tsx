'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Loader2,
  HandHeart,
  Send,
  BadgeCheck,
  Clock,
  XCircle,
  Users,
  Sparkles,
  ImagePlus,
  IdCard,
  X,
} from 'lucide-react';
import type { AuthUser } from './AuthDialog';
import { SPONSOR_PACKAGES, STATUS_LABELS, packageByKey } from '@/lib/sponsor-packages';

interface SponsorshipRequest {
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
}

interface SponsorProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  bio: string | null;
  imageUrl: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AuthUser | null;
  /** طلب بوابة الداعمين (سجل أو دخول) — تظهر حصراً من هذه اللوحة */
  onNeedSponsorAuth: (mode: 'login' | 'register') => void;
  /** يُستدعى بعد تغيّر صورة الداعم لتحديث لوحة الشرف */
  onProfileSaved?: () => void;
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'APPROVED') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-black rounded-full px-2.5 py-1 bg-emerald-400/15 text-emerald-300 border border-emerald-400/40">
        <BadgeCheck className="w-3 h-3" /> {STATUS_LABELS.APPROVED}
      </span>
    );
  }
  if (status === 'REJECTED') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-black rounded-full px-2.5 py-1 bg-red-400/15 text-red-300 border border-red-400/40">
        <XCircle className="w-3 h-3" /> {STATUS_LABELS.REJECTED}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-black rounded-full px-2.5 py-1 bg-amber-400/15 text-amber-300 border border-amber-400/40">
      <Clock className="w-3 h-3" /> {STATUS_LABELS.PENDING}
    </span>
  );
}

// ═══ باقات دعم التعليم العربي — بوابة الداعمين ═══
// اختيار الباقة → سجل أو تسجيل دخول داعم (بوابة مستقلة) → ثم طلب الرعاية + صفحة الداعم (صورته ونبذته)
export default function SponsorsPanel({ open, onOpenChange, user, onNeedSponsorAuth, onProfileSaved }: Props) {
  const [selected, setSelected] = useState<string>('BRONZE');
  const [orgName, setOrgName] = useState('');
  const [contactNote, setContactNote] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [requests, setRequests] = useState<SponsorshipRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  // صفحة الداعم: الصورة والنبذة (البايو) التي تظهر على بطاقته في لوحة الشرف
  const [profile, setProfile] = useState<SponsorProfile | null>(null);
  const [bio, setBio] = useState('');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const isSponsor = user?.role === 'SPONSOR';

  const loadRequests = useCallback(async () => {
    if (!open || !isSponsor) {
      setRequests([]);
      return;
    }
    setLoadingRequests(true);
    try {
      const res = await fetch('/api/sponsorships');
      const data = await res.json();
      if (res.ok) setRequests(data.requests || []);
    } catch {
      toast.error('تعذر تحميل طلباتك');
    } finally {
      setLoadingRequests(false);
    }
  }, [open, isSponsor]);

  // جلب صفحة الداعم (الصورة والنبذة)
  const loadProfile = useCallback(async () => {
    if (!open || !isSponsor) {
      setProfile(null);
      return;
    }
    try {
      const res = await fetch('/api/me/profile');
      const data = await res.json();
      if (res.ok && data.profile) {
        setProfile(data.profile);
        setBio(data.profile.bio || '');
        setImagePreview(data.profile.imageUrl);
      }
    } catch {
      /* تجاهل — الصفحة تظهر ببياناتها الافتراضية */
    }
  }, [open, isSponsor]);

  useEffect(() => {
    loadRequests();
    loadProfile();
  }, [loadRequests, loadProfile]);

  function pickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('حجم الصورة يجب أن يقل عن 5 ميغابايت');
      return;
    }
    setProfileImage(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const fd = new FormData();
      fd.append('bio', bio);
      if (profileImage) fd.append('image', profileImage);
      const res = await fetch('/api/me/profile', { method: 'PUT', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'تعذر الحفظ');
      setProfile(data.profile);
      setProfileImage(null);
      if (imagePreview?.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
      setImagePreview(data.profile.imageUrl);
      toast.success('تم تحديث صفحتك — ستظهر صورتك ونبذتك على بطاقتك في لوحة الشرف ✦');
      onProfileSaved?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'تعذر الحفظ');
    } finally {
      setSavingProfile(false);
    }
  }

  async function submitRequest(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/sponsorships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageKey: selected, orgName, contactNote, proofUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل تقديم الطلب');
      toast.success('تم تقديم طلب الرعاية — سيصلك الرد بعد مراجعة الإدارة 🌟');
      setOrgName('');
      setContactNote('');
      setProofUrl('');
      await loadRequests();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'فشل تقديم الطلب');
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls = 'h-11 bg-white/5 border-white/15 text-white placeholder:text-violet-100/40 text-sm';
  const totalGranted = requests
    .filter((r) => r.status === 'APPROVED')
    .reduce((a, r) => a + r.studentsCount, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-3xl max-h-[88vh] overflow-y-auto rounded-3xl border-2 border-[#c9992b]/50 bg-gradient-to-b from-[#1e0d2e] to-[#150a20]">
        <DialogHeader className="items-center text-center">
          <span className="w-14 h-14 rounded-2xl gold-bar flex items-center justify-center shadow-md">
            <HandHeart className="w-7 h-7 text-[#2a1240]" strokeWidth={2.2} />
          </span>
          <DialogTitle className="text-xl font-black text-white">باقات دعم التعليم العربي</DialogTitle>
          <DialogDescription className="text-violet-100/65 text-xs leading-relaxed">
            ساهم بدعم أرث التعليم العربي ليستمر نورُه لكل طالب عربي — كل 100$ توفّر 200 حساب طالب
          </DialogDescription>
          {totalGranted > 0 && (
            <p className="text-[11px] font-black text-emerald-300 bg-emerald-400/10 border border-emerald-400/30 rounded-full px-3 py-1.5 mt-1">
              🎉 رعايتك المُعتمدة توفّر {totalGranted} حساب طالب حتى الآن
            </p>
          )}
        </DialogHeader>

        {/* الباقات */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-1">
          {SPONSOR_PACKAGES.map((p) => {
            const active = selected === p.key;
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => setSelected(p.key)}
                aria-pressed={active}
                className={`relative rounded-2xl border p-4 text-center transition-all ${
                  active
                    ? 'border-amber-400/80 bg-gradient-to-b from-amber-400/15 to-white/[0.03] shadow-[0_0_25px_rgba(212,167,44,0.15)]'
                    : 'border-white/10 bg-white/5 hover:border-amber-400/40'
                }`}
              >
                {active && (
                  <span className="absolute -top-2 start-1/2 -translate-x-1/2 rtl:translate-x-1/2 text-[8px] font-black gold-bar rounded-full px-2 py-0.5 text-[#2a1240]">
                    مختارة
                  </span>
                )}
                <span className="text-3xl">{p.icon}</span>
                <p className="font-black text-sm text-white mt-1.5">{p.nameAr}</p>
                <p className="text-2xl font-black gold-text leading-8">${p.amountUsd}</p>
                <p className="text-[11px] font-bold text-amber-200 flex items-center justify-center gap-1">
                  <Users className="w-3 h-3" /> {p.studentsCount} حساب طالب
                </p>
                <p className="text-[9.5px] text-violet-100/55 leading-relaxed mt-1.5">{p.descAr}</p>
              </button>
            );
          })}
        </div>

        {/* حسب حالة المستخدم */}
        {!user ? (
          <div className="mt-4 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-center space-y-2.5">
            <p className="text-sm font-black text-amber-200 flex items-center justify-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              سجّل أو تسجيل دخول داعم لتقديم طلب رعاية
            </p>
            <p className="text-[11px] text-violet-100/65 leading-relaxed">
              بوابة الداعمين تظهر من هنا فقط — اختر باقتك أعلاه ثم أنشئ حسابك الداعم وسجّل دخولك لتقديم طلبك ومتابعته
            </p>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <Button
                onClick={() => onNeedSponsorAuth('register')}
                className="h-10 bg-gradient-to-br from-amber-300 to-[#c9992b] text-[#2a1240] hover:from-amber-200 hover:to-[#d4a72c] font-black"
              >
                <HandHeart className="w-4 h-4" />
                سجّل كداعم الآن
              </Button>
              <Button
                onClick={() => onNeedSponsorAuth('login')}
                variant="outline"
                className="h-10 border-white/20 bg-white/5 text-white hover:bg-white/15 hover:text-white font-black"
              >
                تسجيل دخول داعم
              </Button>
            </div>
          </div>
        ) : user.role === 'SPONSOR' ? (
          <>
            {/* نموذج تقديم الطلب */}
            <form onSubmit={submitRequest} className="mt-4 rounded-2xl border border-amber-400/25 bg-gradient-to-br from-amber-400/10 to-white/[0.03] p-4 space-y-3">
              <p className="text-sm font-black text-amber-200 flex items-center gap-1.5">
                <Send className="w-4 h-4" />
                طلب رعاية — {packageByKey(selected)?.nameAr} (${packageByKey(selected)?.amountUsd} = {packageByKey(selected)?.studentsCount} حساب طالب)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="اسم الجهة الداعمة (اختياري)"
                  className={inputCls}
                />
                <Input
                  value={proofUrl}
                  onChange={(e) => setProofUrl(e.target.value)}
                  placeholder="رابط إثبات التحويل (اختياري)"
                  className={inputCls}
                  dir="ltr"
                />
              </div>
              <Input
                value={contactNote}
                onChange={(e) => setContactNote(e.target.value)}
                placeholder="ملاحظة للإدارة: وسيلة التواصل معك أو أي تفاصيل (اختياري)"
                className={inputCls}
              />
              <Button
                type="submit"
                disabled={submitting}
                className="w-full h-11 bg-gradient-to-br from-amber-300 to-[#c9992b] text-[#2a1240] hover:from-amber-200 hover:to-[#d4a72c] font-black"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                تقديم طلب الرعاية
              </Button>
            </form>

            {/* طلباتي */}
            <div className="mt-4">
              <p className="text-sm font-bold mb-2.5 text-white">
                طلباتي <span className="text-violet-100/50 font-normal">({requests.length})</span>
              </p>
              {loadingRequests ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-300" />
                </div>
              ) : requests.length === 0 ? (
                <div className="text-center py-6 text-violet-100/50 text-sm border rounded-2xl border-dashed border-white/15">
                  <HandHeart className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  لم تقدّم أي طلب رعاية بعد — اختر باقتك أعلاه وابدأ عطاءك
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pe-1">
                  {requests.map((r) => {
                    const pkg = packageByKey(r.packageKey);
                    return (
                      <div key={r.id} className="rounded-2xl border border-white/10 bg-white/5 p-3.5 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-lg">{pkg?.icon}</span>
                          <span className="font-black text-sm text-white">{pkg?.nameAr}</span>
                          <span className="text-xs font-black gold-text">${r.amountUsd}</span>
                          <span className="text-[10px] text-violet-100/60 font-bold">· {r.studentsCount} حساب طالب</span>
                          <span className="ms-auto">
                            <StatusBadge status={r.status} />
                          </span>
                        </div>
                        {r.orgName && <p className="text-[11px] text-violet-100/70">الجهة: {r.orgName}</p>}
                        {r.status === 'APPROVED' && (
                          <p className="text-[11px] font-black text-emerald-300">
                            🎉 شكراً لعطائك — رعايتك توفّر {r.studentsCount} حساب طالب
                          </p>
                        )}
                        {r.adminNote && (
                          <p className="text-[10px] text-violet-100/60 rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5">
                            رد الإدارة: {r.adminNote}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ═══ صفحة الداعم: صورتك ونبذتك على بطاقة لوحة الشرف ═══ */}
            <form onSubmit={saveProfile} className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4 space-y-3">
              <p className="text-sm font-black text-amber-200 flex items-center gap-1.5">
                <IdCard className="w-4 h-4" />
                صفحتك في لوحة الشرف — صورتك ونبذتك
              </p>
              <p className="text-[10px] text-violet-100/60 leading-relaxed -mt-1">
                خصّص بطاقتك التي يراها الجميع: صورتك أو شعار جهتك، ونبذة منك تصل للطلاب — دون إظهار أي تفاصيل عن الباقة أو قيمة الدعم
              </p>

              <div className="flex items-start gap-4">
                {/* الصورة الشخصية */}
                <div className="shrink-0 text-center space-y-1.5">
                  <span className="block w-20 h-20 rounded-2xl overflow-hidden ring-2 ring-amber-400/40 bg-gradient-to-br from-emerald-700 to-emerald-950 mx-auto">
                    {imagePreview ? (
                      <img src={imagePreview} alt="صورة الداعم" className="w-full h-full object-cover" />
                    ) : (
                      <span className="w-full h-full flex items-center justify-center text-2xl font-black text-amber-300">
                        {(profile?.name || user.name || 'د').charAt(0)}
                      </span>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="inline-flex items-center gap-1 text-[9.5px] font-black rounded-lg px-2 py-1 bg-white/10 text-amber-300 hover:bg-amber-400/25 transition-colors"
                  >
                    <ImagePlus className="w-3 h-3" />
                    اختيار صورة
                  </button>
                  <input ref={imageInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={pickImage} />
                </div>

                {/* النبذة */}
                <div className="flex-1 min-w-0 space-y-2">
                  <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="اكتب نبذتك هنا… مثال: مؤسسة خيرية تهتم بتعليم أبناء الأمة — تبرعنا يفتح أبواب المعرفة لكل طالب"
                    className="min-h-[84px] bg-white/5 border-white/15 text-white placeholder:text-violet-100/35 text-xs leading-relaxed"
                    maxLength={500}
                  />
                  <p className="text-[8.5px] text-violet-100/45 text-left">{bio.length} / 500 حرف</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="submit"
                  disabled={savingProfile}
                  className="h-9 bg-gradient-to-br from-amber-300 to-[#c9992b] text-[#2a1240] hover:from-amber-200 hover:to-[#d4a72c] text-[11px] font-black"
                >
                  {savingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BadgeCheck className="w-3.5 h-3.5" />}
                  حفظ صفحتي
                </Button>
                {profileImage && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setProfileImage(null);
                      if (imagePreview?.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
                      setImagePreview(profile?.imageUrl || null);
                    }}
                    className="h-9 text-[11px] text-violet-100/60 hover:text-white hover:bg-white/10"
                  >
                    <X className="w-3.5 h-3.5" />
                    إلغاء الصورة المختارة
                  </Button>
                )}
              </div>
            </form>
          </>
        ) : (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
            <p className="text-sm font-black text-white">
              أنت مسجّل بحساب {user.role === 'TEACHER' ? 'معلم 👨‍🏫' : 'طالب 👨‍🎓'}
            </p>
            <p className="text-[11px] text-violet-100/60 mt-1 leading-relaxed">
              طلبات الرعاية متاحة للحسابات الداعمة — بوابة الداعمين تظهر من هذه اللوحة فقط، ويمكنك دائماً إنشاء حساب داعم ببريد آخر إن رغبت برعاية أرث التعليم العربي
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
