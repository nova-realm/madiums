'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import type { QR } from '@/lib/types';
import { copyText } from '@/lib/clipboard';

/* ── SVG Icons ── */
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

const DOWNLOAD_SVG = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }} aria-hidden>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

/* ── Topic definitions ── */
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

/* ── Reusable sub-components ── */

function CmdBadge({ cmd, copiedKey, onCopy }: { cmd: string; copiedKey: string | null; onCopy: (key: string, text: string) => void }) {
  const key = `cmd-${cmd}`;
  const copied = copiedKey === key;
  return (
    <button
      type="button"
      className={`macro-badge-btn${copied ? ' copied' : ''}`}
      onClick={() => onCopy(key, cmd)}
      title={`Click to copy bot command "${cmd}"`}
    >
      <code>{cmd}</code>
      <span className="macro-cmd-tag">{copied ? '✓ Copied' : 'Copy Cmd'}</span>
    </button>
  );
}

function InfoBox({ type, children }: { type: 'info' | 'warning' | 'tip'; children: React.ReactNode }) {
  const cls = type === 'warning' ? 'guide-box guide-box-warn' : type === 'tip' ? 'guide-box guide-box-tip' : 'guide-box guide-box-info';
  return <div className={cls}>{children}</div>;
}

function Step({ num, children }: { num: number; children: React.ReactNode }) {
  return (
    <div className="guide-step">
      <div className="guide-step-num">{num}</div>
      <div className="guide-step-body">{children}</div>
    </div>
  );
}

function MediaAttachment({ url }: { url: string }) {
  const lower = url.toLowerCase().split('?')[0];
  const isVideo = lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.endsWith('.mov');
  const isImage = lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.gif') || lower.endsWith('.webp');
  const isBat = lower.endsWith('.bat');
  const isExe = lower.endsWith('.exe') || lower.endsWith('.zip');

  if (isVideo) {
    return (
      <div className="guide-media">
        <video
          src={url}
          controls
          playsInline
          className="guide-video"
          preload="none"
        />
        <span className="guide-media-caption">Video demonstration</span>
      </div>
    );
  }
  if (isImage) {
    return (
      <div className="guide-media">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="Guide illustration" className="guide-img" loading="lazy" />
      </div>
    );
  }
  if (isBat || isExe) {
    const fileName = url.split('/').pop()?.split('?')[0] ?? 'file';
    return (
      <a href={url} download className="guide-dl-btn" target="_blank" rel="noopener noreferrer">
        {DOWNLOAD_SVG}
        <span>Download {fileName}</span>
      </a>
    );
  }
  return null;
}

/* ── Individual guide topic renderers ── */

function TopicOverview() {
  return (
    <div className="guide-topic-content">
      <div className="guide-hero">
        <div className="guide-hero-badge">{BOOK_SVG}</div>
        <h1 className="guide-hero-title">Madium Support Guide</h1>
        <p className="guide-hero-sub">
          The complete reference for Madium support staff. Everything from team protocols to step-by-step troubleshooting playbooks.
        </p>
      </div>
      <InfoBox type="info">
        <strong>Who is this for?</strong> This guide is written for Madium support staff. If you are a user looking for help, please open a ticket in the Discord server.
      </InfoBox>
      <h2 className="guide-section-title">What is Madium?</h2>
      <p className="guide-p">
        Madium is a tool designed to enhance the Roblox experience. Support staff handle tickets from users who run into installation issues, key problems, crashes, antivirus conflicts, and more. Our job is to guide them through solutions efficiently and professionally.
      </p>
      <h2 className="guide-section-title">Official Links</h2>
      <div className="guide-link-grid">
        <a href="https://getmadium.net" target="_blank" rel="noopener noreferrer" className="guide-link-card">
          {EXT_SVG}<span>Madium Download</span><code>getmadium.net</code>
        </a>
        <a href="https://app.getmadium.xyz" target="_blank" rel="noopener noreferrer" className="guide-link-card">
          {EXT_SVG}<span>Key System</span><code>app.getmadium.xyz</code>
        </a>
        <a href="https://madius.dev" target="_blank" rel="noopener noreferrer" className="guide-link-card">
          {EXT_SVG}<span>Madius External</span><code>madius.dev</code>
        </a>
        <a href="https://discord.gg/eQGM8cMZN" target="_blank" rel="noopener noreferrer" className="guide-link-card">
          {EXT_SVG}<span>Support Server</span><code>discord.gg/eQGM8cMZN</code>
        </a>
        <a href="https://discord.gg/olemad" target="_blank" rel="noopener noreferrer" className="guide-link-card">
          {EXT_SVG}<span>Main Server</span><code>discord.gg/olemad</code>
        </a>
      </div>
      <h2 className="guide-section-title">Quick Bot Commands</h2>
      <p className="guide-p">All quick-replies are available via the bot using <code>t!qr &lt;key&gt;</code>. Navigate through the topics in the sidebar to see the full guides for each command.</p>
      <div className="guide-cmd-grid">
        {['ask','exclude','dep','bin','anal','vpn','alt','rdd','corruptweb'].map(k => (
          <code key={k} className="guide-cmd-pill">t!qr {k}</code>
        ))}
      </div>
    </div>
  );
}

