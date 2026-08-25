import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import Footer from '@/components/Footer';
import EasterEgg from '@/components/EasterEgg';
import config from '@data/config.json';
import eggData from '@data/easter-egg.json';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'Madium Support Desk', template: '%s, Madium Support' },
  description: 'Quick replies and resources for the Madium support team.',
  icons: { icon: '/assets/logo-support.png', shortcut: '/assets/logo-support.png' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body>
        {children}
        <Footer config={config} />
        <EasterEgg data={eggData} config={config} />
      </body>
    </html>
  );
}
