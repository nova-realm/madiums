'use client';

import { useState, useEffect, useMemo } from 'react';
import type { QR } from '@/lib/types';
import { copyText } from '@/lib/clipboard';

/* ── SVG Icons ── */
const CLOUDFLARE_SVG = (
  <svg viewBox="0 0 24 24" fill="currentColor" className="cf-icon" aria-hidden>
    <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95C8.08 7.14 9.94 6 12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11c1.6.1 2.78 1.41 2.78 2.96 0 1.65-1.35 3-3 3z"/>
  </svg>
);

const EXT_SVG = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ext-icon" aria-hidden>
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

const COPY_SVG = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13 }} aria-hidden>
    <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);

const CHECK_SVG = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13 }} aria-hidden>
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const SHIELD_SVG = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const TOOL_SVG = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
  </svg>
);

const USERS_SVG = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const BOOK_SVG = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
);

const ALERT_SVG = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

const ARROW_RIGHT_SVG = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }} aria-hidden>
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>
);

const ARROW_LEFT_SVG = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }} aria-hidden>
    <line x1="19" y1="12" x2="5" y2="12"/>
    <polyline points="12 19 5 12 12 5"/>
  </svg>
);

export type GuideTopicKey =
  | 'overview'
  | 'roles'
  | 'protocols'
  | 'diagnostics'
  | 'key-system'
  | 'universal'
  | 'bin-replacement'
  | 'cloudflare'
  | 'antivirus'
  | 'roblox'
  | 'webview'
  | 'dependencies'
  | 'analysis';

interface NavTopic {
  key: GuideTopicKey;
  title: string;
  category: 'Overview' | 'Staff Roles' | 'Core Protocols' | 'Troubleshooting Guides';
}

const TOPICS: NavTopic[] = [
  { key: 'overview',        title: 'Welcome & Mission',           category: 'Overview' },
  { key: 'roles',           title: 'Roles & Hierarchy',           category: 'Staff Roles' },
  { key: 'protocols',       title: 'Rules, Bans & Security',      category: 'Core Protocols' },
  { key: 'diagnostics',     title: 'Initial Diagnostic Questions', category: 'Troubleshooting Guides' },
  { key: 'key-system',      title: 'Key Issues & Work.ink Fix',   category: 'Troubleshooting Guides' },
  { key: 'universal',       title: 'Universal Clean Fix',         category: 'Troubleshooting Guides' },
  { key: 'bin-replacement', title: 'Corrupted Bin Replacement',   category: 'Troubleshooting Guides' },
  { key: 'cloudflare',      title: 'Network & Cloudflare WARP',   category: 'Troubleshooting Guides' },
  { key: 'antivirus',       title: 'Antivirus & Firewall Rules',  category: 'Troubleshooting Guides' },
  { key: 'roblox',          title: 'Roblox Crashes & Launchers',  category: 'Troubleshooting Guides' },
  { key: 'webview',         title: 'WebView2 Corruptions',        category: 'Troubleshooting Guides' },
  { key: 'dependencies',    title: 'Required Dependencies',       category: 'Troubleshooting Guides' },
  { key: 'analysis',        title: 'Generating Analysis Logs',    category: 'Troubleshooting Guides' },
];

interface Props {
  qrs: QR[];
}

