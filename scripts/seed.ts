/**
 * تعبئة قاعدة البيانات: الدول العربية + المراحل + الصفوف + المواد
 * البنية: دولة → مرحلة (متوسطة/ثانوية) → صف دراسي → مواد
 * تشغيل: bun run scripts/seed.ts
 */
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

interface CountrySeed {
  code: string;
  nameAr: string;
  flag: string;
  region: string;
  culturePersona: string;
  curriculumNote: string;
}

// الدول العربية الـ22 مع الشخصية الثقافية لكل دولة للنموذج الذكي
const COUNTRIES: CountrySeed[] = [
  {
    code: 'SY', nameAr: 'سوريا', flag: '🇸🇾', region: 'بلاد الشام',
    culturePersona:
      'تتكلم بلهجة شامية دافئة قريبة من قلب الطالب، وتستخدم تعابير شامية مشجعة مثل «شو حلو!» و«يا سلام عليك» و«استمر يا بطل». تستشهد بأمثلة من دمشق وحلب وريف سوريا، وتذكر تراث سوريا العريق مثل دمشق القديمة وأزقة الشام.',
    curriculumNote: 'المنهج السوري المعتمد من وزارة التربية والتعليم السورية',
  },
  {
    code: 'LB', nameAr: 'لبنان', flag: '🇱🇧', region: 'بلاد الشام',
    culturePersona:
      'تتكلم بلهجة لبنانية لطيفة وتستخدم تعابير مثل «يا حلو» و«برافو» و«شو هيدا الذكاء!». تستخدم أمثلة من بيروت وأرز الرب وجبل لبنان، وتلمّح بلمسة لطيفة لطبيعة لبنان وأشجار الأرز والبحر المتوسط.',
    curriculumNote: 'المنهج اللبناني المعتمد من وزارة التربية والتعليم العالي اللبنانية',
  },
  {
    code: 'JO', nameAr: 'الأردن', flag: '🇯🇴', region: 'بلاد الشام',
    culturePersona:
      'تتكلم بلهجة أردنية أصيلة وتستخدم تعابير مثل «يا سلام» و«الله يعطيك العافية» و«شاطر يا صاحبي». تستخدم أمثلة من عمان ووادي رم والبتراء ووادي الأردن.',
    curriculumNote: 'المنهج الأردني المعتمد من وزارة التربية والتعليم الأردنية',
  },
  {
    code: 'PS', nameAr: 'فلسطين', flag: '🇵🇸', region: 'بلاد الشام',
    culturePersona:
      'تتكلم بلهجة فلسطينية دافئة وتستخدم تعابير مثل «يا سلام عليك» و«استمر يا بطل» و«شاطر». تستخدم أمثلة من القدس ويافا وزيتون فلسطين، والزيتون رمز الصبر والعزيمة.',
    curriculumNote: 'المنهج الفلسطيني المعتمد من وزارة التربية والتعليم الفلسطينية',
  },
  {
    code: 'IQ', nameAr: 'العراق', flag: '🇮🇶', region: 'بلاد الشام والمشرق',
    culturePersona:
      'تتكلم بلهجة عراقية حانية وتستخدم تعابير مثل «شلونك» و«زين!» و«هواية» و«يا وحش». تستخدم أمثلة من بغداد ونهر دجلة والفرات وبلاد الرافدين مهد ابن سينا والخوارزمي.',
    curriculumNote: 'المنهج العراقي المعتمد من وزارة التربية العراقية',
  },
  {
    code: 'EG', nameAr: 'مصر', flag: '🇪🇬', region: 'شمال أفريقيا ووادي النيل',
    culturePersona:
      'تتكلم بلهجة مصرية بسيطة وقريبة وتستخدم تعابير مثل «يا بطل» و«جامد!» و«برافو عليك» و«تمام يا معلم». تستخدم أمثلة من القاهرة والنيل والأهرامات والإسكندرية.',
    curriculumNote: 'المنهج المصري المعتمد من وزارة التربية والتعليم المصرية',
  },
  {
    code: 'SD', nameAr: 'السودان', flag: '🇸🇩', region: 'وادي النيل',
    culturePersona:
      'تتكلم بلهجة سودانية طيبة وتستخدم تعابير مثل «يا سلام» و«برافو عليك» و«زين». تستخدم أمثلة من الخرطوم والنيل الأزرق والأبيض وحضارة كوش والمروي.',
    curriculumNote: 'المنهج السوداني المعتمد من وزارة التربية السودانية',
  },
  {
    code: 'LY', nameAr: 'ليبيا', flag: '🇱🇾', region: 'شمال أفريقيا',
    culturePersona:
      'تتكلم بلهجة ليبية بسيطة وتستخدم تعابير مثل «يا سلام» و«شاطر» و«الله يوفقك». تستخدم أمثلة من طرابلس وبنغازي والصحراء الليبية والبحر المتوسط.',
    curriculumNote: 'المنهج الليبي المعتمد من وزارة التعليم الليبية',
  },
  {
    code: 'TN', nameAr: 'تونس', flag: '🇹🇳', region: 'المغرب العربي',
    culturePersona:
      'تتكلم بفصحى مبسطة مع لمسة تونسية وتستخدم تعابير مثل «برافو» و«باهي!» و«ممتاز يا صاحبي». تستخدم أمثلة من تونس العاصمة وقرطاج والمدينة العتيقة وسيدي بوسعيد.',
    curriculumNote: 'المنهج التونسي المعتمد من وزارة التربية التونسية',
  },
  {
    code: 'DZ', nameAr: 'الجزائر', flag: '🇩🇿', region: 'المغرب العربي',
    culturePersona:
      'تتكلم بفصحى مبسطة مع لمسة جزائرية وتستخدم تعابير مثل «برافو عليك» و«صحّت» و«ممتاز». تستخدم أمثلة من الجزائر العاصمة والأوراس والصحراء الجزائرية وأسواق القصبة.',
    curriculumNote: 'المنهج الجزائري المعتمد من وزارة التربية الوطنية الجزائرية',
  },
  {
    code: 'MA', nameAr: 'المغرب', flag: '🇲🇦', region: 'المغرب العربي',
    culturePersona:
      'تتكلم بفصحى مبسطة مع لمسة مغربية وتستخدم تعابير مثل «برافو» و«الله يوفقك يا صاحبي» و«ممتاز». تستخدم أمثلة من فاس ومراكش والصويرة وأزقة المدينة القديمة.',
    curriculumNote: 'المنهج المغربي المعتمد من وزارة التربية الوطنية المغربية',
  },
  {
    code: 'MR', nameAr: 'موريتانيا', flag: '🇲🇷', region: 'المغرب العربي وغرب أفريقيا',
    culturePersona:
      'تتكلم بفصحى مبسطة مع لمسة حسانية وتستخدم تعابير مثل «برافو» و«الله يبارك فيك» و«ممتاز». تستخدم أمثلة من نواكشوط والصحراء الموريتانية ومدينة شنقيط التاريخية.',
    curriculumNote: 'المنهج الموريتاني المعتمد من وزارة التربية الوطنية الموريتانية',
  },
  {
    code: 'SA', nameAr: 'السعودية', flag: '🇸🇦', region: 'الخليج والجزيرة العربية',
    culturePersona:
      'تتكلم بلهجة سعودية واضحة وتستخدم تعابير مثل «يا سلام» و«الله يعطيك القوة» و«كفو عليك!» و«تميزت». تستخدم أمثلة من الرياض وجدة والمنطقة الشرقية وصحراء الربع الخالي.',
    curriculumNote: 'المنهج السعودي المعتمد من وزارة التعليم السعودية',
  },
  {
    code: 'AE', nameAr: 'الإمارات', flag: '🇦🇪', region: 'الخليج العربي',
    culturePersona:
      'تتكلم بلهجة إماراتية لطيفة وتستخدم تعابير مثل «يا شاطر» و«حلو كثير» و«الله يوفقك». تستخدم أمثلة من أبوظبي ودبي والشارقة والخليج العربي و النخيل.',
    curriculumNote: 'المنهج الإماراتي المعتمد من وزارة التربية والتعليم الإماراتية',
  },
  {
    code: 'QA', nameAr: 'قطر', flag: '🇶🇦', region: 'الخليج العربي',
    culturePersona:
      'تتكلم بلهجة قطرية بسيطة وتستخدم تعابير مثل «يا سلام» و«شاطر» و«الله يوفقك». تستخدم أمثلة من الدوحة وكورنيش الدوحة وخليج قطر.',
    curriculumNote: 'المنهج القطري المعتمد من وزارة التعليم والتعليم العالي القطرية',
  },
  {
    code: 'KW', nameAr: 'الكويت', flag: '🇰🇼', region: 'الخليج العربي',
    culturePersona:
      'تتكلم بلهجة كويتية حانية وتستخدم تعابير مثل «يا سلام» و«حلو!» و«شاطر» و«الله يوفقك». تستخدم أمثلة من مدينة الكويت والخليج العربي وسوق المباركية.',
    curriculumNote: 'المنهج الكويتي المعتمد من وزارة التربية الكويتية',
  },
  {
    code: 'BH', nameAr: 'البحرين', flag: '🇧🇭', region: 'الخليج العربي',
    culturePersona:
      'تتكلم بلهجة بحرينة ودودة وتستخدم تعابير مثل «يا سلام» و«شاطر» و«برافو عليك». تستخدم أمثلة من المنامة وشجرة الحياة وخليج البحرين.',
    curriculumNote: 'المنهج البحريني المعتمد من وزارة التربية والتعليم البحرينية',
  },
  {
    code: 'OM', nameAr: 'عمان', flag: '🇴🇲', region: 'الخليج العربي وجنوب الجزيرة',
    culturePersona:
      'تتكلم بلهجة عمانية بسيطة وتستخدم تعابير مثل «يا سلام» و«شاطر» و«الله يحفظك». تستخدم أمثلة من مسقط وصلالة ووادي بني خالد ولبان عمان التاريخي.',
    curriculumNote: 'المنهج العماني المعتمد من وزارة التربية والتعليم العمانية',
  },
  {
    code: 'YE', nameAr: 'اليمن', flag: '🇾🇪', region: 'جنوب الجزيرة العربية',
    culturePersona:
      'تتكلم بلهجة يمنية أصيلة وتستخدم تعابير مثل «يا سلام» و«شاطر يا ابني» و«الله يوفقك». تستخدم أمثلة من صنعاء القديمة وسقطرى وسور صنعاء وتراث اليمن العريق.',
    curriculumNote: 'المنهج اليمني المعتمد من وزارة التربية اليمنية',
  },
  {
    code: 'SO', nameAr: 'الصومال', flag: '🇸🇴', region: 'القرن الأفريقي',
    culturePersona:
      'تتكلم بفصحى مبسطة مع لمسة صومالية ودودة وتستخدم تعابير مثل «برافو» و«الله يوفقك» و«ممتاز». تستخدم أمثلة من مقديشو والبحر الصومالي وشواطئ المحيط الهندي.',
    curriculumNote: 'المنهج الصومالي المعتمد من وزارة التربية الصومالية',
  },
  {
    code: 'DJ', nameAr: 'جيبوتي', flag: '🇩🇯', region: 'القرن الأفريقي',
    culturePersona:
      'تتكلم بفصحى مبسطة مع لمسة جيبوتية ودودة وتستخدم تعابير مثل «برافو» و«الله يوفقك» و«ممتاز». تستخدم أمثلة من جيبوتي العاصمة وخليج تجابورا وبحرها الدافئ.',
    curriculumNote: 'المنهج الجيبوتي المعتمد من وزارة التربية الوطنية الجيبوتية',
  },
  {
    code: 'KM', nameAr: 'جزر القمر', flag: '🇰🇲', region: 'المحيط الهندي',
    culturePersona:
      'تتكلم بفصحى مبسطة مع لمسة قمرية ودودة وتستخدم تعابير مثل «برافو» و«الله يوفقك» و«ممتاز». تستخدم أمثلة من موروني وجزر القمر الأربع وجمال المحيط الهندي.',
    curriculumNote: 'المنهج القمري المعتمد من وزارة التربية الوطنية القمرية',
  },
];

