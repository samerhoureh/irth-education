// إنشاء حسابات الأدمن والمعلم للبوابة الموحدة
// الاستخدام: bun scripts/seed-admin-teacher.mjs
// تُقرأ بيانات الحسابات من متغيرات البيئة في ملف .env — انسخ .env.example وعدّل القيم.
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const db = new PrismaClient();

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

const ACCOUNTS = [
  {
    name: process.env.ADMIN_NAME || 'مدير المنصة',
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
    role: 'ADMIN',
  },
  {
    name: process.env.TEACHER_NAME || 'معلم المنصة',
    email: process.env.TEACHER_EMAIL,
    password: process.env.TEACHER_PASSWORD,
    role: 'TEACHER',
  },
];

if (ACCOUNTS.some((acc) => !acc.email || !acc.password)) {
  console.error('⚠️  عيّن القيم التالية في ملف .env ثم أعد المحاولة:');
  console.error('   ADMIN_EMAIL, ADMIN_PASSWORD, TEACHER_EMAIL, TEACHER_PASSWORD');
  process.exit(1);
}

for (const acc of ACCOUNTS) {
  const existing = await db.user.findUnique({ where: { email: acc.email } });
  if (existing) {
    const updated = await db.user.update({
      where: { email: acc.email },
      data: { role: acc.role, passwordHash: hashPassword(acc.password) },
    });
    console.log(`♻️  حدّث الحساب: ${updated.name} (${updated.email}) → ${updated.role}`);
  } else {
    const created = await db.user.create({
      data: {
        name: acc.name,
        email: acc.email,
        passwordHash: hashPassword(acc.password),
        role: acc.role,
      },
    });
    console.log(`✅ أنشئ الحساب: ${created.name} (${created.email}) → ${created.role}`);
  }
}

console.log('\nالحسابات الجاهزة للبوابة الموحدة (حسب قيم .env):');
for (const acc of ACCOUNTS) {
  const icon = acc.role === 'ADMIN' ? '🛡️  إدمن' : '📖 معلم';
  console.log(`  ${icon}: ${acc.email}`);
}

await db.$disconnect();
