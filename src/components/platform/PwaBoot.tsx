'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Download, Smartphone, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// PwaBoot — تسجيل عامل الخدمة + زر تنزيل التطبيق على الموبايل
export default function PwaBoot() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [iosHint, setIosHint] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // تسجيل عامل الخدمة
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    // مخفي إذا التطبيق مثبّت أصلاً (يعمل standalone)
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) return;

    // لا تعرض البانر مرة أخرى إذا رفضه المستخدم في هذه الجلسة
    if (sessionStorage.getItem('edu_install_dismissed')) return;

    const isApple = /iphone|ipad|ipod/i.test(window.navigator.userAgent);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      // نعرض البانر بعد ثوانٍ قليلة حتى لا يزعج من أول دخول
      setTimeout(() => setShowBanner(true), 4000);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // iOS لا يطلق beforeinstallprompt — نعرض إرشاد الإضافة يدوياً
    let t: ReturnType<typeof setTimeout> | undefined;
    if (isApple) {
      t = setTimeout(() => setShowBanner(true), 6000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      if (t) clearTimeout(t);
    };
  }, []);

  async function install() {
    const isApple = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    if (isApple) {
      setIosHint(true);
      return;
    }
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === 'accepted') {
      setShowBanner(false);
      sessionStorage.setItem('edu_install_dismissed', '1');
    }
    setDeferred(null);
  }

  function dismiss() {
    setShowBanner(false);
    sessionStorage.setItem('edu_install_dismissed', '1');
  }

  return (
    <AnimatePresence>
      {showBanner && !dismissed && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 26 }}
          className="fixed z-[70] inset-x-3 bottom-20 md:bottom-4 md:inset-x-auto md:end-4 md:max-w-sm"
          role="dialog"
          aria-label="تنزيل التطبيق"
        >
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-[#022c22] via-[#064e3b] to-[#022c22] border border-[#c9992b]/60 luxury-shadow-lg">
            <div className="absolute inset-0 pattern-arabesque-light opacity-[0.06]" aria-hidden />
            <div className="relative flex items-center gap-3 p-3">
              <span className="w-11 h-11 rounded-xl gold-bar flex items-center justify-center shrink-0 shadow-md">
                <Smartphone className="w-5.5 h-5.5 text-[#1a2e24]" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-white leading-5">ثبّت أرث التعليم العربي</p>
                <p className="text-[10px] text-emerald-100/75 leading-4 mt-0.5">
                  {iosHint
                    ? 'اضغط زر المشاركة ثم «إضافة إلى الشاشة الرئيسية»'
                    : 'يعمل كتطبيق كامل على موبايلك — سريع وخفيف'}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={install}
                  className="gold-bar rounded-xl h-9 px-3 flex items-center gap-1.5 text-[11px] font-black text-[#1a2e24] shadow-sm hover:brightness-105 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  تنزيل
                </button>
                <button
                  onClick={dismiss}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="إخفاء"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
