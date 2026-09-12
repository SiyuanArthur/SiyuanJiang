import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Siyuan · 个人工作台",
  description: "目标、行动、记录。把想做的事，一步一步变成现实。",
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
