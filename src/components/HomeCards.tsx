import Link from 'next/link';
import type { Config } from '@/lib/types';

interface Props {
  config: Config;
  qrCount: number;
}

const CHAT_SVG = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const BOOK_SVG = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
);

const PULSE_SVG = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const DISCORD_SVG = (
  <svg viewBox="0 0 127.14 96.36" fill="currentColor" aria-hidden>
    <path d="M107.7 8.07A105.15 105.15 0 0 0 81.47 0a72.06 72.06 0 0 0-3.36 6.83 97.68 97.68 0 0 0-29.11 0A72.37 72.37 0 0 0 45.64 0a105.89 105.89 0 0 0-26.25 8.09C2.79 32.65-1.71 56.6.54 80.21a105.73 105.73 0 0 0 32.17 16.15 77.7 77.7 0 0 0 6.89-11.11 68.42 68.42 0 0 1-10.85-5.18c.91-.66 1.8-1.34 2.66-2a75.57 75.57 0 0 0 64.32 0c.87.71 1.76 1.39 2.66 2a68.68 68.68 0 0 1-10.87 5.19 77 77 0 0 0 6.89 11.1 105.25 105.25 0 0 0 32.19-16.14c2.64-27.38-4.51-51.11-18.9-72.09ZM42.45 65.69C36.18 65.69 31 60 31 53s5-12.74 11.43-12.74S54 46 53.89 53s-5.05 12.69-11.44 12.69Zm42.24 0C78.41 65.69 73.25 60 73.25 53s5-12.74 11.44-12.74S96.23 46 96.12 53s-5.04 12.69-11.43 12.69Z" />
  </svg>
);

const QUESTION_SVG = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const ARROW_SVG = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="card-arrow-icon" aria-hidden>
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const EXT_SVG = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="card-arrow-icon" aria-hidden>
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

export default function HomeCards({ config, qrCount }: Props) {
  return (
    <div className="home-cards">
      <Link href="/qrs" className="home-card" id="card-qrs">
        <div className="home-card-icon">{CHAT_SVG}</div>
        <h3>Quick Replies</h3>
        <p>Pre-written responses for common support tickets. Copy and paste directly.</p>
        <div className="home-card-arrow">
          <span>{qrCount} replies</span>
          {ARROW_SVG}
        </div>
      </Link>

      <Link href="/guide" className="home-card" id="card-guide">
        <div className="home-card-icon">{BOOK_SVG}</div>
        <h3>Support Guide</h3>
        <p>Staff handbook, team roles, troubleshooting playbooks, and Cloudflare routing.</p>
        <div className="home-card-arrow">
          <span>Read handbook</span>
          {ARROW_SVG}
        </div>
      </Link>

      <Link href="/status" className="home-card" id="card-status">
        <div className="home-card-icon">{PULSE_SVG}</div>
        <h3>Status</h3>
        <p>Live status of Madium and its support services.</p>
        <div className="home-card-arrow">
          <span>View status</span>
          {ARROW_SVG}
        </div>
      </Link>

      <a href={config.madiumInvite} className="home-card" id="card-discord" target="_blank" rel="noopener noreferrer">
        <div className="home-card-icon">{DISCORD_SVG}</div>
        <h3>Madium Server</h3>
        <p>Join the main Madium community server.</p>
        <div className="home-card-arrow">
          <span>Open Discord</span>
          {EXT_SVG}
        </div>
      </a>

      <a href={config.madiumSupportInvite} className="home-card" id="card-support" target="_blank" rel="noopener noreferrer">
        <div className="home-card-icon">{QUESTION_SVG}</div>
        <h3>Support Server</h3>
        <p>The Madium support Discord server.</p>
        <div className="home-card-arrow">
          <span>Open Discord</span>
          {EXT_SVG}
        </div>
      </a>
    </div>
  );
}