// بطاقات المواد (اسم + إيموجي + لون)
const SUBJ: Record<string, { icon: string; color: string }> = {
  'اللغة العربية': { icon: '📖', color: '#0d9488' },
  'الرياضيات': { icon: '🔢', color: '#d97706' },
  'العلوم': { icon: '🔬', color: '#059669' },
  'اللغة الإنجليزية': { icon: '🌐', color: '#dc2626' },
  'الاجتماعيات': { icon: '🗺️', color: '#7c3aed' },
  'التربية الإسلامية': { icon: '🕌', color: '#15803d' },
  'الحاسوب': { icon: '💻', color: '#b45309' },
  'الفيزياء': { icon: '⚛️', color: '#0891b2' },
  'الكيمياء': { icon: '🧪', color: '#16a34a' },
  'الأحياء': { icon: '🧬', color: '#65a30d' },
  'التاريخ': { icon: '📜', color: '#92400e' },
  'الجغرافيا': { icon: '🌍', color: '#4d7c0f' },
  'الفلسفة': { icon: '🤔', color: '#6d28d9' },
};

function subs(names: string[]) {
  return names.map((n) => ({ nameAr: n, icon: SUBJ[n].icon, color: SUBJ[n].color }));
}

// مواد الصفوف
const MIDDLE_SUBJECTS = subs([
  'اللغة العربية', 'الرياضيات', 'العلوم', 'اللغة الإنجليزية', 'الاجتماعيات', 'التربية الإسلامية', 'الحاسوب',
]);
const GRADE10_SUBJECTS = subs([
  'اللغة العربية', 'الرياضيات', 'الفيزياء', 'الكيمياء', 'الأحياء', 'اللغة الإنجليزية', 'التاريخ', 'الجغرافيا', 'الحاسوب',
]);
const SCIENTIFIC_SUBJECTS = subs([
  'اللغة العربية', 'الرياضيات', 'الفيزياء', 'الكيمياء', 'الأحياء', 'اللغة الإنجليزية', 'الحاسوب',
]);
const LITERARY_SUBJECTS = subs([
  'اللغة العربية', 'الرياضيات', 'الفلسفة', 'التاريخ', 'الجغرافيا', 'اللغة الإنجليزية', 'التربية الإسلامية',
]);

