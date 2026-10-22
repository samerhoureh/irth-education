import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "أرث التعليم العربي — لكل طالب عربي معلم خصوصي يدعم مسيرته التعليمية",
  description:
    "منصة أرث التعليم العربي: اختر دولتك، مرحلتك التعليمية، مادتك، وتصفح كتب مدرستك مع معلم خصوصي من بلدك يراجع دروسك بلهجته ومصطلحاته — التطبيق لا يلغي المدرسة بل يدعمها، وبرعاية داعمي الأمة.",
  keywords: ["تعليم", "كتب", "مناهج", "الدول العربية", "أرث التعليم العربي", "مرحلة متوسطة", "مرحلة ثانوية", "معلم ذكي", "رعاية"],
  authors: [{ name: "أرث التعليم العربي" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#150a20",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={`${cairo.variable} font-[family-name:var(--font-cairo)] antialiased bg-background text-foreground`}>
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
