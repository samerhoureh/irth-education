import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/grades/[id]/subjects — مواد صف دراسي معين
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const grade = await db.grade.findUnique({
      where: { id },
      include: {
        stage: {
          include: {
            country: { select: { code: true, nameAr: true, flag: true, region: true } },
          },
        },
        subjects: {
          orderBy: [{ order: 'asc' }, { id: 'asc' }],
          include: { _count: { select: { books: true } } },
        },
      },
    });

    if (!grade) {
      return NextResponse.json({ error: 'الصف غير موجود' }, { status: 404 });
    }

    const subjects = grade.subjects.map((s) => ({
      id: s.id,
      nameAr: s.nameAr,
      icon: s.icon,
      color: s.color,
      gender: s.gender,
      booksCount: s._count.books,
    }));

    return NextResponse.json({
      grade: { id: grade.id, nameAr: grade.nameAr, stream: grade.stream },
      stage: { id: grade.stage.id, key: grade.stage.key, nameAr: grade.stage.nameAr, icon: grade.stage.icon },
      country: grade.stage.country,
      subjects,
    });
  } catch (error) {
    console.error('grade subjects error:', error);
    return NextResponse.json({ error: 'حدث خطأ في تحميل المواد' }, { status: 500 });
  }
}