function TopicRoles() {
  return (
    <div className="guide-topic-content">
      <h1 className="guide-h1">{USERS_SVG} Roles & Hierarchy</h1>
      <p className="guide-p">Understanding the team structure helps ensure the right people handle the right tickets. Always escalate when in doubt.</p>
      <div className="guide-role-cards">
        <div className="guide-role-card guide-role-lead">
          <span className="guide-role-badge">Lead</span>
          <h3>Project Lead / Admin</h3>
          <p>Oversees the entire operation. Makes final decisions on bans, policy changes, and major feature requests. Do not escalate trivial issues here.</p>
        </div>
        <div className="guide-role-card guide-role-mod">
          <span className="guide-role-badge">Mod</span>
          <h3>Moderator</h3>
          <p>Handles ban appeals, blacklists, rule enforcement, and escalated tickets. If a user is aggressive or abusive, tag a moderator immediately.</p>
        </div>
        <div className="guide-role-card guide-role-support">
          <span className="guide-role-badge">Support</span>
          <h3>Support Staff</h3>
          <p>First line of response in all tickets. Expected to know all troubleshooting playbooks, be professional, and close tickets once resolved.</p>
        </div>
        <div className="guide-role-card guide-role-trial">
          <span className="guide-role-badge">Trial</span>
          <h3>Trial Support</h3>
          <p>New staff under evaluation. Should follow all protocols strictly. Avoid closing tickets without confirmation from a senior member.</p>
        </div>
      </div>
      <InfoBox type="warning">
        <strong>Escalation rule:</strong> If a ticket involves a user threatening legal action, revealing personal information, or a suspected scam, escalate to a moderator immediately and do not engage further.
      </InfoBox>
      <h2 className="guide-section-title">Response Expectations</h2>
      <ul className="guide-ul">
        <li>Always greet the user by acknowledging their issue briefly.</li>
        <li>Use the bot commands (<code>t!qr &lt;key&gt;</code>) to send consistent, accurate responses.</li>
        <li>Do not close a ticket without confirming the issue is resolved.</li>
        <li>Use <code>t!qr ?</code> to check in on idle tickets before closing them.</li>
        <li>Do not argue with users. Stay calm and professional at all times.</li>
      </ul>
    </div>
  );
}

function TopicProtocols() {
  return (
    <div className="guide-topic-content">
      <h1 className="guide-h1">{SHIELD_SVG} Rules, Bans & Security</h1>
      <p className="guide-p">Every support interaction has standards. Deviating from these can result in demotion or blacklisting.</p>
      <h2 className="guide-section-title">Core Rules</h2>
      <ul className="guide-ul">
        <li>Never share internal tools, scripts, or staff-only channels with users.</li>
        <li>Never generate or give a user a key — <strong>this is strictly prohibited.</strong></li>
        <li>Do not assist users who have been blacklisted. Check before starting.</li>
        <li>Do not assist bypasser users who skipped the work.ink link — use <code>t!qr bypasser</code>.</li>
        <li>Always verify issues before claiming they are &apos;known bugs.&apos; Don&apos;t guess.</li>
      </ul>
      <InfoBox type="warning">
        <strong>Key Scam Warning:</strong> If someone asks you to &quot;give them a key&quot; or says &quot;the system is down, can you give me one?&quot; — refuse and close the ticket. We cannot and do not generate keys manually.
      </InfoBox>
      <h2 className="guide-section-title">Blacklist Policy</h2>
      <p className="guide-p">Users who repeatedly open tickets for dismissed issues, abuse staff, or are caught bypassing the key system may be blacklisted. Blacklisting must be approved by a Moderator or above. Do not blacklist users unilaterally.</p>
      <h2 className="guide-section-title">Crash / Downtime Policy</h2>
      <InfoBox type="info">
        <strong>Crashes:</strong> We are currently not working on crash/freeze issues. Use <code>t!qr crash</code> to inform users and close the ticket. Do not open internal tickets for these — more tickets will not speed up the fix.
      </InfoBox>
      <p className="guide-p">During Madium downtime, only Madius External is being supported. Use <code>t!qr down</code> to inform users and redirect them appropriately.</p>
      <h2 className="guide-section-title">Privacy & Data</h2>
      <ul className="guide-ul">
        <li>Never ask for or store a user&apos;s real name, address, or payment information.</li>
        <li>Logs shared for diagnostic purposes (like <code>Madium_Analysis.txt</code>) should be treated as confidential.</li>
        <li>Do not share screenshots of tickets in public channels.</li>
      </ul>
    </div>
  );
}

function TopicDiagnostics({ copiedKey, handleCopy }: { copiedKey: string | null; handleCopy: (k: string, t: string) => void }) {
  return (
    <div className="guide-topic-content">
      <h1 className="guide-h1">{ALERT_SVG} Initial Diagnostic Questions</h1>
      <p className="guide-p">
        Before jumping into fixes, always gather information. Sending fixes blindly wastes both your time and the user&apos;s. Use the diagnostic QR to collect the essentials up front.
      </p>
      <div className="guide-qr-usage">
        <CmdBadge cmd="t!qr ask" copiedKey={copiedKey} onCopy={handleCopy} />
        <span className="guide-qr-usage-label">Send this when opening a ticket</span>
      </div>
      <h2 className="guide-section-title">What this asks the user</h2>
      <ol className="guide-ol">
        <li><strong>Is their Windows account an administrator?</strong> — Many fixes require admin rights. Non-admin accounts will fail silently.</li>
        <li><strong>Do they know what an exclusion is?</strong> — If yes, have they added Madium to their antivirus exclusions?</li>
        <li><strong>Is Roblox open or closed when clicking &quot;Attach&quot;?</strong> — And which launcher are they using (default, Bloxstrap, Fishstrap)?</li>
        <li><strong>Do they have antivirus software installed?</strong> — Even if disabled, some AVs (Kaspersky, McAfee, Malwarebytes) intercept processes.</li>
      </ol>
      <InfoBox type="tip">
        <strong>Tip:</strong> Based on their answers, you can jump directly to the right guide section. Admin account + Kaspersky = go to Antivirus guide. No admin = solve that first before anything else.
      </InfoBox>
      <h2 className="guide-section-title">Interpreting the answers</h2>
      <div className="guide-decision-table">
        <div className="guide-dt-row guide-dt-head">
          <span>Condition</span><span>Action</span>
        </div>
        <div className="guide-dt-row">
          <span>No admin account</span><span>Ask them to log in to an admin account or create one before proceeding</span>
        </div>
        <div className="guide-dt-row">
          <span>Has AV, no exclusion</span><span>Send <code>t!qr exclude</code> first</span>
        </div>
        <div className="guide-dt-row">
          <span>Roblox open when attaching</span><span>Ask them to close Roblox first, then try again</span>
        </div>
        <div className="guide-dt-row">
          <span>Using Bloxstrap / Fishstrap</span><span>Try default Roblox or an alternative launcher — see Roblox guide</span>
        </div>
        <div className="guide-dt-row">
          <span>No AV, no known issues</span><span>Proceed to Universal Clean Fix</span>
        </div>
      </div>
    </div>
  );
}

