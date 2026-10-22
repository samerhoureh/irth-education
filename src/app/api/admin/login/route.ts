import { NextResponse } from 'next/server';
import { getAdminPassword } from '@/lib/auth';

// POST /api/admin/login — تحقق من كلمة مرور الأدمن
export async function POST(req: Request) {
  try {
    const { password } = await req.json();
    const expected = getAdminPassword();

    if (!expected) {
      return NextResponse.json(
        { error: 'لم يتم ضبط ADMIN_PASSWORD في متغيرات البيئة — انسخ .env.example وعدّل القيم' },
        { status: 500 }
      );
    }

    if (!password || password !== expected) {
      return NextResponse.json({ error: 'كلمة المرور غير صحيحة' }, { status: 401 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'طلب غير صالح' }, { status: 400 });
  }
}
