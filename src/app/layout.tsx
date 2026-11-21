import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Agro Angola',
  description: 'Ligamos agricultores a compradores em Angola',
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <body style={{ margin: 0, fontFamily: 'sans-serif', background: '#f3f7f1', color: '#222' }}>
        {children}
      </body>
    </html>
  );
}
