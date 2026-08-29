/** Escape HTML special chars */
export function escHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export interface FileMeta {
  isDownloadableFile: boolean;
  fileName: string;
  extension: string;
  label: string;
  category: 'script' | 'exe' | 'zip' | 'doc' | 'file';
}

const FILE_EXT_MAP: Record<
  string,
  { label: string; category: 'script' | 'exe' | 'zip' | 'doc' | 'file' }
> = {
  bat: { label: 'Windows Batch Script', category: 'script' },
  cmd: { label: 'Command Script', category: 'script' },
  ps1: { label: 'PowerShell Script', category: 'script' },
  sh: { label: 'Shell Script', category: 'script' },
  py: { label: 'Python Script', category: 'script' },
  lua: { label: 'Lua Script', category: 'script' },
  vbs: { label: 'VBScript File', category: 'script' },
  exe: { label: 'Windows Executable', category: 'exe' },
  msi: { label: 'Windows Installer', category: 'exe' },
  dll: { label: 'Application DLL', category: 'exe' },
  scr: { label: 'Screen / Script Executable', category: 'exe' },
  zip: { label: 'ZIP Archive', category: 'zip' },
  rar: { label: 'RAR Archive', category: 'zip' },
  '7z': { label: '7-Zip Archive', category: 'zip' },
  tar: { label: 'TAR Archive', category: 'zip' },
  gz: { label: 'GZ Archive', category: 'zip' },
  txt: { label: 'Text Document', category: 'doc' },
  log: { label: 'Log File', category: 'doc' },
  json: { label: 'JSON Document', category: 'doc' },
  xml: { label: 'XML File', category: 'doc' },
  cfg: { label: 'Config File', category: 'doc' },
  ini: { label: 'Config File', category: 'doc' },
  pdf: { label: 'PDF Document', category: 'doc' },
};

export function isVideoUrl(url: string): boolean {
  if (!url) return false;
  const clean = url.split('?')[0].split('#')[0].toLowerCase();
  return /\.(mp4|webm|mov|m4v|ogg)$/i.test(clean);
}

export function isImageUrl(url: string): boolean {
  if (!url) return false;
  if (isVideoUrl(url)) return false;
  const clean = url.split('?')[0].split('#')[0].toLowerCase();
  return (
    /\.(png|jpe?g|gif|webp|svg|ico|bmp)$/i.test(clean) ||
    /\/api\/uploads\/.*\.(png|jpe?g|gif|webp|svg|ico|bmp)/i.test(clean) ||
    /\/uploads\/.*\.(png|jpe?g|gif|webp|svg|ico|bmp)/i.test(clean) ||
    (
      (url.includes('cdn.discordapp.com/attachments/') || url.includes('media.discordapp.net/attachments/')) &&
      !/\.(mp4|webm|mov|m4v|ogg|txt|bat|cmd|ps1|sh|py|lua|vbs|exe|msi|dll|zip|rar|7z|tar|gz|log|json|xml|cfg|ini|pdf)$/i.test(clean)
    )
  );
}

export function getFileMeta(rawUrl: string, fallbackName?: string): FileMeta {
  try {
    const cleanUrl = rawUrl.split('?')[0].split('#')[0];
    const rawFileName = cleanUrl.split('/').pop() || '';
    const decodedName = decodeURIComponent(rawFileName);
    const candidateName =
      fallbackName && fallbackName.includes('.')
        ? fallbackName
        : decodedName || fallbackName || 'file';
    const ext = (candidateName.split('.').pop() || '').toLowerCase();

    if (FILE_EXT_MAP[ext]) {
      return {
        isDownloadableFile: true,
        fileName: candidateName,
        extension: ext,
        label: FILE_EXT_MAP[ext].label,
        category: FILE_EXT_MAP[ext].category,
      };
    }

    // Check if it is a Discord CDN attachment with any non-media file
    if (
      rawUrl.includes('cdn.discordapp.com/attachments/') ||
      rawUrl.includes('media.discordapp.net/attachments/')
    ) {
      if (
        ext &&
        ![
          'png',
          'jpg',
          'jpeg',
          'gif',
          'webp',
          'svg',
          'mp4',
          'webm',
          'mov',
          'm4v',
          'ogg',
        ].includes(ext)
      ) {
        return {
          isDownloadableFile: true,
          fileName: candidateName,
          extension: ext,
          label: `${ext.toUpperCase()} Attachment`,
          category: 'file',
        };
      }
    }
  } catch {
    // fallback
  }

  return {
    isDownloadableFile: false,
    fileName: fallbackName || 'file',
    extension: '',
    label: 'File',
    category: 'file',
  };
}