function TopicKeySystem({ copiedKey, handleCopy }: { copiedKey: string | null; handleCopy: (k: string, t: string) => void }) {
  return (
    <div className="guide-topic-content">
      <h1 className="guide-h1">Key Issues & Work.ink Fix</h1>
      <p className="guide-p">
        Key-related tickets are one of the most common. There are two distinct situations: users who cannot complete the work.ink link, and users who think there is a key system bug.
      </p>
      <InfoBox type="warning">
        <strong>Critical reminder:</strong> We do not generate keys. If a user asks for a manual key, close the ticket immediately using <code>t!qr key</code>.
      </InfoBox>
      <div className="guide-qr-usage">
        <CmdBadge cmd="t!qr key" copiedKey={copiedKey} onCopy={handleCopy} />
        <span className="guide-qr-usage-label">For users asking for a manual key</span>
      </div>
      <h2 className="guide-section-title">Work.ink Not Working</h2>
      <p className="guide-p">This is the most common key issue. Work.ink fails on PC browsers that have ad-blockers or VPNs active. The fix:</p>
      <div className="guide-qr-usage">
        <CmdBadge cmd="t!qr workink" copiedKey={copiedKey} onCopy={handleCopy} />
        <span className="guide-qr-usage-label">Send this for work.ink issues</span>
      </div>
      <div className="guide-steps">
        <Step num={1}>Go to your <strong>phone</strong> and switch to <strong>mobile data</strong> (disable Wi-Fi completely).</Step>
        <Step num={2}>Open a mobile browser with <strong>no ad-blockers and no VPN active</strong>.</Step>
        <Step num={3}>Complete the work.ink link on your phone to get the download link.</Step>
        <Step num={4}>Transfer the download link or file to your PC.</Step>
      </div>
      <InfoBox type="info">
        The download links are also available via the bot: <code>t!qr dl</code> — Workink and Lootlabs links are both listed there.
      </InfoBox>
      <div className="guide-qr-usage" style={{ marginTop: 12 }}>
        <CmdBadge cmd="t!qr dl" copiedKey={copiedKey} onCopy={handleCopy} />
        <span className="guide-qr-usage-label">Send direct download links</span>
      </div>
      <h2 className="guide-section-title">Madius External — Lost Key</h2>
      <p className="guide-p">If a user using Madius External says they lost their key, they can retrieve it easily:</p>
      <div className="guide-qr-usage">
        <CmdBadge cmd="t!qr key-ext" copiedKey={copiedKey} onCopy={handleCopy} />
        <span className="guide-qr-usage-label">For lost Madius External keys</span>
      </div>
      <div className="guide-steps">
        <Step num={1}>Open the Madius External installer again.</Step>
        <Step num={2}>Click <strong>&quot;Get Key&quot;</strong> in the installer — it will retrieve your existing key automatically.</Step>
      </div>
    </div>
  );
}

function TopicUniversal({ copiedKey, handleCopy }: { copiedKey: string | null; handleCopy: (k: string, t: string) => void }) {
  return (
    <div className="guide-topic-content">
      <h1 className="guide-h1">{TOOL_SVG} Universal Clean Fix</h1>
      <p className="guide-p">
        This is your go-to first attempt for most &quot;Madium isn&apos;t working&quot; tickets with no specific error. It covers a full reinstall and exclusion setup before moving to more targeted fixes.
      </p>
      <InfoBox type="tip">
        Always run this <strong>before</strong> suggesting the bin replacement or dependency install unless the user has a very specific, identifiable error.
      </InfoBox>
      <h2 className="guide-section-title">Step-by-Step</h2>
      <div className="guide-steps">
        <Step num={1}>
          <strong>Add antivirus exclusions</strong> — Before touching Madium files, set up exclusions to prevent the AV from blocking or quarantining files.
          <div className="guide-qr-usage" style={{ marginTop: 8 }}>
            <CmdBadge cmd="t!qr exclude" copiedKey={copiedKey} onCopy={handleCopy} />
            <span className="guide-qr-usage-label">Send exclusions guide</span>
          </div>
          <p style={{ fontSize: 13, marginTop: 6, color: 'var(--fg-3)' }}>Folders to exclude: <code>%LocalAppData%/Madium/Bin</code>, <code>C:/Users/%username%/Downloads</code>, <code>%temp%</code></p>
        </Step>
        <Step num={2}>
          <strong>Uninstall Madium completely</strong> — Open &quot;Apps &amp; Features&quot; in Windows Settings and uninstall Madium. Then delete <code>%LocalAppData%/Madium</code> manually if it still exists.
        </Step>
        <Step num={3}>
          <strong>Download a fresh copy</strong> — Use the download link from <code>t!qr dl</code> or from the work.ink link.
          <div className="guide-qr-usage" style={{ marginTop: 8 }}>
            <CmdBadge cmd="t!qr dl" copiedKey={copiedKey} onCopy={handleCopy} />
          </div>
        </Step>
        <Step num={4}>
          <strong>Install as administrator</strong> — Right-click the installer and select &quot;Run as administrator.&quot;
        </Step>
        <Step num={5}>
          <strong>Test immediately after install</strong> — Open Madium before rebooting. If it works, the issue was the old installation.
        </Step>
        <Step num={6}>
          <strong>If still failing</strong> — Move to the Bin Replacement guide or Dependencies install guide.
        </Step>
      </div>
    </div>
  );
}

