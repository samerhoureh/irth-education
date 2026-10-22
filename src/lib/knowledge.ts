// ─── أدوات قاعدة المعرفة ───
// 1) تنظيف النص المستخرج من كتب PDF ودمج صفحاته بفواصل مرقّمة
// 2) بناء سياق المعرفة المحقون في النموذج بطريقة «واعية بالدرس»:
//    عند طلب «الدرس ٣» أو «صفحة ٤٥» يُستخرج المقطع المناسب من الكتاب كاملاً
//    بدل حقن بداية الكتاب فقط — فيصبح الكتاب كله معرفةً حقيقية للنموذج.

export interface KnowledgeDocLike {
  titleAr: string;
  content: string;
}

export interface KnowledgeContextResult {
  block: string; // نص المعرفة النهائي للحقن في system prompt
  matched: boolean; // هل وُجد الدرس/الصفحة المطلوبة في المعرفة
}

/** أرقام عربية-هندية → لاتينية */
export function toLatinDigits(s: string): string {
  return s.replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
}

/**
 * تطبيع عربي مع الحفاظ على تطابق الفهارس بين النص الأصلي والمطبَّع
 * (حذف التشكيل والتطويل، توحيد الهمزات والتاء المربوطة والألف المقصورة، توحيد الأرقام)
 * — يعيد النص المطبَّع وخريطة تحويل كل فهرس فيه إلى فهرس النص الأصلي.
 */
function buildNormIndexMap(s: string): { norm: string; map: number[] } {
  let norm = '';
  const map: number[] = [];
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (/[\u064B-\u065F\u0670\u0640]/.test(ch)) continue; // تشكيل + تطويل
    let out: string;
    const arDigit = '٠١٢٣٤٥٦٧٨٩'.indexOf(ch);
    const faDigit = '۰۱۲۳۴۵۶۷۸۹'.indexOf(ch);
    if (arDigit >= 0) out = String(arDigit);
    else if (faDigit >= 0) out = String(faDigit);
    else if ('أإآٱ'.includes(ch)) out = 'ا';
    else if (ch === 'ة') out = 'ه';
    else if (ch === 'ى') out = 'ي';
    else out = ch.toLowerCase();
    norm += out;
    map.push(i);
  }
  return { norm, map };
}

const ORDINAL_WORDS: Array<[string, number]> = [
  ['الاول', 1], ['اول', 1],
  ['الثاني', 2], ['ثاني', 2],
  ['الثالث', 3], ['ثالث', 3],
  ['الرابع', 4], ['رابع', 4],
  ['الخامس', 5], ['خامس', 5],
  ['السادس', 6], ['سادس', 6],
  ['السابع', 7], ['سابع', 7],
  ['الثامن', 8], ['ثامن', 8],
  ['التاسع', 9], ['تاسع', 9],
  ['العاشر', 10], ['عاشر', 10],
];

/** حد الكلمة العربي/الرقمي — ‹\b› في جافاسكربت لا يفهم الحروف العربية */
const NO_AR = '(?![\\u0621-\\u064A\\u0660-\\u06690-9])';

/** استخراج رقم الدرس من طلب الطالب (مثال: «الدرس ٣» / «الدرس الثالث») */
export function parseLessonNumber(label: string): number | null {
  const { norm } = buildNormIndexMap(label);
  const digit = norm.match(new RegExp(`درس\\s*(\\d{1,3})${NO_AR}`));
  if (digit) return parseInt(digit[1], 10);
  for (const [word, num] of ORDINAL_WORDS) {
    if (new RegExp(`درس\\s*${word}${NO_AR}`).test(norm)) return num;
  }
  return null;
}

/** استخراج رقم الصفحة من طلب الطالب (مثال: «صفحة ٤٥») */
export function parsePageNumber(label: string): number | null {
  const { norm } = buildNormIndexMap(label);
  const m = norm.match(new RegExp(`صفح[هة]\\s*(\\d{1,4})${NO_AR}`));
  return m ? parseInt(m[1], 10) : null;
}

