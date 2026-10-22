import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const SPONSOR_UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'sponsors');
const MAX_IMAGE = 5 * 1024 * 1024;
const MAX_BIO = 500;
const ALLOWED_IMG: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
};

// GET /api/me/profile — بيانات صفحة المستخدم الحالي (الداعم: صورته ونبذته)
export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'سجّل الدخول أولاً' }, { status: 401 });

  const user = await db.user.findUnique({
    where: { id: session.id },
    select: { id: true, name: true, email: true, role: true, bio: true, imageUrl: true, createdAt: true },
  });
  if (!user) return NextResponse.json({ error: 'الحساب غير موجود' }, { status: 404 });

  return NextResponse.json({
    profile: {
      ...user,
      imageUrl: user.imageUrl ? `/api/sponsors/${user.id}/image` : null,
    },
  });
}

// PUT /api/me/profile — تحديث نبذة الداعم وصورته الخاصة بصفحته في لوحة الشرف
export async function PUT(req: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'سجّل الدخول أولاً' }, { status: 401 });

  try {
    const form = await req.formData();
    const bio = String(form.get('bio') || '').trim();
    const image = form.get('image');

    if (bio.length > MAX_BIO) {
      return NextResponse.json({ error: `النبذة طويلة — الحد ${MAX_BIO} حرف` }, { status: 400 });
    }

    const data: { bio?: string | null; imageUrl?: string } = { bio: bio || null };

    if (image instanceof File && image.size > 0) {
      const ext = ALLOWED_IMG[image.type];
      if (!ext) return NextResponse.json({ error: 'صورة غير مدعومة (PNG/JPG/WebP/SVG)' }, { status: 400 });
      if (image.size > MAX_IMAGE) {
        return NextResponse.json({ error: 'حجم الصورة يجب أن يقل عن 5 ميغابايت' }, { status: 400 });
      }
      await mkdir(SPONSOR_UPLOAD_DIR, { recursive: true });
      const storedName = `${crypto.randomUUID()}.${ext}`;
      await writeFile(path.join(SPONSOR_UPLOAD_DIR, storedName), Buffer.from(await image.arrayBuffer()));
      data.imageUrl = storedName;
    }

    const user = await db.user.update({
      where: { id: session.id },
      data,
      select: { id: true, name: true, role: true, bio: true, imageUrl: true },
    });

    return NextResponse.json({
      profile: {
        ...user,
        imageUrl: user.imageUrl ? `/api/sponsors/${user.id}/image` : null,
      },
    });
  } catch {
    return NextResponse.json({ error: 'تعذر حفظ بيانات صفحتك، حاول مرة أخرى' }, { status: 500 });
  }
}