function TopicBinReplacement({ copiedKey, handleCopy }: { copiedKey: string | null; handleCopy: (k: string, t: string) => void }) {
  return (
    <div className="guide-topic-content">
      <h1 className="guide-h1">Corrupted Bin Replacement</h1>
      <p className="guide-p">
        Sometimes the <code>Bin</code> folder inside Madium&apos;s AppData directory gets corrupted — this causes Madium to fail silently or crash immediately after launch. Replacing the Bin folder resolves this.
      </p>
      <div className="guide-qr-usage">
        <CmdBadge cmd="t!qr bin" copiedKey={copiedKey} onCopy={handleCopy} />
        <span className="guide-qr-usage-label">Send this to the user</span>
      </div>
      <h2 className="guide-section-title">Step-by-Step</h2>
      <div className="guide-steps">
        <Step num={1}>
          Press <kbd>Win</kbd> + <kbd>R</kbd> to open the Run dialog. Type <code>%localappdata%/Madium</code> and press Enter.
        </Step>
        <Step num={2}>
          Find the <strong>Bin</strong> folder inside and <strong>delete it entirely</strong>.
        </Step>
        <Step num={3}>
          Download and extract the replacement Bin folder from the official link:
          <a href="https://gofile.io/d/ySADPi" target="_blank" rel="noopener noreferrer" className="guide-ext-link">
            {EXT_SVG} gofile.io/d/ySADPi
          </a>
        </Step>
        <Step num={4}>
          Drag and drop the extracted <strong>Bin</strong> folder into the <code>%localappdata%/Madium</code> directory — the same place you deleted it from.
        </Step>
        <Step num={5}>
          Launch Madium and test. If the Bin folder was missing entirely (no folder existed before), the same steps apply — just place the new folder there.
        </Step>
      </div>
      <InfoBox type="info">
        If the user says they do not have a Bin folder at all, they should still download and place the new one in the Madium folder. The result is the same.
      </InfoBox>
    </div>
  );
}

function TopicCloudflare({ copiedKey, handleCopy }: { copiedKey: string | null; handleCopy: (k: string, t: string) => void }) {
  return (
    <div className="guide-topic-content">
      <h1 className="guide-h1">Network & Cloudflare WARP</h1>
      <p className="guide-p">
        Connection issues — where Madium loads but cannot contact its servers — are often fixed by changing the network path. Cloudflare WARP is the recommended first attempt.
      </p>
      <div className="guide-qr-usage">
        <CmdBadge cmd="t!qr vpn" copiedKey={copiedKey} onCopy={handleCopy} />
        <span className="guide-qr-usage-label">Send the full WARP/DNS guide</span>
      </div>
      <h2 className="guide-section-title">Method 1 — Cloudflare WARP</h2>
      <div className="guide-steps">
        <Step num={1}>
          Download and install WARP from <a href="https://one.one.one.one" target="_blank" rel="noopener noreferrer" className="guide-inline-link">one.one.one.one</a>.
        </Step>
        <Step num={2}>
          Once installed, open WARP and connect. Select <strong>Traffic and DNS (UDP)</strong> mode — not the &quot;WARP&quot; only mode.
        </Step>
        <Step num={3}>
          Launch Madium and test the connection.
        </Step>
      </div>
      <InfoBox type="tip">
        If WARP doesn&apos;t help, ask the user to try any other VPN of their choice. Sometimes the ISP is the root cause of the block.
      </InfoBox>
      <h2 className="guide-section-title">Method 2 — Manual DNS (Windows 11 Only)</h2>
      <p className="guide-p">For users who prefer not to use a VPN, changing the DNS resolver can resolve connection issues.</p>
      <div className="guide-steps">
        <Step num={1}>Open <strong>Windows Settings</strong> → <strong>Network &amp; Internet</strong> → <strong>Ethernet</strong>.</Step>
        <Step num={2}>Find <strong>DNS Server assignment</strong> and click <strong>Edit</strong>.</Step>
        <Step num={3}>Change <strong>Automatic (DHCP)</strong> to <strong>Manual</strong>.</Step>
        <Step num={4}>Set <strong>Preferred DNS</strong> to <code>1.1.1.1</code> or <code>8.8.8.8</code>.</Step>
        <Step num={5}>Set <strong>Alternate DNS</strong> to <code>1.0.0.1</code> or <code>8.8.4.4</code>.</Step>
        <Step num={6}>Set <strong>DNS over HTTPS</strong> to <strong>On (Automatic Template)</strong> for both entries.</Step>
        <Step num={7}>Click Save, then open <strong>cmd.exe</strong> and run <code>ipconfig /flushdns</code>.</Step>
        <Step num={8}>Test Madium again.</Step>
      </div>
      <div className="guide-qr-usage" style={{ marginTop: 16 }}>
        <CmdBadge cmd="t!qr lastresort" copiedKey={copiedKey} onCopy={handleCopy} />
        <span className="guide-qr-usage-label">Alternative WARP flow (simplified)</span>
      </div>
    </div>
  );
}

