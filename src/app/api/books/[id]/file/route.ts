import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { readFile } from 'fs/promises';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'books');

// GET /api/books/[id]/file — تقديم ملف الكتاب (عرض أو تنزيل)
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const book = await db.book.findUnique({ where: { id } });
    if (!book) {
      return NextResponse.json({ error: 'الكتاب غير موجود' }, { status: 404 });
    }

    let buffer: Buffer;
    try {
      buffer = await readFile(path.join(UPLOAD_DIR, book.storedName));
    } catch {
      return NextResponse.json({ error: 'الملف غير متوفر على الخادم' }, { status: 410 });
    }

    const url = new URL(req.url);
    const forceDownload = url.searchParams.get('download') === '1';
    const isPdf = book.mimeType === 'application/pdf';
    const disposition = forceDownload || !isPdf ? 'attachment' : 'inline';

    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': book.mimeType || 'application/octet-stream',
        'Content-Length': String(buffer.length),
        'Content-Disposition': `${disposition}; filename*=UTF-8''${encodeURIComponent(book.fileName)}`,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error) {
    console.error('book file error:', error);
    return NextResponse.json({ error: 'حدث خطأ في تحميل الملف' }, { status: 500 });
  }
}
