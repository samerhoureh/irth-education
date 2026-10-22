import { NextResponse } from 'next/server';
import AIGateway from '@/lib/ai';

// حد التسجيل الصوتي (base64) — يقابل نحو دقيقة ونصف صوت مضغوط
const MAX_AUDIO_LENGTH = 9_000_000;

// POST /api/ai/voice — تحويل صوت الطالب إلى نص (يرسل من صندوق المحادثة)
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const audio = String(body.audio || '');

    const match = audio.match(/^data:audio\/[^;]*;base64,(.+)$/);
    if (!match) {
      return NextResponse.json({ error: 'صيغة الصوت غير مدعومة' }, { status: 400 });
    }
    const base64 = match[1];
    if (!base64 || base64.length < 200) {
      return NextResponse.json({ error: 'التسجيل فارغ أو قصير جداً — حاول مجدداً' }, { status: 400 });
    }
    if (base64.length > MAX_AUDIO_LENGTH) {
      return NextResponse.json(
        { error: 'التسجيل طويل جداً — سجّل رسالة أقصر من دقيقة ونصف' },
        { status: 413 }
      );
    }

    const ai = await AIGateway.create();
    const result = await ai.audio.asr.create({ file_base64: base64 });
    const text = String(result.text || '').trim();

    if (!text) {
      return NextResponse.json(
        { error: 'لم نتمكن من سماع كلام واضح في التسجيل — اقترب من الميكروفون وحاول مجدداً' },
        { status: 422 }
      );
    }

    return NextResponse.json({ text: text.slice(0, 2000) });
  } catch (error) {
    console.error('voice transcribe error:', error);
    return NextResponse.json(
      { error: 'تعذر تحويل الصوت إلى نص حالياً، حاول بعد قليل' },
      { status: 500 }
    );
  }
}
