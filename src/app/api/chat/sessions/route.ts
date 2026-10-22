import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bearer } from '@/lib/auth';

// GET /api/chat/sessions — قائمة محادثات الطالب المحفوظة
export async function GET(req: Request) {
  const payload = bearer(req);
  if (!payload) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  try {
    const sessions = await db.chatSession.findMany({
      where: { studentId: payload.uid },
      orderBy: { updatedAt: 'desc' },
      take: 60,
    });
    const mapped = sessions.map((s) => {
      let msgs: { role: string; content: string }[] = [];
      try {
        msgs = JSON.parse(s.messages);
      } catch { /* تجاهل */ }
      const last = msgs[msgs.length - 1];
      return {
        id: s.id,
        subjectName: s.subjectName,
        countryName: s.countryName,
        countryCode: s.countryCode,
        gradeName: s.gradeName,
        bookTitle: s.bookTitle,
        lessonLabel: s.lessonLabel,
        messagesCount: msgs.length,
        preview: last ? last.content.replace(/[#*`>\-\n]/g, ' ').trim().slice(0, 90) : '',
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      };
    });
    return NextResponse.json({ sessions: mapped });
  } catch (error) {
    console.error('sessions GET error:', error);
    return NextResponse.json({ error: 'تعذر جلب المحادثات' }, { status: 500 });
  }
}

// POST /api/chat/sessions — إنشاء جلسة جديدة محفوظة
export async function POST(req: Request) {
  const payload = bearer(req);
  if (!payload) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  try {
    const body = await req.json();
    const subjectName = String(body.subjectName || '').trim();
    if (!subjectName) return NextResponse.json({ error: 'اسم المادة مطلوب' }, { status: 400 });

    const session = await db.chatSession.create({
      data: {
        studentId: payload.uid,
        subjectName,
        countryName: String(body.countryName || '').trim() || null,
        countryCode: String(body.countryCode || '').trim().toUpperCase() || null,
        gradeName: String(body.gradeName || '').trim() || null,
        bookTitle: String(body.bookTitle || '').trim() || null,
        lessonLabel: String(body.lessonLabel || '').trim() || null,
        messages: JSON.stringify(
          Array.isArray(body.messages) ? body.messages.slice(0, 100) : []
        ),
      },
    });
    return NextResponse.json({ id: session.id });
  } catch (error) {
    console.error('sessions POST error:', error);
    return NextResponse.json({ error: 'تعذر إنشاء الجلسة' }, { status: 500 });
  }
}
