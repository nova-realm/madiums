'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import type { QR, Config } from '@/lib/types';
import { mdToHtml, highlightMatch } from '@/lib/markdown';
import { copyText } from '@/lib/clipboard';

/* ── Icons ── */
const COPY_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
const CHECK_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
const CHEV_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`;

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
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState<Set<string>>(new Set());
  const [toasts, setToasts] = useState<Toast[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);

  const filtered = query.trim()
    ? qrs.filter(q =>
        (q.id + ' ' + q.title).toLowerCase().includes(query.trim().toLowerCase())
      )
    : qrs;

  /* Cmd/Ctrl+K → focus search */
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
      if (e.key === 'Escape') {
        if (document.activeElement === searchRef.current) {
          searchRef.current?.blur();
        } else {
          setExpanded(new Set()); // collapse all
        }
      }
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  /* Toast helper */
  const pushToast = useCallback((msg: string, ok = true) => {
    const id = ++_toastId;
    setToasts(ts => [...ts, { id, msg, ok }]);
    setTimeout(() => setToasts(ts => ts.filter(t => t.id !== id)), 2200);
  }, []);

  function toggleRow(id: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleCopy(e: React.MouseEvent, qr: QR) {
    e.stopPropagation();
    const ok = await copyText(qr.text || '');
    if (ok) {
      setCopied(prev => new Set(prev).add(qr.id));
      pushToast('Copied to clipboard');
      setTimeout(() => setCopied(prev => {
        const next = new Set(prev);
        next.delete(qr.id);
        return next;
      }), 1600);
    } else {
      pushToast("Couldn't copy. Browser blocked clipboard access.", false);
    }
  }

  const avatarFile = config.modmailAvatar.split('/').pop();

  return (
    <>
      {/* Toolbar */}
      <div className="qrs-toolbar">
        <h2>Quick Replies</h2>
        <span className="qr-count-badge">{filtered.length}</span>
        <div className="search-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={searchRef}
            className="search-input"
            type="text"
            placeholder="Search…"
            autoComplete="off"
            spellCheck={false}
            value={query}
            onChange={e => setQuery(e.target.value)}
            aria-label="Search quick replies"
          />
          {query && (
            <button
              className="search-clear"
              onClick={() => { setQuery(''); searchRef.current?.focus(); }}
              aria-label="Clear search"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13 }}>
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
        {expanded.size > 0 && (
          <button className="collapse-all-btn" onClick={() => setExpanded(new Set())}>
            Collapse all
          </button>
        )}
      </div>

      {/* Table */}
      <div className="qr-table" role="table" aria-label="Quick replies">
        <div className="qr-table-head" role="row">
          <span role="columnheader">ID</span>
          <span role="columnheader">Title</span>
          <span role="columnheader" />
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            {query ? <>No results for &ldquo;<strong>{query}</strong>&rdquo;</> : 'No quick replies.'}
          </div>
        ) : (
          filtered.map(qr => {
            const isOpen = expanded.has(qr.id);
            const isCopied = copied.has(qr.id);
            const hasText = (qr.text || '').trim().length > 0;
            const bodyHtml = hasText ? mdToHtml(qr.text) : '<div class="dc-line" style="color:var(--fg-3);font-style:italic;">No text yet.</div>';

            return (
              <div
                key={qr.id}
                className={`qr-row${isOpen ? ' expanded' : ''}`}
                id={`row-${qr.id}`}
                role="row"
                onClick={() => toggleRow(qr.id)}
                onKeyDown={e => { if (e.key === 'Enter') toggleRow(qr.id); }}
                tabIndex={0}
                aria-expanded={isOpen}
              >
                {/* Row top */}
                <div style={{ display: 'contents' }}>
                  <div className="qr-cell qr-id" role="cell">{qr.id}</div>
                  <div
                    className="qr-cell qr-title"
                    role="cell"
                    dangerouslySetInnerHTML={{ __html: highlightMatch(qr.title, query) }}
                  />
                  <div className="qr-cell qr-actions" role="cell">
                    <button
                      className={`icon-btn copy-btn${isCopied ? ' copied' : ''}`}
                      title="Copy to clipboard"
                      aria-label={`Copy "${qr.title}"`}
                      onClick={e => handleCopy(e, qr)}
                      dangerouslySetInnerHTML={{ __html: isCopied ? CHECK_SVG : COPY_SVG }}
                    />
                    <button
                      className="icon-btn expand-icon"
                      title={isOpen ? 'Collapse' : 'Preview'}
                      aria-label={isOpen ? 'Collapse' : 'Preview'}
                      onClick={e => { e.stopPropagation(); toggleRow(qr.id); }}
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
                          <span className="dc-time">Today</span>
                        </div>
                        <div
                          className={`dc-body${hasText ? '' : ' empty'}`}
                          dangerouslySetInnerHTML={{ __html: bodyHtml }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Toasts */}
      <div className="toast-container" aria-live="polite" aria-atomic="true">
        {toasts.map(t => (
          <div key={t.id} className={`toast${t.ok ? '' : ' toast-error'}`}>
            {t.ok ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13 }}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13 }}>
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            )}
            {t.msg}
          </div>
        ))}
      </div>
    </>
  );
}
