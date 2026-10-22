/**
 * curriculum-sync.mjs — مزامنة المواد الدراسية مع المناهج الرسمية المعتمدة
 *
 * المواد يجب أن تكون بالضبط كما في الجداول الرسمية لكل دولة.
 * الدفعة 1: السعودية + الإمارات + الكويت (المتوسطة: السابع/الثامن/التاسع).
 * الدفعة 2: قطر + البحرين + عمان (المتوسطة: السابع/الثامن/التاسع + الثانوية: العاشر/الحادي عشر/الثاني عشر بمساراتها التخصصية).
 * الدفعة 3: اليمن + العراق + سوريا (المتوسطة/الأساسية + الثانوية/الإعدادية بمساراتها).
 * الدفعة 4: لبنان + الأردن + فلسطين + مصر + السودان + ليبيا + تونس + الجزائر + المغرب.
 * الدفعة 5: موريتانيا + الصومال + جيبوتي + جزر القمر (شعب ثانوية موريتانيا الخمس + فلسفة/اقتصاد حسب الصف).
 * بنية قابلة للتوسيع — تُضاف الدول الجديدة بنفس النمط.
 *
 * التشغيل: bun scripts/curriculum-sync.mjs
 */
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

// اسم الصف في الجدول الرسمي → اسمه المخزّن في المنصة
const GRADE_MAP = {
  'الصف السابع': 'الأول المتوسط',
  'الصف الثامن': 'الثاني المتوسط',
  'الصف التاسع': 'الثالث المتوسط',
  'الصف العاشر': 'صف العاشر',
};

// لوحة ألوان متناسقة مع هوية المنصة (بدون أزرق/نيلي)
const C = {
  teal: '#0d9488',
  amber: '#d97706',
  emerald: '#059669',
  red: '#dc2626',
  violet: '#7c3aed',
  green: '#15803d',
  brown: '#b45309',
  orange: '#ea580c',
  rose: '#e11d48',
  fuchsia: '#c026d3',
  lime: '#65a30d',
  purple: '#6d28d9',
  stone: '#78716c',
  gold: '#a16207',
};

// ───────────────────────── المناهج الرسمية ─────────────────────────
// s = { name, icon, color, gender? } — الاسم بالضبط كما في الجدول الرسمي
const CURRICULUM = {
  // ═══════════ السعودية ═══════════
  SA: {
    'الصف السابع': [
      { name: 'القرآن الكريم والدراسات الإسلامية (مادة مدمجة)', icon: '📖', color: C.green },
      { name: 'اللغة العربية', icon: '✒️', color: C.teal },
      { name: 'الدراسات الاجتماعية', icon: '🗺️', color: C.violet },
      { name: 'الرياضيات', icon: '🔢', color: C.amber },
      { name: 'العلوم', icon: '🔬', color: C.emerald },
      { name: 'اللغة الإنجليزية', icon: '🌐', color: C.red },
      { name: 'المهارات الرقمية', icon: '💻', color: C.brown },
      { name: 'التربية الفنية', icon: '🎨', color: C.fuchsia },
      { name: 'التربية البدنية والدفاع عن النفس', icon: '🥋', color: C.orange },
      { name: 'المهارات الحياتية والأسرية', icon: '🏡', color: C.lime },
    ],
    'الصف الثامن': [
      { name: 'القرآن الكريم والدراسات الإسلامية (مادة مدمجة)', icon: '📖', color: C.green },
      { name: 'اللغة العربية', icon: '✒️', color: C.teal },
      { name: 'الدراسات الاجتماعية', icon: '🗺️', color: C.violet },
      { name: 'الرياضيات', icon: '🔢', color: C.amber },
      { name: 'العلوم', icon: '🔬', color: C.emerald },
      { name: 'اللغة الإنجليزية', icon: '🌐', color: C.red },
      { name: 'المهارات الرقمية', icon: '💻', color: C.brown },
      { name: 'التربية الفنية', icon: '🎨', color: C.fuchsia },
      { name: 'التربية البدنية والدفاع عن النفس', icon: '🥋', color: C.orange },
      { name: 'المهارات الحياتية والأسرية', icon: '🏡', color: C.lime },
    ],
    'الصف التاسع': [
      { name: 'القرآن الكريم والدراسات الإسلامية (مادة مدمجة)', icon: '📖', color: C.green },
      { name: 'اللغة العربية', icon: '✒️', color: C.teal },
      { name: 'الدراسات الاجتماعية', icon: '🗺️', color: C.violet },
      { name: 'الرياضيات', icon: '🔢', color: C.amber },
      { name: 'العلوم', icon: '🔬', color: C.emerald },
      { name: 'اللغة الإنجليزية', icon: '🌐', color: C.red },
      { name: 'المهارات الرقمية', icon: '💻', color: C.brown },
      { name: 'التربية الفنية', icon: '🎨', color: C.fuchsia },
      { name: 'التربية البدنية والدفاع عن النفس', icon: '🥋', color: C.orange },
      { name: 'المهارات الحياتية والأسرية', icon: '🏡', color: C.lime },
      { name: 'التفكير الناقد', icon: '🧠', color: C.purple },
    ],
  },

  // ═══════════ الإمارات ═══════════
  AE: {
    'الصف السابع': [
      { name: 'التربية الإسلامية', icon: '🕌', color: C.green },
      { name: 'اللغة العربية', icon: '✒️', color: C.teal },
      { name: 'الدراسات الاجتماعية / التربية الأخلاقية (مادة مدمجة)', icon: '🗺️', color: C.violet },
      { name: 'اللغة الإنجليزية', icon: '🌐', color: C.red },
      { name: 'الرياضيات', icon: '🔢', color: C.amber },
      { name: 'العلوم (أو العلوم المتكاملة)', icon: '🔬', color: C.emerald },
      { name: 'التصميم والتكنولوجيا (أو الحوسبة والتصميم الإبداعي والابتكار)', icon: '🛠️', color: C.brown },
      { name: 'الفنون (البصرية والموسيقية والمسرح)', icon: '🎭', color: C.fuchsia },
      { name: 'التربية البدنية والصحية', icon: '⚽', color: C.orange },
    ],
    'الصف الثامن': [
      { name: 'التربية الإسلامية', icon: '🕌', color: C.green },
      { name: 'اللغة العربية', icon: '✒️', color: C.teal },
      { name: 'الدراسات الاجتماعية / التربية الأخلاقية (مادة مدمجة)', icon: '🗺️', color: C.violet },
      { name: 'اللغة الإنجليزية', icon: '🌐', color: C.red },
      { name: 'الرياضيات', icon: '🔢', color: C.amber },
      { name: 'العلوم (أو العلوم المتكاملة)', icon: '🔬', color: C.emerald },
      { name: 'التصميم والتكنولوجيا (أو الحوسبة والتصميم الإبداعي والابتكار)', icon: '🛠️', color: C.brown },
      { name: 'الفنون (البصرية والموسيقية والمسرح)', icon: '🎭', color: C.fuchsia },
      { name: 'التربية البدنية والصحية', icon: '⚽', color: C.orange },
    ],
    'الصف التاسع': [
      { name: 'التربية الإسلامية', icon: '🕌', color: C.green },
      { name: 'اللغة العربية', icon: '✒️', color: C.teal },
      { name: 'الدراسات الاجتماعية / التربية الأخلاقية (مادة مدمجة)', icon: '🗺️', color: C.violet },
      { name: 'اللغة الإنجليزية', icon: '🌐', color: C.red },
      { name: 'الرياضيات', icon: '🔢', color: C.amber },
      { name: 'العلوم (أو العلوم المتكاملة)', icon: '🔬', color: C.emerald },
      { name: 'التصميم والتكنولوجيا (أو الحوسبة والتصميم الإبداعي والابتكار)', icon: '🛠️', color: C.brown },
      { name: 'الفنون (البصرية والموسيقية والمسرح)', icon: '🎭', color: C.fuchsia },
      { name: 'التربية البدنية والصحية', icon: '⚽', color: C.orange },
    ],
  },

  // ═══════════ الكويت ═══════════
  KW: {
    'الصف السابع': [
      { name: 'القرآن الكريم', icon: '📖', color: C.green },
      { name: 'التربية الإسلامية', icon: '🕌', color: C.emerald },
      { name: 'اللغة العربية', icon: '✒️', color: C.teal },
      { name: 'اللغة الإنجليزية', icon: '🌐', color: C.red },
      { name: 'الرياضيات', icon: '🔢', color: C.amber },
      { name: 'العلوم', icon: '🔬', color: C.lime },
      { name: 'الاجتماعيات', icon: '🗺️', color: C.violet },
      { name: 'الحاسب الآلي', icon: '💻', color: C.brown },
      { name: 'التربية الفنية', icon: '🎨', color: C.fuchsia },
      { name: 'التربية الموسيقية', icon: '🎵', color: C.rose },
      { name: 'التربية البدنية', icon: '⚽', color: C.orange },
      { name: 'مهارات الحياة', icon: '🧩', color: C.purple },
      // مواد خاصة بالبنات
      { name: 'علوم الأسرة والمستهلك', icon: '🧵', color: C.rose, gender: 'GIRLS' },
      { name: 'الدراسات العملية (ديكور/كهرباء)', icon: '🪡', color: C.gold, gender: 'GIRLS' },
      // مواد خاصة بالبنين
      { name: 'الدراسات العملية', icon: '🔨', color: C.stone, gender: 'BOYS' },
    ],
    'الصف الثامن': [
      { name: 'القرآن الكريم', icon: '📖', color: C.green },
      { name: 'التربية الإسلامية', icon: '🕌', color: C.emerald },
      { name: 'اللغة العربية', icon: '✒️', color: C.teal },
      { name: 'اللغة الإنجليزية', icon: '🌐', color: C.red },
      { name: 'الرياضيات', icon: '🔢', color: C.amber },
      { name: 'العلوم', icon: '🔬', color: C.lime },
      { name: 'الاجتماعيات', icon: '🗺️', color: C.violet },
      { name: 'الحاسب الآلي', icon: '💻', color: C.brown },
      { name: 'التربية الفنية', icon: '🎨', color: C.fuchsia },
      { name: 'التربية الموسيقية', icon: '🎵', color: C.rose },
      { name: 'التربية البدنية', icon: '⚽', color: C.orange },
      { name: 'مهارات الحياة', icon: '🧩', color: C.purple },
      // مواد خاصة بالبنات
      { name: 'علوم الأسرة والمستهلك', icon: '🧵', color: C.rose, gender: 'GIRLS' },
      { name: 'الدراسات العملية (ديكور/كهرباء)', icon: '🪡', color: C.gold, gender: 'GIRLS' },
      // مواد خاصة بالبنين
      { name: 'الدراسات العملية', icon: '🔨', color: C.stone, gender: 'BOYS' },
    ],
    'الصف التاسع': [
      { name: 'القرآن الكريم', icon: '📖', color: C.green },
      { name: 'التربية الإسلامية', icon: '🕌', color: C.emerald },
      { name: 'اللغة العربية', icon: '✒️', color: C.teal },
      { name: 'اللغة الإنجليزية', icon: '🌐', color: C.red },
      { name: 'الرياضيات', icon: '🔢', color: C.amber },
      { name: 'العلوم', icon: '🔬', color: C.lime },
      { name: 'الاجتماعيات', icon: '🗺️', color: C.violet },
      { name: 'الحاسب الآلي', icon: '💻', color: C.brown },
      { name: 'التربية الفنية', icon: '🎨', color: C.fuchsia },
      { name: 'التربية الموسيقية', icon: '🎵', color: C.rose },
      { name: 'التربية البدنية', icon: '⚽', color: C.orange },
      { name: 'مهارات الحياة', icon: '🧩', color: C.purple },
      // مواد خاصة بالبنات
      { name: 'علوم الأسرة والمستهلك', icon: '🧵', color: C.rose, gender: 'GIRLS' },
      { name: 'الدراسات العملية (ديكور/كهرباء)', icon: '🪡', color: C.gold, gender: 'GIRLS' },
      // مواد خاصة بالبنين
      { name: 'الدراسات العملية', icon: '🔨', color: C.stone, gender: 'BOYS' },
    ],
  },
};

