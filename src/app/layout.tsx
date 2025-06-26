import type { ReactNode } from 'react';
// import { Inter } from 'next/font/google';
import './globals.css';
import 'src/style/main.scss';
import ClientProviders from './ClientProviders';

export const metadata = {
  title: '킨더보드 : 교사의 시간이 가치가 되는 공간',
  description: '교사의 시간을 교사의 가치로 만들어드립니다.',
  icons: {
    icon: '/favicon.png',
  },
};

// const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: ReactNode;
  modal: ReactNode;
}>) {
  return (
    <html lang="ko">
      <head />
      <body>
        <ClientProviders>
          {children}
          {modal}
        </ClientProviders>
        <div id="modal-root" />
      </body>
    </html>
  );
}
