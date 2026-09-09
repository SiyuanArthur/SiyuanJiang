import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Siyuan 的个人空间",
  description: "日常计划、随手写作、档案收藏与技能筆记。",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hans">
      <body className="antialiased">{children}</body>
    </html>
  );
}
