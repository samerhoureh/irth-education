import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import AIGateway from '@/lib/ai';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  attachments?: Attachment[];
}

interface Attachment {
  type: 'image' | 'audio';
  dataUrl: string;
}

const MAX_MESSAGES = 16;
const MAX_CONTENT_LENGTH = 4000;
const MAX_ATTACHMENTS = 3;
const MAX_DATAURL_LENGTH = 4_500_000; // ~3.3MB ملف لكل مرفق

// POST /api/ai/chat — المدرس الذكي المخصص لثقافة كل دولة
// يدعم رسائل الطالب النصية مع مرفقات: صور (فهم بصري) وصوت (تحويل الكلام إلى نص)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const countryCode = String(body.countryCode || '');
    const stageKey = String(body.stageKey || '');
    const stageName = String(body.stageName || '');
    const gradeName = String(body.gradeName || '');
    const subjectName = String(body.subjectName || '');
    const messages: ChatMessage[] = Array.isArray(body.messages) ? body.messages : [];

    if (!countryCode || !subjectName || messages.length === 0) {
      return NextResponse.json({ error: 'بيانات الطلب ناقصة' }, { status: 400 });
    }

    const country = await db.country.findUnique({ where: { code: countryCode.toUpperCase() } });
    if (!country) {
      return NextResponse.json({ error: 'الدولة غير موجودة' }, { status: 404 });
    }

    // تنظيف وتحديد عدد الرسائل (المرفقات تُعتمد من الرسالة الأخيرة فقط)
    const history: ChatMessage[] = messages
      .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .map((m, i, arr) => ({
        role: m.role,
        content: m.content.slice(0, MAX_CONTENT_LENGTH),
        attachments: i === arr.length - 1 ? sanitizeAttachments(m.attachments) : undefined,
      }))
      .slice(-MAX_MESSAGES);

    if (history.length === 0) {
      return NextResponse.json({ error: 'لا توجد رسائل صالحة' }, { status: 400 });
    }

    const last = history[history.length - 1];
    const lastAttachments = last.role === 'user' ? last.attachments || [] : [];
    const images = lastAttachments.filter((a) => a.type === 'image').map((a) => a.dataUrl);
    const audios = lastAttachments.filter((a) => a.type === 'audio').map((a) => a.dataUrl);

    const stageLabel = gradeName
      ? `صف ${gradeName}`
      : stageName || (stageKey === 'secondary' ? 'المرحلة الثانوية' : 'المرحلة المتوسطة');

    const systemPrompt = `أنت «أرث»، المعلم الخصوصي الذكي في أرث التعليم العربي (إذا سألك الطالب عن اسمك أو هويتك فاذكر أن اسمك «أرث» — من أرث التعليم العربي، رفيقُ كل طالب عربي في مسيرته التعليمية).

هويتك الأساسية: أنت معلمُ خصوصيٌّ وقورٌ من نفس بلد الطالب — من دولة ${country.nameAr} ${country.flag} — تعرف مدارسه ومناهجه المعتمدة ومصطلحات أهله التي يتداولونها في بيوتهم وأسواقهم. تتقمص دور المعلم الخصوصي المكرّم الذي يجلس مع الطالب في جلسة درس يليق بمكانة العلم وطلابه، فليشعر الطالب طوال المحادثة أنه يتعلم مع معلمٍ خاصٍّ من بلده لا مع برنامجٍ عام.

الطالب يدرس مادة «${subjectName}» في ${stageLabel} وفق المنهج الرسمي المعتمد: ${country.curriculumNote}.

ثقافتك ولهجتك — التزم بها حرفياً وباعتدال وقور:
${country.culturePersona}

قواعد الجلسة التعليمية:
1) القالب الثابت لكل رد: (ترحيبٌ أو تعليقٌ قصيرٌ بلهجته → الشرح الكامل بالفصحى المبسطة الراقية → سؤالُ تحقّقٍ قصير → كلمةُ تشجيعٍ بلهجته). فإذا سألك عن معلومةٍ أو مفهومٍ فاشرح الإجابة كاملةً فوراً ولا تكتفِ بسؤالٍ راجعٍ لها؛ الشرح حقُّ الطالب أولاً.
2) اللسان الراقي: لغة إجاباتك فصحى مبسطة واضحة راقية تليق بمكانة المعلم في مجتمع بلد الطالب — بعيدة عن ركيكة العامية والعبارات الطفولية؛ فأنت معلمٌ يحاور تلميذه بتوقيرٍ وودٍّ، واللهجة موضعُها الافتتاح والختام والتحفيز فقط (عبارةٌ أو عبارتان قصيرتان دون إفراط).
3) لمسة اللهجة المحلية: التحية والتحفيز والتعبيرات الدافئة بلهجة ${country.nameAr} كما في ثقافتك أعلاه باعتدالٍ وقور، أما المفاهيم والتعريفات والأمثلة العلمية فبالفصحى المبسطة الراقية — فيجتمع دفءُ الانتماء ورصانةُ العلم.
4) أمانة المصطلحات: استخدم المصطلحات العلمية والدراسية كما تعتمدها كتب منهج ${country.nameAr} بأسمائها الحرفية، ومصطلحات المجتمع الدارجة في بلد الطالب كما في ثقافتك؛ ولا تستبدل أبداً مصطلح بلد الطالب بمصطلح دولة أخرى (كأسماء المراحل أو أدوات الدراسة التي يعرفها أهل بلده).
5) الأمثلة المحلية: اربط الشرح ببيئة ${country.nameAr} وأسواقها وطبيعتها وحياة أهلها اليومية كلما سمح الموضوع، بأمثلة وقورة يفهمها الطالب من وسطه.
6) أسلوب المعلم الخصوصي: اشرح خطوة بخطوة بتدرجٍ وسكينة، ثم اطرح سؤالاً قصيراً للتأكد من فهمه، وقدّر تقدمه بتعبير تقديرٍ راقٍ من تعابير بلده.
7) لا تعطِ حلول الواجبات جاهزة مباشرة؛ ساعد الطالب على الوصول للحل بنفسه بتوجيهات متدرجة تحترم عقله.
8) إذا كان السؤال خارج منهج المرحلة، بسّط الإجابة بما يناسب عمر الطالب.
9) اجعل الردود مركزة وغير طويلة، واستخدم القوائم والتنسيق عند الحاجة.
10) إذا لم تعرف إجابة سؤال ما بثقة، أخبر الطالب بصدق واقترح عليه مراجعة كتاب المادة المرفوع في المنصة.
11) إذا أرسل الطالب صورة فحلّل محتواها التعليمي بدقة واربطها بمادة «${subjectName}»، وإذا أرسل رسالة صوتية فتفاعل مع نصّها المكتوب بلغته.
12) إذا أرسل الطالب صورة لصفحة من كتابه المدرسي فتعرّف منها الدرس أو الوحدة واشرحه خطوة بخطوة وفق منهج ${country.nameAr}، وإذا كانت الصورة غير واضحة أو غير كاملة فاطلب منه بلطف وبوقار إعادة تصويرها بوضوح قبل المتابعة.`;

    const ai = await AIGateway.create();

    // تحويل المرفقات الصوتية إلى نص عبر خدمة التعرف على الكلام
    const voiceNotes: string[] = [];
    for (const dataUrl of audios.slice(0, 1)) {
      try {
        const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
        const asr = await ai.audio.asr.create({ file_base64: base64 });
        const text = (asr.text || '').trim();
        if (text) voiceNotes.push(text);
      } catch (e) {
        console.error('asr error:', e);
      }
    }

    // نص الرسالة الأخيرة + نصوص التسجيلات الصوتية
    let userText = last.content.trim();
    for (const note of voiceNotes) {
      userText = `${userText}\n[رسالة صوتية من الطالب]: «${note}»`.trim();
    }
    if (!userText && images.length > 0) {
      userText = 'أرسل الطالب صورة بدون نص — حلّل محتواها واشرحه واربطه بمادة الدراسة، ثم اطرح سؤالاً للتحقق من الفهم.';
    }

    // استبدال نص الرسالة الأخيرة بالنص المركب
    history[history.length - 1] = { role: last.role, content: userText || last.content };

    let reply = '';

    if (images.length > 0) {
      // رسالة تحتوي صوراً — استخدام النموذج البصري
      const visionHistory = history.slice(0, -1).map((m) => ({ role: m.role, content: m.content }));
      const completion = await ai.chat.completions.createVision({
        model: 'glm-4.6v',
        messages: [
          { role: 'assistant', content: systemPrompt },
          ...visionHistory,
          {
            role: 'user',
            content: [
              { type: 'text', text: userText || 'أرسل الطالب صورة — حلّلها واشرحها.' },
              ...images.slice(0, 2).map((url) => ({ type: 'image_url' as const, image_url: { url } })),
            ],
          },
        ],
        thinking: { type: 'disabled' },
      });
      reply = completion.choices[0]?.message?.content || '';
    } else {
      const completion = await ai.chat.completions.create({
        messages: [{ role: 'assistant', content: systemPrompt }, ...history.map((m) => ({ role: m.role, content: m.content }))],
        thinking: { type: 'disabled' },
      });
      reply = completion.choices[0]?.message?.content || '';
    }

    if (!reply.trim()) {
      return NextResponse.json({ error: 'لم يتمكن المعلم الذكي من الرد، حاول مرة أخرى' }, { status: 502 });
    }

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('ai chat error:', error);
    return NextResponse.json(
      { error: 'تعذر الاتصال بالمعلم الذكي حالياً، حاول بعد قليل' },
      { status: 500 }
    );
  }
}

// تحقق من صحة المرفقات: النوع والحجم والصيغة
function sanitizeAttachments(input: unknown): Attachment[] | undefined {
  if (!Array.isArray(input)) return undefined;
  const out: Attachment[] = [];
  for (const raw of input.slice(0, MAX_ATTACHMENTS)) {
    const a = raw as Attachment;
    if (!a || (a.type !== 'image' && a.type !== 'audio')) continue;
    if (typeof a.dataUrl !== 'string' || !a.dataUrl.startsWith('data:')) continue;
    if (a.dataUrl.length > MAX_DATAURL_LENGTH) continue;
    if (a.type === 'image' && !a.dataUrl.startsWith('data:image/')) continue;
    if (a.type === 'audio' && !a.dataUrl.startsWith('data:audio/')) continue;
    out.push({ type: a.type, dataUrl: a.dataUrl });
  }
  return out.length > 0 ? out : undefined;
}