// ───────────────────────── الدفعة 2: قطر + البحرين + عمان ─────────────────────────

// مواد مشتركة متكررة
const ISLAM = { name: 'التربية الإسلامية', icon: '🕌', color: C.green };
const ARABIC = { name: 'اللغة العربية', icon: '✒️', color: C.teal };
const ENGLISH = { name: 'اللغة الإنجليزية', icon: '🌐', color: C.red };
const MATH = { name: 'الرياضيات', icon: '🔢', color: C.amber };

// ═══════════ قطر ═══════════
const QA_MIDDLE = [
  ISLAM, ARABIC, ENGLISH, MATH,
  { name: 'العلوم', icon: '🔬', color: C.emerald },
  { name: 'الدراسات الاجتماعية', icon: '🗺️', color: C.violet },
  { name: 'الحوسبة وتكنولوجيا المعلومات', icon: '💻', color: C.brown },
  { name: 'التربية البدنية', icon: '⚽', color: C.orange },
  { name: 'الفنون البصرية', icon: '🎨', color: C.fuchsia },
  { name: 'المهارات الحياتية والمهنية', icon: '🧩', color: C.purple },
];

// الصف العاشر (السنة المشتركة)
const QA_G10 = [
  ISLAM, ARABIC, ENGLISH, MATH,
  { name: 'العلوم المتكاملة (فيزياء + كيمياء + أحياء)', icon: '🔬', color: C.emerald },
  { name: 'الدراسات الاجتماعية', icon: '🗺️', color: C.violet },
  { name: 'الحوسبة وتكنولوجيا المعلومات', icon: '💻', color: C.brown },
  { name: 'التربية البدنية', icon: '⚽', color: C.orange },
  { name: 'المهارات الحياتية والبحث العلمي', icon: '🔍', color: C.purple },
  { name: 'مشروع التخرج', icon: '🎓', color: C.gold },
];

// المواد الأساسية المشتركة للصفين الحادي عشر والثاني عشر
const QA_CORE = [ISLAM, ARABIC, ENGLISH, MATH];
// المسار العلمي
const QA_SCI = [
  ...QA_CORE,
  { name: 'الفيزياء', icon: '⚛️', color: C.emerald },
  { name: 'الكيمياء', icon: '🧪', color: C.lime },
  { name: 'الأحياء', icon: '🧬', color: C.brown },
  { name: 'الرياضيات المتقدمة', icon: '📐', color: C.fuchsia },
];
// مسار الآداب والإنسانيات
const QA_HUMAN = [
  ...QA_CORE,
  { name: 'التاريخ', icon: '🏛️', color: C.violet },
  { name: 'الجغرافيا', icon: '🌍', color: C.emerald },
  { name: 'الفلسفة', icon: '🤔', color: C.purple },
  { name: 'علم الاجتماع', icon: '👥', color: C.rose },
];
// المسار التكنولوجي
const QA_TECH = [
  ...QA_CORE,
  { name: 'علوم الحاسب', icon: '💻', color: C.brown },
  { name: 'البرمجة', icon: '⌨️', color: C.stone },
  { name: 'التصميم الرقمي', icon: '🖌️', color: C.fuchsia },
  { name: 'الرياضيات التطبيقية', icon: '🧮', color: C.gold },
];

// ═══════════ البحرين ═══════════
const BH_MIDDLE = [
  ISLAM, ARABIC, ENGLISH,
  { name: 'العلوم والتكنولوجيا', icon: '🔬', color: C.emerald },
  MATH,
  { name: 'المواد الاجتماعية', icon: '🗺️', color: C.violet },
  { name: 'التربية الرياضية', icon: '⚽', color: C.orange },
  { name: 'التربية الأسرية', icon: '🏡', color: C.lime },
  { name: 'التربية الفنية', icon: '🎨', color: C.fuchsia },
  { name: 'الأناشيد والموسيقى', icon: '🎵', color: C.rose },
];

// المواد الأساسية المشتركة للمرحلة الثانوية (العاشر/الحادي عشر/الثاني عشر)
const BH_CORE = [
  ARABIC, ENGLISH, MATH, ISLAM,
  { name: 'المواد الاجتماعية', icon: '🗺️', color: C.violet },
  { name: 'التربية الأسرية', icon: '🏡', color: C.lime },
  { name: 'التربية الرياضية', icon: '⚽', color: C.orange },
];
// المسار العلمي
const BH_SCI = [
  ...BH_CORE,
  { name: 'الفيزياء', icon: '⚛️', color: C.emerald },
  { name: 'الكيمياء', icon: '🧪', color: C.lime },
  { name: 'الأحياء', icon: '🧬', color: C.brown },
  { name: 'الرياضيات المتقدمة', icon: '📐', color: C.fuchsia },
];
// المسار الأدبي
const BH_LIT = [
  ...BH_CORE,
  { name: 'التاريخ', icon: '🏛️', color: C.violet },
  { name: 'الجغرافيا', icon: '🌍', color: C.emerald },
  { name: 'علم النفس', icon: '🧠', color: C.purple },
  { name: 'علم الاجتماع', icon: '👥', color: C.rose },
  { name: 'الفلسفة', icon: '🤔', color: C.gold },
];
// المسار التجاري
const BH_BUS = [
  ...BH_CORE,
  { name: 'المحاسبة', icon: '🧾', color: C.stone },
  { name: 'إدارة الأعمال', icon: '💼', color: C.brown },
  { name: 'الرياضيات المالية', icon: '🧮', color: C.gold },
  { name: 'الاقتصاد', icon: '📈', color: C.emerald },
];

// ═══════════ عمان ═══════════
const OM_MIDDLE = [
  ISLAM, ARABIC, ENGLISH,
  { name: 'الدراسات الاجتماعية', icon: '🗺️', color: C.violet },
  MATH,
  { name: 'العلوم العامة', icon: '🔬', color: C.emerald },
  { name: 'تقنية المعلومات', icon: '💻', color: C.brown },
  { name: 'المهارات الحياتية', icon: '🧩', color: C.purple },
  { name: 'التربية البدنية المدرسية', icon: '⚽', color: C.orange },
  { name: 'الفنون التشكيلية', icon: '🎨', color: C.fuchsia },
  { name: 'المهارات الموسيقية', icon: '🎵', color: C.rose },
  { name: 'خدمة التوجيه المهني', icon: '🧭', color: C.lime },
];

// الصف العاشر
const OM_G10 = [
  ISLAM, ARABIC, ENGLISH, MATH,
  { name: 'الفيزياء', icon: '⚛️', color: C.emerald },
  { name: 'الكيمياء', icon: '🧪', color: C.lime },
  { name: 'الأحياء', icon: '🧬', color: C.brown },
  { name: 'التاريخ', icon: '🏛️', color: C.violet },
  { name: 'الجغرافيا', icon: '🌍', color: C.gold },
  { name: 'المجتمع العماني', icon: '🤝', color: C.rose },
];

// الحادي عشر والثاني عشر: المجموعة الأولى (أساسية إلزامية) + المجموعة الثانية (اختيارية — يختار الطالب 3 مواد)
const OM_11_12 = [
  // المجموعة الأولى
  ISLAM, ARABIC, ENGLISH,
  { name: 'الدراسات الاجتماعية', icon: '🗺️', color: C.violet },
  { name: 'الرياضيات (أساسية أو متقدمة)', icon: '🔢', color: C.amber },
  { name: 'خدمة التوجيه المهني', icon: '🧭', color: C.lime },
  // المجموعة الثانية (اختيارية)
  { name: 'مهارات اللغة الإنجليزية', icon: '🗣️', color: C.red },
  { name: 'اللغة الفرنسية', icon: '🇫🇷', color: C.rose },
  { name: 'اللغة الألمانية', icon: '🇩🇪', color: C.stone },
  { name: 'اللغة الصينية (جديدة)', icon: '🇨🇳', color: C.gold },
  { name: 'الكيمياء', icon: '🧪', color: C.lime },
  { name: 'الفيزياء', icon: '⚛️', color: C.emerald },
  { name: 'الأحياء', icon: '🧬', color: C.brown },
  { name: 'العلوم البيئية', icon: '🌱', color: C.emerald },
  { name: 'تقنية المعلومات', icon: '💻', color: C.brown },
  { name: 'الجغرافيا والتقنيات الحديثة', icon: '🛰️', color: C.violet },
  { name: 'التاريخ (العالم من حولي)', icon: '🏛️', color: C.purple },
  { name: 'الرياضة المدرسية', icon: '🏅', color: C.orange },
  { name: 'الفنون التشكيلية', icon: '🎨', color: C.fuchsia },
  { name: 'المهارات الموسيقية', icon: '🎵', color: C.rose },
];

