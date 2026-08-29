'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Image from 'next/image';
import type { QR, Config } from '@/lib/types';
import { copyText } from '@/lib/clipboard';
import {
  mdToHtml,
  highlightMatch,
  getFileMeta,
  renderFileCard,
} from '@/lib/markdown';

const COPY_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="action-icon" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
const CHECK_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="action-icon" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
const CHEV_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="action-icon chev-icon" aria-hidden="true"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
const REFRESH_SVG = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ width: 14, height: 14 }}
    aria-hidden
  >
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);
const SEARCH_SVG = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ width: 14, height: 14 }}
    aria-hidden
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const SHARE_SVG = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ width: 13, height: 13 }}
    aria-hidden
  >
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);
const CLOSE_SVG = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ width: 16, height: 16 }}
    aria-hidden
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

interface Toast {
  id: number;
  msg: string;
  ok: boolean;
}

let _toastId = 0;

interface Props {
  qrs: QR[];
  config: Config;
}

export default function QRTable({ qrs, config }: Props) {
  const [items, setItems] = useState<QR[]>(qrs);
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'media'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState<Set<string>>(new Set());
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  // Mobile search popup state
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileQuery, setMobileQuery] = useState('');
  const mobileInputRef = useRef<HTMLInputElement>(null);

  const searchRef = useRef<HTMLInputElement>(null);

  // Sync prop changes if SSR data updates
  useEffect(() => {
    setItems(qrs);
  }, [qrs]);

  // Handle URL search parameters (?id=...) or hashes (#row-key) to auto-expand targeted QR
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      const targetId =
        url.searchParams.get('id') ||
        window.location.hash.replace('#row-', '').replace('#', '');

      if (targetId) {
        setExpanded(new Set([targetId]));
        setTimeout(() => {
          const el = document.getElementById(`row-${targetId}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 180);
      }
    }
  }, []);

  // Filter items
  const filtered = useMemo(() => {
    let list = items;
    if (activeFilter === 'media') {
      list = list.filter((q) => q.attachments && q.attachments.length > 0);
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((item) =>
        (item.id + ' ' + item.title + ' ' + (item.text || '')).toLowerCase().includes(q)
      );
    }
    return list;
  }, [items, activeFilter, query]);

  // Mobile live search results
  const mobileFiltered = useMemo(() => {
    if (!mobileQuery.trim()) return items.slice(0, 20);
    const q = mobileQuery.trim().toLowerCase();
    return items.filter((item) =>
      (item.id + ' ' + item.title + ' ' + (item.text || '')).toLowerCase().includes(q)
    );
  }, [items, mobileQuery]);

  // Focus mobile input on open
  useEffect(() => {
    if (mobileSearchOpen) {
      setTimeout(() => mobileInputRef.current?.focus(), 60);
    }
  }, [mobileSearchOpen]);

  /* Focus search on '/' keypress on desktop */
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (
        e.key === '/' &&
        document.activeElement !== searchRef.current &&
        !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
      if (e.key === 'Escape') {
        if (mobileSearchOpen) {
          setMobileSearchOpen(false);
        } else if (document.activeElement === searchRef.current) {
          searchRef.current?.blur();
        } else {
          setExpanded(new Set()); // collapse all
        }
      }
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [mobileSearchOpen]);

  /* Toast helper */
  const pushToast = useCallback((msg: string, ok = true) => {
    const id = ++_toastId;
    setToasts((ts) => [...ts, { id, msg, ok }]);
    setTimeout(() => setToasts((ts) => ts.filter((t) => t.id !== id)), 2200);
  }, []);

  /* In-place refresh from live API */
  async function handleRefresh() {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      let res: Response;
      try {
        res = await fetch('https://madiums-production.up.railway.app/api/all', { cache: 'no-store' });
      } catch {
        res = await fetch('/api/all', { cache: 'no-store' });
      }
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      if (Array.isArray(data)) {
        const mapped: QR[] = data.map((d: any) => ({
          id: d.key || d.id,
          title: d.title || d.key || d.id,
          text: d.desc || d.text || '',
          attachments: d.attachments || (d.attachment ? [d.attachment] : undefined),
          enabled: d.enabled !== false,
        }));
        setItems(mapped);
        pushToast('Refreshed quick replies');
      }
    } catch {
      pushToast('Failed to refresh quick replies', false);
    } finally {
      setTimeout(() => setIsRefreshing(false), 450);
    }
  }

  function toggleRow(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAndOpenSingleQR(qrId: string) {
    setExpanded(new Set([qrId]));
    setMobileSearchOpen(false);
    setMobileQuery('');
    setTimeout(() => {
      const el = document.getElementById(`row-${qrId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);
  }

  function playEasterEggSound() {
    try {
      const audio = new Audio('/assets/voicy.mp3');
      audio.currentTime = 0;
      audio.play().catch(() => {});
    } catch {}
  }

  async function handleCopy(e: React.MouseEvent, qr: QR) {
    e.stopPropagation();
    if (qr.id.toLowerCase() === 'nigga') {
      playEasterEggSound();
    }
    const ok = await copyText(qr.text || '');
    if (ok) {
      setCopied((prev) => new Set(prev).add(qr.id));
      pushToast(`Copied text for "${qr.title}"`);
      setTimeout(
        () =>
          setCopied((prev) => {
            const next = new Set(prev);
            next.delete(qr.id);
            return next;
          }),
        1600
      );
    } else {
      pushToast("Couldn't copy. Browser blocked clipboard access.", false);
    }
  }

  async function handleCopyCommand(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    if (id.toLowerCase() === 'nigga') {
      playEasterEggSound();
    }
    const cmd = `t!qr ${id}`;
    const ok = await copyText(cmd);
    if (ok) {
      setCopiedCmd(id);
      pushToast(`Copied bot command "${cmd}"`);
      setTimeout(() => setCopiedCmd(null), 1600);
    }
  }

  async function handleShareLink(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    const url = `${window.location.origin}/qrs?id=${encodeURIComponent(id)}`;
    const ok = await copyText(url);
    if (ok) {
      pushToast(`Copied direct link for "${id}"`);
    }
  }

  const avatarFile = config.modmailAvatar.split('/').pop();

  return (
    <>
      {/* Toolbar */}
      <div className="qrs-toolbar">
        <div className="toolbar-left">
          <h2>Quick Replies</h2>
          <span className="qr-count-badge">{filtered.length}</span>

          <div className="qr-filter-chips">
            <button
              type="button"
              className={`qr-filter-chip${activeFilter === 'all' ? ' active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              All
            </button>
            <button
              type="button"
              className={`qr-filter-chip${activeFilter === 'media' ? ' active' : ''}`}
              onClick={() => setActiveFilter('media')}
            >
              With Attachments
            </button>
          </div>
        </div>

        <div className="toolbar-actions">
          {expanded.size > 0 && (
            <button
              className="collapse-all-btn"
              onClick={() => setExpanded(new Set())}
            >
              Collapse all
            </button>
          )}

          <button
            className={`toolbar-icon-btn refresh-btn${isRefreshing ? ' refreshing' : ''}`}
            onClick={handleRefresh}
            title="Refresh quick replies"
            aria-label="Refresh quick replies"
            disabled={isRefreshing}
          >
            {REFRESH_SVG}
          </button>

          {/* Mobile Search Button (Visible only on mobile screens) */}
          <button
            type="button"
            className="mobile-qr-search-btn"
            onClick={() => setMobileSearchOpen(true)}
            aria-label="Search quick replies"
            title="Search quick replies"
          >
            {SEARCH_SVG}
            <span>Search</span>
          </button>

          {/* Desktop Search Bar */}
          <div className="search-wrap desktop-search-wrap">
            <svg
              className="search-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              ref={searchRef}
              className="search-input"
              type="text"
              placeholder="Search quick replies…"
              autoComplete="off"
              spellCheck={false}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search quick replies"
            />
            {query ? (
              <button
                type="button"
                className="search-clear"
                onClick={() => {
                  setQuery('');
                  searchRef.current?.focus();
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  setQuery('');
                  searchRef.current?.focus();
                }}
                aria-label="Clear search"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ width: 13, height: 13 }}
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            ) : (
              <kbd className="search-kbd-hint hide-on-mobile">/</kbd>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="qr-table" role="table" aria-label="Quick replies">
        <div className="qr-table-head" role="row">
          <span role="columnheader">Command</span>
          <span role="columnheader">Title</span>
          <span role="columnheader" />
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            {query ? (
              <>
                No results for &ldquo;<strong>{query}</strong>&rdquo;
              </>
            ) : (
              'No quick replies found.'
            )}
          </div>
        ) : (
          filtered.map((qr) => {
            const isOpen = expanded.has(qr.id);
            const isCopied = copied.has(qr.id);
            const hasText = (qr.text || '').trim().length > 0;
            const bodyHtml = hasText
              ? mdToHtml(qr.text)
              : '<div class="dc-line" style="color:var(--fg-3);font-style:italic;">No text yet.</div>';

            return (
              <div
                key={qr.id}
                className={`qr-row${isOpen ? ' expanded' : ''}`}
                id={`row-${qr.id}`}
                role="row"
                onClick={() => toggleRow(qr.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') toggleRow(qr.id);
                }}
                tabIndex={0}
                aria-expanded={isOpen}
              >
                {/* Row top */}
                <div style={{ display: 'contents' }}>
                  <div className="qr-cell qr-id" role="cell">
                    <button
                      type="button"
                      className={`qr-cmd-pill${copiedCmd === qr.id ? ' copied' : ''}`}
                      title={`Click to copy command "t!qr ${qr.id}"`}
                      onClick={(e) => handleCopyCommand(e, qr.id)}
                    >
                      <code>t!qr {qr.id}</code>
                      <span className="cmd-copy-tag">
                        {copiedCmd === qr.id ? '✓' : '⧉'}
                      </span>
                    </button>
                  </div>
                  <div
                    className="qr-cell qr-title"
                    role="cell"
                    dangerouslySetInnerHTML={{
                      __html: highlightMatch(qr.title, query),
                    }}
                  />
                  <div className="qr-cell qr-actions" role="cell">
                    <button
                      type="button"
                      className="icon-btn share-btn hide-on-mobile"
                      title="Copy direct share link"
                      aria-label="Copy direct share link"
                      onClick={(e) => handleShareLink(e, qr.id)}
                    >
                      {SHARE_SVG}
                    </button>
                    <button
                      className={`icon-btn copy-btn${isCopied ? ' copied' : ''}`}
                      title="Copy message text"
                      aria-label={`Copy text of "${qr.title}"`}
                      onClick={(e) => handleCopy(e, qr)}
                      dangerouslySetInnerHTML={{
                        __html: isCopied ? CHECK_SVG : COPY_SVG,
                      }}
                    />
                    <button
                      className="icon-btn expand-icon"
                      title={isOpen ? 'Collapse' : 'Preview'}
                      aria-label={isOpen ? 'Collapse' : 'Preview'}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleRow(qr.id);
                      }}
                      dangerouslySetInnerHTML={{ __html: CHEV_SVG }}
                    />
                  </div>
                </div>

                {/* Expandable body */}
                <div className="qr-body" hidden={!isOpen} aria-hidden={!isOpen}>
                  <div className="qr-body-inner">
                    <div className="dc-message">
                      <Image
                        src={`/assets/${avatarFile}`}
                        alt=""
                        width={36}
                        height={36}
                        className="dc-avatar"
                      />
                      <div className="dc-content">
                        <div className="dc-meta">
                          <span className="dc-name">{config.modmailName}</span>
                          <span className="dc-time">Quick Reply</span>
                        </div>
                        <div
                          className={`dc-body${hasText ? '' : ' empty'}`}
                          dangerouslySetInnerHTML={{ __html: bodyHtml }}
                        />

                        {qr.attachments && qr.attachments.length > 0 && (
                          <div className="dc-attachments">
                            {qr.attachments
                              .filter((att) => !(qr.text || '').includes(att))
                              .map((att, aIdx) => {
                                const isImg =
                                  /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(att) ||
                                  (
                                    (att.includes('cdn.discordapp.com/attachments/') || att.includes('media.discordapp.net/attachments/')) &&
                                    !/\.(txt|bat|cmd|ps1|sh|py|lua|vbs|exe|msi|dll|zip|rar|7z|tar|gz|log|json|xml|cfg|ini|pdf)(\?.*)?$/i.test(att)
                                  );
                                const isVid = /\.(mp4|webm|mov)(\?.*)?$/i.test(att);

                                if (isImg) {
                                  return (
                                    <div key={aIdx} className="dc-media-wrap">
                                      <a href={att} target="_blank" rel="noopener">
                                        <img src={att} alt="Attachment" className="dc-img" loading="lazy" />
                                      </a>
                                    </div>
                                  );
                                }
                                if (isVid) {
                                  return (
                                    <div key={aIdx} className="dc-media-wrap">
                                      <video src={att} controls className="dc-video" preload="metadata" />
                                      <div className="dc-media-link">
                                        <a href={att} target="_blank" rel="noopener">{att}</a>
                                      </div>
                                    </div>
                                  );
                                }

                                const fileMeta = getFileMeta(att);
                                if (fileMeta.isDownloadableFile) {
                                  return (
                                    <div
                                      key={aIdx}
                                      dangerouslySetInnerHTML={{
                                        __html: renderFileCard(att, fileMeta),
                                      }}
                                    />
                                  );
                                }

                                return (
                                  <div key={aIdx} className="dc-media-link">
                                    <a href={att} target="_blank" rel="noopener">{att}</a>
                                  </div>
                                );
                              })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Mobile QR Search Modal ── */}
      {mobileSearchOpen && (
        <div
          className="mobile-qr-search-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setMobileSearchOpen(false);
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className="mobile-qr-search-sheet">
            <div className="mobile-qr-search-head">
              <div className="mobile-qr-input-wrap">
                <span className="mobile-qr-icon">{SEARCH_SVG}</span>
                <input
                  ref={mobileInputRef}
                  type="text"
                  placeholder="Search e.g. rdd, crash, ask..."
                  value={mobileQuery}
                  onChange={(e) => setMobileQuery(e.target.value)}
                  className="mobile-qr-search-input"
                />
                {mobileQuery && (
                  <button
                    type="button"
                    className="mobile-qr-clear-btn"
                    onClick={() => {
                      setMobileQuery('');
                      mobileInputRef.current?.focus();
                    }}
                  >
                    {CLOSE_SVG}
                  </button>
                )}
              </div>
              <button
                type="button"
                className="mobile-qr-close-btn"
                onClick={() => setMobileSearchOpen(false)}
              >
                Cancel
              </button>
            </div>

            <div className="mobile-qr-search-results">
              {mobileFiltered.length === 0 ? (
                <div className="mobile-qr-empty">
                  No quick replies matching &ldquo;{mobileQuery}&rdquo;
                </div>
              ) : (
                mobileFiltered.map((q) => (
                  <div
                    key={q.id}
                    className="mobile-qr-result-item"
                    onClick={() => selectAndOpenSingleQR(q.id)}
                  >
                    <div className="mobile-qr-item-left">
                      <span className="mobile-qr-cmd">t!qr {q.id}</span>
                      <span className="mobile-qr-title">{q.title}</span>
                      <span className="mobile-qr-preview">
                        {(q.text || '').replace(/\n/g, ' ')}
                      </span>
                    </div>
                    <span className="mobile-qr-open-arrow">→</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toasts */}
      <div className="toast-container" aria-live="polite" aria-atomic="true">
        {toasts.map((t) => (
          <div key={t.id} className={`toast${t.ok ? '' : ' toast-error'}`}>
            {t.ok ? (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ width: 13, height: 13 }}
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ width: 13, height: 13 }}
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            )}
            {t.msg}
          </div>
        ))}
      </div>
    </>
  );
}
