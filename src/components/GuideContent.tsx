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
  | 'universal'
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
  roleColor?: 'trial' | 'support' | 'senior' | 'lead';
}

const TOPICS: NavTopic[] = [
  { key: 'overview',     title: 'Welcome & Mission',           category: 'Overview' },
  { key: 'roles',        title: 'Roles & Hierarchy',           category: 'Staff Roles' },
  { key: 'protocols',    title: 'Rules, Bans & Security',      category: 'Core Protocols' },
  { key: 'diagnostics',  title: 'Initial Diagnostic Questions', category: 'Troubleshooting Guides' },
  { key: 'universal',    title: 'Universal Clean Fix',         category: 'Troubleshooting Guides' },
  { key: 'cloudflare',   title: 'Network & Cloudflare WARP',   category: 'Troubleshooting Guides' },
  { key: 'antivirus',    title: 'Antivirus & Firewall Rules',  category: 'Troubleshooting Guides' },
  { key: 'roblox',       title: 'Roblox Crashes & Launchers',  category: 'Troubleshooting Guides' },
  { key: 'webview',      title: 'WebView2 Corruptions',        category: 'Troubleshooting Guides' },
  { key: 'dependencies', title: 'Required Dependencies',       category: 'Troubleshooting Guides' },
  { key: 'analysis',     title: 'Generating Analysis Logs',    category: 'Troubleshooting Guides' },
];

interface Props {
  qrs: QR[];
}