// متوسطة الدفعة 2
const MIDDLE2 = {
  QA: { 'الصف السابع': QA_MIDDLE, 'الصف الثامن': QA_MIDDLE, 'الصف التاسع': QA_MIDDLE },
  BH: { 'الصف السابع': BH_MIDDLE, 'الصف الثامن': BH_MIDDLE, 'الصف التاسع': BH_MIDDLE },
  OM: { 'الصف السابع': OM_MIDDLE, 'الصف الثامن': OM_MIDDLE, 'الصف التاسع': OM_MIDDLE },
};

// ═══════════ اليمن ═══════════
const YE_MIDDLE = [
  { name: 'القرآن الكريم وعلومه', icon: '📖', color: C.green },
  { name: 'التربية الإسلامية', icon: '🕌', color: C.emerald },
  { name: 'اللغة العربية (لغتي العربية)', icon: '✒️', color: C.teal },
  ENGLISH, MATH,
  { name: 'العلوم', icon: '🔬', color: C.lime },
  { name: 'التاريخ', icon: '🏛️', color: C.violet },
  { name: 'الجغرافيا', icon: '🌍', color: C.gold },
  { name: 'التربية الوطنية', icon: '🚩', color: C.rose },
];

// الصف العاشر (الأول ثانوي) — مواد مشتركة
const YE_G10 = [
  { name: 'العقيدة الإسلامية', icon: '🕌', color: C.green },
  { name: 'الفقه والحديث', icon: '📕', color: C.emerald },
  { name: 'السيرة النبوية', icon: '🕋', color: C.gold },
  { name: 'القرآن والعلوم الإسلامية', icon: '📖', color: C.green },
  { name: 'النحو والصرف', icon: '✒️', color: C.teal },
  { name: 'الأدب والنصوص', icon: '📚', color: C.violet },
  { name: 'القراءة', icon: '📑', color: C.stone },
  MATH,
  { name: 'الأحياء', icon: '🧬', color: C.brown },
  { name: 'الكيمياء', icon: '🧪', color: C.lime },
  { name: 'الفيزياء', icon: '⚛️', color: C.emerald },
  { name: 'الحاسوب', icon: '💻', color: C.brown },
  { name: 'الجغرافيا', icon: '🌍', color: C.gold },
  { name: 'التاريخ', icon: '🏛️', color: C.violet },
  { name: 'المجتمع اليمني', icon: '🤝', color: C.rose },
];

const YE_QURAN = { name: 'القرآن الكريم', icon: '📖', color: C.green };
const YE_ISLAM = { name: 'التربية الإسلامية', icon: '🕌', color: C.emerald };
const YE_CORE = [YE_QURAN, YE_ISLAM, ARABIC, ENGLISH, MATH];
// المسار العلمي (11 مادة)
const YE_SCI = [
  ...YE_CORE,
  { name: 'الأحياء', icon: '🧬', color: C.brown },
  { name: 'الكيمياء', icon: '🧪', color: C.lime },
  { name: 'الفيزياء', icon: '⚛️', color: C.emerald },
  { name: 'التاريخ', icon: '🏛️', color: C.violet },
  { name: 'الجغرافيا', icon: '🌍', color: C.gold },
  { name: 'الحاسوب', icon: '💻', color: C.stone },
];
// المسار الأدبي (10 مواد)
const YE_LIT = [
  ...YE_CORE,
  { name: 'التاريخ', icon: '🏛️', color: C.violet },
  { name: 'الجغرافيا', icon: '🌍', color: C.gold },
  { name: 'علم الاجتماع', icon: '👥', color: C.rose },
  { name: 'علم الاقتصاد', icon: '📈', color: C.emerald },
  { name: 'الحاسوب', icon: '💻', color: C.stone },
];

// ═══════════ العراق ═══════════
const IQ_MIDDLE = [
  ISLAM, ARABIC, ENGLISH, MATH,
  { name: 'الأحياء', icon: '🧬', color: C.brown },
  { name: 'الكيمياء', icon: '🧪', color: C.lime },
  { name: 'الفيزياء', icon: '⚛️', color: C.emerald },
  { name: 'الاجتماعيات', icon: '🗺️', color: C.violet },
  { name: 'اللغة الفرنسية', icon: '🇫🇷', color: C.rose },
  { name: 'الحاسوب', icon: '💻', color: C.stone },
];

// الإعدادية: المواد الأساسية المشتركة + مواد الفرع العلمي
const IQ_SCI = [
  ISLAM, ARABIC, ENGLISH, MATH,
  { name: 'الأحياء', icon: '🧬', color: C.brown },
  { name: 'الكيمياء', icon: '🧪', color: C.lime },
  { name: 'الفيزياء', icon: '⚛️', color: C.emerald },
  { name: 'الاجتماعيات', icon: '🗺️', color: C.violet },
  { name: 'اللغة الفرنسية', icon: '🇫🇷', color: C.rose },
];
const IQ_LIT = [
  ISLAM, ARABIC, ENGLISH, MATH,
  { name: 'الاجتماعيات', icon: '🗺️', color: C.violet },
  { name: 'اللغة الفرنسية', icon: '🇫🇷', color: C.rose },
];

// ═══════════ سوريا ═══════════
const SY_MIDDLE = [
  { name: 'التربية الدينية الإسلامية', icon: '🕌', color: C.green },
  ARABIC, ENGLISH,
  { name: 'اللغة الفرنسية', icon: '🇫🇷', color: C.rose },
  MATH,
  { name: 'علم الأحياء والأرض', icon: '🌿', color: C.emerald },
  { name: 'الفيزياء والكيمياء', icon: '⚗️', color: C.lime },
  { name: 'التاريخ', icon: '🏛️', color: C.violet },
  { name: 'الجغرافيا', icon: '🌍', color: C.gold },
  { name: 'التربية الوطنية', icon: '🚩', color: C.brown },
  { name: 'التربية الفنية', icon: '🎨', color: C.fuchsia },
  { name: 'التربية الموسيقية', icon: '🎵', color: C.rose },
  { name: 'التربية الرياضية', icon: '⚽', color: C.orange },
  { name: 'تكنولوجيا المعلومات والاتصالات', icon: '📡', color: C.purple },
];

// الصف العاشر — بالترتيب الرأسي للجدول حسب كل فرع
const SY_10_SCI = [
  { name: 'التربية الدينية', icon: '🕌', color: C.green },
  ARABIC, ENGLISH,
  { name: 'اللغة الفرنسية / الروسية', icon: '🇫🇷', color: C.rose },
  { name: 'الرياضيات (جبر + هندسة)', icon: '🔢', color: C.amber },
  { name: 'الفيزياء', icon: '⚛️', color: C.emerald },
  { name: 'الكيمياء', icon: '🧪', color: C.lime },
  { name: 'علم الأحياء', icon: '🧬', color: C.brown },
  { name: 'التاريخ', icon: '🏛️', color: C.violet },
  { name: 'الجغرافيا', icon: '🌍', color: C.gold },
  { name: 'التربية الوطنية', icon: '🚩', color: C.brown },
  { name: 'تكنولوجيا المعلومات', icon: '📡', color: C.purple },
];
const SY_10_LIT = [
  { name: 'التربية الدينية', icon: '🕌', color: C.green },
  ARABIC, ENGLISH,
  { name: 'اللغة الفرنسية / الروسية', icon: '🇫🇷', color: C.rose },
  { name: 'الرياضيات (جبر + هندسة)', icon: '🔢', color: C.amber },
  { name: 'الفلسفة والعلوم الإنسانية', icon: '🤔', color: C.purple },
  { name: 'التاريخ', icon: '🏛️', color: C.violet },
  { name: 'الجغرافيا', icon: '🌍', color: C.gold },
  { name: 'التربية الوطنية', icon: '🚩', color: C.brown },
  { name: 'تكنولوجيا المعلومات', icon: '📡', color: C.purple },
];
// الحادي عشر والثاني عشر — نفس البنية مع تعمق أكبر
const SY_11_12_SCI = [
  { name: 'التربية الدينية', icon: '🕌', color: C.green },
  ARABIC, ENGLISH,
  { name: 'اللغة الفرنسية / الروسية', icon: '🇫🇷', color: C.rose },
  MATH,
  { name: 'الفيزياء', icon: '⚛️', color: C.emerald },
  { name: 'الكيمياء', icon: '🧪', color: C.lime },
  { name: 'علم الأحياء', icon: '🧬', color: C.brown },
  { name: 'التاريخ', icon: '🏛️', color: C.violet },
  { name: 'الجغرافيا', icon: '🌍', color: C.gold },
  { name: 'التربية الوطنية', icon: '🚩', color: C.brown },
  { name: 'تكنولوجيا المعلومات', icon: '📡', color: C.purple },
];
const SY_11_12_LIT = [
  { name: 'التربية الدينية', icon: '🕌', color: C.green },
  ARABIC, ENGLISH,
  { name: 'اللغة الفرنسية / الروسية', icon: '🇫🇷', color: C.rose },
  MATH,
  { name: 'الفلسفة والعلوم الإنسانية', icon: '🤔', color: C.purple },
  { name: 'التاريخ', icon: '🏛️', color: C.violet },
  { name: 'الجغرافيا', icon: '🌍', color: C.gold },
  { name: 'التربية الوطنية', icon: '🚩', color: C.brown },
  { name: 'تكنولوجيا المعلومات', icon: '📡', color: C.purple },
];

