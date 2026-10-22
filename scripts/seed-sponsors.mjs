// بذر بيانات داعمين تجريبية للاختبار
// الاستخدام: bun scripts/seed-sponsors.mjs
// كلمة مرور الحسابات التجريبية تُقرأ من SPONSOR_DEMO_PASSWORD في ملف .env
import { PrismaClient } from '@prisma/client';
import { scryptSync, randomBytes } from 'crypto';

const db = new PrismaClient();

const demoPassword = process.env.SPONSOR_DEMO_PASSWORD;
if (!demoPassword) {
  console.error('⚠️  عيّن SPONSOR_DEMO_PASSWORD في ملف .env ثم أعد المحاولة');
  process.exit(1);
}

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

const SPONSORS = [
  { name: 'مؤسسة النور الخيرية', email: 'noor@example.org', org: 'مؤسسة النور الخيرية — الرياض', pkg: 'GOLD' },
  { name: 'أبو محمد المروزي', email: 'abu.mohammad@example.org', org: null, pkg: 'SILVER' },
  { name: 'جمعية البر الخليجية', email: 'albirr@example.org', org: 'جمعية البر — دبي', pkg: 'BRONZE' },
];

const PKG = {
  GOLD: { amountUsd: 500, studentsCount: 1000 },
  SILVER: { amountUsd: 250, studentsCount: 500 },
  BRONZE: { amountUsd: 100, studentsCount: 200 },
};

async function main() {
  for (const s of SPONSORS) {
    const existing = await db.user.findUnique({ where: { email: s.email } });
    if (existing) { console.log('exists:', s.email); continue; }
    const p = PKG[s.pkg];
    const user = await db.user.create({
      data: {
        name: s.name,
        email: s.email,
        passwordHash: hashPassword(demoPassword),
        role: 'SPONSOR',
        sponsorships: {
          create: {
            packageKey: s.pkg,
            amountUsd: p.amountUsd,
            studentsCount: p.studentsCount,
            orgName: s.org,
            status: 'APPROVED',
            contactNote: 'رعاية معتمدة تجريبية — بذرة عطاء للمنصة',
            reviewedAt: new Date(),
          },
        },
      },
    });
    console.log('created sponsor:', user.name, user.id);
  }
  const count = await db.user.count();
  console.log('total users now:', count);
}
main().finally(() => db.$disconnect());
