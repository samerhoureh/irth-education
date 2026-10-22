import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { buildBookContent } from '@/lib/knowledge';
import { getAdminPassword } from '@/lib/auth';

const MAX_DOC_BYTES = 1024 * 1024; // حد حجم ملف Markdown (1MB)
const MAX_PDF_BYTES = 40 * 1024 * 1024; // حد حجم كتاب PDF (40MB)
const MAX_PDF_PAGES = 600; // أقصى عدد صفحات تُستخرج من الكتاب
const MIN_PDF_TEXT_CHARS = 80; // أقل نص مقبول — تحقق من وجود طبقة نصية
const ALLOWED_EXT = ['.md', '.markdown', '.mdown', '.txt', '.pdf'];

function checkAdmin(req: Request): boolean {
  const expected = getAdminPassword();
  return !!expected && req.headers.get('x-admin-key') === expected;
}

// GET /api/admin/knowledge?subjectId=... — قائمة مستندات المعرفة لمادة (بدون المحتوى الكامل)
export async function GET(req: Request) {
  try {
    if (!checkAdmin(req)) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const subjectId = new URL(req.url).searchParams.get('subjectId') || '';
    if (!subjectId) {
      return NextResponse.json({ docs: [] });
    }

    const docs = await db.knowledgeDoc.findMany({
      where: { subjectId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        titleAr: true,
        fileName: true,
        size: true,
        source: true,
        pages: true,
        subjectId: true,
        content: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      docs: docs.map((d) => ({
        id: d.id,
        titleAr: d.titleAr,
        fileName: d.fileName,
        size: d.size,
        source: d.source,
        pages: d.pages,
        chars: d.content.length,
        createdAt: d.createdAt,
      })),
    });
  } catch (error) {
    console.error('list knowledge error:', error);
    return NextResponse.json({ error: 'تعذر جلب مستندات المعرفة' }, { status: 500 });
  }
}

// POST /api/admin/knowledge — تحويل الكتاب (PDF) أو ملف Markdown إلى قاعدة معرفة لمادة
// يُستخرج نص الكتاب ويُضمَّن كمعرفةٍ للنموذج الذكي — ولا يظهر ككتاب في واجهة المحادثة
export async function POST(req: Request) {
  try {
    if (!checkAdmin(req)) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const form = await req.formData();
    const subjectId = String(form.get('subjectId') || '');
    const titleAr = String(form.get('titleAr') || '').trim();
    const file = form.get('file');

    if (!subjectId || !(file instanceof File)) {
      return NextResponse.json({ error: 'المادة والملف مطلوبان' }, { status: 400 });
    }

    const subject = await db.subject.findUnique({ where: { id: subjectId } });
    if (!subject) {
      return NextResponse.json({ error: 'المادة غير موجودة' }, { status: 404 });
    }

    const name = file.name || 'document.md';
    const dot = name.lastIndexOf('.');
    const ext = dot >= 0 ? name.slice(dot).toLowerCase() : '';

    if (!ALLOWED_EXT.includes(ext)) {
      return NextResponse.json(
        { error: 'الصيغة المقبولة: كتاب PDF أو ملفات Markdown (.md أو .txt)' },
        { status: 400 }
      );
    }

    let content = '';
    let source = 'markdown';
    let pages: number | null = null;

    if (ext === '.pdf') {
      // ─── تحويل الكتاب من PDF إلى قاعدة معرفة ───
      if (file.size > MAX_PDF_BYTES) {
        return NextResponse.json({ error: 'حجم الكتاب يتجاوز 40 ميغابايت' }, { status: 400 });
      }

      source = 'pdf';
      try {
        const { extractText, getDocumentProxy } = await import('unpdf');
        const bytes = new Uint8Array(await file.arrayBuffer());
        const pdf = await getDocumentProxy(bytes);
        const result = await extractText(pdf, { mergePages: false });
        const totalPages: number = result.totalPages || 0;

        const capped = (Array.isArray(result.text) ? result.text : [String(result.text)]).slice(0, MAX_PDF_PAGES);
        // تنظيف + كشف انعكاس RTL (شائع في كتب PDF العربية) وإصلاحه + دمج بفواصل الصفحات
        const book = buildBookContent(capped);
        pages = Math.min(totalPages, capped.length) || null;
        content = book.content;

        if (book.textChars < MIN_PDF_TEXT_CHARS) {
          return NextResponse.json(
            { error: 'لم يُعثر على نص قابل للاستخراج — يبدو أن الكتاب مصوَّر (مسح ضوئي) بدون طبقة نصية. ارفع نسخة نصية أو ملف Markdown.' },
            { status: 400 }
          );
        }
        // سقف أمان للتخزين: 900 ألف حرف تكتب كتاباً كاملاً
        if (content.length > 900_000) content = content.slice(0, 900_000);
      } catch (e) {
        console.error('pdf extraction error:', e);
        return NextResponse.json({ error: 'تعذّرت قراءة ملف PDF — تأكد أن الملف سليم وغير محمي بكلمة مرور' }, { status: 400 });
      }
    } else {
      // ─── ملف Markdown / نص ───
      if (file.size > MAX_DOC_BYTES) {
        return NextResponse.json({ error: 'حجم ملف Markdown يتجاوز 1 ميغابايت' }, { status: 400 });
      }
      content = Buffer.from(await file.arrayBuffer()).toString('utf-8').trim();
      if (!content) {
        return NextResponse.json({ error: 'الملف فارغ' }, { status: 400 });
      }
    }

    const defaultTitle = name.replace(/\.(md|markdown|mdown|txt|pdf)$/i, '');
    const doc = await db.knowledgeDoc.create({
      data: {
        titleAr: titleAr || defaultTitle,
        fileName: name,
        size: file.size,
        source,
        pages,
        content,
        subjectId,
      },
    });

    return NextResponse.json({
      doc: {
        id: doc.id,
        titleAr: doc.titleAr,
        fileName: doc.fileName,
        size: doc.size,
        source: doc.source,
        pages: doc.pages,
        chars: doc.content.length,
      },
    });
  } catch (error) {
    console.error('upload knowledge error:', error);
    return NextResponse.json({ error: 'تعذر رفع مستند المعرفة' }, { status: 500 });
  }
}
