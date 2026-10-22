// Service Worker — أرث التعليم العربي
// استراتيجية آمنة: الشبكة أولاً لكل الطلبات (تضمن دائماً أحدث نسخة)،
// مع ذاكرة احتياطية للعمل دون اتصال، وذاكرة أولى للأيقونات والأعلام الثابتة.
const CACHE = 'arab-edu-v2';
const PRECACHE = [
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/manifest.webmanifest',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // لا نعترض طلبات الإدارة أو الملفات المرفوعة أو عارض الكتب
  if (url.pathname.startsWith('/api/admin')) return;
  if (url.pathname.startsWith('/api/books')) return;

  // أصول ثابتة لا تتغير: أيقونات وأعلام — ذاكرة أولاً
  if (url.pathname.startsWith('/icons') || url.pathname.startsWith('/flags')) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
            return res;
          })
      )
    );
    return;
  }

  // بقية الطلبات (صفحات، chunks، api، كتب): الشبكة أولاً مع احتياطي الذاكرة دون اتصال
  event.respondWith(
    fetch(req)
      .then((res) => {
        // نخزّن الأصول الثابتة والصفحات فقط (ليس نتائج API المتغيرة)
        if (res.ok && !url.pathname.startsWith('/api/')) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req))
  );
});
