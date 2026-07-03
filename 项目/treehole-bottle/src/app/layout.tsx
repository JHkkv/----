import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "树洞漂流瓶 — 把你的不开心送走",
  description: "匿名写下心事投入大海，捡起别人的漂流瓶给予温暖的回应。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-sea-deep overflow-hidden font-sans text-gold-light antialiased">
        {children}
      </body>
    </html>
  );
}
