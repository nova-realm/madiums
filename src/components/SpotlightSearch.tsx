'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { QR } from '@/lib/types';
import { copyText } from '@/lib/clipboard';

const SEARCH_SVG = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }} aria-hidden>
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const BOOK_SVG = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }} aria-hidden>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
);

const CHAT_SVG = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }} aria-hidden>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const ARROW_RIGHT_SVG = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 12, height: 12 }} aria-hidden>
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);

const GUIDE_ITEMS = [
  { key: 'overview', title: 'Welcome & Mission', category: 'Overview', desc: 'Support mission and staff introduction', href: '/guide?topic=overview' },
  { key: 'roles', title: 'Staff Roles & Hierarchy', category: 'Staff Roles', desc: 'Trial Support, Support, Senior Support & Lead Support expectations', href: '/guide?topic=roles' },
  { key: 'protocols', title: 'Rules, Bans & Security', category: 'Core Protocols', desc: 'Inactivity rule, bypass policies, and batch file security', href: '/guide?topic=protocols' },
  { key: 'diagnostics', title: 'Initial Diagnostic Questions', category: 'Troubleshooting Guides', desc: 'Questionnaire to ask users before guessing fixes', href: '/guide?topic=diagnostics' },
  { key: 'key-system', title: 'Key Issues & Work.ink Fix', category: 'Troubleshooting Guides', desc: 'Mobile data workaround, bypasser rules, key inquiries', href: '/guide?topic=key-system' },
  { key: 'universal', title: 'Universal Clean Fix', category: 'Troubleshooting Guides', desc: 'DeleteMadium.bat and clean reinstallation process', href: '/guide?topic=universal' },
  { key: 'bin-replacement', title: 'Corrupted Bin Replacement', category: 'Troubleshooting Guides', desc: 'Manual replacement of Bin folder from Gofile', href: '/guide?topic=bin-replacement' },
  { key: 'cloudflare', title: 'Network & Cloudflare WARP', category: 'Troubleshooting Guides', desc: 'WARP UDP mode & Windows 11 DNS-over-HTTPS resolution', href: '/guide?topic=cloudflare' },
  { key: 'antivirus', title: 'Antivirus & Firewall Rules', category: 'Troubleshooting Guides', desc: '3 exclusion folders & firewall socket rules', href: '/guide?topic=antivirus' },
  { key: 'roblox', title: 'Roblox Crashes & Launchers', category: 'Troubleshooting Guides', desc: 'Client instance injection, version mismatches, Fishstrap/Froststrap', href: '/guide?topic=roblox' },
  { key: 'webview', title: 'WebView2 Corruptions', category: 'Troubleshooting Guides', desc: 'Permissions fix & EdgeWebView folder copy workaround', href: '/guide?topic=webview' },
  { key: 'dependencies', title: 'Required Dependencies', category: 'Troubleshooting Guides', desc: 'Visual C++, .NET Desktop Runtime, DirectX web setup', href: '/guide?topic=dependencies' },
  { key: 'analysis', title: 'Generating Analysis Logs', category: 'Troubleshooting Guides', desc: 'How to collect analysis.bat log file for escalations', href: '/guide?topic=analysis' },
];

const NAV_PAGES = [
  { title: 'Home Dashboard', desc: 'Overview and recent updates', href: '/' },
  { title: 'Quick Replies Table', desc: 'Search and copy pre-written responses', href: '/qrs' },
  { title: 'Support Guide', desc: 'Full staff troubleshooting handbook', href: '/guide' },
  { title: 'Server Status', desc: 'Check live status of Madium services', href: '/status' },
];