export default function GuideContent({ qrs }: Props) {
  const [activeTopic, setActiveTopic] = useState<GuideTopicKey>('overview');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');

  // Sync hash / query on initial load
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      const match = TOPICS.find((t) => t.key === hash);
      if (match) {
        setActiveTopic(match.key);
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  function switchTopic(key: GuideTopicKey) {
    setActiveTopic(key);
    window.location.hash = key;
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

  // Filtered navigation list
  const filteredTopics = useMemo(() => {
    if (!searchFilter.trim()) return TOPICS;
    const q = searchFilter.toLowerCase();
    return TOPICS.filter((t) => t.title.toLowerCase().includes(q) || t.category.toLowerCase().includes(q));
  }, [searchFilter]);

  // Current topic index for pagination
  const currentIndex = TOPICS.findIndex((t) => t.key === activeTopic);
  const prevTopic = currentIndex > 0 ? TOPICS[currentIndex - 1] : null;
  const nextTopic = currentIndex < TOPICS.length - 1 ? TOPICS[currentIndex + 1] : null;

  return (
    <div className="doc-layout">
      {/* ── Left Sidebar Navigation ── */}
      <aside className="doc-sidebar">
        <div className="doc-sidebar-header">
          <span className="doc-badge">Handbook</span>
          <span className="doc-sidebar-title">Support Guide</span>
        </div>

        <div className="doc-sidebar-search">
          <input
            type="text"
            placeholder="Filter guides…"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="doc-filter-input"
            aria-label="Filter documentation"
          />
        </div>

        <nav className="doc-nav" aria-label="Support Guide Navigation">
          {/* Overview Category */}
          <div className="doc-nav-group">
            <span className="doc-nav-heading">
              {BOOK_SVG} Overview
            </span>
            {filteredTopics
              .filter((t) => t.category === 'Overview')
              .map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => switchTopic(t.key)}
                  className={`doc-nav-link ${activeTopic === t.key ? 'active' : ''}`}
                >
                  {t.title}
                </button>
              ))}
          </div>

          {/* Staff Roles Category */}
          <div className="doc-nav-group">
            <span className="doc-nav-heading">
              {USERS_SVG} Staff Roles
            </span>
            {filteredTopics
              .filter((t) => t.category === 'Staff Roles')
              .map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => switchTopic(t.key)}
                  className={`doc-nav-link ${activeTopic === t.key ? 'active' : ''}`}
                >
                  {t.title}
                </button>
              ))}
          </div>

          {/* Core Protocols */}
          <div className="doc-nav-group">
            <span className="doc-nav-heading">
              {SHIELD_SVG} Core Protocols
            </span>
            {filteredTopics
              .filter((t) => t.category === 'Core Protocols')
              .map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => switchTopic(t.key)}
                  className={`doc-nav-link ${activeTopic === t.key ? 'active' : ''}`}
                >
                  {t.title}
                </button>
              ))}
          </div>

          {/* Troubleshooting Guides */}
          <div className="doc-nav-group">
            <span className="doc-nav-heading">
              {TOOL_SVG} Troubleshooting Guides
            </span>
            {filteredTopics
              .filter((t) => t.category === 'Troubleshooting Guides')
              .map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => switchTopic(t.key)}
                  className={`doc-nav-link ${activeTopic === t.key ? 'active' : ''}`}
                >
                  {t.title}
                </button>
              ))}
          </div>
        </nav>
      </aside>

      {/* ── Main Documentation Page Content ── */}
      <article className="doc-content">
        {/* TOPIC 1: OVERVIEW */}
        {activeTopic === 'overview' && (
          <div className="doc-page-view">
            <header className="doc-hero">
              <span className="doc-pill">Staff Knowledge Base</span>
              <h1 className="doc-title">Welcome to Support</h1>
              <p className="doc-subtitle">
                Official handbook for diagnosing user issues, ticket triaging workflows,
                and team role standards.
              </p>
            </header>

            <section className="doc-section">
              <h2>Introduction &amp; Mission</h2>
              <div className="doc-prose">
                <p className="lead-text">
                  <strong>Welcome to the Support Team!</strong> As a support member,
                  you are one of our frontline soldiers for any technical challenges and inquiries.
                  Your role is crucial in maintaining user satisfaction and experience.
                </p>

                <blockquote className="doc-quote-card">
                  <span className="quote-label">Our Mission</span>
                  <p>
                    &ldquo;Provide Timely &amp; Professional Support to Members &amp; Users that exceeds their expectations while maintaining our community standard.&rdquo;
                  </p>
                </blockquote>
              </div>
            </section>

            {/* Quick Link Cards */}
            <div className="doc-category-cards">
              <button type="button" onClick={() => switchTopic('roles')} className="doc-cat-card">
                <div className="cat-card-icon">{USERS_SVG}</div>
                <div className="cat-card-content">
                  <h3>Team Hierarchy</h3>
                  <p>Trial, Support, Senior UNCs, and Lead Support expectations.</p>
                </div>
              </button>

              <button type="button" onClick={() => switchTopic('universal')} className="doc-cat-card">
                <div className="cat-card-icon">{TOOL_SVG}</div>
                <div className="cat-card-content">
                  <h3>Universal Fixes</h3>
                  <p>One-click clean reinstall, DeleteMadium batch, and resets.</p>
                </div>
              </button>

              <button type="button" onClick={() => switchTopic('cloudflare')} className="doc-cat-card">
                <div className="cat-card-icon">{SHIELD_SVG}</div>
                <div className="cat-card-content">
                  <h3>Network &amp; Cloudflare</h3>
                  <p>Backend ratelimits, WARP routing, and connection bypasses.</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* TOPIC 2: ROLES & RESPONSIBILITIES */}
        {activeTopic === 'roles' && (
          <div className="doc-page-view">
            <header className="doc-hero">
              <span className="doc-pill">Staff Structure</span>
              <h1 className="doc-title">Roles &amp; Hierarchy</h1>
              <p className="doc-subtitle">
                Scope of authority, team expectations, and escalation pathways.
              </p>
            </header>

            <section className="doc-section">
              <div className="roles-grid">
                {/* Trial Support (Yellow) */}
                <div className="role-card card-trial">
                  <div className="role-card-header">
                    <div className="role-badge badge-trial">
                      <span className="badge-dot" /> Trial Support
                    </div>
                    <span className="role-id">@Trial Support</span>
                  </div>
                  <p className="role-summary">
                    Supports under a trial phase, where you will learn how to diagnose and resolve issues faced by users.
                  </p>

                  <h4>What We Expect From You:</h4>
                  <ul className="role-list">
                    <li>
                      <strong>Will to Learn &amp; Observe:</strong> You should be willing to learn and be open to any information given to you by a support or a senior.
                    </li>
                    <li>
                      <strong>Ticket Observation:</strong> As you are a trial, <strong>you are not required to directly start doing tickets</strong>. You can watch your seniors or fellow supports and get comfortable with the fixes.
                    </li>
                    <li>
                      <strong>Handle Simple Tickets:</strong> You may handle simple tickets, such as Network Errors and Unban/Appeal inquiries (where you will have to ping a moderator).
                    </li>
                    <li>
                      <strong>Knowledge DB Familiarization:</strong> Get familiar with all the quick fixes, issues, and support documentation.
                    </li>
                    <li>
                      <strong>Feedback:</strong> Always request and implement feedback.
                    </li>
                    <li>
                      <strong className="highlight-text alert">Integrity:</strong> Uphold the highest level of integrity. Failing to do so will result in strikes or removal of roles.
                    </li>
                  </ul>
                </div>

                {/* Support (Orange) */}
                <div className="role-card card-support">
                  <div className="role-card-header">
                    <div className="role-badge badge-support">
                      <span className="badge-dot" /> Support Staff
                    </div>
                    <span className="role-id">@Support</span>
                  </div>
                  <p className="role-summary">
                    The core of our support team. You are expected to handle the majority of tickets and be self-sufficient in diagnosing users&apos; issues.
                  </p>

                  <h4>What We Expect From You:</h4>
                  <ul className="role-list">
                    <li>
                      <strong>Ticket Triaging:</strong> Quickly claim, assess, and solve tickets.
                    </li>
                    <li>
                      <strong>Issue Diagnosing:</strong> Use the Support Doc and your experience to resolve common and new issues.
                    </li>
                    <li>
                      <strong>User&apos;s Education:</strong> Guide users to self-help by navigating them through the <code>#quickfixes</code> channel.
                    </li>
                    <li>
                      <strong className="highlight-text">Rule Enforcement:</strong> Act on rule violations. If a user is disrespectful, uncooperative, or breaking server rules, deny service and request a ban from a senior (in extreme cases).
                    </li>
                    <li>
                      <strong>Support Docs:</strong> Contribute to the Support Database by adding new fixes or improvements (always verify with a Senior first).
                    </li>
                    <li>
                      <strong>Team Collaboration:</strong> Help Trials when needed, becoming their teacher when seniors are not available.
                    </li>
                  </ul>
                </div>

                {/* Senior Support (Orange to Brown) */}
                <div className="role-card card-senior">
                  <div className="role-card-header">
                    <div className="role-badge badge-senior">
                      <span className="badge-dot" /> Senior Support
                    </div>
                    <span className="role-id">@Senior Support (UNCS)</span>
                  </div>
                  <p className="role-summary">
                    The Seniors (UNCS) of the team. You are expected to handle the toughest issues, teach trials/supports, and ensure quality across the team.
                  </p>

                  <h4>What We Expect From You:</h4>
                  <ul className="role-list">
                    <li>
                      <strong>Complex Issue Resolution:</strong> Handle and/or take over tickets escalated to you due to user sensitivity or technical difficulties.
                    </li>
                    <li>
                      <strong>Mentorship:</strong> Train and guide Trials and Supports. Provide actionable feedback to help them improve.
                    </li>
                    <li>
                      <strong>Quality Assurance:</strong> Review tickets to ensure compliance with staff guide and rules.
                    </li>
                    <li>
                      <strong>Rule Enforcement Authority:</strong> Make decisions regarding whether users deserve a Blacklist/Ban and forward to a Lead or Manager for final approval.
                    </li>
                    <li>
                      <strong>Bug Reporting:</strong> Actively report reproducible bugs directly to the dev team.
                    </li>
                    <li>
                      <strong>Support Document Update:</strong> Actively review the support document, make necessary changes for new issues/bugs, and provide fixes.
                    </li>
                  </ul>
                </div>

                {/* Lead Support (Brown) */}
                <div className="role-card card-lead">
                  <div className="role-card-header">
                    <div className="role-badge badge-lead">
                      <span className="badge-dot" /> Lead Support
                    </div>
                    <span className="role-id">@Lead Support</span>
                  </div>
                  <p className="role-summary">
                    The operational leader. You manage the team and act as a bridge between Management and Support.
                  </p>

                  <h4>What Is Expected From You:</h4>
                  <ul className="role-list">
                    <li>
                      <strong>Team Oversight:</strong> Actively monitor team performance, active tickets, and response times.
                    </li>
                    <li>
                      <strong>Onboarding:</strong> Lead the onboarding process for new trial supports.
                    </li>
                    <li>
                      <strong>Team Morale:</strong> Foster a positive and collaborative team culture.
                    </li>
                    <li>
                      <strong>Escalation Management:</strong> Manage Blacklist / Ban requests based on provided proof.
                    </li>
                    <li>
                      <strong className="highlight-text alert">External Fix Approval:</strong> Review and approve any unofficial fixes (batch files) before they are distributed by team members. <strong>Do not allow unapproved fixes.</strong>
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
              <ul className="doc-checklist">
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
                <div className="code-block-wrap">
                  <pre className="code-snippet">
{`1. Is your Windows user account an Administrator?
2. Do you know what an Antivirus Exclusion is? Have you added Madium?
3. When clicking "Attach", is Roblox open or closed? Are you using default Roblox, Fishstrap, or Froststrap?
4. Do you have third-party antivirus software installed (Kaspersky, McAfee, Malwarebytes, Norton)?`}
                  </pre>
                  <button
                    type="button"
                    className="code-copy-btn"
                    onClick={() => handleCopy('ask', qrMap.get('ask')?.text || '')}
                  >
                    {copiedKey === 'ask' ? CHECK_SVG : COPY_SVG} {copiedKey === 'ask' ? 'Copied' : 'Copy Macro'}
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* TOPIC 5: UNIVERSAL CLEAN FIX */}
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
              </div>
            </section>
          </div>
        )}

        {/* TOPIC 6: CLOUDFLARE WARP */}
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
                  <span className="playbook-badge">Macro: vpn</span>
                  <h3>Cloudflare WARP (1.1.1.1) Solution</h3>
                </div>
                <p>
                  If a user encounters network errors, key system ratelimits, or ISP blocking:
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
                    <li>Launch the installer and select <strong>Private Browsing</strong>.</li>
                    <li>Toggle the switch to <strong>Connected</strong>.</li>
                    <li>Relaunch Madium and attempt attaching again.</li>
                  </ol>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* TOPIC 7: ANTIVIRUS & FIREWALL */}
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
              </div>
            </section>
          </div>
        )}

        {/* TOPIC 8: ROBLOX CRASHES & LAUNCHERS */}
        {activeTopic === 'roblox' && (
          <div className="doc-page-view">
            <header className="doc-hero">
              <span className="doc-pill">Client Crashes</span>
              <h1 className="doc-title">Roblox Crashes &amp; Launchers</h1>
              <p className="doc-subtitle">
                Resolve immediate crash-on-inject and test alternative custom launchers.
              </p>
            </header>

            <section className="doc-section">
              <div className="playbook-card">
                <div className="playbook-header">
                  <span className="playbook-badge">Macro: testqr / alt</span>
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
              </div>
            </section>
          </div>
        )}

        {/* TOPIC 9: WEBVIEW2 CORRUPTION */}
        {activeTopic === 'webview' && (
          <div className="doc-page-view">
            <header className="doc-hero">
              <span className="doc-pill">UI Renderer</span>
              <h1 className="doc-title">WebView2 Corruptions</h1>
              <p className="doc-subtitle">
                Fix blank white or black screens caused by corrupted Microsoft WebView2 runtimes.
              </p>
            </header>

            <section className="doc-section">
              <div className="playbook-card">
                <div className="playbook-header">
                  <span className="playbook-badge">Macro: webview</span>
                  <h3>Edge / WebView2 Folder Copy Fix</h3>
                </div>
                <p>
                  If the Madium UI opens as a blank white/black window or displays a WebView error:
                </p>
                <ol className="step-list">
                  <li>Navigate to: <code>C:\Program Files (x86)\Microsoft</code></li>
                  <li>Delete the folder named <code>EdgeWebView</code>.</li>
                  <li>Copy the existing <code>Edge</code> folder in the same directory (creating <code>Edge - Copy</code>).</li>
                  <li>Rename <code>Edge - Copy</code> to <code>EdgeWebView</code>.</li>
                  <li>Relaunch Madium.</li>
                </ol>
              </div>
            </section>
          </div>
        )}

        {/* TOPIC 10: REQUIRED DEPENDENCIES */}
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
              </div>
            </section>
          </div>
        )}

        {/* TOPIC 11: ANALYSIS LOGS */}
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
      </article>
    </div>
  );
}
