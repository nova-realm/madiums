/** Escape HTML special chars */
export function escHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function isImageUrl(url: string): boolean {
  return (
    /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(url) ||
    url.includes('cdn.discordapp.com/attachments/') ||
    url.includes('media.discordapp.net/attachments/')
  );
}

function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm|mov)(\?.*)?$/i.test(url);
}

/** Inline Discord markdown → HTML */
function inline(raw: string): string {
  let s = escHtml(raw);

  // Code snippets
  s = s.replace(/`([^`]+)`/g, (_, c) => `<code class="dc-code">${c}</code>`);

  // Bold, underline, strikethrough
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/__([^_]+)__/g, '<u>$1</u>');
  s = s.replace(/~~([^~]+)~~/g, '<s>$1</s>');

  // Explicit markdown images: ![alt](url)
  s = s.replace(
    /!\[([^\]]*)\]\((https?:\/\/[^)]+)\)/gi,
    '<div class="dc-media-wrap"><a href="$2" target="_blank" rel="noopener"><img src="$2" alt="$1" class="dc-img" loading="lazy" /></a></div>'
  );

  // Markdown image shortcuts: [image](url), [screenshot](url), [attachment](url)
  s = s.replace(
    /\[(image|img|screenshot|attachment|photo)\]\((https?:\/\/[^)]+)\)/gi,
    '<div class="dc-media-wrap"><a href="$2" target="_blank" rel="noopener"><img src="$2" alt="$1" class="dc-img" loading="lazy" /></a></div>'
  );

  // Markdown video shortcuts: [video](url), [vid](url)
  s = s.replace(
    /\[(video|vid|clip)\]\((https?:\/\/[^)]+)\)/gi,
    '<div class="dc-media-wrap"><video src="$2" controls class="dc-video" preload="metadata"></video></div>'
  );

  // Standard markdown links: [text](url)
  s = s.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener">$1</a>'
  );

  // Discord angle bracket links: <https://...>
  s = s.replace(
    /&lt;(https?:\/\/[^\s&]+)&gt;/g,
    '<a href="$1" target="_blank" rel="noopener">$1</a>'
  );

  // Autolink bare URLs
  s = s.replace(
    /(^|[\s(])(https?:\/\/[^\s<]+)/g,
    (m, pre, url) => `${pre}<a href="${url}" target="_blank" rel="noopener">${url}</a>`
  );

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

    // Check if line is a standalone Discord attachment URL (image / video)
    if (/^https?:\/\/[^\s]+$/i.test(trimmed)) {
      if (isVideoUrl(trimmed)) {
        out += `<div class="dc-media-wrap"><video src="${trimmed}" controls class="dc-video" preload="metadata"></video><div class="dc-media-link"><a href="${trimmed}" target="_blank" rel="noopener">${trimmed}</a></div></div>`;
        i++;
        continue;
      } else if (isImageUrl(trimmed)) {
        out += `<div class="dc-media-wrap"><a href="${trimmed}" target="_blank" rel="noopener"><img src="${trimmed}" alt="Attachment" class="dc-img" loading="lazy" /></a></div>`;
        i++;
        continue;
      }
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
