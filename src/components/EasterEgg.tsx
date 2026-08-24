'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import type { EasterEggData, Config } from '@/lib/types';

const ARROW = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 11, height: 11 }} aria-hidden>
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

interface Props {
  data: EasterEggData;
  config: Config;
}

export default function EasterEgg({ data, config }: Props) {
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
    <div className="egg-wrap" ref={wrapRef}>
      <div className={`float-bubble egg-bubble${open ? ' show' : ''}`} role="dialog" aria-modal="true" aria-label="Contact info">
        <Image src={`/assets/${avatarFile}`} alt="" width={28} height={28} className="bubble-avatar" />
        <div>
          <span className="bubble-name">{config.footerName}</span>
          <span className="bubble-time">{data.timestamp}</span>
          <p className="bubble-text">{data.message}</p>
          <a
            className="bubble-contact"
            href="https://discord.com/users/244201123504717825"
            target="_blank"
            rel="noopener noreferrer"
          >
            {ARROW} Contact
          </a>
        </div>
      </div>

      <button
        className="float-btn"
        onClick={() => setOpen(v => !v)}
        aria-label="Contact info"
        aria-expanded={open}
      >
        <Image src={`/assets/${avatarFile}`} alt="" width={36} height={36} className="float-btn-img" />
        <span className="float-badge" aria-hidden>
          <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: 7, height: 7 }}>
            <path d="M2 1l3 12 1.8-4.6L11 7z" />
          </svg>
        </span>
      </button>
    </div>
  );
}
