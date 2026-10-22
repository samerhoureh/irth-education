'use client';

import { useEffect, useRef, useState } from 'react';
import { Bot, Send, Loader2, Sparkles, User, Mic, ImagePlus, X, Square, Camera, BookOpen } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ChatAttachment, ChatMsg } from './types';

interface Props {
  countryCode: string;
  countryName: string;
  stageKey: string;
  stageName: string;
  gradeName: string;
  subjectName: string;
  /** مادة بلا كتاب مرفوع: تُطالب الطالب برفع صورة صفحة من كتابه قبل بدء المحادثة التعليمية */
  requiresBookPhoto?: boolean;
}

const QUICK_PROMPTS = [
  'اشرح لي أول درس في هذه المادة',
  'لخّص لي أهم النقاط بشكل مبسط',
  'أعطني تمريناً للتدريب',
  'راجع معني المصطلحات المهمة',
];

const MAX_IMAGES = 2;
const MAX_RECORD_SECONDS = 60;

// ضغط الصورة قبل الإرسال (أقصى بُعد 1280px بجودة JPEG) لتبقى الحمولة خفيفة
async function compressImage(file: File): Promise<string> {
  const maxDim = 1280;
  let width = 0;
  let height = 0;
  let drawSource: ImageBitmap | HTMLImageElement;

  // المحاولة الأولى: ImageBitmap (سريع ويدعم صور الكاميرا JPEG/PNG/WebP)
  try {
    const bitmap = await createImageBitmap(file);
    drawSource = bitmap;
    width = bitmap.width;
    height = bitmap.height;
  } catch {
    // المحاولة الاحتياطية: عنصر صورة (يدعم صيغاً إضافية مثل SVG)
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.src = url;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('image decode failed'));
      });
      drawSource = img;
      width = img.naturalWidth || 400;
      height = img.naturalHeight || 400;
    } finally {
      setTimeout(() => URL.revokeObjectURL(url), 3000);
    }
  }

  const scale = Math.min(1, maxDim / Math.max(width, height));
  const w = Math.max(1, Math.round(width * scale));
  const h = Math.max(1, Math.round(height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas');
  ctx.drawImage(drawSource as CanvasImageSource, 0, 0, w, h);
  if ('close' in drawSource && typeof drawSource.close === 'function') drawSource.close();
  return canvas.toDataURL('image/jpeg', 0.82);
}

// تحويل أي تسجيل صوتي إلى WAV (16kHz أحادي) لضمان توافق خدمة التعرف على الصوت
async function blobToWavDataUrl(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const tmp = new Ctx();
  const decoded = await tmp.decodeAudioData(buf);
  await tmp.close();

  const rate = 16000;
  const length = Math.max(1, Math.ceil(decoded.duration * rate));
  const off = new OfflineAudioContext(1, length, rate);
  const src = off.createBufferSource();
  src.buffer = decoded;
  src.connect(off.destination);
  src.start();
  const rendered = await off.startRendering();
  const ch = rendered.getChannelData(0);
  const n = ch.length;

  const bytes = new ArrayBuffer(44 + n * 2);
  const view = new DataView(bytes);
  const wstr = (o: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i));
  };
  wstr(0, 'RIFF');
  view.setUint32(4, 36 + n * 2, true);
  wstr(8, 'WAVE');
  wstr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, rate, true);
  view.setUint32(28, rate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  wstr(36, 'data');
  view.setUint32(40, n * 2, true);
  let o = 44;
  for (let i = 0; i < n; i++, o += 2) {
    const s = Math.max(-1, Math.min(1, ch[i]));
    view.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  const u8 = new Uint8Array(bytes);
  let bin = '';
  const chunk = 0x8000;
  for (let i = 0; i < u8.length; i += chunk) {
    bin += String.fromCharCode(...u8.subarray(i, i + chunk));
  }
  return 'data:audio/wav;base64,' + btoa(bin);
}

export default function AiTutorChat({ countryCode, countryName, stageKey, stageName, gradeName, subjectName, requiresBookPhoto }: Props) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // المرفقات المعلّقة قبل الإرسال
  const [pendingImages, setPendingImages] = useState<string[]>([]);
  const [pendingAudio, setPendingAudio] = useState<string | null>(null);

  // بوابة صورة صفحة الكتاب (للمواد بدون كتاب مرفوع)
  const [bookPhoto, setBookPhoto] = useState<string | null>(null);
  const [bookPhotoSent, setBookPhotoSent] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const verifyingRef = useRef(false); // حارس فوري ضد النقر المزدوج (الحالة لا تتحدّث فوراً)

  // حالة التسجيل الصوتي
  const [recording, setRecording] = useState(false);
  const [recSeconds, setRecSeconds] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const bookInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // البوابة مفتوحة: مادة بلا كتاب ولم تُرفع صورة الصفحة بعد
  const gateOpen = !!requiresBookPhoto && !bookPhotoSent;

  // إعادة ضبط المحادثة عند تغيّر المادة
  useEffect(() => {
    setMessages([
      {
        role: 'assistant',
        content: requiresBookPhoto
          ? `أهلاً وسهلاً بك في جلسة درسنا 🌟\n\nأنا معلمك الخصوصي من ${countryName} في مادة **${subjectName}** لطلاب صف ${gradeName}.\nسأرافقك في مراجعة دروسك من كتاب مدرستك، بمنهج بلدك وبمصطلحاته كما يعرفها أهل ${countryName} — بلغة راقية وشرحٍ مبسّط خطوة بخطوة.\n\nلنبدأ درسنا، يلزمني **صورة صفحة من كتابك المدرسي** لهذه المادة 📖\nصوّر الصفحة بكاميرتك وارفعها من الزر في الأسفل، وسأقرأها وأشرح لك الدرس درساً درساً.`
          : `أهلاً وسهلاً بك في جلسة درسنا 🌟\n\nأنا معلمك الخصوصي من ${countryName} في مادة **${subjectName}** لطلاب صف ${gradeName}.\nسأرافقك في مراجعة دروسك من كتاب مدرستك بأسلوب بلدك ومصطلحاته كما يعرفها أهل ${countryName} — بلغة راقية وشرحٍ مبسّط.\n\nاسألني أي سؤال عن المادة، أو اختر أحد الاقتراحات بالأسفل 👇`,
      },
    ]);
    setPendingImages([]);
    setPendingAudio(null);
    setBookPhoto(null);
    setBookPhotoSent(false);
  }, [subjectName, gradeName, stageName, countryName, requiresBookPhoto]);

  // تمرير تلقائي لآخر رسالة
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, loading]);

  // إيقاف تلقائي عند بلوغ الحد الأقصى للتسجيل
  useEffect(() => {
    if (recording && recSeconds >= MAX_RECORD_SECONDS) stopRecording();
  }, [recSeconds, recording]);

  // تنظيف الموارد عند الإلغاء
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  function pickImages(files: FileList | null) {
    if (!files || files.length === 0) return;
    const room = MAX_IMAGES - pendingImages.length;
    if (room <= 0) {
      toast.error(`يمكنك إرفاق ${MAX_IMAGES} صور كحد أقصى في الرسالة`);
      return;
    }
    const chosen = Array.from(files).slice(0, room);
    for (const f of chosen) {
      if (!f.type.startsWith('image/')) {
        toast.error('الملف المختار ليس صورة');
        continue;
      }
      compressImage(f)
        .then((dataUrl) => setPendingImages((prev) => (prev.length >= MAX_IMAGES ? prev : [...prev, dataUrl])))
        .catch(() => toast.error('تعذر معالجة الصورة'));
    }
    if (imgInputRef.current) imgInputRef.current.value = '';
  }

  // اختيار صورة صفحة الكتاب (بوابة البدء)
  function pickBookPhoto(files: FileList | null) {
    if (!files || files.length === 0) return;
    const f = files[0];
    if (!f.type.startsWith('image/')) {
      toast.error('الملف المختار ليس صورة');
      if (bookInputRef.current) bookInputRef.current.value = '';
      return;
    }
    compressImage(f)
      .then((dataUrl) => setBookPhoto(dataUrl))
      .catch(() => toast.error('تعذر معالجة الصورة'));
    if (bookInputRef.current) bookInputRef.current.value = '';
  }

  async function startRecording() {
    if (recording || loading) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/mpeg'];
      const mimeType = candidates.find((m) => MediaRecorder.isTypeSupported(m));
      const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' });
        if (blob.size === 0) return;
        try {
          const wav = await blobToWavDataUrl(blob);
          setPendingAudio(wav);
        } catch {
          toast.error('تعذر معالجة التسجيل الصوتي');
        }
      };
      rec.start();
      mediaRecorderRef.current = rec;
      setRecSeconds(0);
      setRecording(true);
      timerRef.current = setInterval(() => setRecSeconds((s) => s + 1), 1000);
    } catch {
      toast.error('لا يمكن الوصول إلى الميكروفون — تحقق من إذن المتصفح');
    }
  }

  function stopRecording() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    const rec = mediaRecorderRef.current;
    if (rec && rec.state !== 'inactive') rec.stop();
    setRecording(false);
  }

  async function send(text: string, opts?: { bookPhoto?: string }) {
    if (loading) return;
    const gatePhoto = opts?.bookPhoto;
    const gateMode = !!gatePhoto;

    const trimmed = text.trim();
    const attachments: ChatAttachment[] = gateMode
      ? [{ type: 'image' as const, dataUrl: gatePhoto }]
      : [
          ...pendingImages.map((u) => ({ type: 'image' as const, dataUrl: u })),
          ...(pendingAudio ? [{ type: 'audio' as const, dataUrl: pendingAudio }] : []),
        ];
    if (!trimmed && attachments.length === 0) return;

    // بوابة الكتاب: لا محادثة تعليمية قبل رفع صورة صفحة الكتاب
    if (gateOpen && !gateMode) {
      toast.error('أرفق صورة صفحة الكتاب أولاً لبدء الدرس 📖');
      return;
    }

    if (!gateMode) {
      setInput('');
      setPendingImages([]);
      setPendingAudio(null);
    }

    const hasVoice = attachments.some((a) => a.type === 'audio');
    const hasImage = attachments.some((a) => a.type === 'image');
    const userMsg: ChatMsg = {
      role: 'user',
      content: trimmed || (hasVoice && hasImage ? '🎤📷 رسالة صوتية مع صورة' : hasVoice ? '🎤 رسالة صوتية' : '📷 صورة'),
      attachments: attachments.length > 0 ? attachments : undefined,
    };
    const withUser: ChatMsg[] = [...messages, userMsg];
    setMessages(withUser);
    setLoading(true);

    try {
      // إرسال المرفقات مع آخر رسالة فقط لتبقى الحمولة خفيفة
      const history = withUser.slice(-16).map((m, i, arr) => ({
        role: m.role,
        content: m.content,
        attachments: i === arr.length - 1 ? m.attachments : undefined,
      }));
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          countryCode,
          stageKey,
          stageName,
          gradeName,
          subjectName,
          messages: history,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'تعذر الحصول على الرد');
      setMessages([...withUser, { role: 'assistant', content: data.reply }]);
      if (gateMode) {
        setBookPhotoSent(true);
        setBookPhoto(null);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'حدث خطأ في المحادثة');
      if (gateMode) {
        // تراجع نظيف مع إبقاء الصورة المختارة لإعادة المحاولة
        setMessages(messages);
      } else {
        setMessages(withUser);
      }
    } finally {
      setLoading(false);
    }
  }

  async function startLesson() {
    if (!bookPhoto || verifyingRef.current || loading) return;
    verifyingRef.current = true;
    setVerifying(true);
    try {
      // تدقيق الصورة أولاً: يجب أن تكون فعلًا صفحة من كتاب المادة وذات صلة به قبل قبولها
      const res = await fetch('/api/ai/verify-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectName,
          stageName,
          gradeName,
          countryName,
          image: bookPhoto,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'تعذر التحقق من الصورة، حاول مجدداً');
      }
      if (!data.accepted) {
        // رفض الصورة: لا تُعتبر أي صورة صورة كتاب قبل التدقيق — يُعاد الطلب من الطالب
        const reason = data.verdict?.reason ? `\n\nالسبب: ${data.verdict.reason}` : '';
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `📷❌ **لم يُقبل الصورة المرفقة — ليست صفحة من كتاب مادة ${subjectName}.**${reason}\n\nمن فضلك صوّر صفحة حقيقية من كتابك المدرسي لمادة **${subjectName}** وارفعها من جديد لبدء الدرس 📖`,
          },
        ]);
        toast.error('الصورة غير مرتبطة بمادة الدراسة — أرسل صورة من الكتاب 📖');
        setBookPhoto(null);
        return;
      }
      // الصورة مقبولة — تبدأ المحادثة التعليمية منها
      send(`هذه صورة صفحة من كتابي المدرسي لمادة ${subjectName} — اقرأ الدرس منها واشرحه لي خطوة بخطوة.`, {
        bookPhoto,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'تعذر التحقق من الصورة');
    } finally {
      verifyingRef.current = false;
      setVerifying(false);
    }
  }

  const canSend = !loading && (input.trim().length > 0 || pendingImages.length > 0 || !!pendingAudio);

  // معاينة المرفقات المعلّقة فوق حقل الإدخال
  const pendingPreview = (pendingImages.length > 0 || pendingAudio || recording) && (
    <div className="px-3 pt-2.5 bg-[#1e0d2e] border-t border-amber-400/15 space-y-2">
      {recording && (
        <div className="flex items-center gap-2 text-[11px] font-bold text-red-300 bg-red-500/10 border border-red-400/30 rounded-full px-3 py-1.5 w-fit">
          <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
          جارٍ تسجيل الصوت… {recSeconds} ثانية — اضغط ⏹ للإيقاف
        </div>
      )}
      {(pendingImages.length > 0 || pendingAudio) && (
        <div className="flex items-center gap-2 flex-wrap">
          {pendingImages.map((u, i) => (
            <div key={i} className="relative">
              <img src={u} alt={`صورة مرفقة ${i + 1}`} className="w-14 h-14 object-cover rounded-xl ring-1 ring-amber-400/40" />
              <button
                type="button"
                onClick={() => setPendingImages((prev) => prev.filter((_, j) => j !== i))}
                className="absolute -top-1.5 -end-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow"
                aria-label="إزالة الصورة"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          {pendingAudio && (
            <div className="relative flex items-center gap-2 bg-white/5 border border-amber-400/30 rounded-full ps-3 pe-8 py-1">
              <Mic className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <audio src={pendingAudio} controls className="h-8 max-w-[180px]" />
              <button
                type="button"
                onClick={() => setPendingAudio(null)}
                className="absolute top-1/2 -translate-y-1/2 end-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow"
                aria-label="إزالة التسجيل"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-full rounded-2xl border border-amber-400/20 bg-[#1e0d2e] luxury-shadow overflow-hidden">
      {/* رأس الدردشة الفخم */}
      <div className="relative flex items-center gap-3 px-4 py-3.5 bg-gradient-to-l from-[#150a20] via-[#301552] to-[#150a20] overflow-hidden">
        <div className="absolute inset-0 pattern-arabesque-light opacity-[0.08]" aria-hidden />
        <div className="relative w-10 h-10 rounded-xl gold-bar flex items-center justify-center shrink-0 shadow-md">
          <Bot className="w-6 h-6 text-[#2a1240]" />
        </div>
        <div className="relative min-w-0">
          <p className="font-black text-sm text-white">المعلم الذكي</p>
          <p className="text-[10px] text-amber-200/85 truncate font-semibold">
            منهج وثقافة {countryName} • {gradeName} • {subjectName}
          </p>
        </div>
        <span className="relative ms-auto flex items-center gap-1 text-[10px] glass-dark rounded-full px-2.5 py-1 shrink-0 text-violet-100 font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-300 animate-pulse" />
          متصل
        </span>
      </div>

      {/* الرسائل */}
      <div ref={scrollRef} className="flex-1 min-h-0 max-h-[420px] overflow-y-auto px-4 py-4 space-y-3 bg-[#170a24]">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                m.role === 'user' ? 'gold-bar text-[#2a1240]' : 'bg-violet-950 text-amber-300 ring-1 ring-amber-400/30'
              }`}
            >
              {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm space-y-2 ${
                m.role === 'user'
                  ? 'bg-gradient-to-br from-violet-700 to-violet-900 text-white ring-1 ring-amber-400/25 rounded-tl-sm'
                  : 'bg-[#2c1544] border border-amber-400/15 text-violet-50 rounded-tr-sm'
              }`}
            >
              {m.attachments?.some((a) => a.type === 'image') && (
                <div className="flex gap-2 flex-wrap justify-end">
                  {m.attachments
                    .filter((a) => a.type === 'image')
                    .map((a, j) => (
                      <img
                        key={j}
                        src={a.dataUrl}
                        alt={`صورة من الطالب ${j + 1}`}
                        className="max-h-40 rounded-xl ring-1 ring-white/20 object-cover"
                      />
                    ))}
                </div>
              )}
              {m.attachments
                ?.filter((a) => a.type === 'audio')
                .map((a, j) => (
                  <audio key={j} src={a.dataUrl} controls className="h-9 w-full max-w-[240px]" />
                ))}
              {m.role === 'assistant' ? (
                <div className="prose prose-sm prose-invert max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_strong]:text-amber-300 [&_a]:text-amber-300 [&_code]:text-amber-200">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{m.content}</p>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2">
            <div className="w-8 h-8 rounded-xl bg-violet-950 text-amber-300 ring-1 ring-amber-400/30 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-[#2c1544] border border-amber-400/15 rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* اقتراحات سريعة — مخفية أثناء بوابة صورة صفحة الكتاب */}
      {!gateOpen && (
      <div className="flex gap-2 px-4 py-2.5 overflow-x-auto bg-[#1e0d2e] border-t border-amber-400/15">
        {QUICK_PROMPTS.map((q) => (
          <button
            key={q}
            onClick={() => send(q)}
            disabled={loading || recording}
            className="flex items-center gap-1 whitespace-nowrap text-[11px] font-bold bg-amber-400/10 hover:bg-amber-400/20 text-amber-200 border border-amber-400/30 rounded-full px-3 py-1.5 transition-colors disabled:opacity-50"
          >
            <Sparkles className="w-3 h-3 text-amber-300" />
            {q}
          </button>
        ))}
      </div>
      )}

      {/* معاينة المرفقات المعلّقة */}
      {!gateOpen && pendingPreview}

      {/* بوابة صورة صفحة الكتاب — مطلوبة حصراً قبل بدء المحادثة التعليمية للمادة بلا كتاب */}
      {gateOpen ? (
        <div className="p-3 bg-[#1e0d2e] border-t-2 border-amber-400/30 space-y-2.5">
          <div className="flex items-start gap-2.5 rounded-2xl border border-amber-400/35 bg-amber-400/10 p-3">
            <BookOpen className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-xs font-black text-amber-200 leading-5">لبدء المحادثة التعليمية: ارفق صورة صفحة من كتابك المدرسي</p>
              <p className="text-[10px] text-violet-100/70 leading-4 mt-0.5">
                صوّر صفحة من كتاب مادة {subjectName} وارفعها هنا — سيتم أولاً التحقق من أن الصورة فعلًا من كتاب المادة، ثم يقرأها المعلم الذكي ويبدأ الشرح منها مباشرة.
              </p>
            </div>
          </div>

          {bookPhoto ? (
            <div className="flex items-center gap-3 rounded-2xl border border-amber-400/30 bg-white/5 p-2.5">
              <img src={bookPhoto} alt="صفحة الكتاب المرفقة" className="w-16 h-16 object-cover rounded-xl ring-1 ring-amber-400/40 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold text-violet-50">تم اختيار الصورة ✓</p>
                <button
                  type="button"
                  onClick={() => setBookPhoto(null)}
                  disabled={loading}
                  className="text-[10px] text-red-300 hover:text-red-200 font-bold transition-colors disabled:opacity-50"
                >
                  اختيار صورة أخرى
                </button>
              </div>
              <Button
                type="button"
                onClick={startLesson}
                disabled={loading || verifying}
                className="shrink-0 h-10 px-4 bg-gradient-to-br from-amber-300 to-[#c9992b] text-[#2a1240] hover:from-amber-200 hover:to-[#d4a72c] text-xs font-black shadow-md"
              >
                {verifying ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    جارٍ التحقق من الصورة…
                  </span>
                ) : loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'ابدأ الدرس 📖'
                )}
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => bookInputRef.current?.click()}
              className="w-full h-14 rounded-2xl border-2 border-dashed border-amber-400/40 bg-amber-400/5 hover:bg-amber-400/15 transition-colors flex items-center justify-center gap-2 text-amber-200 text-xs font-black"
            >
              <Camera className="w-5 h-5" />
              صوّر صفحة الكتاب وارفعها
            </button>
          )}

          <input
            ref={bookInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => pickBookPhoto(e.target.files)}
          />
        </div>
      ) : (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex gap-2 p-3 bg-[#1e0d2e] border-t border-amber-400/15"
      >
        {/* زر إرفاق صورة */}
        <button
          type="button"
          onClick={() => imgInputRef.current?.click()}
          disabled={loading || recording}
          className="shrink-0 w-11 h-11 rounded-xl bg-white/5 border border-amber-400/30 text-amber-300 flex items-center justify-center hover:bg-amber-400/15 transition-colors disabled:opacity-50"
          title="إرفاق صورة"
          aria-label="إرفاق صورة"
        >
          <ImagePlus className="w-5 h-5" />
        </button>
        <input
          ref={imgInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => pickImages(e.target.files)}
        />

        {/* زر التسجيل الصوتي */}
        {recording ? (
          <button
            type="button"
            onClick={stopRecording}
            className="shrink-0 w-11 h-11 rounded-xl bg-red-500/90 text-white flex items-center justify-center shadow-md animate-pulse"
            title="إيقاف التسجيل"
            aria-label="إيقاف التسجيل"
          >
            <Square className="w-4.5 h-4.5 fill-current" />
          </button>
        ) : (
          <button
            type="button"
            onClick={startRecording}
            disabled={loading || !!pendingAudio}
            className="shrink-0 w-11 h-11 rounded-xl bg-white/5 border border-amber-400/30 text-amber-300 flex items-center justify-center hover:bg-amber-400/15 transition-colors disabled:opacity-50"
            title="تسجيل رسالة صوتية"
            aria-label="تسجيل رسالة صوتية"
          >
            <Mic className="w-5 h-5" />
          </button>
        )}

        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={recording ? 'جارٍ التسجيل…' : 'اكتب سؤالك أو أرفق صورة/صوتاً...'}
          disabled={loading || recording}
          className="flex-1 h-11 bg-white/5 border-white/15 text-white placeholder:text-violet-100/40 focus-visible:ring-amber-400/60"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!canSend}
          className="shrink-0 w-11 h-11 bg-gradient-to-br from-amber-300 to-[#c9992b] text-[#2a1240] hover:from-amber-200 hover:to-[#d4a72c] shadow-md"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 -scale-x-100" />}
        </Button>
      </form>
      )}
    </div>
  );
}