// متوسطة الدفعة 3 (اليمن وسوريا: المرحلة الأساسية - الحلقة الثانية)
const MIDDLE3 = {
  YE: {
    stageName: 'المرحلة الأساسية - الحلقة الثانية',
    grades: { 'الصف السابع': YE_MIDDLE, 'الصف الثامن': YE_MIDDLE, 'الصف التاسع': YE_MIDDLE },
  },
  IQ: {
    grades: { 'الصف السابع': IQ_MIDDLE, 'الصف الثامن': IQ_MIDDLE, 'الصف التاسع': IQ_MIDDLE },
  },
  SY: {
    stageName: 'المرحلة الأساسية - الحلقة الثانية',
    grades: { 'الصف السابع': SY_MIDDLE, 'الصف الثامن': SY_MIDDLE, 'الصف التاسع': SY_MIDDLE },
  },
};

// ───────────────────────── الدفعة 4: لبنان + الأردن + فلسطين + مصر + السودان + ليبيا + تونس + الجزائر + المغرب ─────────────────────────

// مواد مشتركة إضافية
const RELIGION = { name: 'التربية الدينية', icon: '🕌', color: C.green };
const FRENCH = { name: 'اللغة الفرنسية', icon: '🇫🇷', color: C.rose };
const HISTORY = { name: 'التاريخ', icon: '🏛️', color: C.violet };
const GEOGRAPHY = { name: 'الجغرافيا', icon: '🌍', color: C.gold };
const HIST_GEO = { name: 'التاريخ والجغرافيا', icon: '🗺️', color: C.violet };
const PHYSICS = { name: 'الفيزياء', icon: '⚛️', color: C.emerald };
const CHEMISTRY = { name: 'الكيمياء', icon: '🧪', color: C.lime };
const BIOLOGY = { name: 'الأحياء', icon: '🧬', color: C.brown };
const PHILOSOPHY = { name: 'الفلسفة', icon: '🤔', color: C.purple };
const SPORT = { name: 'التربية البدنية', icon: '⚽', color: C.orange };
const CIVICS = { name: 'التربية المدنية', icon: '🤝', color: C.rose };

// ═══════════ لبنان ═══════════
const LB_MIDDLE = [
  RELIGION, ARABIC,
  { name: 'اللغة الأجنبية الأولى (فرنسي/إنجليزي)', icon: '🌐', color: C.red },
  { name: 'اللغة الأجنبية الثانية', icon: '🗨️', color: C.fuchsia },
  MATH,
  { name: 'العلوم (علوم الحياة + فيزياء + كيمياء)', icon: '🔬', color: C.emerald },
  HISTORY, GEOGRAPHY, CIVICS,
  { name: 'المعلوماتية', icon: '💻', color: C.brown },
  { name: 'الفنون (رسم/مسرح/موسيقى)', icon: '🎭', color: C.fuchsia },
  SPORT,
];
// ثانوية لبنان: العاشر 13 مادة، الحادي عشر والثاني عشر 14 (مع الفلسفة والحضارات)
const LB_S_BASE = [
  RELIGION, ARABIC,
  { name: 'اللغة الأجنبية الأولى', icon: '🌐', color: C.red },
  { name: 'اللغة الأجنبية الثانية', icon: '🗨️', color: C.fuchsia },
  MATH, PHYSICS, CHEMISTRY,
  { name: 'علوم الحياة', icon: '🧬', color: C.brown },
  HISTORY, GEOGRAPHY,
  { name: 'التربية الوطنية', icon: '🚩', color: C.brown },
  { name: 'المعلوماتية', icon: '💻', color: C.purple },
  SPORT,
];
const LB_S_11_12 = [
  ...LB_S_BASE.slice(0, 11),
  { name: 'الفلسفة والحضارات', icon: '🏺', color: C.purple },
  ...LB_S_BASE.slice(11),
];

// ═══════════ الأردن ═══════════
const JO_BASIC = [
  ISLAM, ARABIC, ENGLISH, MATH,
  { name: 'العلوم (فيزياء + كيمياء + أحياء + علوم أرض)', icon: '🔬', color: C.emerald },
  { name: 'الدراسات الاجتماعية (تاريخ + جغرافيا + تربية وطنية)', icon: '🗺️', color: C.violet },
  { name: 'المهارات الرقمية', icon: '💻', color: C.brown },
  { name: 'التربية الفنية', icon: '🎨', color: C.fuchsia },
  { name: 'التربية الرياضية', icon: '⚽', color: C.orange },
];
const JO_CORE = [
  ISLAM, ARABIC, ENGLISH, MATH,
  { name: 'تاريخ الأردن', icon: '🏛️', color: C.violet },
];
const JO_SCI = [
  ...JO_CORE, PHYSICS, CHEMISTRY,
  { name: 'العلوم الحياتية', icon: '🧬', color: C.brown },
  { name: 'علوم الأرض والبيئة', icon: '🌱', color: C.emerald },
];

// ═══════════ فلسطين ═══════════
const PS_TECH = { name: 'التكنولوجيا والعلوم التطبيقية', icon: '🛠️', color: C.brown };
const PS_MIDDLE = [
  ISLAM, ARABIC, ENGLISH, MATH,
  { name: 'العلوم (فيزياء + كيمياء + أحياء)', icon: '🔬', color: C.emerald },
  { name: 'الدراسات الاجتماعية والتربية الوطنية', icon: '🗺️', color: C.violet },
  PS_TECH,
  { name: 'التربية الفنية والحرف', icon: '🎨', color: C.fuchsia },
  { name: 'التربية الرياضية', icon: '⚽', color: C.orange },
  CIVICS,
];
const PS_G10 = [...PS_MIDDLE, { name: 'مهارات حياتية ومهنية', icon: '🧩', color: C.lime }];
const PS_SCI = [ISLAM, ARABIC, ENGLISH, MATH, PHYSICS, CHEMISTRY, BIOLOGY, PS_TECH, SPORT];
const PS_LIT = [ISLAM, ARABIC, ENGLISH, MATH, HISTORY, GEOGRAPHY, { name: 'الاقتصاد وإدارة الأعمال', icon: '📈', color: C.emerald }, PS_TECH, SPORT];

// ═══════════ مصر ═══════════
const EG_PREP = [
  { name: 'اللغة العربية والخط العربي', icon: '✒️', color: C.teal },
  ENGLISH, MATH,
  { name: 'العلوم', icon: '🔬', color: C.emerald },
  { name: 'الدراسات الاجتماعية', icon: '🗺️', color: C.violet },
  RELIGION,
  { name: 'تكنولوجيا المعلومات والاتصالات', icon: '📡', color: C.purple },
  { name: 'التربية الفنية', icon: '🎨', color: C.fuchsia },
  { name: 'التربية الرياضية', icon: '⚽', color: C.orange },
];
const EG_LANG1 = { name: 'اللغة الأجنبية الأولى', icon: '🌐', color: C.red };
const EG_LANG2 = { name: 'اللغة الأجنبية الثانية', icon: '🗨️', color: C.fuchsia };
const EG_RELIGION = { name: 'التربية الدينية', icon: '🕌', color: C.green };
const EG_AI = { name: 'البرمجة والذكاء الاصطناعي', icon: '🤖', color: C.purple };
const EG_S1 = [
  ARABIC, EG_LANG1, MATH, HISTORY,
  { name: 'العلوم المتكاملة', icon: '🔬', color: C.emerald },
  { name: 'الفلسفة والمنطق', icon: '🤔', color: C.purple },
  EG_LANG2, EG_RELIGION, EG_AI, SPORT,
];
const EG_S2_SCI = [
  ARABIC, EG_LANG1, MATH, HISTORY,
  { name: 'الفلسفة والمنطق', icon: '🤔', color: C.purple },
  CHEMISTRY, PHYSICS, BIOLOGY,
  EG_LANG2, EG_RELIGION, EG_AI, SPORT,
];
const EG_S2_LIT = [
  ARABIC, EG_LANG1, MATH, HISTORY,
  { name: 'الفلسفة والمنطق', icon: '🤔', color: C.purple },
  EG_LANG2, EG_RELIGION, EG_AI, SPORT,
];
const EG_S3_SCI = [
  ARABIC, EG_LANG1, MATH, HISTORY,
  CHEMISTRY, PHYSICS, BIOLOGY,
  EG_LANG2, EG_RELIGION, EG_AI, SPORT,
];
const EG_S3_LIT = [
  ARABIC, EG_LANG1, MATH, HISTORY,
  EG_LANG2, EG_RELIGION, EG_AI, SPORT,
];

// ═══════════ السودان ═══════════
const SD_MIDDLE = [
  ISLAM, ARABIC, ENGLISH, MATH,
  { name: 'العلوم', icon: '🔬', color: C.emerald },
  GEOGRAPHY, HISTORY,
  { name: 'التكنولوجيا', icon: '🛠️', color: C.brown },
  { name: 'التربية الفنية', icon: '🎨', color: C.fuchsia },
  { name: 'التربية الرياضية', icon: '⚽', color: C.orange },
];
const SD_CS = { name: 'علوم الحاسوب', icon: '💻', color: C.brown };
const SD_IT = { name: 'تكنولوجيا المعلومات', icon: '📡', color: C.purple };
const SD_S12 = [ISLAM, ARABIC, ENGLISH, MATH, PHYSICS, CHEMISTRY, BIOLOGY, HISTORY, GEOGRAPHY, SD_CS, SD_IT];
const SD_S3_SCI = [ISLAM, ARABIC, ENGLISH, MATH, PHYSICS, CHEMISTRY, BIOLOGY, SD_CS, SD_IT];
const SD_S3_LIT = [ISLAM, ARABIC, ENGLISH, MATH, HISTORY, GEOGRAPHY, SD_CS, SD_IT];

