'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import type { Config } from '@/lib/types';

const BELL_SVG = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const CLOSE_SVG = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const SPARKLE_SVG = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4" />
  </svg>
);

// Custom emoji URL for changelog section headers
const CHANGELOG_EMOJI_URL = 'https://cdn.discordapp.com/emojis/1541919264594985040.webp?size=32';

interface ChangelogEntry {
  date: string;
  items: string[];
}

interface ChangelogData {
  title?: string;
  footerNote?: string;
  entries: ChangelogEntry[];
  // Legacy single-entry support
  timestamp?: string;
  message?: string;
}

interface Props {
  data: ChangelogData;
  config: Config;
}

export default function ChangelogModal({ data, config }: Props) {
  const [showToast, setShowToast] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [progress, setProgress] = useState(100);
  const animRef = useRef<number | null>(null);

  // Normalize: support both old (message) and new (entries) format
  const entries: ChangelogEntry[] = data.entries && data.entries.length > 0
    ? data.entries
    : data.message
      ? [{ date: data.timestamp || 'Today', items: data.message.split('\n').filter(Boolean) }]
      : [];

  const latestEntry = entries[0];
  // Use ISO date or title for the storage key so re-opening after new entries works
  const storageKey = `madium_changelog_seen_${data.title || 'v1'}_${latestEntry?.date || 'today'}`;
  const avatarFile = config.footerAvatar.split('/').pop() || 'avatar-lucas.jpg';

  useEffect(() => {
    try {
      const seen = localStorage.getItem(storageKey);
      if (!seen) {
        const t = setTimeout(() => setShowToast(true), 1200);
        return () => clearTimeout(t);
      }
    } catch {}
  }, [storageKey]);

  // 30-second progress countdown
  useEffect(() => {
    if (!showToast) return;
    const startTime = Date.now();
    const duration = 30000;

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (elapsed < duration) {
        animRef.current = requestAnimationFrame(tick);
      } else {
        dismissToast();
      }
    };

    animRef.current = requestAnimationFrame(tick);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showToast]);

  // Listen for "open-changelog" event from Topbar icon
  useEffect(() => {
    function handleOpen() { setModalOpen(true); dismissToast(); }
    function handleKey(e: KeyboardEvent) { if (e.key === 'Escape' && modalOpen) setModalOpen(false); }
    window.addEventListener('open-changelog', handleOpen);
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('open-changelog', handleOpen);
      window.removeEventListener('keydown', handleKey);
    };
  }, [modalOpen]);

  function dismissToast() {
    setShowToast(false);
    try { localStorage.setItem(storageKey, 'true'); } catch {}
  }

  function handleToastClick(e: React.MouseEvent) {
    if ((e.target as HTMLElement).closest('.cl-toast-close')) return;
    dismissToast();
    setModalOpen(true);
  }

  // Teaser: first item of the latest entry
  const teaser = latestEntry?.items[0] ?? 'Check out what is new in Madium Support Desk!';
  const teaserClean = teaser.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[*_~`]/g, '');

  return (
    <>
      {/* ── 30-Second Floating Toast ── */}
      {showToast && (
        <div
          className="cl-toast"
          role="status"
          aria-live="polite"
          onClick={handleToastClick}
          title="Click to view full changelog"
        >
          <div className="cl-toast-glow" />
          <div className="cl-toast-inner">
            <div className="cl-toast-avatar-box">
              <Image
                src={`/assets/${avatarFile}`}
                alt={config.footerName}
                width={36}
                height={36}
                className="cl-toast-avatar"
              />
              <span className="cl-toast-online" />
            </div>

            <div className="cl-toast-content">
              <div className="cl-toast-meta">
                <span className="cl-toast-author">{config.footerName}</span>
                <span className="cl-toast-badge">DEV</span>
                <span className="cl-toast-time">{latestEntry?.date ?? 'Today'}</span>
              </div>
              <p className="cl-toast-text">
                <span className="cl-toast-tag">New Updates:</span> {teaserClean}
              </p>
              <span className="cl-toast-cta">Click to view full changelog →</span>
            </div>

            <button
              type="button"
              className="cl-toast-close"
              onClick={(e) => { e.stopPropagation(); dismissToast(); }}
              title="Dismiss notification"
              aria-label="Dismiss notification"
            >
              {CLOSE_SVG}
            </button>
          </div>

          <div className="cl-toast-progress-track">
            <div className="cl-toast-progress-bar" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* ── Full Changelog Modal ── */}
      {modalOpen && (
        <div
          className="cl-modal-backdrop"
          onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}
          role="presentation"
        >
          <div
            className="cl-modal-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cl-modal-title"
          >
            {/* Header */}
            <div className="cl-modal-header">
              <div className="cl-modal-title-wrap">
                <div className="cl-modal-icon-badge">{BELL_SVG}</div>
                <div>
                  <h3 id="cl-modal-title" className="cl-modal-title">
                    {data.title || 'Changelog & Updates'}
                  </h3>
                  <span className="cl-modal-subtitle">What is new on the Madium Support Platform</span>
                </div>
              </div>
              <button
                type="button"
                className="cl-modal-close-btn"
                onClick={() => setModalOpen(false)}
                aria-label="Close modal"
              >
                {CLOSE_SVG}
              </button>
            </div>

            {/* Body — multiple dated sections */}
            <div className="cl-modal-body">
              <div className="cl-author-card">
                <Image
                  src={`/assets/${avatarFile}`}
                  alt={config.footerName}
                  width={42}
                  height={42}
                  className="cl-author-avatar"
                />
                <div className="cl-author-info">
                  <div className="cl-author-row">
                    <span className="cl-author-name">{config.footerName}</span>
                    <span className="cl-dev-pill">DEV</span>
                  </div>
                  <span className="cl-author-role">Project Maintainer & Lead</span>
                </div>
              </div>

              <div className="cl-entries">
                {entries.map((entry, idx) => (
                  <div key={idx} className="cl-entry">
                    {/* Date header with custom emoji — styled like Discord ## heading */}
                    <div className="cl-entry-header">
                      <Image
                        src={CHANGELOG_EMOJI_URL}
                        alt="changelog"
                        width={22}
                        height={22}
                        className="cl-entry-emoji"
                        unoptimized
                      />
                      <h4 className="cl-entry-date">{entry.date}</h4>
                    </div>
                    <ul className="cl-entry-list">
                      {entry.items.map((item, i) => (
                        <li key={i} className="cl-entry-item">{item}</li>
                      ))}
                    </ul>
                    {idx < entries.length - 1 && <div className="cl-entry-divider" />}
                  </div>
                ))}
              </div>

              {data.footerNote && (
                <div className="cl-footer-note">
                  <span className="cl-footer-sparkle">{SPARKLE_SVG}</span>
                  <p>{data.footerNote}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="cl-modal-footer">
              <span className="cl-dismiss-hint">Press [Esc] or click background to close</span>
              <button
                type="button"
                className="cl-modal-done-btn"
                onClick={() => setModalOpen(false)}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