export function renderFileCard(url: string, fileMeta: FileMeta): string {
  const { fileName, label, category, extension } = fileMeta;
  const safeUrl = escHtml(url);
  const safeName = escHtml(fileName);
  const safeLabel = escHtml(label);
  const safeExt = escHtml(extension ? extension.toUpperCase() : 'FILE');

  let iconSvg = '';
  if (category === 'script') {
    iconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="dc-file-svg" aria-hidden="true"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>`;
  } else if (category === 'exe') {
    iconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="dc-file-svg" aria-hidden="true"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>`;
  } else if (category === 'zip') {
    iconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="dc-file-svg" aria-hidden="true"><path d="M21 8v13H3V8"></path><path d="M1 3h22v5H1z"></path><path d="M10 12h4"></path></svg>`;
  } else if (category === 'doc') {
    iconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="dc-file-svg" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>`;
  } else {
    iconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="dc-file-svg" aria-hidden="true"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>`;
  }

  const downloadSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="dc-download-svg" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`;

  return `<div class="dc-file-card">
    <div class="dc-file-icon-box dc-icon-${category}">
      ${iconSvg}
      <span class="dc-file-ext-tag">${safeExt}</span>
    </div>
    <div class="dc-file-info">
      <span class="dc-file-name" title="${safeName}">${safeName}</span>
      <span class="dc-file-meta">${safeLabel}</span>
    </div>
    <a href="${safeUrl}" target="_blank" rel="noopener" download="${safeName}" class="dc-file-download-btn" title="Download ${safeName}">
      ${downloadSvg}
    </a>
  </div>`;
}

/** Tokenizer to safely replace markdown without regex collisions on generated HTML */
function inline(raw: string): string {
  const tokens: string[] = [];
  const pushToken = (html: string) => {
    const placeholder = `\x00TOKEN_${tokens.length}\x00`;
    tokens.push(html);
    return placeholder;
  };

  let s = raw;

  // 0. Discord custom emojis: <:name:id> or <a:name:id>
  s = s.replace(/<(a)?:([a-zA-Z0-9_~]+):([0-9]+)>/g, (_, anim, name, id) => {
    const ext = anim ? 'gif' : 'png';
    const emojiUrl = `https://cdn.discordapp.com/emojis/${id}.${ext}?size=48&quality=lossless`;
    return pushToken(
      `<img class="dc-custom-emoji" src="${escHtml(emojiUrl)}" alt=":${escHtml(name)}:" title=":${escHtml(name)}:" loading="lazy" />`
    );
  });

  // 1. Markdown images: ![alt](url)
  s = s.replace(/!\[([^\]]*)\]\(([^)]+)\)/gi, (_, alt, rawUrl) => {
    const url = rawUrl.trim();
    if (isVideoUrl(url)) {
      const fileName = url.split('/').pop()?.split('?')[0] || 'Open Video';
      return pushToken(
        `<div class="dc-media-wrap dc-video-wrap"><video src="${escHtml(url)}" controls playsinline preload="metadata" class="dc-video"></video><div class="dc-media-link"><a href="${escHtml(url)}" target="_blank" rel="noopener">${escHtml(alt || fileName)}</a></div></div>`
      );
    }
    const fileMeta = getFileMeta(url, alt);
    if (fileMeta.isDownloadableFile) {
      return pushToken(renderFileCard(url, fileMeta));
    }
    return pushToken(
      `<div class="dc-media-wrap"><a href="${escHtml(url)}" target="_blank" rel="noopener"><img src="${escHtml(url)}" alt="${escHtml(alt || 'Attachment')}" class="dc-img" loading="lazy" /></a></div>`
    );
  });

  // 2. Media shortcuts: [image](url), [attachment](url), [video](url), etc.
  s = s.replace(/\[(image|img|screenshot|attachment|photo|video|vid|clip)\]\(([^)]+)\)/gi, (_, label, rawUrl) => {
    const url = rawUrl.trim();
    const lowerLabel = label.toLowerCase();
    
    if (isVideoUrl(url) || ['video', 'vid', 'clip'].includes(lowerLabel)) {
      const fileName = url.split('/').pop()?.split('?')[0] || 'Open Video';
      return pushToken(
        `<div class="dc-media-wrap dc-video-wrap"><video src="${escHtml(url)}" controls playsinline preload="metadata" class="dc-video"></video><div class="dc-media-link"><a href="${escHtml(url)}" target="_blank" rel="noopener">${escHtml(fileName)}</a></div></div>`
      );
    }

    const fileMeta = getFileMeta(url, label);
    if (fileMeta.isDownloadableFile) {
      return pushToken(renderFileCard(url, fileMeta));
    }

    return pushToken(
      `<div class="dc-media-wrap"><a href="${escHtml(url)}" target="_blank" rel="noopener"><img src="${escHtml(url)}" alt="${escHtml(label)}" class="dc-img" loading="lazy" /></a></div>`
    );
  });

  // 3. Standard markdown links: [text](url)
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, rawUrl) => {
    const url = rawUrl.trim();
    const isExternal = url.startsWith('http://') || url.startsWith('https://');

    if (isVideoUrl(url)) {
      return pushToken(
        `<div class="dc-media-wrap dc-video-wrap"><video src="${escHtml(url)}" controls playsinline preload="metadata" class="dc-video"></video><div class="dc-media-link"><a href="${escHtml(url)}" target="_blank" rel="noopener">${escHtml(label)}</a></div></div>`
      );
    }

    if (
      isImageUrl(url) &&
      ['image', 'img', 'screenshot', 'attachment', 'photo', 'picture'].includes(label.toLowerCase())
    ) {
      return pushToken(
        `<div class="dc-media-wrap"><a href="${escHtml(url)}" target="_blank" rel="noopener"><img src="${escHtml(url)}" alt="${escHtml(label)}" class="dc-img" loading="lazy" /></a></div>`
      );
    }

    const fileMeta = getFileMeta(url, label);
    if (fileMeta.isDownloadableFile) {
      return pushToken(renderFileCard(url, fileMeta));
    }

    const targetAttr = isExternal ? ' target="_blank" rel="noopener"' : '';
    const arrowSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="dc-link-arrow" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>`;

    return pushToken(
      `<a href="${escHtml(url)}"${targetAttr} class="dc-link">${escHtml(label)} ${arrowSvg}</a>`
    );
  });

  // 4. Discord angle bracket links: <https://...>
  s = s.replace(/<((?:https?:\/\/|\/api\/uploads\/|\/uploads\/)[^\s>]+)>/g, (_, url) => {
    if (isVideoUrl(url)) {
      return pushToken(
        `<div class="dc-media-wrap dc-video-wrap"><video src="${escHtml(url)}" controls playsinline preload="metadata" class="dc-video"></video><div class="dc-media-link"><a href="${escHtml(url)}" target="_blank" rel="noopener">${escHtml(url)}</a></div></div>`
      );
    }
    const fileMeta = getFileMeta(url);
    if (fileMeta.isDownloadableFile) {
      return pushToken(renderFileCard(url, fileMeta));
    }
    if (isImageUrl(url)) {
      return pushToken(
        `<div class="dc-media-wrap"><a href="${escHtml(url)}" target="_blank" rel="noopener"><img src="${escHtml(url)}" alt="Attachment" class="dc-img" loading="lazy" /></a></div>`
      );
    }
    return pushToken(
      `<a href="${escHtml(url)}" target="_blank" rel="noopener">${escHtml(url)}</a>`
    );
  });

  // 5. Bare URLs (auto-linking with video, image, and file card detection)
  s = s.replace(/(https?:\/\/[^\s<)\]>"']+|\/api\/uploads\/[^\s<)\]>"']+|\/uploads\/[^\s<)\]>"']+)/g, (url) => {
    if (isVideoUrl(url)) {
      const fileName = url.split('/').pop()?.split('?')[0] || url;
      return pushToken(
        `<div class="dc-media-wrap dc-video-wrap"><video src="${escHtml(url)}" controls playsinline preload="metadata" class="dc-video"></video><div class="dc-media-link"><a href="${escHtml(url)}" target="_blank" rel="noopener">${escHtml(fileName)}</a></div></div>`
      );
    }
    const fileMeta = getFileMeta(url);
    if (fileMeta.isDownloadableFile) {
      return pushToken(renderFileCard(url, fileMeta));
    }
    if (isImageUrl(url)) {
      return pushToken(
        `<div class="dc-media-wrap"><a href="${escHtml(url)}" target="_blank" rel="noopener"><img src="${escHtml(url)}" alt="Attachment" class="dc-img" loading="lazy" /></a></div>`
      );
    }
    return pushToken(
      `<a href="${escHtml(url)}" target="_blank" rel="noopener">${escHtml(url)}</a>`
    );
  });

  // Safe HTML escaping for remaining non-token characters
  s = escHtml(s);

  // 6. Inline code: `code`
  s = s.replace(/`([^`]+)`/g, (_, c) => `<code class="dc-code">${c}</code>`);

  // 7. Text formatting: **bold**, __underline__, ~~strike~~
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/__([^_]+)__/g, '<u>$1</u>');
  s = s.replace(/~~([^~]+)~~/g, '<s>$1</s>');

  // 8. Restore placeholders with exact token HTML
  tokens.forEach((tok, i) => {
    const placeholder = `\x00TOKEN_${i}\x00`;
    s = s.split(placeholder).join(tok);
  });

  return s;
}