// ═══════════ ليبيا ═══════════
const LY_MIDDLE = [
  ISLAM, ARABIC, ENGLISH, MATH,
  { name: 'العلوم', icon: '🔬', color: C.emerald },
  HISTORY, GEOGRAPHY,
  { name: 'التربية الوطنية', icon: '🚩', color: C.brown },
  { name: 'الفنون', icon: '🎨', color: C.fuchsia },
  { name: 'التربية البدنية', icon: '⚽', color: C.orange },
];
const LY_ARABIC = { name: 'اللغة العربية (نحو + صرف + إملاء + بلاغة)', icon: '✒️', color: C.teal };
const LY_IT = { name: 'تقنية المعلومات', icon: '💻', color: C.brown };
const LY_SOCIAL = { name: 'أساسيات الحياة الاجتماعية', icon: '🤝', color: C.rose };
const LY_S1 = [ISLAM, LY_ARABIC, ENGLISH, MATH, PHYSICS, CHEMISTRY, BIOLOGY, HISTORY, GEOGRAPHY, LY_IT, LY_SOCIAL];
const LY_S_SCI = [ISLAM, LY_ARABIC, ENGLISH, MATH, PHYSICS, CHEMISTRY, BIOLOGY, LY_IT, LY_SOCIAL];
const LY_S_LIT = [ISLAM, LY_ARABIC, ENGLISH, MATH, HISTORY, GEOGRAPHY, LY_IT, LY_SOCIAL];

// ═══════════ تونس ═══════════
const TN_PHYS = { name: 'العلوم الفيزيائية', icon: '⚗️', color: C.lime };
const TN_ESV = { name: 'علوم الحياة والأرض', icon: '🌿', color: C.emerald };
const TN_IT = { name: 'الإعلامية', icon: '💻', color: C.purple };
const TN_MIDDLE = [
  ISLAM, ARABIC, FRENCH, ENGLISH, MATH, TN_PHYS, TN_ESV, HIST_GEO, CIVICS,
  { name: 'التربية التقنية', icon: '🛠️', color: C.brown },
  { name: 'التربية الموسيقية', icon: '🎵', color: C.rose },
  { name: 'التربية التشكيلية', icon: '🎨', color: C.fuchsia },
  SPORT, TN_IT,
];
const TN_ISLAMIC = { name: 'التفكير الإسلامي', icon: '🕌', color: C.green };
const TN_S1 = [ARABIC, FRENCH, ENGLISH, MATH, TN_PHYS, TN_ESV, HIST_GEO, TN_ISLAMIC, CIVICS, TN_IT, SPORT];
const TN_BRANCH_CORE = [ARABIC, FRENCH, ENGLISH, MATH, HIST_GEO, TN_ISLAMIC, PHILOSOPHY, CIVICS, SPORT];
const TN_SCIENCE = [ARABIC, FRENCH, ENGLISH, MATH, TN_PHYS, TN_ESV, HIST_GEO, TN_ISLAMIC, PHILOSOPHY, CIVICS, SPORT];
const TN_ECO = [...TN_BRANCH_CORE.slice(0, 8), { name: 'الاقتصاد', icon: '📈', color: C.emerald }, { name: 'التصرف', icon: '💼', color: C.brown }, SPORT];
const TN_TECHNO = [ARABIC, FRENCH, ENGLISH, MATH, TN_PHYS, HIST_GEO, TN_ISLAMIC, PHILOSOPHY, CIVICS, { name: 'التكنولوجيا', icon: '🛠️', color: C.brown }, SPORT];
const TN_INFO = [ARABIC, FRENCH, ENGLISH, MATH, TN_PHYS, HIST_GEO, TN_ISLAMIC, PHILOSOPHY, CIVICS, { name: 'قواعد البيانات', icon: '🗄️', color: C.stone }, SPORT];

// ═══════════ الجزائر ═══════════
const DZ_MIDDLE = [
  ARABIC, FRENCH, ENGLISH, MATH,
  { name: 'العلوم الطبيعية والحياة', icon: '🧬', color: C.brown },
  { name: 'العلوم الفيزيائية والتكنولوجيا', icon: '⚗️', color: C.lime },
  HIST_GEO, ISLAM, CIVICS,
  { name: 'التربية الفنية', icon: '🎨', color: C.fuchsia },
  SPORT,
  { name: 'المعلوماتية', icon: '💻', color: C.purple },
  { name: 'اللغة الأمازيغية', icon: '🏔️', color: C.orange },
];
const DZ_CORE = [
  ARABIC, FRENCH, ENGLISH, MATH,
  { name: 'العلوم الفيزيائية', icon: '⚗️', color: C.lime },
  { name: 'علوم الطبيعة والحياة', icon: '🧬', color: C.brown },
  HIST_GEO, ISLAM, CIVICS,
  { name: 'الإعلام الآلي', icon: '💻', color: C.stone },
  SPORT,
  { name: 'التربية الفنية', icon: '🎨', color: C.fuchsia },
];
const DZ_ADL = [ARABIC, PHILOSOPHY, FRENCH, ENGLISH, MATH, HIST_GEO, ISLAM, SPORT];
const DZ_LANG = [ARABIC, FRENCH, ENGLISH, { name: 'اللغة الأجنبية الثالثة', icon: '🗨️', color: C.gold }, MATH, HIST_GEO, ISLAM, SPORT];
const DZ_SCI_EXP = [ARABIC, PHILOSOPHY, FRENCH, ENGLISH, MATH, { name: 'العلوم الفيزيائية', icon: '⚗️', color: C.lime }, { name: 'علوم الطبيعة والحياة', icon: '🧬', color: C.brown }, HIST_GEO, ISLAM, SPORT];
const DZ_MATH = [ARABIC, PHILOSOPHY, FRENCH, ENGLISH, MATH, { name: 'العلوم الفيزيائية', icon: '⚗️', color: C.lime }, HIST_GEO, ISLAM, { name: 'الإعلام الآلي', icon: '💻', color: C.stone }, SPORT];
const DZ_TECH = [ARABIC, FRENCH, ENGLISH, MATH, { name: 'العلوم الفيزيائية', icon: '⚗️', color: C.lime }, HIST_GEO, ISLAM, { name: 'التكنولوجيا', icon: '🛠️', color: C.brown }, { name: 'الإعلام الآلي', icon: '💻', color: C.stone }, SPORT];
const DZ_ECO = [ARABIC, PHILOSOPHY, FRENCH, ENGLISH, MATH, HIST_GEO, ISLAM, { name: 'التسيير والمحاسبة', icon: '🧾', color: C.stone }, { name: 'الاقتصاد والمناجمنت', icon: '📈', color: C.emerald }, SPORT];

// ═══════════ المغرب ═══════════
const MA_PHY_CHE = { name: 'الفيزياء والكيمياء', icon: '⚗️', color: C.lime };
const MA_SVT = { name: 'علوم الحياة والأرض', icon: '🌿', color: C.emerald };
const MA_PREP = [
  ARABIC, FRENCH, ENGLISH, MATH, MA_PHY_CHE, MA_SVT,
  { name: 'الاجتماعيات (التاريخ، الجغرافيا، التربية على المواطنة)', icon: '🗺️', color: C.violet },
  ISLAM, SPORT,
  { name: 'الإعلاميات', icon: '💻', color: C.purple },
  { name: 'التربية التشكيلية', icon: '🎨', color: C.fuchsia },
  { name: 'التربية الموسيقية', icon: '🎵', color: C.rose },
  { name: 'التربية الأسرية', icon: '🏡', color: C.lime },
  { name: 'التكنولوجيا', icon: '🛠️', color: C.brown },
];
const MA_TRONC_SCI = [ARABIC, FRENCH, ENGLISH, MATH, MA_PHY_CHE, MA_SVT, HIST_GEO, ISLAM, SPORT];
const MA_TRONC_LIT = [ARABIC, FRENCH, ENGLISH, MATH, HIST_GEO, ISLAM, PHILOSOPHY, SPORT];
const MA_TRONC_TECH = [ARABIC, FRENCH, ENGLISH, MATH, MA_PHY_CHE, HIST_GEO, ISLAM, { name: 'علوم المهندس', icon: '⚙️', color: C.brown }, SPORT];
const MA_BAC_SCI = [ARABIC, FRENCH, ENGLISH, MATH, MA_PHY_CHE, MA_SVT, HIST_GEO, ISLAM, PHILOSOPHY, SPORT];
const MA_BAC_LIT = [ARABIC, FRENCH, ENGLISH, MATH, HIST_GEO, ISLAM, PHILOSOPHY, SPORT];
const MA_BAC_ECO = [ARABIC, FRENCH, ENGLISH, MATH, HIST_GEO, ISLAM, PHILOSOPHY, { name: 'الاقتصاد والتنظيم الإداري', icon: '🏢', color: C.gold }, { name: 'المحاسبة والرياضيات المالية', icon: '🧮', color: C.gold }, SPORT];

// متوسطة الدفعة 4 (الأردن وفلسطين تضيفان الصف العاشر للمرحلة الأساسية/الإعدادية)
const MIDDLE4 = {
  LB: { grades: { 'الصف السابع': LB_MIDDLE, 'الصف الثامن': LB_MIDDLE, 'الصف التاسع': LB_MIDDLE } },
  JO: {
    stageName: 'المرحلة الأساسية',
    grades: { 'الصف السابع': JO_BASIC, 'الصف الثامن': JO_BASIC, 'الصف التاسع': JO_BASIC, 'الصف العاشر': JO_BASIC },
  },
  PS: {
    stageName: 'المرحلة الإعدادية',
    grades: { 'الصف السابع': PS_MIDDLE, 'الصف الثامن': PS_MIDDLE, 'الصف التاسع': PS_MIDDLE, 'الصف العاشر': PS_G10 },
  },
  EG: {
    stageName: 'المرحلة الإعدادية',
    gradeRenames: { 'الأول المتوسط': 'الأول الإعدادي', 'الثاني المتوسط': 'الثاني الإعدادي', 'الثالث المتوسط': 'الثالث الإعدادي' },
    grades: { 'الأول الإعدادي': EG_PREP, 'الثاني الإعدادي': EG_PREP, 'الثالث الإعدادي': EG_PREP },
  },
  SD: { grades: { 'الأول المتوسط': SD_MIDDLE, 'الثاني المتوسط': SD_MIDDLE, 'الثالث المتوسط': SD_MIDDLE } },
  LY: { stageName: 'المرحلة الإعدادية', grades: { 'الصف السابع': LY_MIDDLE, 'الصف الثامن': LY_MIDDLE, 'الصف التاسع': LY_MIDDLE } },
  TN: {
    stageName: 'المرحلة الإعدادية',
    gradeRenames: { 'الأول المتوسط': 'السابعة أساسي', 'الثاني المتوسط': 'الثامنة أساسي', 'الثالث المتوسط': 'التاسعة أساسي' },
    grades: { 'السابعة أساسي': TN_MIDDLE, 'الثامنة أساسي': TN_MIDDLE, 'التاسعة أساسي': TN_MIDDLE },
  },
  DZ: {
    gradeRenames: { 'الأول المتوسط': 'الأولى متوسط', 'الثاني المتوسط': 'الثانية متوسط', 'الثالث المتوسط': 'الثالثة متوسط' },
    grades: { 'الأولى متوسط': DZ_MIDDLE, 'الثانية متوسط': DZ_MIDDLE, 'الثالثة متوسط': DZ_MIDDLE, 'الرابعة متوسط': DZ_MIDDLE },
  },
  MA: {
    stageName: 'المرحلة الثانوية الإعدادية',
    gradeRenames: { 'الأول المتوسط': 'الأولى إعدادي', 'الثاني المتوسط': 'الثانية إعدادي', 'الثالث المتوسط': 'الثالثة إعدادي' },
    grades: { 'الأولى إعدادي': MA_PREP, 'الثانية إعدادي': MA_PREP, 'الثالثة إعدادي': MA_PREP },
  },
};

