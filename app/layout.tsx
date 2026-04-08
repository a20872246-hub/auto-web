import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ITN Fitness 안내방송 시스템',
  description: 'ITN Fitness 헬스장 자동 안내방송 관리 시스템',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-slate-900 text-slate-100 antialiased min-h-screen">{children}</body>
    </html>
  );
}
