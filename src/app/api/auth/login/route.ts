import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword, setSessionCookie } from '@/lib/auth';

const ROLE_LABELS: Record<string, string> = {
  STUDENT: 'طالب',
  SPONSOR: 'داعم',
  TEACHER: 'معلم',
  ADMIN: 'إدمن',
};

// POST /api/auth/login — تسجيل الدخول (بوابة موحدة: طالب / داعم / معلم / إدمن)
export async function POST(req: Request) {
  try {
    const { email, password, role } = await req.json();
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanPassword = String(password || '');
    const cleanRole = typeof role === 'string' ? role.trim().toUpperCase() : '';

    if (!cleanEmail || !cleanPassword) {
      return NextResponse.json({ error: 'أدخل البريد وكلمة المرور' }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { email: cleanEmail } });
    if (!user || !verifyPassword(cleanPassword, user.passwordHash)) {
      return NextResponse.json({ error: 'البريد أو كلمة المرور غير صحيحة' }, { status: 401 });
    }

    // التحقق من تطابق نوع الحساب المختار في بوابة الدخول
    if (cleanRole && cleanRole !== user.role) {
      const actual = ROLE_LABELS[user.role] || user.role;
      const chosen = ROLE_LABELS[cleanRole] || cleanRole;
      return NextResponse.json(
        {
          error:
            chosen === actual
              ? `هذا الحساب مسجَّل كـ${actual}`
              : `نوع الحساب غير مطابق — هذا الحساب مسجَّل كـ«${actual}»، اختر «${actual}» من بوابة الدخول`,
        },
        { status: 403 }
      );
    }

    await setSessionCookie(user.id);
    return NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch {
    return NextResponse.json({ error: 'تعذر تسجيل الدخول، حاول مرة أخرى' }, { status: 500 });
  }
}