function TopicAntivirus({ copiedKey, handleCopy, qrs }: { copiedKey: string | null; handleCopy: (k: string, t: string) => void; qrs: QR[] }) {
  const excludeQR = qrs.find(q => q.id === 'exclude');
  const firewallQR = qrs.find(q => q.id === 'firewall');
  const excludeVideo = excludeQR?.attachments?.[0];
  const firewallVideo = firewallQR?.attachments?.[0];

  return (
    <div className="guide-topic-content">
      <h1 className="guide-h1">{SHIELD_SVG} Antivirus & Firewall Rules</h1>
      <p className="guide-p">
        Antivirus software is the #1 cause of Madium not working. Antivirus programs quarantine or block Madium&apos;s core files because they are flagged as suspicious — this is a false positive. The fix is adding exclusions.
      </p>
      <h2 className="guide-section-title">Windows Security Exclusions</h2>
      <p className="guide-p">Start here for most users — they will be running Windows Defender.</p>
      <div className="guide-qr-usage">
        <CmdBadge cmd="t!qr exclude" copiedKey={copiedKey} onCopy={handleCopy} />
        <span className="guide-qr-usage-label">Send the full exclusions guide</span>
      </div>
      <div className="guide-steps">
        <Step num={1}>Open <strong>Windows Security</strong> → <strong>Virus &amp; threat protection</strong>.</Step>
        <Step num={2}>Click <strong>Manage settings</strong> under &quot;Virus &amp; threat protection settings&quot;.</Step>
        <Step num={3}>Scroll to <strong>Exclusions</strong> and click <strong>Add or remove exclusions</strong>. Accept the admin prompt.</Step>
        <Step num={4}>
          Add the following <strong>Folder</strong> exclusions one by one:
          <ul className="guide-ul" style={{ marginTop: 8 }}>
            <li><code>C:/Users/%username%/Downloads</code></li>
            <li><code>%LocalAppData%/Madium/Bin</code></li>
            <li><code>%temp%</code></li>
          </ul>
        </Step>
        <Step num={5}>Restart Madium and test.</Step>
      </div>
      {excludeVideo && (
        <div style={{ marginTop: 12 }}>
          <p className="guide-media-label">Video walkthrough:</p>
          <MediaAttachment url={excludeVideo} />
        </div>
      )}
      <h2 className="guide-section-title" style={{ marginTop: 28 }}>Windows Firewall Rules</h2>
      <p className="guide-p">If antivirus exclusions don&apos;t fix it, the Windows Firewall may be blocking Madium&apos;s network connections. You need to allow inbound and outbound traffic for the three Madium executables.</p>
      <div className="guide-qr-usage">
        <CmdBadge cmd="t!qr firewall" copiedKey={copiedKey} onCopy={handleCopy} />
        <span className="guide-qr-usage-label">Send the full firewall guide</span>
      </div>
      <div className="guide-steps">
        <Step num={1}>Search <strong>Firewall</strong> in the Windows search bar and open <strong>Windows Defender Firewall with Advanced Security</strong>.</Step>
        <Step num={2}>Click <strong>Inbound Rules</strong> on the left, then <strong>New Rule</strong> on the right.</Step>
        <Step num={3}>
          Select <strong>Program</strong> → Next. Add the path for each of these executables (repeat for all three):
          <ul className="guide-ul" style={{ marginTop: 8 }}>
            <li><code>C:\Users\&lt;username&gt;\AppData\Roaming\Madium\Bin\Loader.exe</code></li>
            <li><code>C:\Users\&lt;username&gt;\AppData\Roaming\Madium\Bin\Madium.exe</code></li>
            <li>The path to your <code>madium-launcher.exe</code></li>
          </ul>
        </Step>
        <Step num={4}>Select <strong>Allow the connection</strong>, check all three boxes (Domain, Private, Public), then give it a name.</Step>
        <Step num={5}>Repeat the exact same process for <strong>Outbound Rules</strong> with the same three paths.</Step>
      </div>
      {firewallVideo && (
        <div style={{ marginTop: 12 }}>
          <p className="guide-media-label">Video walkthrough:</p>
          <MediaAttachment url={firewallVideo} />
        </div>
      )}
      <InfoBox type="warning">
        <strong>Third-party AV (Kaspersky, McAfee, Malwarebytes, etc.):</strong> Windows Security exclusions do NOT apply to these. The user must open their specific AV software and add the same folder paths as exclusions within that AV&apos;s settings. Every AV interface is different — advise the user to Google their specific AV + &quot;add folder exclusion&quot; if they are unsure.
      </InfoBox>
    </div>
  );
}

