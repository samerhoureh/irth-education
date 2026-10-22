import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkAdmin } from '@/lib/auth';

// GET /api/admin/sponsorships — كل طلبات الرعاية (للأدمن)
export async function GET(req: Request) {
  if (!(await checkAdmin(req))) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  const requests = await db.sponsorshipRequest.findMany({
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { name: true, email: true, role: true } } },
  });
  return NextResponse.json({ requests });
}
