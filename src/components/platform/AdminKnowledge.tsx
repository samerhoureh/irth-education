'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Upload,
  Trash2,
  Eye,
  Loader2,
  Brain,
  X,
  BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import type { CountryItem, GradeItem, StageWithGrades, SubjectItem } from './types';
import { formatSize, formatDate } from './types';

const ACCEPT = '.pdf,.md,.markdown,.mdown,.txt';
const MAX_MD_BYTES = 1024 * 1024; // 1MB للـ Markdown
const MAX_PDF_BYTES = 40 * 1024 * 1024; // 40MB لكتاب PDF

interface KnowledgeDocItem {
  id: string;
  titleAr: string;
  fileName: string;
  size: number;
  source: string; // pdf | markdown
  pages: number | null;
  chars: number;
  createdAt: string;
}

interface Props {
  adminKey: string;
}

// قسم قاعدة المعرفة — تحويل الكتاب من PDF إلى قاعدة معرفة حسب كل مادة + ملفات Markdown
// تُضمَّن هذه المحتويات كمعرفةٍ للنموذج الذكي ولا تظهر ككتاب في واجهة المحادثة
export default function AdminKnowledge({ adminKey }: Props) {
  const [countries, setCountries] = useState<CountryItem[]>([]);
  const [stages, setStages] = useState<StageWithGrades[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [docs, setDocs] = useState<KnowledgeDocItem[]>([]);

  const [countryCode, setCountryCode] = useState('');
  const [stageId, setStageId] = useState('');
  const [gradeId, setGradeId] = useState('');
  const [subjectId, setSubjectId] = useState('');

  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(false);

  const [previewDoc, setPreviewDoc] = useState<{ titleAr: string; content: string } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const stage = stages.find((s) => s.id === stageId);
  const grades: GradeItem[] = stage?.grades || [];

  useEffect(() => {
    fetch('/api/countries')
      .then((r) => r.json())
      .then((d) => setCountries(d.countries || []))
      .catch(() => toast.error('تعذر تحميل الدول'));
  }, []);

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

  useEffect(() => {
    if (!gradeId) return;
    setSubjectId('');
    fetch(`/api/grades/${gradeId}/subjects`)
      .then((r) => r.json())
      .then((d) => setSubjects(d.subjects || []))
      .catch(() => toast.error('تعذر تحميل المواد'));
  }, [gradeId]);

  const loadDocs = useCallback(async () => {
    if (!subjectId) {
      setDocs([]);
      return;
    }
    setLoadingDocs(true);
    try {
      const res = await fetch(`/api/admin/knowledge?subjectId=${subjectId}`, {
        headers: { 'x-admin-key': adminKey },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل الجلب');
      setDocs(data.docs || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'تعذر جلب المستندات');
    } finally {
      setLoadingDocs(false);
    }
  }, [subjectId, adminKey]);

  useEffect(() => {
    loadDocs();
  }, [loadDocs]);

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    if (!subjectId || !file) {
      toast.error('اختر المادة ثم ملف الكتاب (PDF) أو Markdown');
      return;
    }
    const isPdf = file.name.toLowerCase().endsWith('.pdf');
    if (isPdf && file.size > MAX_PDF_BYTES) {
      toast.error('حجم الكتاب يتجاوز 40 ميغابايت');
      return;
    }
    if (!isPdf && file.size > MAX_MD_BYTES) {
      toast.error('حجم ملف Markdown يتجاوز 1 ميغابايت');
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('subjectId', subjectId);
      fd.append('titleAr', title.trim());
      fd.append('file', file);
      const res = await fetch('/api/admin/knowledge', {
        method: 'POST',
        headers: { 'x-admin-key': adminKey },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل الرفع');
      toast.success(
        isPdf
          ? `تم تحويل الكتاب إلى قاعدة معرفة النموذج ✅ (${(data.doc?.pages || 0).toLocaleString('ar-EG')} صفحة)`
          : 'أُضيف المستند إلى قاعدة معرفة النموذج ✅'
      );
      setTitle('');
      setFile(null);
      const inputEl = document.getElementById('admin-knowledge-file-input') as HTMLInputElement | null;
      if (inputEl) inputEl.value = '';
      await loadDocs();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'فشل الرفع');
    } finally {
      setUploading(false);
    }
  }

  async function removeDoc(id: string) {
    if (!confirm('حذف هذا المستند من قاعدة معرفة النموذج؟')) return;
    try {
      const res = await fetch(`/api/admin/knowledge/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-key': adminKey },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل الحذف');
      toast.success('تم حذف المستند');
      await loadDocs();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'فشل الحذف');
    }
  }

  async function openPreview(d: KnowledgeDocItem) {
    setPreviewLoading(true);
    setPreviewDoc({ titleAr: d.titleAr, content: '' });
    try {
      const res = await fetch(`/api/admin/knowledge/${d.id}`, {
        headers: { 'x-admin-key': adminKey },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل الجلب');
      setPreviewDoc({ titleAr: data.doc.titleAr, content: data.doc.content });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'تعذر جلب المحتوى');
      setPreviewDoc(null);
    } finally {
      setPreviewLoading(false);
    }
  }

  const selectCls =
    'w-full h-11 rounded-md border border-input bg-stone-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500';
  const gradeName = grades.find((g) => g.id === gradeId)?.nameAr || '';

  return (
    <div className="space-y-4">
      {/* توضيح القسم */}
      <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/25 bg-amber-50 px-3.5 py-3">
        <Brain className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-[11px] sm:text-xs text-amber-900 leading-5 font-semibold">
          ارفع <b>كتاب المادة PDF</b> فيُستخرج نصّه تلقائياً ويُحوَّل إلى <b>قاعدة معرفة متخصصة للمعلم الذكي</b> بهذه المادة —
          فيشرح منه أي درس أو صفحة بدقة، أو ارفع ملخصات <b>Markdown</b>. كل ذلك
          <b> يُضمَّن كمعرفةٍ للنموذج دون أن يظهر ككتاب في واجهة المحادثة</b> إطلاقاً.
        </p>
      </div>

      {/* الاختيارات المتسلسلة */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              {s.icon} {s.nameAr}
            </option>
          ))}
        </select>
      </div>

      {countryCode && stageId && gradeId && (
        <p className="text-[11px] font-bold text-emerald-900 bg-emerald-50 border border-emerald-600/20 rounded-lg px-3 py-2">
          المسار المحدد: {countries.find((c) => c.code === countryCode)?.nameAr} ← {stage?.nameAr} ← {gradeName}
        </p>
      )}

      {subjectId && (
        <>
          {/* نموذج رفع كتاب PDF / مستند معرفة */}
          <form onSubmit={upload} className="rounded-xl border border-emerald-900/10 bg-gradient-to-br from-amber-50/80 to-white p-4 space-y-3 luxury-shadow">
            <p className="text-sm font-black text-emerald-900 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-amber-600" />
              تحويل كتاب «{subjects.find((s) => s.id === subjectId)?.nameAr}» إلى قاعدة معرفة النموذج
            </p>
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="عنوان الكتاب/المستند (اختياري — الافتراضي اسم الملف)"
                className="h-11 flex-1"
              />
              <input
                id="admin-knowledge-file-input"
                type="file"
                accept={ACCEPT}
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="flex-1 text-sm file:me-3 file:rounded-md file:border-0 file:bg-emerald-600 file:text-white file:px-4 file:py-2 file:text-sm file:cursor-pointer"
              />
              <Button
                type="submit"
                disabled={uploading}
                className="h-11 shrink-0 bg-gradient-to-br from-emerald-800 to-emerald-950 text-amber-200 hover:from-emerald-700 hover:to-emerald-900"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploading ? 'جارٍ استخراج نص الكتاب...' : 'تحويل إلى معرفة'}
              </Button>
            </div>
            <p className="text-[11px] text-stone-500 leading-5">
              الصيغ: كتاب <b>PDF</b> (حتى 40 ميغابايت — قد يستغرق استخراج النصوص من الكتب الكبيرة لحظات) أو Markdown (.md / .txt — حتى 1 ميغابايت).
              يُستخرج نص الكتاب صفحةً صفحة فيصبح النموذج مختصاً بهذه المادة بهذا الكتاب تحديداً.
            </p>
          </form>

          {/* قائمة مستندات المعرفة */}
          <div>
            <p className="text-sm font-bold mb-3 flex items-center gap-1.5">
              <Brain className="w-4 h-4 text-emerald-700" />
              مستندات المعرفة <span className="text-stone-400 font-normal">({docs.length})</span>
            </p>
            {loadingDocs ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              </div>
            ) : docs.length === 0 ? (
              <div className="text-center py-8 text-stone-400 text-sm border rounded-xl border-dashed">
                <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
                لا يوجد كتاب أو مستند معرفة لهذه المادة بعد — ارفع كتاب PDF لتحويله إلى معرفة النموذج
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto pe-1">
                {docs.map((d) => (
                  <div key={d.id} className="flex items-center gap-3 rounded-xl border bg-white p-3 hover:shadow-sm transition-shadow">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                        d.source === 'pdf' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {d.source === 'pdf' ? <BookOpen className="w-5 h-5" /> : <Brain className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm truncate flex items-center gap-1.5">
                        {d.titleAr}
                        <span
                          className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-black ${
                            d.source === 'pdf' ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
                          }`}
                        >
                          {d.source === 'pdf' ? 'كتاب PDF' : 'Markdown'}
                        </span>
                      </p>
                      <p className="text-[11px] text-stone-400 truncate">
                        {formatSize(d.size)}
                        {d.source === 'pdf' && d.pages ? ` • ${d.pages.toLocaleString('ar-EG')} صفحة` : ''} •{' '}
                        {d.chars.toLocaleString('ar-EG')} حرف • {formatDate(d.createdAt)}
                      </p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9 text-emerald-600"
                      onClick={() => openPreview(d)}
                      title="معاينة"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9 text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => removeDoc(d.id)}
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* نافذة معاينة المستند */}
      <Dialog open={!!previewDoc} onOpenChange={(o) => !o && setPreviewDoc(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col" dir="rtl" aria-describedby={undefined}>
          <div className="flex items-center gap-2 shrink-0 pb-3 border-b">
            <span className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Brain className="w-4.5 h-4.5" />
            </span>
            <DialogTitle className="font-black text-emerald-950 truncate">{previewDoc?.titleAr}</DialogTitle>
            <button
              onClick={() => setPreviewDoc(null)}
              className="ms-auto w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:bg-stone-100 shrink-0"
              aria-label="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto pt-3">
            {previewLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              </div>
            ) : (
              <pre className="whitespace-pre-wrap text-[12px] leading-6 text-stone-700 font-mono bg-stone-50 rounded-xl border p-4">
                {previewDoc?.content}
              </pre>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