function TopicRoblox({ copiedKey, handleCopy, qrs }: { copiedKey: string | null; handleCopy: (k: string, t: string) => void; qrs: QR[] }) {
  const rddQR = qrs.find(q => q.id === 'rdd');
  const rddVideo = rddQR?.attachments?.[0];

  return (
    <div className="guide-topic-content">
      <h1 className="guide-h1">Roblox Crashes & Launchers</h1>
      <p className="guide-p">
        Madium attaches to the Roblox process. If Roblox itself is crashing, outdated, or using an incompatible launcher, Madium will appear to fail. This guide covers launcher alternatives and the RDD downgrade method.
      </p>
      <InfoBox type="warning">
        <strong>Crash policy:</strong> If the user is reporting Madium crashes or Roblox crashes specifically caused by Madium — we are not currently fixing those. Use <code>t!qr crash</code> and close the ticket.
      </InfoBox>
      <div className="guide-qr-usage">
        <CmdBadge cmd="t!qr crash" copiedKey={copiedKey} onCopy={handleCopy} />
        <span className="guide-qr-usage-label">Use for crash reports</span>
      </div>
      <h2 className="guide-section-title">Alternative Roblox Launchers</h2>
      <p className="guide-p">If the user is having issues with the default Roblox launcher or Bloxstrap, try these alternatives with Madium:</p>
      <div className="guide-qr-usage">
        <CmdBadge cmd="t!qr alt" copiedKey={copiedKey} onCopy={handleCopy} />
        <span className="guide-qr-usage-label">Send alternative launchers</span>
      </div>
      <div className="guide-link-grid" style={{ marginTop: 12 }}>
        <a href="https://github.com/fishstrap/fishstrap" target="_blank" rel="noopener noreferrer" className="guide-link-card">
          {EXT_SVG}<span>Fishstrap</span><code>github.com/fishstrap</code>
        </a>
        <a href="https://github.com/Froststrap/Froststrap" target="_blank" rel="noopener noreferrer" className="guide-link-card">
          {EXT_SVG}<span>Froststrap</span><code>github.com/Froststrap</code>
        </a>
        <a href="https://github.com/voidstrap/Voidstrap/releases" target="_blank" rel="noopener noreferrer" className="guide-link-card">
          {EXT_SVG}<span>Voidstrap</span><code>github.com/voidstrap</code>
        </a>
      </div>
      <p className="guide-p" style={{ marginTop: 16 }}>Have the user try each one with Madium and report back which (if any) works.</p>
      <h2 className="guide-section-title">Downgrading Roblox with RDD</h2>
      <p className="guide-p">
        When Roblox updates and breaks compatibility with Madium, users can downgrade to an older Roblox version using <strong>RDD by WEAO</strong>.
      </p>
      <div className="guide-qr-usage">
        <CmdBadge cmd="t!qr rdd" copiedKey={copiedKey} onCopy={handleCopy} />
        <span className="guide-qr-usage-label">Send RDD instructions</span>
      </div>
      <div className="guide-steps">
        <Step num={1}>
          Go to <a href="https://rdd.weao.xyz" target="_blank" rel="noopener noreferrer" className="guide-inline-link">rdd.weao.xyz</a>.
        </Step>
        <Step num={2}>Click <strong>Download Latest</strong> — or pick a specific Roblox version that Madium supports.</Step>
        <Step num={3}>Wait for the site to provide a ZIP file.</Step>
        <Step num={4}>
          Extract the contents to <code>C:\Users\&lt;username&gt;\AppData\Local\Roblox\Versions</code>. If that folder doesn&apos;t exist, create it. Rename the extracted folder so it looks like <code>version-xxx</code> (remove the <code>WEAO-Live-WindowsPlayer-</code> prefix).
        </Step>
        <Step num={5}>Open <strong>Madium</strong> → go to <strong>Versions</strong> (the download icon) → click <strong>Patch</strong> to patch that Roblox version.</Step>
        <Step num={6}>Launch Madium. The issue should be resolved.</Step>
      </div>
      {rddVideo && (
        <div style={{ marginTop: 12 }}>
          <p className="guide-media-label">Video walkthrough:</p>
          <MediaAttachment url={rddVideo} />
        </div>
      )}
      <h2 className="guide-section-title" style={{ marginTop: 24 }}>Multiple Clients / Launch Error</h2>
      <p className="guide-p">
        For &quot;Couldn&apos;t Launch Roblox&quot; or &quot;multiple clients&quot; errors, refer the user to the dedicated channel in the Discord server using <code>t!qr crash</code> which includes the relevant Discord link.
      </p>
    </div>
  );
}

function TopicWebview({ copiedKey, handleCopy }: { copiedKey: string | null; handleCopy: (k: string, t: string) => void }) {
  return (
    <div className="guide-topic-content">
      <h1 className="guide-h1">WebView2 Corruptions</h1>
      <p className="guide-p">
        Microsoft Edge WebView2 is a required component that Madium uses for certain UI rendering. If <code>EdgeWebView</code> is missing or corrupted, Madium may crash or fail to open entirely.
      </p>
      <div className="guide-qr-usage">
        <CmdBadge cmd="t!qr corruptweb" copiedKey={copiedKey} onCopy={handleCopy} />
        <span className="guide-qr-usage-label">Send this to the user</span>
      </div>
      <h2 className="guide-section-title">Fix: Manually Repair EdgeWebView</h2>
      <InfoBox type="info">
        This fix works by copying the existing Microsoft Edge installation and renaming it to EdgeWebView — effectively replacing the corrupted WebView2 with a working copy.
      </InfoBox>
      <div className="guide-steps">
        <Step num={1}>Navigate to <code>C:\Program Files (x86)\Microsoft</code>.</Step>
        <Step num={2}>Delete the folder named <strong>EdgeWebView</strong>.</Step>
        <Step num={3}>Copy the <strong>Edge</strong> folder in that same directory — you will now have a folder called <strong>Edge - Copy</strong>.</Step>
        <Step num={4}>Rename <strong>Edge - Copy</strong> to <strong>EdgeWebView</strong>.</Step>
        <Step num={5}>Launch Madium. It should now load correctly.</Step>
      </div>
      <InfoBox type="tip">
        If the user doesn&apos;t have an <code>Edge</code> folder at all, they should first install Microsoft Edge WebView2 Runtime. See the Dependencies guide.
      </InfoBox>
    </div>
  );
}

