import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { packageByKey } from '@/lib/sponsor-packages';

// GET /api/sponsorships — طلبات الرعاية الخاصة بالمستخدم الحالي
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'سجّل الدخول أولاً' }, { status: 401 });

  const requests = await db.sponsorshipRequest.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ requests });
}

// POST /api/sponsorships — تقديم طلب رعاية (للداعمين فقط)
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'سجّل الدخول أولاً' }, { status: 401 });
  if (user.role !== 'SPONSOR') {
    return NextResponse.json({ error: 'طلبات الرعاية متاحة للحسابات الداعمة فقط' }, { status: 403 });
  }

  try {
    const { packageKey, orgName, contactNote, proofUrl } = await req.json();
    const pkg = packageByKey(String(packageKey || ''));
    if (!pkg) {
      return NextResponse.json({ error: 'الباقة غير موجودة' }, { status: 400 });
    }

    const request = await db.sponsorshipRequest.create({
      data: {
        userId: user.id,
        packageKey: pkg.key,
        amountUsd: pkg.amountUsd,
        studentsCount: pkg.studentsCount,
        orgName: String(orgName || '').trim() || null,
        contactNote: String(contactNote || '').trim() || null,
        proofUrl: String(proofUrl || '').trim() || null,
        status: 'PENDING',
      },
    });

    return NextResponse.json({ request });
  } catch {
    return NextResponse.json({ error: 'تعذر تقديم الطلب، حاول مرة أخرى' }, { status: 500 });
  }
}
