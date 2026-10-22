import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';

// GET /api/auth/me — المستخدم الحالي من كوكي الجلسة
export async function GET() {
  const user = await getSessionUser();
  return NextResponse.json({ user });
}
