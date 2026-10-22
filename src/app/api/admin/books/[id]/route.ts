import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkAdmin } from '@/lib/auth';
import { unlink } from 'fs/promises';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'books');

// DELETE /api/admin/books/[id] — حذف كتاب
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await checkAdmin(req))) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { id } = await params;
    const book = await db.book.findUnique({ where: { id } });
    if (!book) {
      return NextResponse.json({ error: 'الكتاب غير موجود' }, { status: 404 });
    }

    try {
      await unlink(path.join(UPLOAD_DIR, book.storedName));
    } catch {
      // الملف قد يكون محذوفاً مسبقاً — نكمل حذف السجل
    }

    await db.book.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('delete book error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء حذف الكتاب' }, { status: 500 });
  }
}
