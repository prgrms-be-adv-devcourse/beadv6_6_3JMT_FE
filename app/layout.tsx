import type { Metadata } from 'next';
import './globals.css';
import ConditionalLayout from '@/components/layout/ConditionalLayout';
import MockProvider from '@/components/providers/MockProvider';
import AuthSync from '@/components/providers/AuthSync';

export const metadata: Metadata = {
  title: 'PromptHub',
  description: '프롬프트 마켓플레이스',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/variable/pretendardvariable.css"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <MockProvider>
          <AuthSync />
          <ConditionalLayout>
            {children}
          </ConditionalLayout>
        </MockProvider>
      </body>
    </html>
  );
}
