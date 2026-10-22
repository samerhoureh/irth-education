import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/sponsors — لوحة الشرف: قائمة الداعمين من الأعلى للأقل
// يعرض للعامة: الاسم، الصورة، النبذة (البايو)، وعدد الطلاب المستفيدين فقط
// — بلا أسعار ولا باقات ولا تفاصيل الرعاية
// ويدعم ?available=1 لجلب المتاحين فقط (لاختيار مظلة الداعم عند تسجيل طالب)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const onlyAvailable = searchParams.get('available') === '1';

    const sponsors = await db.user.findMany({
      where: { role: 'SPONSOR' },
      select: {
        id: true,
        name: true,
        bio: true,
        imageUrl: true,
        createdAt: true,
        sponsorships: {
          where: { status: 'APPROVED' },
          select: { studentsCount: true, orgName: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
        sponsoredStudents: { select: { id: true } },
      },
    });

    const list = sponsors
      .map((s) => {
        const capacity = s.sponsorships.reduce((a, r) => a + r.studentsCount, 0);
        const used = s.sponsoredStudents.length;
        const remaining = Math.max(0, capacity - used);
        return {
          id: s.id,
          name: s.name,
          orgName: s.sponsorships[0]?.orgName || null,
          bio: s.bio,
          imageUrl: s.imageUrl ? `/api/sponsors/${s.id}/image` : null,
          used,
          capacity,
          remaining,
          since: s.sponsorships.length > 0 ? s.sponsorships[s.sponsorships.length - 1].createdAt : s.createdAt,
        };
      })
      .filter((s) => (onlyAvailable ? s.remaining > 0 : s.capacity > 0))
      // الترتيب من الأعلى للأقل: بحجم الرعاية الممولة ثم عدد المستفيدين فعلياً
      .sort(
        (a, b) =>
          b.capacity - a.capacity ||
          b.used - a.used ||
          a.name.localeCompare(b.name, 'ar')
      );

    const totals = {
      sponsorsCount: list.length,
      totalFunded: list.reduce((a, s) => a + s.used, 0),
      totalRemaining: list.reduce((a, s) => a + s.remaining, 0),
    };

    return NextResponse.json({ sponsors: list, totals });
  } catch {
    return NextResponse.json({ error: 'تعذر تحميل قائمة الداعمين' }, { status: 500 });
  }
}
