import { NextResponse } from 'next/server';
import AIGateway from '@/lib/ai';

const MAX_DATAURL_LENGTH = 4_500_000;

interface BookVerdict {
  isBookPage: boolean;
  related: boolean;
  reason: string;
}

// POST /api/ai/verify-book — تدقيق صورة صفحة الكتاب قبل قبولها لبدء الدرس
// يتحقق أن الصورة فعلًا صفحة من كتاب مدرسي وذات صلة بالمادة والتخصص المطلوب،
// ويُبطل أي محاولة لإرسال صور عشوائية لا علاقة لها بالمادة التعليمية.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const subjectName = String(body.subjectName || '').trim();
    const stageName = String(body.stageName || '').trim();
    const gradeName = String(body.gradeName || '').trim();
    const countryName = String(body.countryName || '').trim();
    const image = String(body.image || '');

    if (!subjectName || !image.startsWith('data:image/')) {
      return NextResponse.json({ ok: false, error: 'بيانات التدقيق ناقصة' }, { status: 400 });
    }
    if (image.length > MAX_DATAURL_LENGTH) {
      return NextResponse.json({ ok: false, error: 'الصورة كبيرة جداً' }, { status: 413 });
    }

    const stageLabel = gradeName ? `صف ${gradeName}` : stageName || 'المرحلة الدراسية المعتمدة';

    const ai = await AIGateway.create();

    const completion = await ai.chat.completions.createVision({
      model: 'glm-4.6v',
      messages: [
        {
          role: 'assistant',
          content: `أنت نظام تدقيق آلي في منصة «أرث التعليم العربي». مهمتك واحدة وبسيطة: التأكد أن الصورة المرفوعة عبارة عن صفحة من كتاب (ورقة دراسية مطبوعة) ينتمي مجالها إلى مادة «${subjectName}» التي يدرسها الطالب في ${stageLabel}${
            countryName ? ` (دولة ${countryName})` : ''
          }.

قواعد صارمة يجب ألا تخالفها أبداً:
- لا تتدخل في صحة المعادلات أو المعلومات: قد تظهر المعادلات والأرقام والكلمات غير واضحة أو مشوشة بسبب جودة التصوير أو ضغط الصورة، وهذا لا يُعد سبباً للرفض إطلاقاً.
- لا تشترط لغة معينة: كتاب بالعربية أو بلغة أخرى أو مترجم مقبول، والمهم مجال المادة فقط.
- لا تشترط مطابقة المنهج أو الدولة أو الصف: لا ترفض على أساس «ليس من منهج الدولة» أو «الفصل غير مطابق» — هذا خارج نطاقك تماماً.
- الغلاف والفهرس وصفحات التمارين كلها مقبولة.
- الصورة المائلة أو الجزئية أو منخفضة الدقة مقبولة ما دام يُمكن معرفة أنها كتاب.

اقبل الصورة (isBookPage=true وrelated=true) إذا كانت: صفحة كتاب أو كتيّب دراسي يحتوي نصاً مطبوعاً أو عناوين أو تمارين أو أشكالاً تعليمية، ومجالها العام نفس مجال مادة «${subjectName}» (أرقام ومعادلات وأشكال هندسية → رياضيات، نصوص وقواعد → لغة عربية، خرائط → جغرافيا/تاريخ، تجارب → فيزياء/كيمياء/أحياء، كلمات إنجليزية → لغة إنجليزية، آيات → تربية إسلامية، جداول وأكواد → حاسوب...).

ارفض الصورة (related=false) فقط إذا كانت بوضوح ليس كتاباً أصلاً (طعام، سيلفي، منظر طبيعي، لقطة شاشة لهاتف أو لعبة، منتجات، لوحة فنية، غرفة، سيارة...) أو كتاب لمادة مختلفة تماماً بشكل قاطع (مثال: صفحة قواعد لغة إنجليزية والمادة المطلوبة رياضيات).

إذا لم تستطع الجزم بمخالفة واضحة للشروط أعلاه فاختر القبول.

أجب حصراً بصيغة JSON صالحة دون أي نص إضافي:
{"isBookPage": true أو false, "related": true أو false, "reason": "سبب قصير بالعربية"}`,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `افحص هذه الصورة وحدد: هل هي صفحة من كتاب مادة «${subjectName}» لطالب في ${stageLabel}؟ أجب بصيغة JSON المطلوبة فقط.`,
            },
            { type: 'image_url', image_url: { url: image } },
          ],
        },
      ],
      thinking: { type: 'disabled' },
    });

    const raw = completion.choices[0]?.message?.content || '';
    const verdict = parseVerdict(raw);

    if (!verdict) {
      // تعذر تحليل رد النموذج — نتعامل بحذر ونطلب إعادة الإرسال
      return NextResponse.json({
        ok: false,
        error: 'تعذر التحقق من الصورة تلقائياً، حاول إرسال صورة أوضح لصفحة الكتاب',
      });
    }

    const accepted = verdict.isBookPage && verdict.related;
    return NextResponse.json({
      ok: true,
      accepted,
      verdict: {
        isBookPage: verdict.isBookPage,
        related: verdict.related,
        reason: verdict.reason,
      },
    });
  } catch (error) {
    console.error('verify-book error:', error);
    return NextResponse.json(
      { ok: false, error: 'تعذر الاتصال بنظام التدقيق حالياً، حاول بعد قليل' },
      { status: 500 }
    );
  }
}

// استخراج حكم JSON من رد النموذج (مع تحمّل أسوار Markdown أو نص زائد)
function parseVerdict(raw: string): BookVerdict | null {
  let text = raw.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) text = fence[1].trim();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    const obj = JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;
    const isBookPage = obj.isBookPage === true;
    const related = obj.related === true;
    const reason = typeof obj.reason === 'string' ? obj.reason : '';
    return { isBookPage, related, reason };
  } catch {
    return null;
  }
}
