import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAdminPassword } from '@/lib/auth';

function checkAdmin(req: Request): boolean {
  const expected = getAdminPassword();
  return !!expected && req.headers.get('x-admin-key') === expected;
}

// GET /api/admin/knowledge/[id] — عرض محتوى المستند كاملاً (معاينة)
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!checkAdmin(req)) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { id } = await params;
    const doc = await db.knowledgeDoc.findUnique({ where: { id } });
    if (!doc) {
      return NextResponse.json({ error: 'المستند غير موجود' }, { status: 404 });
    }

    return NextResponse.json({
      doc: {
        id: doc.id,
        titleAr: doc.titleAr,
        fileName: doc.fileName,
        size: doc.size,
        source: doc.source,
        pages: doc.pages,
        chars: doc.content.length,
        content: doc.content,
        createdAt: doc.createdAt,
      },
    });
  } catch (error) {
    console.error('get knowledge error:', error);
    return NextResponse.json({ error: 'تعذر جلب المستند' }, { status: 500 });
  }
}

// DELETE /api/admin/knowledge/[id] — حذف مستند معرفة
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!checkAdmin(req)) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { id } = await params;
    const doc = await db.knowledgeDoc.findUnique({ where: { id } });
    if (!doc) {
      return NextResponse.json({ error: 'المستند غير موجود' }, { status: 404 });
    }

    await db.knowledgeDoc.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('delete knowledge error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء حذف المستند' }, { status: 500 });
  }
}