/** Full Discord markdown block → HTML */
export function mdToHtml(raw: string): string {
  if (!raw) return '';
  const lines = raw.split('\n');
  let out = '';
  let i = 0;

  while (i < lines.length) {
    const ln = lines[i];
    const trimmed = ln.trim();

    if (!trimmed) {
      out += '<div class="dc-spacer"></div>';
      i++;
      continue;
    }

    // Headers
    const h = ln.match(/^(#{1,3})\s+(.*)/);
    if (h) {
      out += `<div class="dc-h${h[1].length}">${inline(h[2])}</div>`;
      i++;
      continue;
    }

    // Subtext / small note (-# note)
    const sub = ln.match(/^-#\s+(.*)/);
    if (sub) {
      out += `<div class="dc-subtext">${inline(sub[1])}</div>`;
      i++;
      continue;
    }

    // Blockquotes (> text)
    if (/^>\s?/.test(ln)) {
      const qs: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        qs.push(inline(lines[i].replace(/^>\s?/, '')));
        i++;
      }
      out += `<blockquote class="dc-quote">${qs.join('<br>')}</blockquote>`;
      continue;
    }

    // Lists (* item or - item or 1. item)
    const li = ln.match(/^\s*([*\-]|\d+\.)\s+(.*)/);
    if (li) {
      const ord = /\d+\./.test(li[1]);
      const items: string[] = [];
      while (i < lines.length) {
        const m = lines[i].match(/^\s*([*\-]|\d+\.)\s+(.*)/);
        if (!m || /\d+\./.test(m[1]) !== ord) break;
        items.push(`<li>${inline(m[2])}</li>`);
        i++;
      }
      out += ord
        ? `<ol class="dc-list">${items.join('')}</ol>`
        : `<ul class="dc-list">${items.join('')}</ul>`;
      continue;
    }

    out += `<div class="dc-line">${inline(ln)}</div>`;
    i++;
  }

  return out;
}

/** Highlight search query in a title string */
export function highlightMatch(title: string, query: string): string {
  if (!query) return escHtml(title);
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(${escaped})`, 'gi');
  return escHtml(title).replace(re, '<mark class="hl">$1</mark>');
}
