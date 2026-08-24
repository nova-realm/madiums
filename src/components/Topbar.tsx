import Link from 'next/link';
import Image from 'next/image';
import type { Config } from '@/lib/types';

const DISCORD_SVG = (
  <svg viewBox="0 0 127.14 96.36" fill="currentColor" aria-hidden>
    <path d="M107.7 8.07A105.15 105.15 0 0 0 81.47 0a72.06 72.06 0 0 0-3.36 6.83 97.68 97.68 0 0 0-29.11 0A72.37 72.37 0 0 0 45.64 0a105.89 105.89 0 0 0-26.25 8.09C2.79 32.65-1.71 56.6.54 80.21a105.73 105.73 0 0 0 32.17 16.15 77.7 77.7 0 0 0 6.89-11.11 68.42 68.42 0 0 1-10.85-5.18c.91-.66 1.8-1.34 2.66-2a75.57 75.57 0 0 0 64.32 0c.87.71 1.76 1.39 2.66 2a68.68 68.68 0 0 1-10.87 5.19 77 77 0 0 0 6.89 11.1 105.25 105.25 0 0 0 32.19-16.14c2.64-27.38-4.51-51.11-18.9-72.09ZM42.45 65.69C36.18 65.69 31 60 31 53s5-12.74 11.43-12.74S54 46 53.89 53s-5.05 12.69-11.44 12.69Zm42.24 0C78.41 65.69 73.25 60 73.25 53s5-12.74 11.44-12.74S96.23 46 96.12 53s-5.04 12.69-11.43 12.69Z" />
  </svg>
);

const EXT_SVG = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="ext-icon" aria-hidden>
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

const NAV_ICONS: Record<string, React.ReactNode> = {
  home: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  qrs: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  status: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
};

interface TopbarProps {
  activePage: 'home' | 'qrs' | 'status';
  config: Config;
}

export default function Topbar({ activePage, config }: TopbarProps) {
  const pages = [
    { key: 'home',   label: 'Home',          href: '/' },
    { key: 'qrs',    label: 'Quick Replies',  href: '/qrs' },
    { key: 'status', label: 'Status',         href: '/status' },
  ] as const;

  const externals = [
    { label: 'Madium',          href: config.madiumInvite },
    { label: 'Support Server',  href: config.madiumSupportInvite },
  ];

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link href="/" className="brand">
          <Image src="/assets/logo-support.png" alt="" width={24} height={24} className="brand-img" />
          <span className="brand-name">Madium</span>
          <span className="brand-sep">/</span>
          <span className="brand-sub">Support Desk</span>
        </Link>

        <div className="topbar-divider" />

        <nav className="main-nav" aria-label="Main navigation">
          {pages.map(p => (
            <Link
              key={p.key}
              href={p.href}
              className={`nav-item${activePage === p.key ? ' active' : ''}`}
            >
              {NAV_ICONS[p.key]}
              {p.label}
            </Link>
          ))}

          <div className="nav-spacer" />

          {externals.map(e => (
            <a
              key={e.label}
              href={e.href}
              target="_blank"
              rel="noopener noreferrer"
              className="nav-item external"
            >
              {DISCORD_SVG}
              {e.label}
              {EXT_SVG}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
