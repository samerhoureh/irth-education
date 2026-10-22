import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, setSessionCookie } from '@/lib/auth';

// POST /api/auth/register — إنشاء حساب جديد (طالب / داعم / معلم)
// الطالب يجب أن يُنشأ تحت مظلة داعم: يختار داعماً له مقاعد متاحة من رعايته المعتمدة
// حساب الإدمن لا يُنشأ من البوابة — يُدار من قاعدة البيانات
export async function POST(req: Request) {
  try {
    const { name, email, password, role, sponsorId } = await req.json();

    const cleanName = String(name || '').trim();
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanPassword = String(password || '');
    const cleanRole = role === 'SPONSOR' ? 'SPONSOR' : role === 'TEACHER' ? 'TEACHER' : 'STUDENT';

    if (cleanName.length < 2) {
      return NextResponse.json({ error: 'الاسم قصير جداً' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return NextResponse.json({ error: 'البريد الإلكتروني غير صالح' }, { status: 400 });
    }
    if (cleanPassword.length < 6) {
      return NextResponse.json({ error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' }, { status: 400 });
    }

    const existing = await db.user.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      return NextResponse.json({ error: 'هذا البريد مسجَّل مسبقاً، سجّل الدخول بدلاً من ذلك' }, { status: 409 });
    }

    // الطالب: إلزامي اختيار مظلة الداعم والتحقق من توفر مقعد مموّل
    let cleanSponsorId: string | null = null;
    if (cleanRole === 'STUDENT') {
      cleanSponsorId = typeof sponsorId === 'string' ? sponsorId.trim() : '';
      if (!cleanSponsorId) {
        return NextResponse.json(
          { error: 'يجب اختيار الداعم الذي تحت مظلته لإنشاء حساب الطالب' },
          { status: 400 }
        );
      }
      const sponsor = await db.user.findUnique({
        where: { id: cleanSponsorId },
        select: {
          id: true,
          role: true,
          sponsorships: { where: { status: 'APPROVED' }, select: { studentsCount: true } },
          sponsoredStudents: { select: { id: true } },
        },
      });
      if (!sponsor || sponsor.role !== 'SPONSOR') {
        return NextResponse.json({ error: 'الداعم المختار غير موجود' }, { status: 400 });
      }
      const capacity = sponsor.sponsorships.reduce((a, r) => a + r.studentsCount, 0);
      const used = sponsor.sponsoredStudents.length;
      if (used >= capacity) {
        return NextResponse.json(
          { error: 'لا توجد مقاعد متاحة تحت مظلة هذا الداعم — اختر داعماً آخر' },
          { status: 400 }
        );
      }
    }

    const user = await db.user.create({
      data: {
        name: cleanName,
        email: cleanEmail,
        passwordHash: hashPassword(cleanPassword),
        role: cleanRole,
        sponsorId: cleanSponsorId,
      },
      select: { id: true, name: true, email: true, role: true },
    });

    await setSessionCookie(user.id);
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: 'تعذر إنشاء الحساب، حاول مرة أخرى' }, { status: 500 });
  }
}
