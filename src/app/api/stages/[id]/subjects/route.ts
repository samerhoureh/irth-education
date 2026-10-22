import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/stages/[id]/subjects — مواد مرحلة معينة
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const stage = await db.stage.findUnique({
      where: { id },
      include: {
        country: { select: { code: true, nameAr: true, flag: true, region: true } },
        subjects: {
          orderBy: { id: 'asc' },
          include: { _count: { select: { books: true } } },
        },
      },
    });

    if (!stage) {
      return NextResponse.json({ error: 'المرحلة غير موجودة' }, { status: 404 });
    }

    const subjects = stage.subjects.map((s) => ({
      id: s.id,
      nameAr: s.nameAr,
      icon: s.icon,
      color: s.color,
      booksCount: s._count.books,
    }));

    return NextResponse.json({
      stage: {
        id: stage.id,
        key: stage.key,
        nameAr: stage.nameAr,
        descAr: stage.descAr,
        icon: stage.icon,
      },
      country: stage.country,
      subjects,
    });
  } catch (error) {
    console.error('subjects error:', error);
    return NextResponse.json({ error: 'حدث خطأ في تحميل المواد' }, { status: 500 });
  }
}
