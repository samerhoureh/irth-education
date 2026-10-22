import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkAdmin } from '@/lib/auth';

// GET /api/admin/sessions — قائمة جلسات المحادثة (أحدث أولاً)
export async function GET(req: Request) {
  if (!checkAdmin(req)) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  try {
    const sessions = await db.chatSession.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 150,
      include: {
        student: { select: { fullName: true, username: true } },
      },
    });
    return NextResponse.json({
      sessions: sessions.map((s) => {
        let msgs: { role: string; content: string }[] = [];
        try {
          msgs = JSON.parse(s.messages);
        } catch { /* تجاهل */ }
        return {
          id: s.id,
          studentName: s.student?.fullName || 'زائر',
          username: s.student?.username || null,
          subjectName: s.subjectName,
          countryName: s.countryName,
          gradeName: s.gradeName,
          lessonLabel: s.lessonLabel,
          messagesCount: msgs.length,
          updatedAt: s.updatedAt,
        };
      }),
    });
  } catch (error) {
    console.error('admin sessions error:', error);
    return NextResponse.json({ error: 'تعذر جلب الجلسات' }, { status: 500 });
  }
}
