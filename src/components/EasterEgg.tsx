'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import type { EasterEggData, Config } from '@/lib/types';

const EGG_SVG = (
  <svg
    viewBox="0 0 24 28"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="hidden-egg-icon"
    aria-hidden
  >
    <path
      d="M12 2C6.5 2 3 9.5 3 17C3 22.5 7 26 12 26C17 26 21 22.5 21 17C21 9.5 17.5 2 12 2Z"
      fill="currentColor"
      fillOpacity="0.2"
    />
    <path d="M12 2C6.5 2 3 9.5 3 17C3 22.5 7 26 12 26C17 26 21 22.5 21 17C21 9.5 17.5 2 12 2Z" />
    <path d="M7 16C8.5 17.5 10 18 12 18C14 18 15.5 17.5 17 16" strokeDasharray="2 2" />
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
    style={{ width: 14, height: 14 }}
    aria-hidden
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const ARROW_SVG = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ width: 12, height: 12 }}
    aria-hidden
  >
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

function triggerConfetti() {
  if (typeof window === 'undefined') return;

  const existing = document.getElementById('easter-egg-confetti');
  if (existing) existing.remove();

  const canvas = document.createElement('canvas');
  canvas.id = 'easter-egg-confetti';
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '999999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = (canvas.width = window.innerWidth);
  const height = (canvas.height = window.innerHeight);

  const colors = [
    '#f59e0b',
    '#ec4899',
    '#8b5cf6',
    '#3b82f6',
    '#10b981',
    '#ef4444',
    '#06b6d4',
    '#eab308',
    '#a855f7',
  ];

  interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
    rotation: number;
    vRot: number;
    opacity: number;
    shape: 'rect' | 'circle';
  }

  const particles: Particle[] = [];
  const count = 160;

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 5 + Math.random() * 14;
    particles.push({
      x: width / 2 + (Math.random() - 0.5) * 120,
      y: height * 0.5 + (Math.random() - 0.5) * 80,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 6,
      size: 6 + Math.random() * 8,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      vRot: (Math.random() - 0.5) * 18,
      opacity: 1,
      shape: Math.random() > 0.35 ? 'rect' : 'circle',
    });
  }

  let animationFrameId: number;
  const startTime = Date.now();

  function render() {
    if (!ctx) return;
    const elapsed = Date.now() - startTime;
    ctx.clearRect(0, 0, width, height);

    let active = false;

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.26; // gravity
      p.vx *= 0.985; // friction
      p.rotation += p.vRot;

      if (elapsed > 1800) {
        p.opacity -= 0.022;
      }

      if (p.opacity > 0 && p.y < height + 60) {
        active = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillStyle = p.color;

        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    }

    if (active && elapsed < 4200) {
      animationFrameId = requestAnimationFrame(render);
    } else {
      cancelAnimationFrame(animationFrameId);
      canvas.remove();
    }
  }

  animationFrameId = requestAnimationFrame(render);
}

interface Props {
  data: EasterEggData;
  config: Config;
}

export default function EasterEgg({ data, config }: Props) {
  const [open, setOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const avatarFile = config.footerAvatar.split('/').pop();

  function handleEggClick() {
    setOpen(true);
    triggerConfetti();
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <>
      {/* ── Tiny Hidden Transparent Egg Trigger (placed in bottom left corner) ── */}
      <button
        type="button"
        className="hidden-egg-trigger"
        onClick={handleEggClick}
        title="???"
        aria-label="Secret Easter Egg"
      >
        {EGG_SVG}
      </button>

      {/* ── Easter Egg Popup Modal & Backdrop ── */}
      {open && (
        <div
          className="egg-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div
            className="egg-modal-card"
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-label="Secret message"
          >
            <button
              type="button"
              className="egg-modal-close"
              onClick={() => setOpen(false)}
              aria-label="Close"
            >
              {CLOSE_SVG}
            </button>

            <div className="egg-modal-header">
              <span className="egg-pill">🥚 Easter Egg Found!</span>
              <span className="egg-modal-time">{data.timestamp}</span>
            </div>

            <div className="egg-modal-body">
              <div className="egg-author-row">
                <Image
                  src={`/assets/${avatarFile}`}
                  alt=""
                  width={38}
                  height={38}
                  className="egg-avatar"
                />
                <div className="egg-author-info">
                  <span className="egg-author-name">{config.footerName}</span>
                  <span className="egg-author-sub">Project Creator</span>
                </div>
              </div>

              <blockquote className="egg-quote-message">
                &ldquo;{data.message}&rdquo;
              </blockquote>
            </div>

            <div className="egg-modal-footer">
              <a
                href="https://discord.com/users/244201123504717825"
                target="_blank"
                rel="noopener noreferrer"
                className="egg-contact-btn"
              >
                Contact via Discord {ARROW_SVG}
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
