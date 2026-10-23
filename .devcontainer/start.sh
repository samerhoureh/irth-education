#!/usr/bin/env bash
# تشغيل خادم التطوير تلقائياً عند فتح البيئة
export PATH="$HOME/.bun/bin:$PATH"
[ -f "$HOME/.bun/env" ] && source "$HOME/.bun/env"
cd "$(dirname "$0")/.."

# إن كان الخادم يعمل فلا تشغّل نسخة ثانية
if curl -s --max-time 3 http://localhost:3000 >/dev/null 2>&1; then
  echo "✅ الخادم يعمل بالفعل — المعاينة على منفذ 3000 (تبويب Ports بالأسفل)"
  exit 0
fi

echo "🚀 تشغيل خادم التطوير في الخلفية..."
nohup bun run dev > /tmp/arth-dev.log 2>&1 &

for i in $(seq 1 30); do
  if curl -s --max-time 2 http://localhost:3000 >/dev/null 2>&1; then
    echo ""
    echo "════════════════════════════════════════════════"
    echo "  ✅ أرث التعليم العربي يعمل الآن!"
    echo "  👈 افتح تبويب Ports بالأسفل واضغط على المنفذ 3000"
    echo "════════════════════════════════════════════════"
    exit 0
  fi
  sleep 1
done

echo "⚠️  الخادم لم يستجب بعد — راجع السجل: tail /tmp/arth-dev.log"
