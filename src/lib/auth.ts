import crypto from 'crypto';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';

// ═══ ثوابت الجلسة ═══
const COOKIE_NAME = 'irth_session';
const SESSION_DAYS = 30;

// مفتاح تشفير الجلسات — يُقرأ من البيئة حصراً (لا قيمة احتياطية أبداً)
function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error('عيّن AUTH_SECRET في ملف .env (مفتاح تشفير الجلسات) — انسخ .env.example');
  }
  return secret;
}

// ═══ تشفير كلمة المرور: scrypt مع ملح عشوائي ═══
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const candidate = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected);
}

// ═══ توكن الجلسة: HMAC-SHA256 موقّع ═══
interface TokenPayload {
  uid: string;
  exp: number;
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url');
}

function sign(data: string): string {
  return crypto.createHmac('sha256', getAuthSecret()).update(data).digest('base64url');
}

export function createToken(userId: string): string {
  const payload: TokenPayload = {
    uid: userId,
    exp: Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000,
  };
  const body = b64url(JSON.stringify(payload));
  return `${body}.${sign(body)}`;
}

function verifyToken(token: string): TokenPayload | null {
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expectedSig = sign(body);
  const a = Buffer.from(sig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString()) as TokenPayload;
    if (!payload.uid || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export { verifyToken as verifySessionToken };

// ═══ جلسة المستخدم الحالي (من الكوكيز) ═══
export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;
  const user = await db.user.findUnique({
    where: { id: payload.uid },
    select: { id: true, name: true, email: true, role: true },
  });
  return user;
}

// ═══ تعيين/مسح كوكي الجلسة داخل Route Handlers ═══
export async function setSessionCookie(userId: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, createToken(userId), {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    path: '/',
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, '', { httpOnly: true, path: '/', maxAge: 0 });
}

// ═══ التحقق من صلاحية الأدمن ═══
// يُقبل: (1) مفتاح x-admin-key (متوافق مع النسخ السابقة)
//       (2) جلسة مستخدم مسجَّل دخوله من بوابة الدخول العامة بدور ADMIN
const SESSION_COOKIE = 'irth_session';

// كلمة مرور الإدارة — تُقرأ من البيئة حصراً (لا قيمة احتياطية أبداً)
export function getAdminPassword(): string | null {
  return process.env.ADMIN_PASSWORD || null;
}

export async function checkAdmin(req: Request): Promise<boolean> {
  // 1) مفتاح المشرف المباشر (متوافق مع النسخ السابقة)
  const expected = getAdminPassword();
  if (expected && req.headers.get('x-admin-key') === expected) return true;

  // 2) جلسة الأدمن من بوابة الدخول الموحدة (كوكي)
  const cookieHeader = req.headers.get('cookie') || '';
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`));
  if (!match) return false;
  const payload = verifyToken(decodeURIComponent(match[1]));
  if (!payload) return false;
  const user = await db.user.findUnique({
    where: { id: payload.uid },
    select: { role: true },
  });
  return user?.role === 'ADMIN';
}
