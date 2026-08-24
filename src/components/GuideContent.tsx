'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
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

interface Props {
  qrs: QR[];
}

export default function GuideContent({ qrs }: Props) {
  const [activeSection, setActiveSection] = useState('welcome');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');

  // Scrollspy observer for headings
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0.1 }
    );

    const sections = document.querySelectorAll('section[id], h2[id], h3[id]');
    sections.forEach((s) => observer.observe(s));

    return () => observer.disconnect();
  }, []);

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

  return (
    <div className="doc-layout">
      {/* ── Left Sidebar Navigation ── */}
      <aside className="doc-sidebar">
        <div className="doc-sidebar-header">
          <span className="doc-badge">Staff Handbook</span>
          <span className="doc-sidebar-title">Support Guide</span>
        </div>

        <div className="doc-sidebar-search">
          <input
            type="text"
            placeholder="Search guide & fixes…"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="doc-filter-input"
            aria-label="Filter documentation"
          />
        </div>

        <nav className="doc-nav" aria-label="Support Guide Navigation">
          <div className="doc-nav-group">
            <span className="doc-nav-heading">
              {BOOK_SVG} Overview
            </span>
            <a
              href="#welcome"
              className={`doc-nav-link ${activeSection === 'welcome' ? 'active' : ''}`}
            >
              Welcome & Mission
            </a>
            <a
              href="#roles-responsibilities"
              className={`doc-nav-link ${activeSection === 'roles-responsibilities' ? 'active' : ''}`}
            >
              Roles & Hierarchy
            </a>
          </div>

          <div className="doc-nav-group">
            <span className="doc-nav-heading">
              {USERS_SVG} Staff Roles
            </span>
            <a
              href="#trial-support"
              className={`doc-nav-link ${activeSection === 'trial-support' ? 'active' : ''}`}
            >
              <span className="role-dot trial" /> Trial Support
            </a>
            <a
              href="#support-role"
              className={`doc-nav-link ${activeSection === 'support-role' ? 'active' : ''}`}
            >
              <span className="role-dot support" /> Support
            </a>
            <a
              href="#senior-support"
              className={`doc-nav-link ${activeSection === 'senior-support' ? 'active' : ''}`}
            >
              <span className="role-dot senior" /> Senior Support
            </a>
            <a
              href="#lead-support"
              className={`doc-nav-link ${activeSection === 'lead-support' ? 'active' : ''}`}
            >
              <span className="role-dot lead" /> Operations Lead
            </a>
          </div>

          <div className="doc-nav-group">
            <span className="doc-nav-heading">
              {SHIELD_SVG} Core Protocols
            </span>
            <a
              href="#ticket-triaging"
              className={`doc-nav-link ${activeSection === 'ticket-triaging' ? 'active' : ''}`}
            >
              Ticket Triaging
            </a>
            <a
              href="#rules-enforcement"
              className={`doc-nav-link ${activeSection === 'rules-enforcement' ? 'active' : ''}`}
            >
              Rule Enforcement & Bans
            </a>
            <a
              href="#external-fixes"
              className={`doc-nav-link ${activeSection === 'external-fixes' ? 'active' : ''}`}
            >
              External Fixes & Safety
            </a>
          </div>

          <div className="doc-nav-group">
            <span className="doc-nav-heading">
              {TOOL_SVG} Troubleshooting Guides
            </span>
            <a
              href="#diagnostic-questions"
              className={`doc-nav-link ${activeSection === 'diagnostic-questions' ? 'active' : ''}`}
            >
              Initial Questions
            </a>
            <a
              href="#universal-fix"
              className={`doc-nav-link ${activeSection === 'universal-fix' ? 'active' : ''}`}
            >
              Universal Clean Fix
            </a>
            <a
              href="#network-cloudflare"
              className={`doc-nav-link ${activeSection === 'network-cloudflare' ? 'active' : ''}`}
            >
              Network & Cloudflare WARP
            </a>
            <a
              href="#antivirus-firewall"
              className={`doc-nav-link ${activeSection === 'antivirus-firewall' ? 'active' : ''}`}
            >
              Antivirus & Firewall Rules
            </a>
            <a
              href="#roblox-launchers"
              className={`doc-nav-link ${activeSection === 'roblox-launchers' ? 'active' : ''}`}
            >
              Roblox Crashes & Launchers
            </a>
            <a
              href="#webview-corruption"
              className={`doc-nav-link ${activeSection === 'webview-corruption' ? 'active' : ''}`}
            >
              WebView2 Corruptions
            </a>
            <a
              href="#dependencies-guide"
              className={`doc-nav-link ${activeSection === 'dependencies-guide' ? 'active' : ''}`}
            >
              Required Dependencies
            </a>
            <a
              href="#analysis-logs"
              className={`doc-nav-link ${activeSection === 'analysis-logs' ? 'active' : ''}`}
            >
              Generating Analysis Logs
            </a>
          </div>
        </nav>
      </aside>

      {/* ── Main Documentation Content ── */}
      <article className="doc-content">
        {/* Header / Hero */}
        <header className="doc-hero">
          <span className="doc-pill">Staff Knowledge Base</span>
          <h1 className="doc-title">Madium Support Guide</h1>
          <p className="doc-subtitle">
            Comprehensive manual for diagnosing user issues, ticket triaging workflows,
            troubleshooting procedures, and team role expectations.
          </p>

          <div className="doc-tags">
            <span className="doc-tag">Staff Only</span>
            <span className="doc-tag">Protocols</span>
            <span className="doc-tag">Quick Fixes</span>
            <span className="doc-tag">Diagnostics</span>
          </div>
        </header>

        {/* Feature Category Banner Cards (like the reference screenshot) */}
        <div className="doc-category-cards">
          <a href="#roles-responsibilities" className="doc-cat-card card-orange">
            <div className="cat-card-icon">{USERS_SVG}</div>
            <div className="cat-card-content">
              <h3>Team Hierarchy</h3>
              <p>Trial, Support, Senior UNCs, and Operations Lead expectations.</p>
            </div>
          </a>

          <a href="#universal-fix" className="doc-cat-card card-purple">
            <div className="cat-card-icon">{TOOL_SVG}</div>
            <div className="cat-card-content">
              <h3>Universal Fixes</h3>
              <p>One-click clean reinstall, DeleteMadium batch, and resets.</p>
            </div>
          </a>

          <a href="#network-cloudflare" className="doc-cat-card card-green">
            <div className="cat-card-icon">{SHIELD_SVG}</div>
            <div className="cat-card-content">
              <h3>Network & Cloudflare</h3>
              <p>Backend ratelimits, WARP routing, and connection bypasses.</p>
            </div>
          </a>
        </div>

        {/* ── SECTION 1: Introduction ── */}
        <section id="welcome" className="doc-section">
          <h2>Introduction</h2>
          <div className="doc-prose">
            <p className="lead-text">
              <strong>Welcome to the Madium Support Team!</strong> As a support member,
              you are one of our frontline soldiers for any technical challenges and inquiries.
              Your role is vital in maintaining user satisfaction, trust, and software reliability.
            </p>

            <blockquote className="doc-quote-card">
              <span className="quote-label">Our Mission</span>
              <p>
                &ldquo;Provide timely and professional support to members and users that exceeds their expectations
                while maintaining our strict community standards.&rdquo;
              </p>
            </blockquote>
          </div>
        </section>

        {/* ── SECTION 2: Roles & Responsibilities ── */}
        <section id="roles-responsibilities" className="doc-section">
          <h2>Roles & Responsibilities</h2>
          <p className="doc-section-desc">
            Understand your specific scope of authority, expectations, and escalation pathways.
          </p>

          <div className="roles-grid">
            {/* Trial Support */}
            <div id="trial-support" className="role-card card-trial">
              <div className="role-card-header">
                <div className="role-badge badge-trial">
                  <span className="badge-dot" /> Trial Support
                </div>
                <span className="role-id">@Trial Support</span>
              </div>
              <p className="role-summary">
                Supports under a trial learning phase. You will observe ticket handling, learn diagnostic procedures,
                and resolve simple issues.
              </p>

              <h4>What We Expect From You:</h4>
              <ul className="role-list">
                <li>
                  <strong>Will to Learn & Observe:</strong> Be open to feedback and absorb advice given by Seniors and Leads.
                </li>
                <li>
                  <strong>Ticket Observation:</strong> You are <em>not required to immediately triage complex tickets</em>.
                  Shadow seniors, read the macros, and get comfortable with standard fixes.
                </li>
                <li>
                  <strong>Handle Simple Tickets:</strong> Address basic network errors, simple exclusions, and appeal inquiries (pinging a moderator).
                </li>
                <li>
                  <strong>Knowledge DB Familiarization:</strong> Master all quick replies, troubleshooting macros, and documentation.
                </li>
                <li>
                  <strong>Feedback Implementation:</strong> Actively request feedback from seniors after resolving tickets.
                </li>
                <li>
                  <strong className="highlight-text alert">Integrity:</strong> Uphold the highest level of honesty and professionalism.
                  Failing to do so results in immediate strikes or role removal.
                </li>
              </ul>
            </div>

            {/* Support */}
            <div id="support-role" className="role-card card-support">
              <div className="role-card-header">
                <div className="role-badge badge-support">
                  <span className="badge-dot" /> Support Staff
                </div>
                <span className="role-id">@Support</span>
              </div>
              <p className="role-summary">
                The core backbone of our team. Expected to handle the majority of incoming tickets and be self-sufficient
                in diagnosing technical problems.
              </p>

              <h4>What We Expect From You:</h4>
              <ul className="role-list">
                <li>
                  <strong>Ticket Triaging:</strong> Promptly claim, diagnose, and resolve user tickets.
                </li>
                <li>
                  <strong>Issue Diagnosing:</strong> Use the support docs, diagnostic questions, and log analysis to identify root causes.
                </li>
                <li>
                  <strong>User Education:</strong> Guide users to self-help resources in the <code>#quickfixes</code> channel.
                </li>
                <li>
                  <strong className="highlight-text">Rule Enforcement:</strong> Act firmly on rule violations. If a user is disrespectful,
                  uncooperative, or abusive, deny service and request a ban/blacklist from a Senior.
                </li>
                <li>
                  <strong>Support Docs Contributions:</strong> Propose improvements and new macros for the support database (always verify with a Senior first).
                </li>
                <li>
                  <strong>Team Collaboration:</strong> Assist and mentor Trial Supports when seniors are occupied.
                </li>
              </ul>
            </div>

            {/* Senior Support */}
            <div id="senior-support" className="role-card card-senior">
              <div className="role-card-header">
                <div className="role-badge badge-senior">
                  <span className="badge-dot" /> Senior Support
                </div>
                <span className="role-id">@Senior Support (UNCs)</span>
              </div>
              <p className="role-summary">
                The technical veterans of the team. Seniors tackle escalated tickets, train trials/staff, and maintain overall service quality.
              </p>

              <h4>What We Expect From You:</h4>
              <ul className="role-list">
                <li>
                  <strong>Complex Issue Resolution:</strong> Take over difficult tickets requiring custom batch fixes, DLL debugging, or sensitive handling.
                </li>
                <li>
                  <strong>Mentorship & Training:</strong> Actively review trial tickets, provide constructive feedback, and guide staff progression.
                </li>
                <li>
                  <strong>Quality Assurance:</strong> Monitor ongoing ticket interactions to ensure compliance with community guidelines.
                </li>
                <li>
                  <strong>Rule Enforcement Authority:</strong> Authorize Blacklist and Ban decisions, forwarding evidence to Management for final logging.
                </li>
                <li>
                  <strong>Bug Reporting:</strong> Document and report reproducible client bugs directly to the development team.
                </li>
                <li>
                  <strong>Documentation Maintenance:</strong> Regularly update fix steps and macros as new Roblox/Madium updates deploy.
                </li>
              </ul>
            </div>

            {/* Operations Lead */}
            <div id="lead-support" className="role-card card-lead">
              <div className="role-card-header">
                <div className="role-badge badge-lead">
                  <span className="badge-dot" /> Operations Lead
                </div>
                <span className="role-id">@Support Lead</span>
              </div>
              <p className="role-summary">
                The operational leadership bridging Management and the Support Team. Oversees performance, escalations, and fix integrity.
              </p>

              <h4>What We Expect From You:</h4>
              <ul className="role-list">
                <li>
                  <strong>Team Oversight:</strong> Monitor response times, active ticket queues, and staff attendance.
                </li>
                <li>
                  <strong>Onboarding:</strong> Direct the trial onboarding pipeline and promote qualifying members.
                </li>
                <li>
                  <strong>Team Morale & Culture:</strong> Foster a positive, collaborative, and communicative team environment.
                </li>
                <li>
                  <strong>Escalation Management:</strong> Review submitted evidence and execute permanent Blacklist / Ban decisions.
                </li>
                <li>
                  <strong className="highlight-text alert">External Fix Approval:</strong> Review and verify every unofficial fix, script,
                  or batch file before distribution. <span className="underline">Strictly prohibit unapproved external files.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* ── SECTION 3: Core Protocols ── */}
        <section id="ticket-triaging" className="doc-section">
          <h2>Core Protocols & Standards</h2>

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

          <h3 id="rules-enforcement">Rules, Strikes & Blacklisting</h3>
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

          <h3 id="external-fixes">External Fixes & Batch File Security</h3>
          <div className="callout callout-warning">
            <div className="callout-icon">{SHIELD_SVG}</div>
            <div className="callout-body">
              <h4>Strict Security Directive</h4>
              <p>
                <strong>Do NOT distribute custom .bat, .exe, or .ps1 files created by yourself or third parties</strong> unless
                they are listed in the official quick reply database or explicitly signed off by an Operations Lead.
              </p>
            </div>
          </div>
        </section>

        {/* ── SECTION 4: Troubleshooting Playbooks ── */}
        <section id="troubleshooting-guides" className="doc-section">
          <h2>Troubleshooting Playbooks</h2>
          <p className="doc-section-desc">
            Standard operating procedures for resolving the most frequent technical problems.
          </p>

          {/* Diagnostic Questions */}
          <div id="diagnostic-questions" className="playbook-card">
            <div className="playbook-header">
              <span className="playbook-badge">Step 1: Diagnostics</span>
              <h3>Initial Triage Questions</h3>
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
                className="code-copy-btn"
                onClick={() => handleCopy('ask', qrMap.get('ask')?.text || '')}
              >
                {copiedKey === 'ask' ? CHECK_SVG : COPY_SVG} {copiedKey === 'ask' ? 'Copied' : 'Copy Macro'}
              </button>
            </div>
          </div>

          {/* Universal Clean Reinstall */}
          <div id="universal-fix" className="playbook-card">
            <div className="playbook-header">
              <span className="playbook-badge">Universal Procedure</span>
              <h3>Universal Clean Fix & Reset</h3>
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
                <span className="text-muted"> (Warn user: saves/tabs in editor will be cleared).</span>
              </li>
              <li>Temporarily disable third-party antivirus shields or add folder exclusions.</li>
              <li>Run the <strong>Madium Bootstrapper</strong> as Administrator.</li>
            </ol>
          </div>

          {/* Network & Cloudflare WARP */}
          <div id="network-cloudflare" className="playbook-card highlight-card">
            <div className="playbook-header">
              <span className="playbook-badge cf-badge">Network & Routing</span>
              <h3>Network Errors, Backend Ratelimits & Cloudflare WARP</h3>
            </div>
            <p>
              If a user gets connection timeouts, backend ratelimits, key system failure, or ISP routing blocks:
            </p>

            <div className="cloudflare-feature-box">
              <div className="cf-box-header">
                <div className="cf-title-wrap">
                  {CLOUDFLARE_SVG}
                  <div>
                    <h4>Recommended Solution: Cloudflare WARP</h4>
                    <span className="cf-sub">1.1.1.1 DNS & Private Routing Layer</span>
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
                <li>Launch the installer and select <strong>Private Browsing</strong> (or UPD mode).</li>
                <li>Toggle the switch to <strong>Connected</strong>.</li>
                <li>Relaunch Madium and attempt attaching again.</li>
              </ol>
            </div>
          </div>

          {/* Antivirus & Firewall */}
          <div id="antivirus-firewall" className="playbook-card">
            <div className="playbook-header">
              <span className="playbook-badge">Windows Security</span>
              <h3>Antivirus & Firewall Exclusions</h3>
            </div>
            <p>
              Windows Defender frequently blocks or quarantines injector DLLs without notification.
              Staff should instruct users to add the following 3 exclusion folders:
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
                <h4>Firewall Inbound & Outbound Rules</h4>
                <p>
                  For persistent socket blocks, add Inbound and Outbound rules in Windows Defender Firewall for:
                  <br />
                  <code>AppData\Roaming\Madium\Bin\Loader.exe</code> and <code>Madium.exe</code>
                </p>
              </div>
            </div>
          </div>

          {/* Roblox Crashes & Custom Launchers */}
          <div id="roblox-launchers" className="playbook-card">
            <div className="playbook-header">
              <span className="playbook-badge">Client Crashes</span>
              <h3>Roblox Crashes & Alternative Launchers</h3>
            </div>
            <p>
              If Roblox closes immediately on injection (or displays <em>&ldquo;Dll disconnected&rdquo;</em>):
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
                <strong>Alternative Launchers:</strong> If standard Roblox launcher crashes, test with alternative wrappers:
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

          {/* WebView2 Corruptions */}
          <div id="webview-corruption" className="playbook-card">
            <div className="playbook-header">
              <span className="playbook-badge">UI Renderer</span>
              <h3>WebView2 Corrupted Files & White Screen Fix</h3>
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

          {/* Dependencies */}
          <div id="dependencies-guide" className="playbook-card">
            <div className="playbook-header">
              <span className="playbook-badge">Runtimes</span>
              <h3>Required Visual C++ & .NET Dependencies</h3>
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
            <p className="doc-subnote">
              <strong>DirectX Installation Note:</strong> Uncheck &ldquo;Install Bing Bar&rdquo; during setup, then restart the PC after completion.
            </p>
          </div>

          {/* Analysis Log Generation */}
          <div id="analysis-logs" className="playbook-card">
            <div className="playbook-header">
              <span className="playbook-badge">Escalations</span>
              <h3>Generating an Analysis Log for Developers</h3>
            </div>
            <p>
              When an issue is unresolvable through standard fixes, request an analysis log (Macro: <code>anal</code>):
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

        {/* ── SECTION 5: Image Container Placeholder (Compatible with future uploads) ── */}
        <section className="doc-section">
          <h2>Visual References & Attachments</h2>
          <p className="doc-section-desc">
            Visual troubleshooting workflows, diagrams, and injection guides.
          </p>

          <figure className="doc-image-frame">
            <div className="doc-image-placeholder">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 28, height: 28, opacity: 0.6 }}>
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              <span>Diagram / Screenshot Container</span>
              <p>Image slot ready for injection flowcharts, exclusion steps, and UI captures.</p>
            </div>
            <figcaption className="doc-caption">
              Figure 1.0: Madium Injection Process & Multi-Instance Triage
            </figcaption>
          </figure>
        </section>
      </article>

      {/* ── Right Sidebar: On This Page Table of Contents ── */}
      <aside className="doc-toc">
        <div className="doc-toc-sticky">
          <span className="toc-title">On this page</span>
          <nav className="toc-links" aria-label="Page Table of Contents">
            <a href="#welcome" className={`toc-link ${activeSection === 'welcome' ? 'active' : ''}`}>
              Overview
            </a>
            <a href="#roles-responsibilities" className={`toc-link ${activeSection.includes('role') || activeSection.includes('support') ? 'active' : ''}`}>
              Roles & Hierarchy
            </a>
            <div className="toc-sublinks">
              <a href="#trial-support" className={`toc-sublink ${activeSection === 'trial-support' ? 'active' : ''}`}>Trial Support</a>
              <a href="#support-role" className={`toc-sublink ${activeSection === 'support-role' ? 'active' : ''}`}>Support</a>
              <a href="#senior-support" className={`toc-sublink ${activeSection === 'senior-support' ? 'active' : ''}`}>Senior Support</a>
              <a href="#lead-support" className={`toc-sublink ${activeSection === 'lead-support' ? 'active' : ''}`}>Operations Lead</a>
            </div>
            <a href="#ticket-triaging" className={`toc-link ${activeSection === 'ticket-triaging' ? 'active' : ''}`}>
              Core Protocols
            </a>
            <a href="#diagnostic-questions" className={`toc-link ${activeSection === 'diagnostic-questions' ? 'active' : ''}`}>
              Initial Diagnostics
            </a>
            <a href="#universal-fix" className={`toc-link ${activeSection === 'universal-fix' ? 'active' : ''}`}>
              Universal Fix
            </a>
            <a href="#network-cloudflare" className={`toc-link ${activeSection === 'network-cloudflare' ? 'active' : ''}`}>
              Cloudflare WARP
            </a>
            <a href="#antivirus-firewall" className={`toc-link ${activeSection === 'antivirus-firewall' ? 'active' : ''}`}>
              Exclusions & Firewall
            </a>
            <a href="#roblox-launchers" className={`toc-link ${activeSection === 'roblox-launchers' ? 'active' : ''}`}>
              Roblox Crashes
            </a>
            <a href="#dependencies-guide" className={`toc-link ${activeSection === 'dependencies-guide' ? 'active' : ''}`}>
              Dependencies
            </a>
            <a href="#analysis-logs" className={`toc-link ${activeSection === 'analysis-logs' ? 'active' : ''}`}>
              Analysis Logs
            </a>
          </nav>
        </div>
      </aside>
    </div>
  );
}
