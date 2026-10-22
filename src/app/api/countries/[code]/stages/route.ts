import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/countries/[code]/stages — مراحل دولة معينة مع صفوفها
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const country = await db.country.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        stages: {
          orderBy: { key: 'asc' },
          include: {
            grades: {
              orderBy: { order: 'asc' },
              include: {
                _count: { select: { subjects: true } },
                subjects: { include: { _count: { select: { books: true } } } },
              },
            },
          },
        },
      },
    });

    if (!country) {
      return NextResponse.json({ error: 'الدولة غير موجودة' }, { status: 404 });
    }

    const stages = country.stages.map((s) => {
      let booksCount = 0;
      const grades = s.grades.map((g) => {
        let gradeBooks = 0;
        for (const subject of g.subjects) gradeBooks += subject._count.books;
        booksCount += gradeBooks;
        return {
          id: g.id,
          nameAr: g.nameAr,
          stream: g.stream,
          order: g.order,
          subjectsCount: g._count.subjects,
          booksCount: gradeBooks,
        };
      });
      return {
        id: s.id,
        key: s.key,
        nameAr: s.nameAr,
        descAr: s.descAr,
        icon: s.icon,
        booksCount,
        grades,
      };
    });

    return NextResponse.json({
      country: {
        id: country.id,
        code: country.code,
        nameAr: country.nameAr,
        flag: country.flag,
        region: country.region,
        culturePersona: country.culturePersona,
        curriculumNote: country.curriculumNote,
      },
      stages,
    });
  } catch (error) {
    console.error('stages error:', error);
    return NextResponse.json({ error: 'حدث خطأ في تحميل المراحل' }, { status: 500 });
  }
}