function TopicDependencies({ copiedKey, handleCopy }: { copiedKey: string | null; handleCopy: (k: string, t: string) => void }) {
  return (
    <div className="guide-topic-content">
      <h1 className="guide-h1">Required Dependencies</h1>
      <p className="guide-p">
        Madium requires several system libraries to run. Missing or outdated dependencies cause a wide range of failures — from crashes at launch to specific features not working. Always have the user install all of these before more specific debugging.
      </p>
      <div className="guide-qr-usage">
        <CmdBadge cmd="t!qr dep" copiedKey={copiedKey} onCopy={handleCopy} />
        <span className="guide-qr-usage-label">Send the dependency install list</span>
      </div>
      <h2 className="guide-section-title">Required Packages</h2>
      <div className="guide-dep-list">
        <a href="https://builds.dotnet.microsoft.com/dotnet/WindowsDesktop/8.0.27/windowsdesktop-runtime-8.0.27-win-x64.exe" download className="guide-dep-item">
          {DOWNLOAD_SVG}<span>.NET Runtime 8.0</span><code>windowsdesktop-runtime-8.0.27</code>
        </a>
        <a href="https://aka.ms/vc14/vc_redist.x64.exe" download className="guide-dep-item">
          {DOWNLOAD_SVG}<span>Visual C++ Redistributable (x64)</span><code>vc_redist.x64.exe</code>
        </a>
        <a href="https://aka.ms/vc14/vc_redist.x86.exe" download className="guide-dep-item">
          {DOWNLOAD_SVG}<span>Visual C++ Redistributable (x86)</span><code>vc_redist.x86.exe</code>
        </a>
        <a href="https://go.microsoft.com/fwlink/?linkid=2124701" download className="guide-dep-item">
          {DOWNLOAD_SVG}<span>Microsoft Edge WebView2 Runtime</span><code>MicrosoftEdgeWebView2Setup.exe</code>
        </a>
        <a href="https://download.microsoft.com/download/1/7/1/1718ccc4-6315-4d8e-9543-8e28a4e18c4c/dxwebsetup.exe" download className="guide-dep-item">
          {DOWNLOAD_SVG}<span>DirectX End-User Runtime</span><code>dxwebsetup.exe</code>
        </a>
        <a href="https://go.microsoft.com/fwlink/?LinkId=2085155" download className="guide-dep-item">
          {DOWNLOAD_SVG}<span>.NET Framework 4.8</span><code>ndp48-web.exe</code>
        </a>
      </div>
      <InfoBox type="warning">
        <strong>DirectX install:</strong> When the DirectX installer opens, <strong>uncheck the &quot;Bing Bar&quot; option</strong> before proceeding. Just uncheck it and hit install normally.
      </InfoBox>
      <p className="guide-p">After installing all dependencies, ask the user to <strong>restart their PC</strong> before testing Madium again.</p>
    </div>
  );
}

function TopicAnalysis({ copiedKey, handleCopy, qrs }: { copiedKey: string | null; handleCopy: (k: string, t: string) => void; qrs: QR[] }) {
  const analQR = qrs.find(q => q.id === 'anal');
  const batUrl = analQR?.attachments?.[0];

  return (
    <div className="guide-topic-content">
      <h1 className="guide-h1">Generating Analysis Logs</h1>
      <p className="guide-p">
        When standard fixes haven&apos;t worked and you need to understand what is wrong with a user&apos;s system, request an Analysis Log. This runs a batch script that collects system information, Madium logs, and relevant data into a single text file.
      </p>
      <div className="guide-qr-usage">
        <CmdBadge cmd="t!qr anal" copiedKey={copiedKey} onCopy={handleCopy} />
        <span className="guide-qr-usage-label">Send the analysis request to the user</span>
      </div>
      <h2 className="guide-section-title">Instructions for the User</h2>
      <div className="guide-steps">
        <Step num={1}>
          Download the analysis batch file below:
          {batUrl ? (
            <MediaAttachment url={batUrl} />
          ) : (
            <a href="https://cdn.discordapp.com/attachments/1486055444223885375/1521271601583362201/analysis.bat" download className="guide-dl-btn" style={{ marginTop: 8 }}>
              {DOWNLOAD_SVG}<span>Download analysis.bat</span>
            </a>
          )}
        </Step>
        <Step num={2}>Double-click <code>analysis.bat</code> to run it. A Command Prompt window will open briefly.</Step>
        <Step num={3}>Go to the <strong>Desktop</strong> and find the file called <strong>Madium_Analysis.txt</strong>.</Step>
        <Step num={4}>Drag and drop <strong>Madium_Analysis.txt</strong> into the support ticket.</Step>
      </div>
      <InfoBox type="info">
        The analysis file is safe. It collects system info relevant to diagnosing Madium — nothing sensitive like passwords or personal files. When reviewing it, look for signs of antivirus deletions, missing dependencies, or failed service starts.
      </InfoBox>
      <h2 className="guide-section-title">Interpreting the Log</h2>
      <ul className="guide-ul">
        <li>Look for <strong>deleted or quarantined files</strong> — indicates AV interference. → Send exclusions guide.</li>
        <li>Look for <strong>missing DLL errors</strong> — indicates missing dependencies. → Send dep guide.</li>
        <li>Look for <strong>service failures</strong> or <strong>access denied</strong> entries — indicates permission issues. Verify admin account.</li>
        <li>Look for <strong>network timeouts</strong> or <strong>connection refused</strong> — indicates network/firewall issue. → Send WARP guide.</li>
      </ul>
    </div>
  );
}

