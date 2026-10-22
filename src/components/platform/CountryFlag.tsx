'use client';

import { useState } from 'react';

interface Props {
  code: string; // SY, EG ...
  flag: string; // إيموجي احتياطي
  alt?: string;
  className?: string;
}

/**
 * علم دولة بصورة محلية عالية الدقة (مع إيموجي احتياطي)
 * الأعلام محفوظة في public/flags/{code}.png
 * علم سوريا هو العلم الجديد المعتمد (أخضر-أبيض-أسود بثلاث نجوم حمراء)
 */
export default function CountryFlag({ code, flag, alt, className = '' }: Props) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span role="img" aria-label={alt || code} className={`inline-block ${className}`}>
        {flag}
      </span>
    );
  }

  return (
    <img
      src={`/flags/${code.toLowerCase()}.png`}
      alt={alt || `علم ${alt || code}`}
      onError={() => setFailed(true)}
      className={`inline-block object-cover shadow-sm ${className}`}
      loading="lazy"
      draggable={false}
    />
  );
}
