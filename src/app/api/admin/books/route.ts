import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkAdmin } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'books');
const MAX_SIZE = 60 * 1024 * 1024; // 60MB

const ALLOWED_EXT: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  epub: 'application/epub+zip',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  txt: 'text/plain',
};

// GET /api/admin/books — كل الكتب مع مسارها الكامل (لداشبورد الإدارة)
export async function GET(req: Request) {
  if (!(await checkAdmin(req))) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  const books = await db.book.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      titleAr: true,
      fileName: true,
      mimeType: true,
      size: true,
      createdAt: true,
      subject: {
        select: {
          nameAr: true,
          grade: {
            select: {
              nameAr: true,
              stage: {
                select: {
                  nameAr: true,
                  country: { select: { nameAr: true, flag: true, code: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  return NextResponse.json({
    books: books.map((b) => ({
      id: b.id,
      titleAr: b.titleAr,
      fileName: b.fileName,
      mimeType: b.mimeType,
      size: b.size,
      createdAt: b.createdAt,
      fileUrl: `/api/books/${b.id}/file`,
      countryAr: b.subject.grade.stage.country.nameAr,
      countryFlag: b.subject.grade.stage.country.flag,
      countrycode: b.subject.grade.stage.country.code,
      stageAr: b.subject.grade.stage.nameAr,
      gradeAr: b.subject.grade.nameAr,
      subjectAr: b.subject.nameAr,
    })),
  });
}

// POST /api/admin/books — رفع كتاب جديد
export async function POST(req: Request) {
  try {
    if (!(await checkAdmin(req))) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const form = await req.formData();
    const subjectId = String(form.get('subjectId') || '');
    const titleAr = String(form.get('titleAr') || '').trim();
    const file = form.get('file');

    if (!subjectId || !titleAr || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'الرجاء إدخال عنوان الكتاب واختيار المادة والملف' },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'حجم الملف يتجاوز 60 ميغابايت' }, { status: 413 });
    }

    const subject = await db.subject.findUnique({ where: { id: subjectId } });
    if (!subject) {
      return NextResponse.json({ error: 'المادة غير موجودة' }, { status: 404 });
    }

    const originalName = file.name || 'book';
    const ext = originalName.split('.').pop()?.toLowerCase() || 'bin';
    const mimeType = ALLOWED_EXT[ext] || file.type || 'application/octet-stream';
    if (!ALLOWED_EXT[ext]) {
      return NextResponse.json(
        { error: 'صيغة الملف غير مدعومة (المسموح: PDF, Word, PowerPoint, EPUB, صور, نص)' },
        { status: 415 }
      );
    }

    const storedName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`;
    await mkdir(UPLOAD_DIR, { recursive: true });
    const bytes = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(UPLOAD_DIR, storedName), bytes);

    const book = await db.book.create({
      data: {
        titleAr,
        fileName: originalName,
        storedName,
        mimeType,
        size: file.size,
        subjectId,
      },
    });

    return NextResponse.json({
      ok: true,
      book: {
        id: book.id,
        titleAr: book.titleAr,
        fileName: book.fileName,
        size: book.size,
        fileUrl: `/api/books/${book.id}/file`,
      },
    });
  } catch (error) {
    console.error('upload error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء رفع الملف' }, { status: 500 });
  }
}