/* ── Main Component ── */

export default function GuideContent({ qrs }: Props) {
  const [activeTopic, setActiveTopic] = useState<GuideTopicKey>('overview');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Sync URL topic on initial load or popstate
  useEffect(() => {
    const parseUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const queryTopic = params.get('topic')?.toLowerCase();
      if (queryTopic) {
        const match = TOPICS.find((t) => t.key === queryTopic);
        if (match) { setActiveTopic(match.key); return; }
      }
      const hash = window.location.hash.replace('#', '').toLowerCase();
      if (hash) {
        const match = TOPICS.find((t) => t.key === hash);
        if (match) { setActiveTopic(match.key); return; }
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
    setDrawerOpen(false);
  }

  function playEasterEggSound() {
    try {
      const audio = new Audio('/assets/voicy.mp3');
      audio.currentTime = 0;
      audio.play().catch(() => {});
    } catch {}
  }

  async function handleCopy(key: string, text: string) {
    if (key.toLowerCase().includes('nigga') || text.toLowerCase().includes('nigga')) {
      playEasterEggSound();
    }
    const ok = await copyText(text);
    if (ok) {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1800);
    }
  }

  const currentIndex = TOPICS.findIndex((t) => t.key === activeTopic);
  const prevTopic = currentIndex > 0 ? TOPICS[currentIndex - 1] : null;
  const nextTopic = currentIndex < TOPICS.length - 1 ? TOPICS[currentIndex + 1] : null;

  const filteredTopics = useMemo(() => {
    if (!searchFilter) return TOPICS;
    const q = searchFilter.toLowerCase();
    return TOPICS.filter((t) => t.title.toLowerCase().includes(q) || t.key.includes(q));
  }, [searchFilter]);

  const categories = useMemo(() => {
    const map = new Map<string, NavTopic[]>();
    filteredTopics.forEach((t) => {
      if (!map.has(t.category)) map.set(t.category, []);
      map.get(t.category)!.push(t);
    });
    return Array.from(map.entries());
  }, [filteredTopics]);

  function renderTopicContent() {
    const props = { copiedKey, handleCopy, qrs };
    switch (activeTopic) {
      case 'overview':        return <TopicOverview />;
      case 'roles':           return <TopicRoles />;
      case 'protocols':       return <TopicProtocols />;
      case 'diagnostics':     return <TopicDiagnostics {...props} />;
      case 'key-system':      return <TopicKeySystem {...props} />;
      case 'universal':       return <TopicUniversal {...props} />;
      case 'bin-replacement': return <TopicBinReplacement {...props} />;
      case 'cloudflare':      return <TopicCloudflare {...props} />;
      case 'antivirus':       return <TopicAntivirus {...props} />;
      case 'roblox':          return <TopicRoblox {...props} />;
      case 'webview':         return <TopicWebview {...props} />;
      case 'dependencies':    return <TopicDependencies {...props} />;
      case 'analysis':        return <TopicAnalysis {...props} />;
      default:                return <TopicOverview />;
    }
  }

  return (
    <div className="guide-layout">
      {/* Mobile drawer toggle */}
      <button
        type="button"
        className="guide-drawer-toggle"
        onClick={() => setDrawerOpen(v => !v)}
        aria-label="Toggle navigation"
        aria-expanded={drawerOpen}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
          <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
        <span>Navigation</span>
      </button>

      {/* Sidebar */}
      <aside className={`guide-sidebar${drawerOpen ? ' open' : ''}`}>
        <div className="guide-sidebar-search">
          <input
            type="search"
            placeholder="Search topics…"
            value={searchFilter}
            onChange={e => setSearchFilter(e.target.value)}
            className="guide-sidebar-input"
            aria-label="Filter guide topics"
          />
        </div>

        <nav className="guide-sidebar-nav" aria-label="Guide sections">
          {categories.map(([cat, items]) => (
            <div key={cat} className="guide-nav-group">
              <span className="guide-nav-category">{cat}</span>
              {items.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  className={`guide-nav-item${activeTopic === t.key ? ' active' : ''}`}
                  onClick={() => switchTopic(t.key)}
                  aria-current={activeTopic === t.key ? 'page' : undefined}
                >
                  {t.title}
                </button>
              ))}
            </div>
          ))}
          {filteredTopics.length === 0 && (
            <p className="guide-sidebar-empty">No topics found.</p>
          )}
        </nav>
      </aside>

      {/* Main content */}
      <main className="guide-main" id="guide-content">
        <div className="guide-content-inner">
          {renderTopicContent()}

          {/* Prev / Next navigation */}
          <div className="guide-pagination">
            {prevTopic ? (
              <button type="button" className="guide-page-btn guide-page-prev" onClick={() => switchTopic(prevTopic.key)}>
                {ARROW_LEFT_SVG}
                <div>
                  <span className="guide-page-label">Previous</span>
                  <span className="guide-page-title">{prevTopic.title}</span>
                </div>
              </button>
            ) : <div />}
            {nextTopic ? (
              <button type="button" className="guide-page-btn guide-page-next" onClick={() => switchTopic(nextTopic.key)}>
                <div>
                  <span className="guide-page-label">Next</span>
                  <span className="guide-page-title">{nextTopic.title}</span>
                </div>
                {ARROW_RIGHT_SVG}
              </button>
            ) : <div />}
          </div>
        </div>
      </main>
    </div>
  );
}
