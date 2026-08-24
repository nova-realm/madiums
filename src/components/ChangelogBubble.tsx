'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import type { ChangelogData, Config } from '@/lib/types';

const NOTE_SVG = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }} aria-hidden>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const ARROW = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 11, height: 11 }} aria-hidden>
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

interface Props {
  data: ChangelogData;
  config: Config;
}

export default function ChangelogBubble({ data, config }: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const avatarFile = config.footerAvatar.split('/').pop();

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="changelog-wrap" ref={wrapRef}>
      <div className={`float-bubble changelog-bubble${open ? ' show' : ''}`} role="dialog" aria-modal="true" aria-label="Changelog">
        <div className="changelog-inner">
          <Image src={`/assets/${avatarFile}`} alt="" width={28} height={28} className="bubble-avatar" />
          <div>
            <span className="bubble-name">{config.footerName}</span>
            <span className="bubble-time">{data.timestamp}</span>
            <p className="bubble-text">{data.message.split('\n').map((line, i) => (
              <span key={i}>{line}<br /></span>
            ))}</p>
            <a
              className="bubble-contact"
              href="https://discord.com/users/244201123504717825"
              target="_blank"
              rel="noopener noreferrer"
            >
              {ARROW} Contact
            </a>
            {data.footerNote && (
              <p className="bubble-footer">{data.footerNote}</p>
            )}
          </div>
        </div>
      </div>

      <button
        className="float-btn"
        onClick={() => setOpen(v => !v)}
        aria-label="Changelog"
        aria-expanded={open}
      >
        {NOTE_SVG}
      </button>
    </div>
  );
}