// ───────────────────────── الدفعة 5: موريتانيا + الصومال + جيبوتي + جزر القمر ─────────────────────────

// ═══════════ موريتانيا ═══════════
const MR_PC = { name: 'الفيزياء والكيمياء', icon: '⚗️', color: C.lime };
const MR_NAT = { name: 'العلوم الطبيعية', icon: '🔬', color: C.emerald };
const MR_IT = { name: 'التكنولوجيا والمعلوماتية', icon: '🖥️', color: C.brown };
// الإعدادية: الفيزياء والكيمياء تُدرَّس من السنة الثانية فقط
const MR_PREP_7 = [ISLAM, ARABIC, FRENCH, ENGLISH, MATH, MR_NAT, HISTORY, GEOGRAPHY, CIVICS, MR_IT, SPORT];
const MR_PREP_8_9 = [ISLAM, ARABIC, FRENCH, ENGLISH, MATH, MR_NAT, MR_PC, HISTORY, GEOGRAPHY, CIVICS, MR_IT, SPORT];
// الثانوية: 5 شعب (الآداب الأصلية / الآداب العصرية / العلوم الطبيعية / الرياضيات / التعليم التقني)
const MR_ARTS = [ARABIC, PHILOSOPHY, FRENCH, ENGLISH, MATH, HIST_GEO, ISLAM, SPORT];
const MR_PHYS_SCI = { name: 'العلوم الفيزيائية', icon: '⚗️', color: C.lime };
const MR_SCI = [ARABIC, FRENCH, ENGLISH, MATH, MR_NAT, MR_PHYS_SCI, ISLAM, SPORT];
const MR_TECH = [ARABIC, FRENCH, ENGLISH, MATH, MR_PHYS_SCI, ISLAM, SPORT, { name: 'الرسم الصناعي', icon: '📐', color: C.gold }];

// ═══════════ الصومال ═══════════
const SOMALI = { name: 'اللغة الصومالية', icon: '🗣️', color: C.stone };
const SO_SOCIAL = { name: 'الدراسات الاجتماعية', icon: '🗺️', color: C.violet };
const SO_MIDDLE = [
  SOMALI, ARABIC, ENGLISH, ISLAM, MATH,
  { name: 'العلوم', icon: '🔬', color: C.emerald },
  SO_SOCIAL, GEOGRAPHY, HISTORY,
  { name: 'التربية الفنية', icon: '🎨', color: C.fuchsia },
  SPORT,
];
const SO_SEC = [
  SOMALI, ARABIC, ENGLISH, ISLAM, MATH, PHYSICS, CHEMISTRY, BIOLOGY,
  SO_SOCIAL, GEOGRAPHY, HISTORY,
  { name: 'تقنية المعلومات والاتصالات', icon: '📡', color: C.purple },
  { name: 'الزراعة', icon: '🌾', color: C.lime },
  SPORT,
];

// ═══════════ جيبوتي ═══════════
const DJ_MIDDLE = [
  FRENCH, ARABIC, ENGLISH, MATH,
  { name: 'العلوم الطبيعية', icon: '🔬', color: C.emerald },
  MR_PC, HIST_GEO, ISLAM,
  { name: 'المعلوماتية', icon: '💻', color: C.brown },
  SPORT,
];
const DJ_SVT = { name: 'علوم الحياة والأرض', icon: '🌿', color: C.emerald };
const DJ_INFO = { name: 'المعلوماتية والتسيير', icon: '🖥️', color: C.stone };
const ECONOMY = { name: 'الاقتصاد', icon: '📈', color: C.emerald };
// الثانوية: الفلسفة من الحادي عشر، الاقتصاد من الثاني عشر
const DJ_G10 = [FRENCH, ARABIC, ENGLISH, MATH, DJ_SVT, MR_PC, HIST_GEO, DJ_INFO, SPORT];
const DJ_G11 = [...DJ_G10.slice(0, 7), PHILOSOPHY, ...DJ_G10.slice(7)];
const DJ_G12 = [...DJ_G11.slice(0, 8), ECONOMY, ...DJ_G11.slice(8)];

// ═══════════ جزر القمر ═══════════
const KM_MIDDLE = [
  FRENCH, ARABIC, ENGLISH, MATH, DJ_SVT, MR_PC, HIST_GEO, CIVICS, ISLAM,
  { name: 'التكنولوجيا', icon: '🛠️', color: C.brown },
  { name: 'التربية الفنية', icon: '🎨', color: C.fuchsia },
  SPORT,
];
const KM_G10 = [FRENCH, ARABIC, ENGLISH, MATH, DJ_SVT, MR_PC, HIST_GEO, SPORT];
const KM_G11 = [...KM_G10.slice(0, 7), PHILOSOPHY, ...KM_G10.slice(7)];
const KM_G12 = [...KM_G11.slice(0, 8), ECONOMY, ...KM_G11.slice(8)];

// متوسطة الدفعة 5 (موريتانيا: إعدادي بأسماء سنواتها + الفيزياء والكيمياء من الثانية)
const MIDDLE5 = {
  MR: {
    stageName: 'المرحلة الإعدادية',
    gradeRenames: {
      'الأول المتوسط': 'السنة الأولى إعدادي',
      'الثاني المتوسط': 'السنة الثانية إعدادي',
      'الثالث المتوسط': 'السنة الثالثة إعدادي',
    },
    grades: {
      'السنة الأولى إعدادي': MR_PREP_7,
      'السنة الثانية إعدادي': MR_PREP_8_9,
      'السنة الثالثة إعدادي': MR_PREP_8_9,
    },
  },
  SO: { grades: { 'الصف السابع': SO_MIDDLE, 'الصف الثامن': SO_MIDDLE, 'الصف التاسع': SO_MIDDLE } },
  DJ: { grades: { 'الصف السابع': DJ_MIDDLE, 'الصف الثامن': DJ_MIDDLE, 'الصف التاسع': DJ_MIDDLE } },
  KM: { grades: { 'الصف السابع': KM_MIDDLE, 'الصف الثامن': KM_MIDDLE, 'الصف التاسع': KM_MIDDLE } },
};