export default function SpotlightSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [qrs, setQrs] = useState<QR[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Fetch QRs once in background for instant spotlight querying
  useEffect(() => {
    async function loadQRs() {
      try {
        let res = await fetch('https://madiums-production.up.railway.app/api/all', { cache: 'no-store' });
        if (!res.ok) res = await fetch('/api/all');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) setQrs(data.filter((q: QR) => q.enabled !== false));
        }
      } catch {
        // Ignore fallback
      }
    }
    loadQRs();
  }, []);

  // Global Ctrl+K / Cmd+K / custom event listener
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    }

    function onCustomOpen() {
      setOpen(true);
    }

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('open-spotlight', onCustomOpen);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('open-spotlight', onCustomOpen);
    };
  }, [open]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Filter items
  const filteredResults = useMemo(() => {
    const q = query.trim().toLowerCase();

    // 1. Filter Guide topics
    const matchedGuide = GUIDE_ITEMS.filter(
      (g) => !q || g.title.toLowerCase().includes(q) || g.desc.toLowerCase().includes(q) || g.key.includes(q)
    );

    // 2. Filter QRs
    const matchedQRs = qrs.filter(
      (qr) => !q || qr.id.toLowerCase().includes(q) || qr.title.toLowerCase().includes(q) || (qr.text || '').toLowerCase().includes(q)
    ).slice(0, 15);

    // 3. Filter Navigation
    const matchedNav = NAV_PAGES.filter(
      (n) => !q || n.title.toLowerCase().includes(q) || n.desc.toLowerCase().includes(q)
    );

    return {
      guide: matchedGuide,
      qrs: matchedQRs,
      nav: matchedNav,
    };
  }, [query, qrs]);

  // Flattened list for keyboard navigation
  const flatList = useMemo(() => {
    const list: { type: 'guide' | 'qr' | 'nav'; data: any }[] = [];
    filteredResults.guide.forEach((g) => list.push({ type: 'guide', data: g }));
    filteredResults.qrs.forEach((qr) => list.push({ type: 'qr', data: qr }));
    filteredResults.nav.forEach((n) => list.push({ type: 'nav', data: n }));
    return list;
  }, [filteredResults]);

  // Keep selected index in bounds
  useEffect(() => {
    if (selectedIndex >= flatList.length) {
      setSelectedIndex(0);
    }
  }, [flatList.length, selectedIndex]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  }

  async function handleSelect(item: { type: 'guide' | 'qr' | 'nav'; data: any }, e?: React.MouseEvent) {
    if (item.type === 'guide' || item.type === 'nav') {
      setOpen(false);
      router.push(item.data.href);
    } else if (item.type === 'qr') {
      const qr = item.data as QR;
      const ok = await copyText(qr.text || '');
      if (ok) {
        showToast(`Copied text for "${qr.title}"`);
      }
    }
  }

  async function handleCopyCmd(qrId: string, e: React.MouseEvent) {
    e.stopPropagation();
    const cmd = `t!qr ${qrId}`;
    const ok = await copyText(cmd);
    if (ok) {
      showToast(`Copied command "${cmd}"`);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, flatList.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + flatList.length) % Math.max(1, flatList.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const current = flatList[selectedIndex];
      if (current) {
        if (e.shiftKey && current.type === 'qr') {
          handleCopyCmd(current.data.id, e as any);
        } else {
          handleSelect(current);
        }
      }
    }
  }

  if (!open) return null;

  let runningIndex = 0;

  return (
    <div
      className="spotlight-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div className="spotlight-modal" role="dialog" aria-modal="true">
        {/* Search Header */}
        <div className="spotlight-input-wrap">
          <span className="spotlight-search-icon">{SEARCH_SVG}</span>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search Quick Replies, Guides, or jump to page..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className="spotlight-input"
          />
          <kbd className="spotlight-kbd-esc" onClick={() => setOpen(false)}>
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="spotlight-results" ref={resultsRef}>
          {flatList.length === 0 ? (
            <div className="spotlight-empty">
              <span>No results found for &ldquo;{query}&rdquo;</span>
            </div>
          ) : (
            <>
              {/* 1. Guide Topics */}
              {filteredResults.guide.length > 0 && (
                <div className="spotlight-group">
                  <div className="spotlight-group-title">
                    {BOOK_SVG} Support Guide Handbook
                  </div>
                  {filteredResults.guide.map((g) => {
                    const currentIndex = runningIndex++;
                    const isSelected = currentIndex === selectedIndex;
                    return (
                      <div
                        key={g.key}
                        className={`spotlight-item${isSelected ? ' selected' : ''}`}
                        onClick={(e) => handleSelect({ type: 'guide', data: g }, e)}
                        onMouseEnter={() => setSelectedIndex(currentIndex)}
                      >
                        <div className="spotlight-item-main">
                          <span className="spotlight-item-badge guide">Guide</span>
                          <span className="spotlight-item-title">{g.title}</span>
                          <span className="spotlight-item-desc">{g.desc}</span>
                        </div>
                        <span className="spotlight-item-action">Jump {ARROW_RIGHT_SVG}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 2. Quick Replies */}
              {filteredResults.qrs.length > 0 && (
                <div className="spotlight-group">
                  <div className="spotlight-group-title">
                    {CHAT_SVG} Quick Replies
                  </div>
                  {filteredResults.qrs.map((qr) => {
                    const currentIndex = runningIndex++;
                    const isSelected = currentIndex === selectedIndex;
                    return (
                      <div
                        key={qr.id}
                        className={`spotlight-item${isSelected ? ' selected' : ''}`}
                        onClick={(e) => handleSelect({ type: 'qr', data: qr }, e)}
                        onMouseEnter={() => setSelectedIndex(currentIndex)}
                      >
                        <div className="spotlight-item-main">
                          <button
                            type="button"
                            className="spotlight-cmd-pill"
                            onClick={(e) => handleCopyCmd(qr.id, e)}
                            title={`Copy command "t!qr ${qr.id}"`}
                          >
                            <code>t!qr {qr.id}</code>
                          </button>
                          <span className="spotlight-item-title">{qr.title}</span>
                          <span className="spotlight-item-preview">
                            {(qr.text || '').replace(/\n/g, ' ')}
                          </span>
                        </div>
                        <div className="spotlight-item-actions">
                          <button
                            type="button"
                            className="spotlight-copy-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelect({ type: 'qr', data: qr });
                            }}
                          >
                            Copy Text
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 3. Navigation Pages */}
              {filteredResults.nav.length > 0 && (
                <div className="spotlight-group">
                  <div className="spotlight-group-title">Quick Navigation</div>
                  {filteredResults.nav.map((n) => {
                    const currentIndex = runningIndex++;
                    const isSelected = currentIndex === selectedIndex;
                    return (
                      <div
                        key={n.href}
                        className={`spotlight-item${isSelected ? ' selected' : ''}`}
                        onClick={(e) => handleSelect({ type: 'nav', data: n }, e)}
                        onMouseEnter={() => setSelectedIndex(currentIndex)}
                      >
                        <div className="spotlight-item-main">
                          <span className="spotlight-item-badge page">Page</span>
                          <span className="spotlight-item-title">{n.title}</span>
                          <span className="spotlight-item-desc">{n.desc}</span>
                        </div>
                        <span className="spotlight-item-action">Open {ARROW_RIGHT_SVG}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="spotlight-footer">
          <div className="spotlight-shortcuts">
            <span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span>
            <span><kbd>Enter</kbd> Select / Copy Text</span>
            <span><kbd>Shift</kbd>+<kbd>Enter</kbd> Copy Command</span>
            <span className="spotlight-shortcut-hide-mobile"><kbd>Ctrl</kbd>+<kbd>K</kbd> Toggle</span>
          </div>
          {toast && <span className="spotlight-toast">{toast}</span>}
        </div>
      </div>
    </div>
  );
}
