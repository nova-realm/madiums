'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import type { Config } from '@/lib/types';

const GLOBE_SVG = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

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

const SEARCH_SVG = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13 }} aria-hidden>
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const CHANGELOG_SVG = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }} aria-hidden>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const MENU_SVG = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }} aria-hidden>
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const CLOSE_SVG = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }} aria-hidden>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
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
  guide: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
  status: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
};

interface TopbarProps {
  activePage: 'home' | 'qrs' | 'guide' | 'status';
  config: Config;
}

export default function Topbar({ activePage, config }: TopbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile menu on page transition
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const pages = [
    { key: 'home',   label: 'Home',          href: '/' },
    { key: 'qrs',    label: 'Quick Replies',  href: '/qrs' },
    { key: 'guide',  label: 'Guide',         href: '/guide' },
    { key: 'status', label: 'Status',         href: '/status' },
  ] as const;

  const externals = [
    { label: 'Madium',         href: config.madiumWebsite || 'https://getmadium.net/', icon: GLOBE_SVG },
    { label: 'Madium Server',  href: config.madiumInvite,                              icon: DISCORD_SVG },
    { label: 'Support Server', href: config.madiumSupportInvite,                       icon: DISCORD_SVG },
  ];

  function openSpotlight() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('open-spotlight'));
    }
  }

  function openChangelog() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('open-changelog'));
    }
  }

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand-group">
            <button
              type="button"
              className="topbar-changelog-icon-btn"
              onClick={openChangelog}
              title="Changelog & Updates"
              aria-label="Open Changelog"
            >
              {CHANGELOG_SVG}
            </button>

            <Link href="/" className="brand">
              <Image src="/assets/logo-support.png" alt="" width={24} height={24} className="brand-img" priority />
              <span className="brand-name">Madium</span>
              <span className="brand-sep">/</span>
              <span className="brand-sub">Support Desk</span>
            </Link>
          </div>

          <div className="topbar-divider" />

          {/* Desktop Navigation */}
          <nav className="main-nav desktop-nav" aria-label="Main navigation">
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

            <button
              type="button"
              className="topbar-search-btn"
              onClick={openSpotlight}
              title="Universal Search (Ctrl + K)"
              aria-label="Universal Search"
            >
              {SEARCH_SVG}
              <span className="search-btn-label">Search…</span>
              <kbd className="search-btn-kbd hide-on-mobile">
                <span>Ctrl K</span>
              </kbd>
            </button>

            <div className="nav-spacer" />

            {externals.map(e => (
              <a
                key={e.label}
                href={e.href}
                target="_blank"
                rel="noopener noreferrer"
                className="nav-item external"
              >
                {e.icon}
                {e.label}
                {EXT_SVG}
              </a>
            ))}
          </nav>

          {/* Mobile Right Controls */}
          <div className="mobile-controls">
            <button
              type="button"
              className="topbar-search-mobile-btn"
              onClick={openSpotlight}
              aria-label="Search"
              title="Universal Search"
            >
              {SEARCH_SVG}
            </button>
            <button
              type="button"
              className="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? CLOSE_SVG : MENU_SVG}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="mobile-nav-backdrop" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-nav-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-nav-head">
              <div className="mobile-nav-brand">
                <Image src="/assets/logo-support.png" alt="" width={20} height={20} />
                <span>Madium Support Menu</span>
              </div>
              <button
                type="button"
                className="mobile-nav-close"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close"
              >
                {CLOSE_SVG}
              </button>
            </div>

            <button
              type="button"
              className="mobile-search-trigger"
              onClick={() => {
                setMobileMenuOpen(false);
                openSpotlight();
              }}
            >
              {SEARCH_SVG}
              <span>Quick Search &amp; Switcher</span>
            </button>

            <div className="mobile-nav-section-title">Navigation</div>
            <div className="mobile-nav-links">
              {pages.map((p) => {
                const isActive = activePage === p.key;
                return (
                  <Link
                    key={p.key}
                    href={p.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`mobile-nav-item${isActive ? ' active' : ''}`}
                  >
                    <span className="mobile-nav-icon">{NAV_ICONS[p.key]}</span>
                    <span className="mobile-nav-label">{p.label}</span>
                    {isActive && <span className="mobile-nav-dot" />}
                  </Link>
                );
              })}
            </div>

            <div className="mobile-nav-section-title">External Links</div>
            <div className="mobile-nav-links">
              {externals.map((e) => (
                <a
                  key={e.label}
                  href={e.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMobileMenuOpen(false)}
                  className="mobile-nav-item external"
                >
                  <span className="mobile-nav-icon">{e.icon}</span>
                  <span className="mobile-nav-label">{e.label}</span>
                  {EXT_SVG}
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
