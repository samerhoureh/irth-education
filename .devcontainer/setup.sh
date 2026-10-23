#!/usr/bin/env bash
# إعداد بيئة أرث التعليم العربي داخل Codespaces — تعمل تلقائياً مرة واحدة
set -e
cd "$(dirname "$0")/.."

# تثبيت bun إن لم يوجد
export PATH="$HOME/.bun/bin:$PATH"
if ! command -v bun >/dev/null 2>&1; then
  echo "📦 تثبيت bun..."
  curl -fsSL https://bun.sh/install | bash
  [ -f "$HOME/.bun/env" ] && source "$HOME/.bun/env"
fi

echo "📦 تثبيت الحزم..."
bun install

# ملف البيئة من القالب (لا يحتوي أي أسرار)
[ -f .env ] || cp .env.example .env

echo "🗄️  إنشاء قاعدة البيانات..."
bun run db:push

echo "🌱 بذر البيانات التعليمية (قد يستغرق دقيقة)..."
bun run seed:base
bun run seed:curriculum
bun run seed:culture

# حسابات تجريبية بكلمات مرور عشوائية تُطبع هنا فقط (لا تُخزَّن في المستودع)
ADMIN_PW="$(openssl rand -hex 5)"
TEACHER_PW="$(openssl rand -hex 5)"
SPONSOR_PW="$(openssl rand -hex 6)"

ADMIN_NAME="مدير المنصة (تجريبي)" ADMIN_EMAIL="admin@demo.local" ADMIN_PASSWORD="$ADMIN_PW" bun run seed:accounts
TEACHER_NAME="معلم المنصة (تجريبي)" TEACHER_EMAIL="teacher@demo.local" TEACHER_PASSWORD="$TEACHER_PW" bun run seed:accounts
SPONSOR_DEMO_PASSWORD="$SPONSOR_PW" bun run seed:sponsors

echo ""
echo "════════════════════════════════════════════════"
echo "  ✅ جاهز! حسابات تجريبية (تُطبع هنا فقط):"
echo "     🛡️  مدير:  admin@demo.local / $ADMIN_PW"
echo "     📖 معلم:  teacher@demo.local / $TEACHER_PW"
echo "════════════════════════════════════════════════"
echo "  💡 وظائف المعلم الذكي تحتاج بوابة ذكاء اصطناعي:"
echo "     عدّل AI_GATEWAY_BASE_URL و AI_GATEWAY_API_KEY في .env"