/** تنظيف نص صفحة واحدة مستخرجة من PDF */
function cleanPdfPage(raw: string): string {
  return raw
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .split('\n')
    .map((line) => line.replace(/[ \t\u00A0]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ─── كشف النص المستخرج بترتيب بصري معكوس (شائع في كتب PDF العربية) وإصلاحه ───

const COMMON_AR_WORDS = [
  'على', 'في', 'من', 'هذا', 'هذه', 'التي', 'الذي', 'عند', 'كان', 'هو', 'هي',
  'مع', 'كل', 'قد', 'إلى', 'بين', 'بعد', 'عن', 'ثم', 'أو', 'حتى', 'لكن',
];

/** هل يبدو النص معكوساً بصرياً؟ (الكلمات الشائعة ترد بصيغة معكوسة) */
export function looksVisuallyReversed(text: string): boolean {
  const words = text.split(/\s+/).filter((w) => /[\u0621-\u064A]{2,}/.test(w));
  if (words.length < 20) return false;
  const join = ` ${words.join(' ')} `;
  let revScore = 0;
  let fwdScore = 0;
  for (const w of COMMON_AR_WORDS) {
    const c = join.split(` ${w} `).length - 1;
    fwdScore += c;
    const r = [...w].reverse().join('');
    const rc = join.split(` ${r} `).length - 1;
    revScore += rc;
  }
  return revScore >= 3 && revScore > fwdScore * 2;
}

/** عكس سطر معكوس بصرياً مع إبقاء الأرقام واللاتينية بترتيبها */
function reverseLine(line: string): string {
  const reversed = [...line].reverse().join('');
  return reversed.replace(/[0-9٠-٩A-Za-z][0-9٠-٩A-Za-z.,:%/+-]*/g, (m) => [...m].reverse().join(''));
}

export interface BookContentResult {
  content: string;
  pages: number;
  rtlFixed: boolean;
  textChars: number; // عدد الأحرف دون فواصل الصفحات
}

/**
 * بناء محتوى الكتاب من صفحاته المستخرجة:
 * تنظيف ← كشف انعكاس RTL وعلاجه ← دمج بفواصل «⸻ صفحة N ⸻»
 */
export function buildBookContent(pagesRaw: string[]): BookContentResult {
  const cleaned = pagesRaw.map(cleanPdfPage);
  const rtlFixed = looksVisuallyReversed(cleaned.join('\n'));
  const finalPages = rtlFixed ? cleaned.map((p) => p.split('\n').map(reverseLine).join('\n')) : cleaned;
  const content = finalPages.map((p, i) => `⸻ صفحة ${i + 1} ⸻\n${p}`).join('\n\n');
  const textChars = finalPages.join('').length;
  return { content, pages: finalPages.length, rtlFixed, textChars };
}

/** فهرس مبسط للكتاب: عناوين الدروس والوحدات وأقسام Markdown */
function buildToc(content: string, maxItems = 40, maxChars = 1500): string {
  const lines = content.split('\n');
  const items: string[] = [];
  const seen = new Set<string>();
  for (const raw of lines) {
    const line = raw.trim().replace(/^[⸻\-•\s]+/, '').trim();
    if (line.length < 4) continue;
    let title = '';
    const mdHeading = line.match(/^#{1,4}\s+(.{4,140})/);
    if (mdHeading) title = mdHeading[1].replace(/[#*_]+/g, '').trim();
    else if (/^(الدرس|درس|الوحدة|وحدة|الباب|الفصل)\s*\S/.test(line)) {
      // عنوان درس: نأخذ أول ~١٢٠ حرفاً حتى لو كان النص المستخرج سطراً طويلاً واحداً
      title = line.slice(0, 120).trim();
    }
    if (!title) continue;
    const key = buildNormIndexMap(title).norm;
    if (seen.has(key)) continue;
    seen.add(key);
    items.push(title);
    if (items.length >= maxItems) break;
  }
  if (items.length === 0) return '';
  let toc = items.join('\n');
  if (toc.length > maxChars) toc = toc.slice(0, maxChars);
  return toc;
}

/** موقع «⸻ صفحة N ⸻» في النص الأصلي (-1 إن لم توجد) — يفضّل المرساة الفعلية على أي ذكر عابر */
function findPageIndex(content: string, page: number): number {
  const { norm, map } = buildNormIndexMap(content);
  const re = new RegExp(`صفحه\\s*${page}${NO_AR}`, 'g');
  let fallback = -1;
  let m: RegExpExecArray | null;
  while ((m = re.exec(norm)) !== null) {
    if (m.index >= map.length) break;
    const orig = map[m.index];
    // مرساة فعلية: «⸻» قبل «صفحة N» مباشرة — نعيد موقعها بدقة
    const before = content.slice(Math.max(0, orig - 6), orig);
    const rel = before.lastIndexOf('⸻');
    if (rel >= 0) return Math.max(0, orig - 6 + rel);
    if (fallback < 0) fallback = orig;
  }
  return fallback;
}

/** موقع بداية الدرس رقم N في النص الأصلي (-1 إن لم يوجد) */
function findLessonIndex(content: string, lesson: number): number {
  const { norm, map } = buildNormIndexMap(content);
  const tryRegexes: RegExp[] = [
    new RegExp(`(?:الدرس|درس)\\s*(?:رقم\\s*)?${lesson}${NO_AR}`),
  ];
  for (const [word, num] of ORDINAL_WORDS) {
    if (num === lesson) tryRegexes.push(new RegExp(`(?:الدرس|درس)\\s*${word}${NO_AR}`));
  }
  for (const re of tryRegexes) {
    const m = re.exec(norm);
    if (m && m.index < map.length) return map[m.index];
  }
  return -1;
}

/** قص نافذة نصية نظيفة حول موقع محدد — مع التقاط بداية فاصل الصفحة إن كان الارتساء عليه */
function sliceWindow(content: string, center: number, window: number): string {
  let start = Math.max(0, center - 400);
  // إن كان الارتساء على مرساة صفحة «⸻ صفحة N ⸻» فابدأ النافذة منها مباشرة
  const mk = content.lastIndexOf('⸻', center);
  if (mk >= 0 && center - mk <= 10) start = mk;
  const rawEnd = Math.min(content.length, start + window);
  // قص عند نهاية سطر أو فاصل صفحة لتجنب قطع الكلمات
  let end = rawEnd;
  const nl = content.lastIndexOf('\n', rawEnd);
  if (nl > start + window * 0.6) end = nl;
  return content.slice(start, end).trim();
}

/**
 * بناء سياق المعرفة لمجموعة مستندات المادة.
 * - إن طلب الطالب درساً/صفحة محددة: تُحقن الفهرس + المقطع المطابق من كل مستند.
 * - إن لم يُحدد: يُحقن الفهرس + بداية المحتوى.
 */
export function buildKnowledgeContext(
  docs: KnowledgeDocLike[],
  lessonLabel: string,
  totalBudget = 16_000
): KnowledgeContextResult {
  if (docs.length === 0) return { block: '', matched: false };

  const lesson = lessonLabel ? parseLessonNumber(lessonLabel) : null;
  const page = lessonLabel ? parsePageNumber(lessonLabel) : null;
  const share = Math.max(2500, Math.floor(totalBudget / docs.length));
  const windowSize = Math.max(1200, share - 1800); // مساحة للفهرس والعنوان

  const parts: string[] = [];
  let matched = false;

  for (const doc of docs) {
    const content = doc.content || '';
    if (!content.trim()) continue;

    let anchor = -1;
    if (page !== null) anchor = findPageIndex(content, page);
    if (anchor < 0 && lesson !== null) anchor = findLessonIndex(content, lesson);

    const sections: string[] = [`### ${doc.titleAr}`];

    if (anchor >= 0) {
      matched = true;
      const toc = buildToc(content, 25, 900);
      if (toc) sections.push(`[فهرس الكتاب — عناوين الدروس]\n${toc}`);
      sections.push(`[مقتطف الكتاب المعتمد للطلب «${lessonLabel}»]\n${sliceWindow(content, anchor, windowSize)}`);
    } else {
      const toc = buildToc(content, 30, 1200);
      if (toc) sections.push(`[فهرس الكتاب — عناوين الدروس]\n${toc}`);
      const headBudget = Math.max(1200, windowSize - (toc ? 1200 : 0));
      sections.push(`[بداية المحتوى المعتمد]\n${content.slice(0, headBudget)}`);
    }

    parts.push(sections.join('\n\n'));
  }

  return { block: parts.join('\n\n---\n\n'), matched };
}