// ثانوية الدفعة 2 — الصفوف والمسارات (تُنشأ الصفوف الجديدة تلقائياً)
const SECONDARY = {
  QA: {
    renames: {
      'الحادي عشر (أدبي)': 'الحادي عشر (آداب وإنسانيات)',
      'الثاني عشر (أدبي)': 'الثاني عشر (آداب وإنسانيات)',
    },
    grades: [
      { name: 'صف العاشر', stream: 'NONE', subjects: QA_G10 },
      { name: 'الحادي عشر (علمي)', stream: 'SCIENTIFIC', subjects: QA_SCI },
      { name: 'الحادي عشر (آداب وإنسانيات)', stream: 'LITERARY', subjects: QA_HUMAN },
      { name: 'الحادي عشر (تكنولوجي)', stream: 'TECH', subjects: QA_TECH },
      { name: 'الثاني عشر (علمي)', stream: 'SCIENTIFIC', subjects: QA_SCI },
      { name: 'الثاني عشر (آداب وإنسانيات)', stream: 'LITERARY', subjects: QA_HUMAN },
      { name: 'الثاني عشر (تكنولوجي)', stream: 'TECH', subjects: QA_TECH },
    ],
  },
  BH: {
    renames: {},
    grades: [
      { name: 'صف العاشر', stream: 'NONE', subjects: BH_CORE },
      { name: 'الحادي عشر (علمي)', stream: 'SCIENTIFIC', subjects: BH_SCI },
      { name: 'الحادي عشر (أدبي)', stream: 'LITERARY', subjects: BH_LIT },
      { name: 'الحادي عشر (تجاري)', stream: 'BUSINESS', subjects: BH_BUS },
      { name: 'الثاني عشر (علمي)', stream: 'SCIENTIFIC', subjects: BH_SCI },
      { name: 'الثاني عشر (أدبي)', stream: 'LITERARY', subjects: BH_LIT },
      { name: 'الثاني عشر (تجاري)', stream: 'BUSINESS', subjects: BH_BUS },
    ],
  },
  OM: {
    renames: {},
    grades: [
      { name: 'صف العاشر', stream: 'NONE', subjects: OM_G10 },
      { name: 'الحادي عشر (أدبي)', stream: 'LITERARY', subjects: OM_11_12 },
      { name: 'الحادي عشر (علمي)', stream: 'SCIENTIFIC', subjects: OM_11_12 },
      { name: 'الثاني عشر (أدبي)', stream: 'LITERARY', subjects: OM_11_12 },
      { name: 'الثاني عشر (علمي)', stream: 'SCIENTIFIC', subjects: OM_11_12 },
    ],
  },
  YE: {
    renames: {},
    grades: [
      { name: 'صف العاشر', stream: 'NONE', subjects: YE_G10 },
      { name: 'الحادي عشر (علمي)', stream: 'SCIENTIFIC', subjects: YE_SCI },
      { name: 'الحادي عشر (أدبي)', stream: 'LITERARY', subjects: YE_LIT },
      { name: 'الثاني عشر (علمي)', stream: 'SCIENTIFIC', subjects: YE_SCI },
      { name: 'الثاني عشر (أدبي)', stream: 'LITERARY', subjects: YE_LIT },
    ],
  },
  IQ: {
    stageName: 'المرحلة الإعدادية',
    renames: {},
    grades: [
      { name: 'الرابع إعدادي (علمي)', stream: 'SCIENTIFIC', subjects: IQ_SCI },
      { name: 'الرابع إعدادي (أدبي)', stream: 'LITERARY', subjects: IQ_LIT },
      { name: 'الخامس إعدادي (علمي)', stream: 'SCIENTIFIC', subjects: IQ_SCI },
      { name: 'الخامس إعدادي (أدبي)', stream: 'LITERARY', subjects: IQ_LIT },
      { name: 'السادس إعدادي (علمي)', stream: 'SCIENTIFIC', subjects: IQ_SCI },
      { name: 'السادس إعدادي (أدبي)', stream: 'LITERARY', subjects: IQ_LIT },
    ],
  },
  SY: {
    renames: { 'صف العاشر': 'الصف العاشر (علمي)' },
    grades: [
      { name: 'الصف العاشر (علمي)', stream: 'SCIENTIFIC', subjects: SY_10_SCI },
      { name: 'الصف العاشر (أدبي)', stream: 'LITERARY', subjects: SY_10_LIT },
      { name: 'الحادي عشر (علمي)', stream: 'SCIENTIFIC', subjects: SY_11_12_SCI },
      { name: 'الحادي عشر (أدبي)', stream: 'LITERARY', subjects: SY_11_12_LIT },
      { name: 'الثاني عشر (علمي)', stream: 'SCIENTIFIC', subjects: SY_11_12_SCI },
      { name: 'الثاني عشر (أدبي)', stream: 'LITERARY', subjects: SY_11_12_LIT },
    ],
  },
  LB: {
    renames: { 'الحادي عشر (أدبي)': 'الحادي عشر', 'الثاني عشر (أدبي)': 'الثاني عشر' },
    grades: [
      { name: 'صف العاشر', stream: 'NONE', subjects: LB_S_BASE },
      { name: 'الحادي عشر', stream: 'NONE', subjects: LB_S_11_12 },
      { name: 'الثاني عشر', stream: 'NONE', subjects: LB_S_11_12 },
    ],
  },
  JO: {
    renames: {},
    grades: [
      { name: 'الحادي عشر (علمي)', stream: 'SCIENTIFIC', subjects: JO_SCI },
      { name: 'الحادي عشر (أدبي)', stream: 'LITERARY', subjects: JO_CORE },
      { name: 'الحادي عشر (مهني)', stream: 'VOCATIONAL', subjects: JO_CORE },
      { name: 'الثاني عشر (علمي)', stream: 'SCIENTIFIC', subjects: JO_SCI },
      { name: 'الثاني عشر (أدبي)', stream: 'LITERARY', subjects: JO_CORE },
      { name: 'الثاني عشر (مهني)', stream: 'VOCATIONAL', subjects: JO_CORE },
    ],
  },
  PS: {
    renames: {},
    grades: [
      { name: 'الحادي عشر (علمي)', stream: 'SCIENTIFIC', subjects: PS_SCI },
      { name: 'الحادي عشر (أدبي)', stream: 'LITERARY', subjects: PS_LIT },
      { name: 'الثاني عشر (علمي)', stream: 'SCIENTIFIC', subjects: PS_SCI },
      { name: 'الثاني عشر (أدبي)', stream: 'LITERARY', subjects: PS_LIT },
    ],
  },
  EG: {
    renames: {
      'صف العاشر': 'الأول الثانوي',
      'الحادي عشر (علمي)': 'الثاني الثانوي (علمي)',
      'الحادي عشر (أدبي)': 'الثاني الثانوي (أدبي)',
      'الثاني عشر (علمي)': 'الثالث الثانوي (علمي)',
      'الثاني عشر (أدبي)': 'الثالث الثانوي (أدبي)',
    },
    grades: [
      { name: 'الأول الثانوي', stream: 'NONE', subjects: EG_S1 },
      { name: 'الثاني الثانوي (علمي)', stream: 'SCIENTIFIC', subjects: EG_S2_SCI },
      { name: 'الثاني الثانوي (أدبي)', stream: 'LITERARY', subjects: EG_S2_LIT },
      { name: 'الثالث الثانوي (علمي)', stream: 'SCIENTIFIC', subjects: EG_S3_SCI },
      { name: 'الثالث الثانوي (أدبي)', stream: 'LITERARY', subjects: EG_S3_LIT },
    ],
  },
  SD: {
    renames: {
      'صف العاشر': 'الأول الثانوي',
      'الحادي عشر (علمي)': 'الثاني الثانوي',
      'الثاني عشر (علمي)': 'الثالث الثانوي (علمي)',
      'الثاني عشر (أدبي)': 'الثالث الثانوي (أدبي)',
    },
    grades: [
      { name: 'الأول الثانوي', stream: 'NONE', subjects: SD_S12 },
      { name: 'الثاني الثانوي', stream: 'NONE', subjects: SD_S12 },
      { name: 'الثالث الثانوي (علمي)', stream: 'SCIENTIFIC', subjects: SD_S3_SCI },
      { name: 'الثالث الثانوي (أدبي)', stream: 'LITERARY', subjects: SD_S3_LIT },
    ],
  },
  LY: {
    renames: {
      'صف العاشر': 'الأول الثانوي',
      'الحادي عشر (علمي)': 'الثاني الثانوي (علمي)',
      'الحادي عشر (أدبي)': 'الثاني الثانوي (أدبي)',
      'الثاني عشر (علمي)': 'الثالث الثانوي (علمي)',
      'الثاني عشر (أدبي)': 'الثالث الثانوي (أدبي)',
    },
    grades: [
      { name: 'الأول الثانوي', stream: 'NONE', subjects: LY_S1 },
      { name: 'الثاني الثانوي (علمي)', stream: 'SCIENTIFIC', subjects: LY_S_SCI },
      { name: 'الثاني الثانوي (أدبي)', stream: 'LITERARY', subjects: LY_S_LIT },
      { name: 'الثالث الثانوي (علمي)', stream: 'SCIENTIFIC', subjects: LY_S_SCI },
      { name: 'الثالث الثانوي (أدبي)', stream: 'LITERARY', subjects: LY_S_LIT },
    ],
  },
  TN: {
    renames: { 'صف العاشر': 'الأولى ثانوي' },
    grades: [
      { name: 'الأولى ثانوي', stream: 'NONE', subjects: TN_S1 },
      { name: 'شعبة الآداب', stream: 'NONE', subjects: TN_BRANCH_CORE },
      { name: 'شعبة العلوم', stream: 'NONE', subjects: TN_SCIENCE },
      { name: 'شعبة الاقتصاد والتصرف', stream: 'NONE', subjects: TN_ECO },
      { name: 'شعبة العلوم التقنية', stream: 'NONE', subjects: TN_TECHNO },
      { name: 'شعبة علوم الإعلامية', stream: 'NONE', subjects: TN_INFO },
      { name: 'شعبة الرياضة', stream: 'NONE', subjects: TN_SCIENCE },
    ],
  },
  DZ: {
    renames: { 'صف العاشر': 'الأولى ثانوي (جذع مشترك)' },
    grades: [
      { name: 'الأولى ثانوي (جذع مشترك)', stream: 'NONE', subjects: DZ_CORE },
      { name: 'شعبة الآداب والفلسفة', stream: 'NONE', subjects: DZ_ADL },
      { name: 'شعبة اللغات الأجنبية', stream: 'NONE', subjects: DZ_LANG },
      { name: 'شعبة العلوم التجريبية', stream: 'NONE', subjects: DZ_SCI_EXP },
      { name: 'شعبة الرياضيات', stream: 'NONE', subjects: DZ_MATH },
      { name: 'شعبة تقني رياضي', stream: 'NONE', subjects: DZ_TECH },
      { name: 'شعبة تسيير واقتصاد', stream: 'NONE', subjects: DZ_ECO },
    ],
  },
  MA: {
    renames: { 'صف العاشر': 'جذع مشترك علمي' },
    grades: [
      { name: 'جذع مشترك علمي', stream: 'SCIENTIFIC', subjects: MA_TRONC_SCI },
      { name: 'جذع مشترك أدبي', stream: 'LITERARY', subjects: MA_TRONC_LIT },
      { name: 'جذع مشترك تكنولوجي', stream: 'TECH', subjects: MA_TRONC_TECH },
      { name: 'شعبة العلوم التجريبية', stream: 'NONE', subjects: MA_BAC_SCI },
      { name: 'شعبة العلوم الرياضية', stream: 'NONE', subjects: MA_BAC_SCI },
      { name: 'شعبة الآداب والعلوم الإنسانية', stream: 'NONE', subjects: MA_BAC_LIT },
      { name: 'شعبة العلوم الاقتصادية والتدبير', stream: 'NONE', subjects: MA_BAC_ECO },
    ],
  },
  MR: {
    renames: {},
    grades: [
      { name: 'شعبة الآداب الأصلية', stream: 'LITERARY', subjects: MR_ARTS },
      { name: 'شعبة الآداب العصرية', stream: 'LITERARY', subjects: MR_ARTS },
      { name: 'شعبة العلوم الطبيعية', stream: 'SCIENTIFIC', subjects: MR_SCI },
      { name: 'شعبة الرياضيات', stream: 'SCIENTIFIC', subjects: MR_SCI },
      { name: 'شعبة التعليم التقني', stream: 'TECH', subjects: MR_TECH },
    ],
  },
  SO: {
    renames: { 'الحادي عشر (أدبي)': 'الحادي عشر', 'الثاني عشر (أدبي)': 'الثاني عشر' },
    grades: [
      { name: 'صف العاشر', stream: 'NONE', subjects: SO_SEC },
      { name: 'الحادي عشر', stream: 'NONE', subjects: SO_SEC },
      { name: 'الثاني عشر', stream: 'NONE', subjects: SO_SEC },
    ],
  },
  DJ: {
    renames: { 'الحادي عشر (أدبي)': 'الحادي عشر', 'الثاني عشر (أدبي)': 'الثاني عشر' },
    grades: [
      { name: 'صف العاشر', stream: 'NONE', subjects: DJ_G10 },
      { name: 'الحادي عشر', stream: 'NONE', subjects: DJ_G11 },
      { name: 'الثاني عشر', stream: 'NONE', subjects: DJ_G12 },
    ],
  },
  KM: {
    renames: { 'الحادي عشر (أدبي)': 'الحادي عشر', 'الثاني عشر (أدبي)': 'الثاني عشر' },
    grades: [
      { name: 'صف العاشر', stream: 'NONE', subjects: KM_G10 },
      { name: 'الحادي عشر', stream: 'NONE', subjects: KM_G11 },
      { name: 'الثاني عشر', stream: 'NONE', subjects: KM_G12 },
    ],
  },
};