export default function GuideContent({ qrs }: Props) {
  const [activeTopic, setActiveTopic] = useState<GuideTopicKey>('overview');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');

  // Sync URL topic on initial load or popstate
  useEffect(() => {
    const parseUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const queryTopic = params.get('topic')?.toLowerCase();
      if (queryTopic) {
        const match = TOPICS.find((t) => t.key === queryTopic);
        if (match) {
          setActiveTopic(match.key);
          return;
        }
      }

      const hash = window.location.hash.replace('#', '').toLowerCase();
      if (hash) {
        const match = TOPICS.find((t) => t.key === hash);
        if (match) {
          setActiveTopic(match.key);
          return;
        }
      }

      setActiveTopic('overview');
    };

    parseUrl();
    window.addEventListener('popstate', parseUrl);
    window.addEventListener('hashchange', parseUrl);
    return () => {
      window.removeEventListener('popstate', parseUrl);
      window.removeEventListener('hashchange', parseUrl);
    };
  }, []);

  function switchTopic(key: GuideTopicKey) {
    setActiveTopic(key);
    const newUrl = key === 'overview' ? '/guide' : `/guide?topic=${key}`;
    window.history.pushState({ topic: key }, '', newUrl);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleCopy(key: string, text: string) {
    const ok = await copyText(text);
    if (ok) {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1800);
    }
  }

  // Fast QR helper
  const qrMap = useMemo(() => {
    const map = new Map<string, QR>();
    qrs.forEach((q) => map.set(q.id.toLowerCase(), q));
    return map;
  }, [qrs]);

  // Current topic index & navigation items
  const currentIndex = TOPICS.findIndex((t) => t.key === activeTopic);
  const prevTopic = currentIndex > 0 ? TOPICS[currentIndex - 1] : null;
  const nextTopic = currentIndex < TOPICS.length - 1 ? TOPICS[currentIndex + 1] : null;

  // Filter topics for the sidebar search
  const filteredTopics = useMemo(() => {
    if (!searchFilter) return TOPICS;
    const q = searchFilter.toLowerCase();
    return TOPICS.filter((t) => t.title.toLowerCase().includes(q) || t.key.includes(q));
  }, [searchFilter]);

  // Group filtered topics by category
  const categories = useMemo(() => {
    const map = new Map<string, NavTopic[]>();
    filteredTopics.forEach((t) => {
      if (!map.has(t.category)) map.set(t.category, []);
      map.get(t.category)!.push(t);
    });
    return Array.from(map.entries());
  }, [filteredTopics]);

  function renderMacro(qrKey: string, customTitle?: string) {
    const qr = qrMap.get(qrKey.toLowerCase());
    const text = qr?.text || '';
    if (!text) return null;

    const title = customTitle || qr?.title || `Macro: ${qrKey}`;

    return (
      <div className="macro-card">
        <div className="macro-card-head">
          <div className="macro-badge">
            <code>/{qrKey}</code>
          </div>
          <span className="macro-title">{title}</span>
          <button
            type="button"
            className="code-copy-btn"
            onClick={() => handleCopy(qrKey, text)}
          >
            {copiedKey === qrKey ? CHECK_SVG : COPY_SVG}{' '}
            {copiedKey === qrKey ? 'Copied' : 'Copy Macro'}
          </button>
        </div>
        <div className="macro-card-body">
          <pre className="code-snippet">{text}</pre>
        </div>
      </div>
    );
  }

  return (
    <div className="doc-layout">
      {/* ── Left Sidebar Navigation ── */}
      <aside className="doc-sidebar" aria-label="Guide topics">
        <div className="doc-sidebar-header">
          <span className="doc-badge">Support Docs</span>
          <span className="doc-sidebar-title">Troubleshooting &amp; Operations</span>
          <div className="doc-sidebar-search">
            <input
              type="text"
              placeholder="Filter topics…"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="doc-filter-input"
            />
          </div>
        </div>

        <nav className="doc-nav">
          {categories.map(([category, items]) => (
            <div key={category} className="doc-nav-group">
              <span className="doc-nav-heading">
                {category === 'Overview' && BOOK_SVG}
                {category === 'Staff Roles' && USERS_SVG}
                {category === 'Core Protocols' && SHIELD_SVG}
                {category === 'Troubleshooting Guides' && TOOL_SVG}
                {category}
              </span>
              {items.map((topic) => {
                const isActive = activeTopic === topic.key;
                return (
                  <button
                    key={topic.key}
                    type="button"
                    onClick={() => switchTopic(topic.key)}
                    className={`doc-nav-link${isActive ? ' active' : ''}`}
                  >
                    {topic.title}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>

      {/* ── Main Content View ── */}
      <div className="doc-content">
        {/* TOPIC 1: WELCOME & OVERVIEW */}
        {activeTopic === 'overview' && (
          <div className="doc-page-view">
            <header className="doc-hero">
              <span className="doc-pill">Support Operations</span>
              <h1 className="doc-title">Madium Support Team Guide</h1>
              <p className="doc-subtitle">
                Welcome to the team! As a support member, you are our frontline for resolving user issues, diagnosing client corruptions, and upholding community standards.
              </p>
            </header>

            <section className="doc-section">
              <div className="doc-quote-card">
                <span className="quote-label">Our Mission</span>
                <p>
                  &ldquo;Provide timely &amp; professional support to members and users that exceeds their expectations while maintaining our community standards.&rdquo;
                </p>
              </div>

              <div className="doc-category-cards">
                <button type="button" className="doc-cat-card" onClick={() => switchTopic('roles')}>
                  <div className="cat-card-icon">{USERS_SVG}</div>
                  <div className="cat-card-content">
                    <h3>Staff Roles &amp; Hierarchy</h3>
                    <p>Learn team responsibilities, trial evaluation criteria, and leadership duties.</p>
                  </div>
                </button>

                <button type="button" className="doc-cat-card" onClick={() => switchTopic('protocols')}>
                  <div className="cat-card-icon">{SHIELD_SVG}</div>
                  <div className="cat-card-content">
                    <h3>Rules &amp; Security Protocols</h3>
                    <p>Understand user rules, 10-minute inactivity thresholds, and blacklist criteria.</p>
                  </div>
                </button>

                <button type="button" className="doc-cat-card" onClick={() => switchTopic('diagnostics')}>
                  <div className="cat-card-icon">{TOOL_SVG}</div>
                  <div className="cat-card-content">
                    <h3>Step 1: Diagnostics</h3>
                    <p>The standard questionnaire to ask users before suggesting troubleshooting steps.</p>
                  </div>
                </button>

                <button type="button" className="doc-cat-card" onClick={() => switchTopic('key-system')}>
                  <div className="cat-card-icon">{TOOL_SVG}</div>
                  <div className="cat-card-content">
                    <h3>Key Issues &amp; Work.ink</h3>
                    <p>Handle key bypass attempts, work.ink link issues, and key generation inquiries.</p>
                  </div>
                </button>
              </div>
            </section>
          </div>
        )}

        {/* TOPIC 2: STAFF ROLES */}
        {activeTopic === 'roles' && (
          <div className="doc-page-view">
            <header className="doc-hero">
              <span className="doc-pill">Staff Structure</span>
              <h1 className="doc-title">Roles &amp; Responsibilities</h1>
              <p className="doc-subtitle">
                Clear expectations and authority across the support ladder.
              </p>
            </header>

            <section className="doc-section">
              <div className="roles-grid">
                {/* Trial Support */}
                <div className="role-card">
                  <div className="role-card-header">
                    <span className="role-badge badge-trial">
                      <span className="badge-dot" /> Trial Support
                    </span>
                    <span className="role-id">Level 1 • Training Phase</span>
                  </div>
                  <p className="role-summary">
                    You are in your trial phase, learning how to diagnose and resolve user issues.
                  </p>
                  <ul className="role-list">
                    <li>
                      <strong>Willingness to Learn:</strong> Be open to feedback and instructions from Support and Seniors.
                    </li>
                    <li>
                      <strong className="highlight-text">Ticket Observation:</strong> In your initial period, you are <strong>not allowed to answer tickets directly</strong> unless explicitly permitted by a Senior or Lead Support.
                    </li>
                    <li>
                      <strong>Take Notes:</strong> Observe senior staff handling tickets, learn common macro triggers, and study this guide.
                    </li>
                  </ul>
                </div>

                {/* Support */}
                <div className="role-card">
                  <div className="role-card-header">
                    <span className="role-badge badge-support">
                      <span className="badge-dot" /> Support
                    </span>
                    <span className="role-id">Level 2 • Frontline</span>
                  </div>
                  <p className="role-summary">
                    You have passed trial and are an official frontline support member.
                  </p>
                  <ul className="role-list">
                    <li>
                      <strong>Ticket Handling:</strong> Be active in tickets, claim them promptly, and diagnose issues accurately.
                    </li>
                    <li>
                      <strong>Ticket Responsibility:</strong> After claiming a ticket, see it through to resolution. Avoid jumping between tickets without finishing them.
                    </li>
                    <li>
                      <strong>Macro Usage:</strong> Use predefined macros (<code>/ask</code>, <code>/universal</code>, <code>/vpn</code>, <code>/key</code>) appropriately.
                    </li>
                  </ul>
                </div>

                {/* Senior Support */}
                <div className="role-card">
                  <div className="role-card-header">
                    <span className="role-badge badge-senior">
                      <span className="badge-dot" /> Senior Support (UNCS)
                    </span>
                    <span className="role-id">Level 3 • Supervisors</span>
                  </div>
                  <p className="role-summary">
                    Experienced staff responsible for guidance, escalations, and moderation.
                  </p>
                  <ul className="role-list">
                    <li>
                      <strong>Guidance &amp; Mentorship:</strong> Guide Trial Supports and Supports through complex edge cases.
                    </li>
                    <li>
                      <strong>Complex Issues:</strong> Take over unresolvable tickets, inspect custom logs, and communicate with developers.
                    </li>
                    <li>
                      <strong>Ticket Supervision:</strong> Ensure support tickets adhere to professionalism and closing protocols.
                    </li>
                  </ul>
                </div>

                {/* Lead Support */}
                <div className="role-card">
                  <div className="role-card-header">
                    <span className="role-badge badge-lead">
                      <span className="badge-dot" /> Lead Support
                    </span>
                    <span className="role-id">Level 4 • Department Lead</span>
                  </div>
                  <p className="role-summary">
                    Executive team leaders managing team operations, policies, and blacklists.
                  </p>
                  <ul className="role-list">
                    <li>
                      <strong>Team Management:</strong> Oversee overall support performance, promotions, and rule enforcements.
                    </li>
                    <li>
                      <strong>Escalation Management:</strong> Manage Blacklist / Ban requests based on provided proof.
                    </li>
                    <li>
                      <strong className="highlight-text alert">External Fix Approval:</strong> Review and approve any unofficial fixes (batch files) before distribution. <strong>Do not allow unapproved fixes.</strong>
                    </li>
                  </ul>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* TOPIC 3: CORE PROTOCOLS */}
        {activeTopic === 'protocols' && (
          <div className="doc-page-view">
            <header className="doc-hero">
              <span className="doc-pill">Staff Standards</span>
              <h1 className="doc-title">Core Protocols &amp; Rules</h1>
              <p className="doc-subtitle">
                Rules of conduct, blacklisting thresholds, and file distribution security.
              </p>
            </header>

            <section className="doc-section">
              <div className="callout callout-important">
                <div className="callout-icon">{ALERT_SVG}</div>
                <div className="callout-body">
                  <h4>Golden Rule of Support</h4>
                  <p>
                    Never ask users for sensitive personal information, passwords, or security keys.
                    Only distribute verified batch files hosted on approved domains.
                  </p>
                </div>
              </div>

              <h3>Rules, Strikes &amp; Blacklisting</h3>
              <p className="doc-p">
                Support staff have the right to close tickets and deny service under the following conditions:
              </p>
              <ul className="step-list">
                <li>
                  <strong>Abusive / Toxic Behavior:</strong> Users insulting staff or screaming in caps should be given 1 warning.
                  If continued, close the ticket with a note and report to a Senior for a server mute/ban.
                </li>
                <li>
                  <strong>Link Bypassing / Ad Fraud:</strong> If a user admits to bypassing monetized download links or demands support
                  after bypassing, use the <code>bypasser</code> quick reply and deny support.
                </li>
                <li>
                  <strong>Inactivity (10 Minute Rule):</strong> Use the <code>?</code> quick reply. If no response is received within 10 minutes,
                  the ticket can be safely closed.
                </li>
              </ul>

              <h3>Inactivity &amp; Patience Macros</h3>
              {renderMacro('?', 'Inactivity Check (10 Minute Rule)')}
              {renderMacro('wait', 'Patient Review Message')}
              {renderMacro('unfixable', 'Final Recommendation / Unfixable')}

              <h3>External Fixes &amp; Batch File Security</h3>
              <div className="callout callout-warning">
                <div className="callout-icon">{SHIELD_SVG}</div>
                <div className="callout-body">
                  <h4>Strict Security Directive</h4>
                  <p>
                    <strong>Do NOT distribute custom .bat, .exe, or .ps1 files created by yourself or third parties</strong> unless
                    they are listed in the official quick reply database or explicitly signed off by a Lead Support.
                  </p>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* TOPIC 4: DIAGNOSTIC QUESTIONS */}
        {activeTopic === 'diagnostics' && (
          <div className="doc-page-view">
            <header className="doc-hero">
              <span className="doc-pill">Step 1: Diagnostics</span>
              <h1 className="doc-title">Initial Diagnostic Questions</h1>
              <p className="doc-subtitle">
                Standard questions to ask when diagnosing unknown technical issues.
              </p>
            </header>

            <section className="doc-section">
              <div className="playbook-card">
                <div className="playbook-header">
                  <span className="playbook-badge">Macro: ask</span>
                  <h3>Diagnostic Questionnaire</h3>
                </div>
                <p>
                  Before guessing fixes, always send the standard diagnostic questions (Macro: <code>ask</code>) to gather essential system context:
                </p>
                {renderMacro('ask', 'Diagnostic Questions Macro')}
              </div>
            </section>
          </div>
        )}

        {/* TOPIC 5: KEY ISSUES & WORK.INK */}
        {activeTopic === 'key-system' && (
          <div className="doc-page-view">
            <header className="doc-hero">
              <span className="doc-pill">Authentication &amp; Links</span>
              <h1 className="doc-title">Key Issues &amp; Work.ink Fix</h1>
              <p className="doc-subtitle">
                Resolving key system failures, work.ink mobile data workaround, and bypasser policies.
              </p>
            </header>

            <section className="doc-section">
              <div className="playbook-card">
                <div className="playbook-header">
                  <span className="playbook-badge">Macro: key</span>
                  <h3>Key Generation Inquiries</h3>
                </div>
                <p>
                  Support staff <strong>cannot generate keys</strong> for users manually. If a user asks for a key, send:
                </p>
                {renderMacro('key', 'Key System Policy')}
              </div>

              <div className="playbook-card" style={{ marginTop: 16 }}>
                <div className="playbook-header">
                  <span className="playbook-badge">Macro: workink</span>
                  <h3>Work.ink Link Not Working Fix</h3>
                </div>
                <p>
                  If a user gets blocked or stuck on work.ink links:
                </p>
                <ol className="step-list">
                  <li>Have the user open the link on their mobile phone.</li>
                  <li><strong>Switch to Mobile Data</strong> (ensure Wi-Fi is completely turned OFF).</li>
                  <li>Use a mobile browser without ad-blockers and ensure VPNs are disabled.</li>
                  <li>Once the key/download link is generated, copy and send it to their PC.</li>
                </ol>
                {renderMacro('workink', 'Work.ink Mobile Data Workaround')}
              </div>

              <div className="playbook-card" style={{ marginTop: 16 }}>
                <div className="playbook-header">
                  <span className="playbook-badge">Macro: bypasser</span>
                  <h3>Link Bypasser Policy</h3>
                </div>
                <p>
                  If a user admits to bypassing ads or using bypass extensions:
                </p>
                {renderMacro('bypasser', 'Refusal of Support for Link Bypassers')}
              </div>
            </section>
          </div>
        )}

        {/* TOPIC 6: UNIVERSAL CLEAN FIX */}
        {activeTopic === 'universal' && (
          <div className="doc-page-view">
            <header className="doc-hero">
              <span className="doc-pill">Universal Procedure</span>
              <h1 className="doc-title">Universal Clean Fix &amp; Reset</h1>
              <p className="doc-subtitle">
                Fresh reset procedure for resolving persistent injector failures and corruptions.
              </p>
            </header>

            <section className="doc-section">
              <div className="playbook-card">
                <div className="playbook-header">
                  <span className="playbook-badge">Macro: universal</span>
                  <h3>Clean Reinstallation Steps</h3>
                </div>
                <p>
                  When a user experiences persistent injector failures, corrupted configs, or unknown crashes:
                </p>
                <ol className="step-list">
                  <li>Ensure all Roblox and Madium processes are fully closed in Task Manager.</li>
                  <li>
                    Download and run the official <strong>DeleteMadium.bat</strong> cleaner:
                    <br />
                    <a
                      href="https://cdn.discordapp.com/attachments/1486055444223885375/1525183311784312953/DeleteMadium.bat"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="doc-resource-link"
                    >
                      DeleteMadium.bat {EXT_SVG}
                    </a>
                    <span className="text-muted"> (Warn user: saves and tabs in editor will be reset).</span>
                  </li>
                  <li>Temporarily disable third-party antivirus shields or add folder exclusions.</li>
                  <li>Run the <strong>Madium Installer</strong> as Administrator.</li>
                </ol>
                {renderMacro('universal', 'Universal Clean Fix Macro')}
              </div>
            </section>
          </div>
        )}

        {/* TOPIC 7: CORRUPTED BIN REPLACEMENT */}
        {activeTopic === 'bin-replacement' && (
          <div className="doc-page-view">
            <header className="doc-hero">
              <span className="doc-pill">Binary Replacement</span>
              <h1 className="doc-title">Corrupted Bin Replacement</h1>
              <p className="doc-subtitle">
                Manual replacement of damaged or missing injector binary files.
              </p>
            </header>

            <section className="doc-section">
              <div className="playbook-card">
                <div className="playbook-header">
                  <span className="playbook-badge">Macro: bin</span>
                  <h3>Bin Folder Replacement Steps</h3>
                </div>
                <p>
                  If injector binaries inside <code>%localappdata%/Madium/Bin</code> are corrupted, locked, or missing:
                </p>
                <ol className="step-list">
                  <li>Press <code>Windows Key + R</code>, type <code>%localappdata%/Madium</code>, and press Enter.</li>
                  <li>Delete the existing <code>Bin</code> folder inside.</li>
                  <li>
                    Download and extract the latest Bin folder from Gofile:{' '}
                    <a
                      href="https://gofile.io/d/ySADPi"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="doc-resource-link"
                    >
                      gofile.io/d/ySADPi {EXT_SVG}
                    </a>
                  </li>
                  <li>Drag and drop the extracted <code>Bin</code> folder into the Madium directory.</li>
                  <li>Restart Madium and test injecting.</li>
                </ol>
                {renderMacro('bin', 'Bin Folder Replacement Macro')}
              </div>
            </section>
          </div>
        )}

        {/* TOPIC 8: CLOUDFLARE WARP */}
        {activeTopic === 'cloudflare' && (
          <div className="doc-page-view">
            <header className="doc-hero">
              <span className="doc-pill">Network &amp; Routing</span>
              <h1 className="doc-title">Network Errors &amp; Cloudflare WARP</h1>
              <p className="doc-subtitle">
                Resolve connection timeouts, backend ratelimits, and ISP routing blocks.
              </p>
            </header>

            <section className="doc-section">
              <div className="playbook-card">
                <div className="playbook-header">
                  <span className="playbook-badge">Macro: vpn / lastresort</span>
                  <h3>Cloudflare WARP &amp; DNS over HTTPS Solution</h3>
                </div>
                <p>
                  If a user encounters network errors, backend ratelimits, or ISP blocking:
                </p>

                <div className="cloudflare-feature-box">
                  <div className="cf-box-header">
                    <div className="cf-title-wrap">
                      {CLOUDFLARE_SVG}
                      <div>
                        <h4>Recommended Solution: Cloudflare WARP</h4>
                        <span className="cf-sub">1.1.1.1 DNS &amp; Private Routing Layer</span>
                      </div>
                    </div>
                    <a
                      href="https://one.one.one.one/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cloudflare-action-link"
                    >
                      {CLOUDFLARE_SVG} Download Cloudflare WARP (1.1.1.1) {EXT_SVG}
                    </a>
                  </div>

                  <ol className="step-list">
                    <li>
                      Direct the user to install{' '}
                      <a
                        href="https://one.one.one.one/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="cf-inline-link"
                      >
                        {CLOUDFLARE_SVG} Cloudflare WARP (1.1.1.1)
                      </a>
                      .
                    </li>
                    <li>Launch the installer and select <strong>Private Browsing</strong> or <strong>Traffic and DNS (UDP)</strong>.</li>
                    <li>Toggle the switch to <strong>Connected</strong>.</li>
                    <li>Relaunch Madium and attempt attaching again.</li>
                  </ol>
                </div>

                {renderMacro('vpn', 'Cloudflare WARP & Windows 11 DNS Fix')}
                {renderMacro('lastresort', 'WARP Setup Protocol')}
                {renderMacro('backend', 'Backend Ratelimits Notification')}
              </div>
            </section>
          </div>
        )}

        {/* TOPIC 9: ANTIVIRUS & FIREWALL */}
        {activeTopic === 'antivirus' && (
          <div className="doc-page-view">
            <header className="doc-hero">
              <span className="doc-pill">Windows Security</span>
              <h1 className="doc-title">Antivirus &amp; Firewall Rules</h1>
              <p className="doc-subtitle">
                Set up required exclusion paths and Windows Defender socket rules.
              </p>
            </header>

            <section className="doc-section">
              <div className="playbook-card">
                <div className="playbook-header">
                  <span className="playbook-badge">Macro: exclude / firewall</span>
                  <h3>3 Mandatory Exclusion Folders</h3>
                </div>
                <p>
                  Windows Defender frequently blocks or quarantines injector DLLs. Have users add these 3 folders:
                </p>

                <div className="exclusions-grid">
                  <div className="ex-item">
                    <span className="ex-label">Exclusion 1: Downloads</span>
                    <code>C:/Users/%username%/Downloads</code>
                  </div>
                  <div className="ex-item">
                    <span className="ex-label">Exclusion 2: Binaries</span>
                    <code>%LocalAppData%/Madium/Bin</code>
                  </div>
                  <div className="ex-item">
                    <span className="ex-label">Exclusion 3: Temp Cache</span>
                    <code>%temp%</code>
                  </div>
                </div>

                {renderMacro('exclude', 'Windows Security Exclusions Macro')}

                <div className="callout callout-tip" style={{ marginTop: 14 }}>
                  <div className="callout-icon">{ALERT_SVG}</div>
                  <div className="callout-body">
                    <h4>Firewall Inbound &amp; Outbound Rules</h4>
                    <p>
                      For persistent socket blocks, add Inbound and Outbound rules in Windows Defender Firewall for:
                      <br />
                      <code>AppData\Roaming\Madium\Bin\Loader.exe</code> and <code>Madium.exe</code>
                    </p>
                  </div>
                </div>

                {renderMacro('firewall', 'Firewall Inbound/Outbound Exclusions Macro')}
              </div>
            </section>
          </div>
        )}

        {/* TOPIC 10: ROBLOX CRASHES & LAUNCHERS */}
        {activeTopic === 'roblox' && (
          <div className="doc-page-view">
            <header className="doc-hero">
              <span className="doc-pill">Client Crashes</span>
              <h1 className="doc-title">Roblox Crashes &amp; Launchers</h1>
              <p className="doc-subtitle">
                Resolve immediate crash-on-inject, version mismatches, and test alternative custom launchers.
              </p>
            </header>

            <section className="doc-section">
              <div className="playbook-card">
                <div className="playbook-header">
                  <span className="playbook-badge">Macro: dx11 / mismatch / blank / alt</span>
                  <h3>Crash Troubleshooting Steps</h3>
                </div>
                <p>
                  If Roblox closes immediately on injection or displays <em>&ldquo;Dll disconnected&rdquo;</em>:
                </p>
                <ul className="step-list">
                  <li>
                    <strong>Restart first:</strong> A standard PC restart clears hanging hook threads in Roblox.
                  </li>
                  <li>
                    <strong>Inject sequence:</strong> Close both Roblox and Madium. Open Roblox first, disable Auto-Attach in Madium settings, then manually click Inject.
                  </li>
                  <li>
                    <strong>Client Instance Injection:</strong> Tell the user to inject from the <em>&ldquo;Client&rdquo;</em> or <em>&ldquo;Roblox Instances&rdquo;</em> button rather than editor.
                  </li>
                  <li>
                    <strong>Alternative Launchers:</strong> If standard Roblox crashes, test with alternative wrappers:
                    <div className="launcher-links">
                      <a href="https://github.com/fishstrap/fishstrap" target="_blank" rel="noopener noreferrer" className="launcher-pill">
                        Fishstrap {EXT_SVG}
                      </a>
                      <a href="https://github.com/Froststrap/Froststrap" target="_blank" rel="noopener noreferrer" className="launcher-pill">
                        Froststrap {EXT_SVG}
                      </a>
                      <a href="https://github.com/voidstrap/Voidstrap/releases" target="_blank" rel="noopener noreferrer" className="launcher-pill">
                        Voidstrap {EXT_SVG}
                      </a>
                    </div>
                  </li>
                </ul>

                {renderMacro('dx11', 'Open Roblox First Macro')}
                {renderMacro('mismatch', 'Version Mismatch Cleanup Macro')}
                {renderMacro('blank', 'Inject via Roblox Instances Macro')}
                {renderMacro('alt', 'Alternative Launchers Macro')}
                {renderMacro('old', "Fix couldn't read version.txt / 16-bit App Macro")}
                {renderMacro('crash', 'Crash Policy Macro')}
              </div>
            </section>
          </div>
        )}

        {/* TOPIC 11: WEBVIEW2 CORRUPTION */}
        {activeTopic === 'webview' && (
          <div className="doc-page-view">
            <header className="doc-hero">
              <span className="doc-pill">UI Renderer</span>
              <h1 className="doc-title">WebView2 Corruptions</h1>
              <p className="doc-subtitle">
                Fix blank white or black screens caused by corrupted Microsoft WebView2 runtimes or permissions.
              </p>
            </header>

            <section className="doc-section">
              <div className="playbook-card">
                <div className="playbook-header">
                  <span className="playbook-badge">Macro: webview / corruptweb</span>
                  <h3>WebView2 Fix Procedures</h3>
                </div>
                <p>
                  If the Madium UI opens as a blank white/black window or displays a WebView error:
                </p>

                <h4>Method 1: Folder Permissions</h4>
                <ol className="step-list">
                  <li>Press <code>Windows Key + E</code> and navigate to <code>C:\Users\%username%\</code>.</li>
                  <li>If prompted, click <strong>Allow</strong> or <strong>Continue</strong>.</li>
                  <li>Restart Madium.</li>
                </ol>
                {renderMacro('webview', 'WebView Permissions Macro')}

                <h4 style={{ marginTop: 16 }}>Method 2: Edge Folder Copy Fix</h4>
                <ol className="step-list">
                  <li>Navigate to: <code>C:\Program Files (x86)\Microsoft</code></li>
                  <li>Delete the folder named <code>EdgeWebView</code>.</li>
                  <li>Copy the existing <code>Edge</code> folder in the same directory (creating <code>Edge - Copy</code>).</li>
                  <li>Rename <code>Edge - Copy</code> to <code>EdgeWebView</code>.</li>
                  <li>Relaunch Madium.</li>
                </ol>
                {renderMacro('corruptweb', 'Corrupted WebView2 Edge Copy Macro')}
              </div>
            </section>
          </div>
        )}

        {/* TOPIC 12: REQUIRED DEPENDENCIES */}
        {activeTopic === 'dependencies' && (
          <div className="doc-page-view">
            <header className="doc-hero">
              <span className="doc-pill">Runtimes</span>
              <h1 className="doc-title">Required Dependencies</h1>
              <p className="doc-subtitle">
                Official download links for all required Visual C++, .NET, and DirectX runtimes.
              </p>
            </header>

            <section className="doc-section">
              <div className="playbook-card">
                <div className="playbook-header">
                  <span className="playbook-badge">Macro: dep</span>
                  <h3>Official Microsoft Runtimes</h3>
                </div>
                <p>
                  Ensure all prerequisite Microsoft runtimes are installed on the user&apos;s machine:
                </p>
                <div className="dep-grid">
                  <a href="https://builds.dotnet.microsoft.com/dotnet/WindowsDesktop/8.0.27/windowsdesktop-runtime-8.0.27-win-x64.exe" target="_blank" rel="noopener noreferrer" className="dep-link">
                    .NET Runtime 8.0 (x64) {EXT_SVG}
                  </a>
                  <a href="https://aka.ms/vc14/vc_redist.x64.exe" target="_blank" rel="noopener noreferrer" className="dep-link">
                    Visual C++ 2015-2022 (x64) {EXT_SVG}
                  </a>
                  <a href="https://aka.ms/vc14/vc_redist.x86.exe" target="_blank" rel="noopener noreferrer" className="dep-link">
                    Visual C++ 2015-2022 (x86) {EXT_SVG}
                  </a>
                  <a href="https://go.microsoft.com/fwlink/?linkid=2124701" target="_blank" rel="noopener noreferrer" className="dep-link">
                    Microsoft Edge WebView2 Runtime {EXT_SVG}
                  </a>
                  <a href="https://download.microsoft.com/download/1/7/1/1718ccc4-6315-4d8e-9543-8e28a4e18c4c/dxwebsetup.exe" target="_blank" rel="noopener noreferrer" className="dep-link">
                    DirectX End-User Runtime {EXT_SVG}
                  </a>
                </div>
                <p className="doc-subnote" style={{ marginTop: 10 }}>
                  <strong>DirectX Installation Note:</strong> Uncheck &ldquo;Install Bing Bar&rdquo; during setup, then restart the PC after completion.
                </p>
                {renderMacro('dep', 'Dependencies Macro')}
              </div>
            </section>
          </div>
        )}

        {/* TOPIC 13: ANALYSIS LOGS */}
        {activeTopic === 'analysis' && (
          <div className="doc-page-view">
            <header className="doc-hero">
              <span className="doc-pill">Escalations</span>
              <h1 className="doc-title">Generating Analysis Logs</h1>
              <p className="doc-subtitle">
                How to gather detailed crash dumps and diagnostic logs for developer escalation.
              </p>
            </header>

            <section className="doc-section">
              <div className="playbook-card">
                <div className="playbook-header">
                  <span className="playbook-badge">Macro: anal</span>
                  <h3>Log Collection Procedure</h3>
                </div>
                <p>
                  When an issue is unresolvable through standard fixes, request an analysis log:
                </p>
                <ol className="step-list">
                  <li>
                    Provide the user with the official analysis script:{' '}
                    <a
                      href="https://cdn.discordapp.com/attachments/1486055444223885375/1521271601583362201/analysis.bat"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="doc-resource-link"
                    >
                      analysis.bat {EXT_SVG}
                    </a>
                  </li>
                  <li>Ask the user to double click and run <code>analysis.bat</code>.</li>
                  <li>Retrieve the generated <code>Madium_Analysis.txt</code> from their Desktop and forward to Senior Support / Devs.</li>
                </ol>
                {renderMacro('anal', 'Analysis Log Macro')}
              </div>
            </section>
          </div>
        )}

        {/* ── Topic Navigation Footer (Previous / Next) ── */}
        <footer className="doc-page-nav-footer">
          {prevTopic ? (
            <button
              type="button"
              onClick={() => switchTopic(prevTopic.key)}
              className="doc-page-nav-btn prev"
            >
              {ARROW_LEFT_SVG}
              <div className="doc-nav-btn-text">
                <span className="nav-btn-sub">Previous</span>
                <span className="nav-btn-title">{prevTopic.title}</span>
              </div>
            </button>
          ) : <div />}

          {nextTopic && (
            <button
              type="button"
              onClick={() => switchTopic(nextTopic.key)}
              className="doc-page-nav-btn next"
            >
              <div className="doc-nav-btn-text">
                <span className="nav-btn-sub">Next</span>
                <span className="nav-btn-title">{nextTopic.title}</span>
              </div>
              {ARROW_RIGHT_SVG}
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}