// الصفوف داخل كل مرحلة
const MIDDLE_GRADES = [
  { nameAr: 'الأول المتوسط', stream: 'NONE', subjects: MIDDLE_SUBJECTS },
  { nameAr: 'الثاني المتوسط', stream: 'NONE', subjects: MIDDLE_SUBJECTS },
  { nameAr: 'الثالث المتوسط', stream: 'NONE', subjects: MIDDLE_SUBJECTS },
];
const SECONDARY_GRADES = [
  { nameAr: 'صف العاشر', stream: 'NONE', subjects: GRADE10_SUBJECTS },
  { nameAr: 'الحادي عشر (أدبي)', stream: 'LITERARY', subjects: LITERARY_SUBJECTS },
  { nameAr: 'الحادي عشر (علمي)', stream: 'SCIENTIFIC', subjects: SCIENTIFIC_SUBJECTS },
  { nameAr: 'الثاني عشر (أدبي)', stream: 'LITERARY', subjects: LITERARY_SUBJECTS },
  { nameAr: 'الثاني عشر (علمي)', stream: 'SCIENTIFIC', subjects: SCIENTIFIC_SUBJECTS },
];

const STAGES = [
  { key: 'middle', nameAr: 'المرحلة المتوسطة', descAr: 'الأول والثاني والثالث المتوسط', icon: '🎒', grades: MIDDLE_GRADES },
  { key: 'secondary', nameAr: 'المرحلة الثانوية', descAr: 'العاشر والحادي عشر والثاني عشر', icon: '🎓', grades: SECONDARY_GRADES },
];

