import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkAdmin } from '@/lib/auth';

// POST /api/admin/sponsorships/review — اعتماد أو رفض طلب رعاية (للأدمن)
export async function POST(req: Request) {
  if (!(await checkAdmin(req))) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  try {
    const { id, action, adminNote } = await req.json();

    if (!id || (action !== 'APPROVE' && action !== 'REJECT')) {
      return NextResponse.json({ error: 'بيانات المراجعة غير مكتملة' }, { status: 400 });
    }

    const existing = await db.sponsorshipRequest.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 });
    }

    const request = await db.sponsorshipRequest.update({
      where: { id },
      data: {
        status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
        adminNote: String(adminNote || '').trim() || null,
        reviewedAt: new Date(),
      },
    });

    return NextResponse.json({ request });
  } catch {
    return NextResponse.json({ error: 'تعذر تحديث الطلب' }, { status: 500 });
  }
}
