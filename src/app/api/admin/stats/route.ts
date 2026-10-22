import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkAdmin } from '@/lib/auth';

// GET /api/admin/stats — إحصاءات شاملة لداشبورد الإدارة
export async function GET(req: Request) {
  if (!(await checkAdmin(req))) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  try {
    const [countries, stages, grades, subjects, books, users, sponsorReqs, recentBooks] =
      await Promise.all([
        db.country.count(),
        db.stage.count(),
        db.grade.count(),
        db.subject.count(),
        db.book.aggregate({ _count: { _all: true }, _sum: { size: true } }),
        db.user.findMany({ select: { role: true, sponsorId: true } }),
        db.sponsorshipRequest.findMany({ select: { status: true, amountUsd: true, studentsCount: true } }),
        db.book.findMany({
          orderBy: { createdAt: 'desc' },
          take: 6,
          select: {
            id: true,
            titleAr: true,
            size: true,
            createdAt: true,
            subject: {
              select: {
                nameAr: true,
                grade: {
                  select: { nameAr: true, stage: { select: { nameAr: true, country: { select: { nameAr: true, flag: true } } } } },
                },
              },
            },
          },
        }),
      ]);

    const students = users.filter((u) => u.role === 'STUDENT');
    const sponsors = users.filter((u) => u.role === 'SPONSOR');
    const sponsoredStudents = students.filter((u) => u.sponsorId).length;

    const approved = sponsorReqs.filter((r) => r.status === 'APPROVED');
    const pending = sponsorReqs.filter((r) => r.status === 'PENDING');
    const rejected = sponsorReqs.filter((r) => r.status === 'REJECTED');

    return NextResponse.json({
      stats: {
        countries,
        stages,
        grades,
        subjects,
        books: books._count._all,
        booksSize: books._sum.size || 0,
        students: students.length,
        sponsoredStudents,
        sponsors: sponsors.length,
        requests: {
          total: sponsorReqs.length,
          pending: pending.length,
          approved: approved.length,
          rejected: rejected.length,
          approvedUsd: approved.reduce((a, r) => a + r.amountUsd, 0),
          fundedAccounts: approved.reduce((a, r) => a + r.studentsCount, 0),
        },
      },
      recentBooks: recentBooks.map((b) => ({
        id: b.id,
        titleAr: b.titleAr,
        size: b.size,
        createdAt: b.createdAt,
        countryAr: b.subject.grade.stage.country.nameAr,
        countryFlag: b.subject.grade.stage.country.flag,
        stageAr: b.subject.grade.stage.nameAr,
        gradeAr: b.subject.grade.nameAr,
        subjectAr: b.subject.nameAr,
      })),
    });
  } catch {
    return NextResponse.json({ error: 'تعذر تحميل الإحصاءات' }, { status: 500 });
  }
}
