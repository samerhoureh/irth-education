import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { readFile } from 'fs/promises';
import path from 'path';

const SPONSOR_DIR = path.join(process.cwd(), 'uploads', 'sponsors');
const MIME: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  webp: 'image/webp',
  svg: 'image/svg+xml',
};

// GET /api/sponsors/[id]/image — صورة/شعار الداعم (حساب المستخدم الداعم)
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const user = await db.user.findUnique({
      where: { id },
      select: { role: true, imageUrl: true },
    });
    if (!user || user.role !== 'SPONSOR' || !user.imageUrl) {
      return NextResponse.json({ error: 'لا توجد صورة' }, { status: 404 });
    }
    const ext = user.imageUrl.split('.').pop()?.toLowerCase() || '';
    const mime = MIME[ext] || 'application/octet-stream';
    const data = await readFile(path.join(SPONSOR_DIR, user.imageUrl));
    return new NextResponse(new Uint8Array(data), {
      headers: {
        'Content-Type': mime,
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch {
    return NextResponse.json({ error: 'تعذر جلب الصورة' }, { status: 500 });
  }
}
