import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PDF to CMYK Converter',
  description: 'Convert your PDF files to CMYK color space',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}