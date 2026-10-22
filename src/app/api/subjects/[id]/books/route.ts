import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/subjects/[id]/books — كتب مادة معينة
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const subject = await db.subject.findUnique({
      where: { id },
      include: {
        grade: {
          include: {
            stage: {
              include: {
                country: { select: { code: true, nameAr: true, flag: true } },
              },
            },
          },
        },
        books: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!subject) {
      return NextResponse.json({ error: 'المادة غير موجودة' }, { status: 404 });
    }

    const books = subject.books.map((b) => ({
      id: b.id,
      titleAr: b.titleAr,
      fileName: b.fileName,
      mimeType: b.mimeType,
      size: b.size,
      createdAt: b.createdAt,
      fileUrl: `/api/books/${b.id}/file`,
    }));

    return NextResponse.json({
      subject: {
        id: subject.id,
        nameAr: subject.nameAr,
        icon: subject.icon,
        color: subject.color,
      },
      grade: { id: subject.grade.id, nameAr: subject.grade.nameAr, stream: subject.grade.stream },
      stage: { id: subject.grade.stage.id, key: subject.grade.stage.key, nameAr: subject.grade.stage.nameAr },
      country: subject.grade.stage.country,
      books,
    });
  } catch (error) {
    console.error('books error:', error);
    return NextResponse.json({ error: 'حدث خطأ في تحميل الكتب' }, { status: 500 });
  }
}
