import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/countries — قائمة الدول العربية مع الإحصائيات
export async function GET() {
  try {
    const countries = await db.country.findMany({
      orderBy: { order: 'asc' },
      include: {
        stages: {
          include: {
            grades: {
              include: {
                _count: { select: { subjects: true } },
                subjects: { include: { _count: { select: { books: true } } } },
              },
            },
          },
        },
      },
    });

    const data = countries.map((c) => {
      let gradesCount = 0;
      let subjectsCount = 0;
      let booksCount = 0;
      for (const stage of c.stages) {
        gradesCount += stage.grades.length;
        for (const grade of stage.grades) {
          subjectsCount += grade._count.subjects;
          for (const subject of grade.subjects) {
            booksCount += subject._count.books;
          }
        }
      }
      return {
        id: c.id,
        code: c.code,
        nameAr: c.nameAr,
        flag: c.flag,
        region: c.region,
        gradesCount,
        subjectsCount,
        booksCount,
        stagesCount: c.stages.length,
      };
    });

    return NextResponse.json({ countries: data });
  } catch (error) {
    console.error('countries error:', error);
    return NextResponse.json({ error: 'حدث خطأ في تحميل الدول' }, { status: 500 });
  }
}
