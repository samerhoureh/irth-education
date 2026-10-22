// أنواع البيانات المشتركة لأرث التعليم العربي

export interface CountryItem {
  id: string;
  code: string;
  nameAr: string;
  flag: string;
  region: string;
  gradesCount: number;
  subjectsCount: number;
  booksCount: number;
  stagesCount: number;
}

export interface CountryFull {
  id: string;
  code: string;
  nameAr: string;
  flag: string;
  region: string;
  culturePersona: string;
  curriculumNote: string;
}

export interface GradeItem {
  id: string;
  nameAr: string;
  stream: 'NONE' | 'LITERARY' | 'SCIENTIFIC';
  order: number;
  subjectsCount: number;
  booksCount: number;
}

export interface StageWithGrades {
  id: string;
  key: string;
  nameAr: string;
  descAr?: string | null;
  icon?: string | null;
  booksCount: number;
  grades: GradeItem[];
}

export interface SubjectItem {
  id: string;
  nameAr: string;
  icon?: string | null;
  color?: string | null;
  /** GIRLS (مادة بنات) | BOYS (مادة بنين) | null (للجميع) */
  gender?: string | null;
  booksCount: number;
}

export interface BookItem {
  id: string;
  titleAr: string;
  fileName: string;
  mimeType?: string | null;
  size: number;
  createdAt: string;
  fileUrl: string;
}

export interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
  attachments?: ChatAttachment[];
}

// مرفقات الطالب في المحادثة (صورة أو صوت)
export interface ChatAttachment {
  type: 'image' | 'audio';
  dataUrl: string;
}

export type View =
  | { name: 'home' }
  | { name: 'sponsors' }
  | { name: 'stages'; country: CountryFull }
  | { name: 'subjects'; country: CountryFull; stage: StageWithGrades; grade: GradeItem }
  | { name: 'detail'; country: CountryFull; stage: StageWithGrades; grade: GradeItem; subject: SubjectItem };

// داعم في لوحة الشرف (البيانات العلنية: بلا أسعار ولا باقات — فقط الاسم والصورة والنبذة وعدد المستفيدين)
export interface SponsorInfo {
  id: string;
  name: string;
  orgName: string | null;
  bio: string | null;
  imageUrl: string | null;
  used: number;
  capacity: number;
  remaining: number;
  since: string | null;
}

export interface SponsorsTotals {
  sponsorsCount: number;
  totalFunded: number;
  totalRemaining: number;
}

// شارة الفرع (أدبي / علمي / تكنولوجي / تجاري) — نسخة داكنة ملكية
export function streamBadge(stream: string): { label: string; cls: string } | null {
  if (stream === 'LITERARY') return { label: 'أدبي', cls: 'bg-amber-400/15 text-amber-300 border-amber-400/30' };
  if (stream === 'SCIENTIFIC') return { label: 'علمي', cls: 'bg-violet-400/15 text-violet-200 border-violet-400/30' };
  if (stream === 'TECH') return { label: 'تكنولوجي', cls: 'bg-teal-400/15 text-teal-200 border-teal-400/30' };
  if (stream === 'BUSINESS') return { label: 'تجاري', cls: 'bg-emerald-400/15 text-emerald-300 border-emerald-400/30' };
  if (stream === 'VOCATIONAL') return { label: 'مهني', cls: 'bg-orange-400/15 text-orange-300 border-orange-400/30' };
  return null;
}

// شارة الفرع (أدبي / علمي / تكنولوجي / تجاري) — نسخة فاتحة تناسب البطاقات البيضاء
export function streamBadgeLight(stream: string): { label: string; cls: string } | null {
  if (stream === 'LITERARY') return { label: 'أدبي', cls: 'bg-amber-100 text-amber-800 border-amber-700/25' };
  if (stream === 'SCIENTIFIC') return { label: 'علمي', cls: 'bg-violet-100 text-violet-800 border-violet-700/25' };
  if (stream === 'TECH') return { label: 'تكنولوجي', cls: 'bg-teal-100 text-teal-800 border-teal-700/25' };
  if (stream === 'BUSINESS') return { label: 'تجاري', cls: 'bg-emerald-100 text-emerald-800 border-emerald-700/25' };
  if (stream === 'VOCATIONAL') return { label: 'مهني', cls: 'bg-orange-100 text-orange-800 border-orange-700/25' };
  return null;
}

// الأرقام العربية (٠-٩) — لعرض الإحصاءات والترتيب
export function toArabicDigits(n: number | string): string {
  const ar = '٠١٢٣٤٥٦٧٨٩';
  return String(n).replace(/[0-9]/g, (d) => ar[Number(d)]);
}

// تنسيق حجم الملف
export function formatSize(bytes: number): string {
  if (!bytes) return '0 KB';
  if (bytes < 1024) return `${bytes} بايت`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// تنسيق التاريخ
export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return '';
  }
}
