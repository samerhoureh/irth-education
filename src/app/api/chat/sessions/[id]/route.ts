import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bearer } from '@/lib/auth';

function ownSession(id: string, uid: string) {
  return db.chatSession.findFirst({ where: { id, studentId: uid } });
}

// GET /api/chat/sessions/[id] — استرجاع جلسة كاملة (لاكتمالها)
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const payload = bearer(req);
  if (!payload) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  const { id } = await ctx.params;
  try {
    const s = await ownSession(id, payload.uid);
    if (!s) return NextResponse.json({ error: 'الجلسة غير موجودة' }, { status: 404 });
    let messages: unknown = [];
    try {
      messages = JSON.parse(s.messages);
    } catch { /* تجاهل */ }
    return NextResponse.json({
      session: {
        id: s.id,
        subjectName: s.subjectName,
        countryName: s.countryName,
        countryCode: s.countryCode,
        gradeName: s.gradeName,
        bookTitle: s.bookTitle,
        lessonLabel: s.lessonLabel,
        messages,
      },
    });
  } catch (error) {
    console.error('session GET error:', error);
    return NextResponse.json({ error: 'تعذر جلب الجلسة' }, { status: 500 });
  }
}

// PUT /api/chat/sessions/[id] — حفظ رسائل الجلسة
export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const payload = bearer(req);
  if (!payload) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  const { id } = await ctx.params;
  try {
    const body = await req.json();
    if (!Array.isArray(body.messages)) {
      return NextResponse.json({ error: 'رسائل غير صالحة' }, { status: 400 });
    }
    const s = await ownSession(id, payload.uid);
    if (!s) return NextResponse.json({ error: 'الجلسة غير موجودة' }, { status: 404 });
    await db.chatSession.update({
      where: { id },
      data: { messages: JSON.stringify(body.messages.slice(0, 200)) },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('session PUT error:', error);
    return NextResponse.json({ error: 'تعذر حفظ الجلسة' }, { status: 500 });
  }
}

// DELETE /api/chat/sessions/[id] — حذف جلسة
export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const payload = bearer(req);
  if (!payload) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  const { id } = await ctx.params;
  try {
    const s = await ownSession(id, payload.uid);
    if (!s) return NextResponse.json({ error: 'الجلسة غير موجودة' }, { status: 404 });
    await db.chatSession.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('session DELETE error:', error);
    return NextResponse.json({ error: 'تعذر حذف الجلسة' }, { status: 500 });
  }
}
