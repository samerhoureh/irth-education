// ═══ باقات دعم التعليم العربي — أرث التعليم العربي ═══
// القاعدة الثابتة: كل 100 دولار = 200 حساب طالب (الدولار يوفّر حسابين)
export interface SponsorPackage {
  key: 'BRONZE' | 'SILVER' | 'GOLD';
  nameAr: string;
  descAr: string;
  amountUsd: number;
  studentsCount: number;
  icon: string;
}

export const SPONSOR_PACKAGES: SponsorPackage[] = [
  {
    key: 'BRONZE',
    nameAr: 'الباقة البرونزية',
    descAr: 'بداية عطاء تدفّق ضوء المعرفة إلى مئتي طالب',
    amountUsd: 100,
    studentsCount: 200,
    icon: '🥉',
  },
  {
    key: 'SILVER',
    nameAr: 'الباقة الفضية',
    descAr: 'رعاية موسّعة تفتح أبواب الأرث لنصف ألف طالب',
    amountUsd: 250,
    studentsCount: 500,
    icon: '🥈',
  },
  {
    key: 'GOLD',
    nameAr: 'الباقة الذهبية',
    descAr: 'منحة فخمة تجعل ألف طالب من أبناء الأمة شركاء في النور',
    amountUsd: 500,
    studentsCount: 1000,
    icon: '🥇',
  },
];

export function packageByKey(key: string): SponsorPackage | undefined {
  return SPONSOR_PACKAGES.find((p) => p.key === key);
}

// تسميات حالات الطلب
export const STATUS_LABELS: Record<string, string> = {
  PENDING: 'قيد المراجعة',
  APPROVED: 'مقبولة ✅',
  REJECTED: 'مرفوضة',
};
