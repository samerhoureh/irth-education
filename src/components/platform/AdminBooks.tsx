'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Upload,
  Trash2,
  FileText,
  Eye,
  Download,
  Loader2,
  Database,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import type { BookItem, CountryItem, GradeItem, StageWithGrades, SubjectItem } from './types';
import { formatSize, formatDate } from './types';

const ACCEPT = '.pdf,.doc,.docx,.ppt,.pptx,.epub,.png,.jpg,.jpeg,.txt';

interface Props {
  adminKey: string;
  onViewBook: (book: BookItem) => void;
}

// قسم إدارة الكتب — التسلسل الرباعي: دولة ← مرحلة ← صف ← مادة
export default function AdminBooks({ adminKey, onViewBook }: Props) {
  const [countries, setCountries] = useState<CountryItem[]>([]);
  const [stages, setStages] = useState<StageWithGrades[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [books, setBooks] = useState<BookItem[]>([]);

  const [countryCode, setCountryCode] = useState('');
  const [stageId, setStageId] = useState('');
  const [gradeId, setGradeId] = useState('');
  const [subjectId, setSubjectId] = useState('');

  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loadingBooks, setLoadingBooks] = useState(false);

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

  const loadBooks = useCallback(async () => {
    if (!subjectId) {
      setBooks([]);
      return;
    }
    setLoadingBooks(true);
    try {
      const res = await fetch(`/api/subjects/${subjectId}/books`);
      const data = await res.json();
      setBooks(data.books || []);
    } catch {
      toast.error('تعذر تحميل الكتب');
    } finally {
      setLoadingBooks(false);
    }
  }, [subjectId]);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

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
      const res = await fetch('/api/admin/books', {
        method: 'POST',
        headers: { 'x-admin-key': adminKey },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل الرفع');
      toast.success('تم رفع الكتاب بنجاح ✅');
      setTitle('');
      setFile(null);
      const inputEl = document.getElementById('admin-file-input') as HTMLInputElement | null;
      if (inputEl) inputEl.value = '';
      await loadBooks();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'فشل الرفع');
    } finally {
      setUploading(false);
    }
  }

  async function removeBook(id: string) {
    if (!confirm('هل أنت متأكد من حذف هذا الكتاب نهائياً؟')) return;
    try {
      const res = await fetch(`/api/admin/books/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-key': adminKey },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل الحذف');
      toast.success('تم حذف الكتاب');
      await loadBooks();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'فشل الحذف');
    }
  }

  const selectCls =
    'w-full h-11 rounded-md border border-input bg-stone-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500';
  const gradeName = grades.find((g) => g.id === gradeId)?.nameAr || '';

  return (
    <div className="space-y-4">
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
        <p className="text-[11px] font-bold text-emerald-900 bg-amber-50 border border-amber-500/25 rounded-lg px-3 py-2">
          المسار المحدد: {countries.find((c) => c.code === countryCode)?.nameAr} ← {stage?.nameAr} ← {gradeName}
        </p>
      )}

      {subjectId && (
        <>
          {/* نموذج رفع كتاب */}
          <form onSubmit={upload} className="rounded-xl border border-emerald-900/10 bg-gradient-to-br from-amber-50/80 to-white p-4 space-y-3 luxury-shadow">
            <p className="text-sm font-black text-emerald-900 flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-amber-600" />
              رفع كتاب جديد إلى: {subjects.find((s) => s.id === subjectId)?.nameAr}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="عنوان الكتاب (مثال: كتاب الرياضيات — الفصل الأول)"
                className="h-11 flex-1"
              />
              <input
                id="admin-file-input"
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
                رفع
              </Button>
            </div>
            <p className="text-[11px] text-stone-500">
              الصيغ المقبولة: PDF, Word, PowerPoint, EPUB, صور, نص — الحجم الأقصى 60 ميغابايت
            </p>
          </form>

          {/* قائمة الكتب */}
          <div>
            <p className="text-sm font-bold mb-3 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-emerald-700" />
              الكتب المرفوعة <span className="text-stone-400 font-normal">({books.length})</span>
            </p>
            {loadingBooks ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              </div>
            ) : books.length === 0 ? (
              <div className="text-center py-8 text-stone-400 text-sm border rounded-xl border-dashed">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                لا توجد كتب مرفوعة لهذه المادة بعد
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto pe-1">
                {books.map((b) => (
                  <div key={b.id} className="flex items-center gap-3 rounded-xl border bg-white p-3 hover:shadow-sm transition-shadow">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm truncate">{b.titleAr}</p>
                      <p className="text-[11px] text-stone-400 truncate">
                        {formatSize(b.size)} • {formatDate(b.createdAt)}
                      </p>
                    </div>
                    <Button size="icon" variant="ghost" className="h-9 w-9 text-emerald-600" onClick={() => onViewBook(b)} title="عرض">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <a
                      href={`${b.fileUrl}?download=1`}
                      download
                      className="inline-flex items-center justify-center h-9 w-9 rounded-md text-stone-500 hover:bg-stone-100"
                      title="تنزيل"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9 text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => removeBook(b.id)}
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
    </div>
  );
}