// الترتيب الرسمي للدول: مجلس التعاون الخليجي أولاً (من السعودية) ثم اليمن
// ثم بلاد الشام ثم وادي النيل ثم المغرب العربي ثم القرن الأفريقي
const COUNTRY_ORDER: string[] = [
  'SA', 'AE', 'KW', 'QA', 'BH', 'OM', // مجلس التعاون الخليجي
  'YE', // جنوب الجزيرة العربية
  'IQ', 'SY', 'LB', 'JO', 'PS', // بلاد الشام والمشرق
  'EG', 'SD', // وادي النيل
  'LY', 'TN', 'DZ', 'MA', 'MR', // المغرب العربي
  'SO', 'DJ', 'KM', // القرن الأفريقي والمحيط الهندي
];

const countryOrderOf = (code: string): number => {
  const idx = COUNTRY_ORDER.indexOf(code);
  return idx >= 0 ? idx : COUNTRY_ORDER.length + code.charCodeAt(0);
};

async function main() {
  console.log('🌱 بدء تعبئة البيانات...');

  for (let i = 0; i < COUNTRIES.length; i++) {
    const c = COUNTRIES[i];
    const order = countryOrderOf(c.code);
    const country = await db.country.upsert({
      where: { code: c.code },
      update: {
        nameAr: c.nameAr,
        flag: c.flag,
        region: c.region,
        culturePersona: c.culturePersona,
        curriculumNote: c.curriculumNote,
        order,
      },
      create: { ...c, order },
    });

    for (const stage of STAGES) {
      const st = await db.stage.upsert({
        where: { countryId_key: { countryId: country.id, key: stage.key } },
        update: { nameAr: stage.nameAr, descAr: stage.descAr, icon: stage.icon },
        create: {
          countryId: country.id,
          key: stage.key,
          nameAr: stage.nameAr,
          descAr: stage.descAr,
          icon: stage.icon,
        },
      });

      for (let g = 0; g < stage.grades.length; g++) {
        const gr = stage.grades[g];
        const grade = await db.grade.upsert({
          where: { stageId_nameAr: { stageId: st.id, nameAr: gr.nameAr } },
          update: { stream: gr.stream, order: g },
          create: { stageId: st.id, nameAr: gr.nameAr, stream: gr.stream, order: g },
        });

        for (const subject of gr.subjects) {
          await db.subject.upsert({
            where: { gradeId_nameAr: { gradeId: grade.id, nameAr: subject.nameAr } },
            update: { icon: subject.icon, color: subject.color },
            create: {
              gradeId: grade.id,
              nameAr: subject.nameAr,
              icon: subject.icon,
              color: subject.color,
            },
          });
        }
      }
    }
    console.log(`  ✔ ${c.flag} ${c.nameAr}`);
  }

  const counts = {
    countries: await db.country.count(),
    stages: await db.stage.count(),
    grades: await db.grade.count(),
    subjects: await db.subject.count(),
  };
  console.log('✅ اكتملت التعبئة:', counts);
}

main()
  .catch((e) => {
    console.error('❌ خطأ في التعبئة:', e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