// ───────────────────────── المزامنة ─────────────────────────
// مزامنة مواد صف واحد: حذف غير الرسمي (مع حماية الكتب) + إنشاء/تحديث الرسمي بالترتيب
async function syncSubjectsForGrade(grade, subjects, label) {
  const existing = await db.subject.findMany({
    where: { gradeId: grade.id },
    include: { _count: { select: { books: true } } },
  });
  const wantedNames = subjects.map((s) => s.name);

  // 1) حذف المواد غير الموجودة في الجدول الرسمي (مع حماية الكتب المرفوعة)
  let removed = 0;
  for (const ex of existing) {
    if (!wantedNames.includes(ex.nameAr)) {
      if (ex._count.books > 0) {
        console.warn(`  ⚠ تجاهل حذف «${ex.nameAr}» في ${label} — عليها ${ex._count.books} كتاب مرفوع`);
        continue;
      }
      await db.subject.delete({ where: { id: ex.id } });
      removed++;
    }
  }

  // 2) إنشاء/تحديث المواد بالترتيب الرسمي بالضبط
  let created = 0;
  let updated = 0;
  for (let i = 0; i < subjects.length; i++) {
    const s = subjects[i];
    const found = existing.find((ex) => ex.nameAr === s.name);
    if (found) {
      await db.subject.update({
        where: { id: found.id },
        data: { icon: s.icon, color: s.color, gender: s.gender ?? null, order: i },
      });
      updated++;
    } else {
      await db.subject.create({
        data: {
          nameAr: s.name,
          icon: s.icon,
          color: s.color,
          gender: s.gender ?? null,
          order: i,
          gradeId: grade.id,
        },
      });
      created++;
    }
  }

  console.log(
    `  ✓ ${label}: ${subjects.length} مادة رسمية — أُنشئ ${created}، حُدّث ${updated}، حُذف ${removed}`
  );
}

// مزامنة المرحلة المتوسطة/الأساسية/الإعدادية — مع إعادة تسمية المرحلة والصفوف وإنشاء الصفوف الناقصة
async function syncMiddle(code, grades, opts = {}) {
  const stageName = typeof opts === 'string' ? opts : opts.stageName;
  const gradeRenames = typeof opts === 'string' ? {} : opts.gradeRenames || {};
  const country = await db.country.findUnique({ where: { code } });
  if (!country) {
    console.error(`✗ الدولة ${code} غير موجودة`);
    return;
  }
  const middle = await db.stage.findUnique({
    where: { countryId_key: { countryId: country.id, key: 'middle' } },
    include: { grades: true },
  });
  if (!middle) {
    console.error(`✗ مرحلة المتوسطة غير موجودة لـ${country.nameAr}`);
    return;
  }

  if (stageName && middle.nameAr !== stageName) {
    await db.stage.update({ where: { id: middle.id }, data: { nameAr: stageName } });
    console.log(`  ↺ أُعيدت تسمية المرحلة إلى «${stageName}»`);
  }

  // إعادة تسمية الصفوف (مثل: الأول المتوسط → الأول الإعدادي)
  for (const [from, to] of Object.entries(gradeRenames)) {
    const g = middle.grades.find((x) => x.nameAr === from);
    if (g) {
      await db.grade.update({ where: { id: g.id }, data: { nameAr: to } });
      g.nameAr = to;
      console.log(`  ↺ أُعيدت تسمية الصف «${from}» إلى «${to}»`);
    }
  }

  console.log(`\n=== ${country.nameAr} (${code}) — ${stageName ?? middle.nameAr} ===`);

  const keys = Object.keys(grades);
  for (let gi = 0; gi < keys.length; gi++) {
    const officialGrade = keys[gi];
    const subjects = grades[officialGrade];
    const gradeName = GRADE_MAP[officialGrade] ?? officialGrade;
    let grade = middle.grades.find((g) => g.nameAr === gradeName);
    if (!grade) {
      grade = await db.grade.create({
        data: { nameAr: gradeName, stream: 'NONE', order: gi, stageId: middle.id },
      });
      middle.grades.push(grade);
      console.log(`  + أُنشئ الصف «${gradeName}»`);
    } else if (grade.order !== gi) {
      await db.grade.update({ where: { id: grade.id }, data: { order: gi } });
    }
    await syncSubjectsForGrade(grade, subjects, `${officialGrade} (${gradeName})`);
  }
}

// مزامنة المرحلة الثانوية — مع إعادة تسمية الصفوف وإنشاء صفوف المسارات الجديدة
async function syncSecondary(code, def) {
  const country = await db.country.findUnique({ where: { code } });
  if (!country) {
    console.error(`✗ الدولة ${code} غير موجودة`);
    return;
  }
  const stage = await db.stage.findUnique({
    where: { countryId_key: { countryId: country.id, key: 'secondary' } },
    include: { grades: true },
  });
  if (!stage) {
    console.error(`✗ المرحلة الثانوية غير موجودة لـ${country.nameAr}`);
    return;
  }

  console.log(`\n=== ${country.nameAr} (${code}) — ${def.stageName ?? stage.nameAr} ===`);

  // إعادة تسمية المرحلة إن طُلب (مثل: المرحلة الإعدادية في العراق)
  if (def.stageName && stage.nameAr !== def.stageName) {
    await db.stage.update({ where: { id: stage.id }, data: { nameAr: def.stageName } });
    console.log(`  ↺ أُعيدت تسمية المرحلة إلى «${def.stageName}»`);
  }

  // إعادة تسمية الصفوف حسب أسماء المسارات الرسمية
  for (const [from, to] of Object.entries(def.renames || {})) {
    const g = stage.grades.find((x) => x.nameAr === from);
    if (g) {
      await db.grade.update({ where: { id: g.id }, data: { nameAr: to } });
      g.nameAr = to;
      console.log(`  ↺ أُعيدت تسمية الصف «${from}» إلى «${to}»`);
    }
  }

  for (let gi = 0; gi < def.grades.length; gi++) {
    const gDef = def.grades[gi];
    let grade = stage.grades.find((x) => x.nameAr === gDef.name);
    if (!grade) {
      grade = await db.grade.create({
        data: { nameAr: gDef.name, stream: gDef.stream, order: gi, stageId: stage.id },
      });
      console.log(`  + أُنشئ الصف «${gDef.name}»`);
    } else if (grade.stream !== gDef.stream || grade.order !== gi) {
      await db.grade.update({
        where: { id: grade.id },
        data: { stream: gDef.stream, order: gi },
      });
    }
    await syncSubjectsForGrade(grade, gDef.subjects, gDef.name);
  }

  // حذف الصفوف القديمة غير الموجودة في الجدول الرسمي (مع حماية الصفوف التي عليها كتب)
  const freshGrades = await db.grade.findMany({
    where: { stageId: stage.id },
    include: { subjects: { include: { _count: { select: { books: true } } } } },
  });
  const keepNames = def.grades.map((g) => g.name);
  for (const g of freshGrades) {
    if (keepNames.includes(g.nameAr)) continue;
    const booksCount = g.subjects.reduce((a, s) => a + s._count.books, 0);
    if (booksCount > 0) {
      console.warn(`  ⚠ تجاهل حذف الصف «${g.nameAr}» — عليه ${booksCount} كتاب مرفوع`);
      continue;
    }
    await db.grade.delete({ where: { id: g.id } });
    console.log(`  − حُذف الصف القديم «${g.nameAr}»`);
  }
}

async function sync() {
  // الدفعة 1: السعودية + الإمارات + الكويت (المتوسطة)
  for (const [code, grades] of Object.entries(CURRICULUM)) {
    await syncMiddle(code, grades);
  }
  // الدفعة 2: قطر + البحرين + عمان (المتوسطة + الثانوية)
  for (const [code, grades] of Object.entries(MIDDLE2)) {
    await syncMiddle(code, grades);
  }
  for (const [code, def] of Object.entries(SECONDARY)) {
    if (!['YE', 'IQ', 'SY'].includes(code)) await syncSecondary(code, def);
  }
  // الدفعة 3: اليمن + العراق + سوريا (المتوسطة + الثانوية/الإعدادية)
  for (const [code, def] of Object.entries(MIDDLE3)) {
    await syncMiddle(code, def.grades, def.stageName);
  }
  for (const code of ['YE', 'IQ', 'SY']) {
    await syncSecondary(code, SECONDARY[code]);
  }
  // الدفعة 4: لبنان + الأردن + فلسطين + مصر + السودان + ليبيا + تونس + الجزائر + المغرب
  for (const [code, def] of Object.entries(MIDDLE4)) {
    await syncMiddle(code, def.grades, def);
  }
  for (const code of ['LB', 'JO', 'PS', 'EG', 'SD', 'LY', 'TN', 'DZ', 'MA']) {
    await syncSecondary(code, SECONDARY[code]);
  }
  // الدفعة 5: موريتانيا + الصومال + جيبوتي + جزر القمر
  for (const [code, def] of Object.entries(MIDDLE5)) {
    await syncMiddle(code, def.grades, def);
  }
  for (const code of ['MR', 'SO', 'DJ', 'KM']) {
    await syncSecondary(code, SECONDARY[code]);
  }
  console.log('\n✅ تمت مزامنة المواد الدراسية مع المناهج الرسمية');
}

sync()
  .catch((e) => {
    console.error('✗ فشل التزامن:', e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
