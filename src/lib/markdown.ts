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

/** Tokenizer to safely replace markdown without regex collisions on generated HTML */
function inline(raw: string): string {
  const tokens: string[] = [];
  const pushToken = (html: string) => {
    const placeholder = `\x00TOKEN_${tokens.length}\x00`;
    tokens.push(html);
    return placeholder;
  };

  let s = raw;

  // 1. Markdown images: ![alt](url)
  s = s.replace(/!\[([^\]]*)\]\((https?:\/\/[^)]+)\)/gi, (_, alt, url) => {
    return pushToken(
      `<div class="dc-media-wrap"><a href="${escHtml(url)}" target="_blank" rel="noopener"><img src="${escHtml(url)}" alt="${escHtml(alt || 'Attachment')}" class="dc-img" loading="lazy" /></a></div>`
    );
  });

  // 2. Image link shortcuts: [image](url), [img](url), [screenshot](url), [attachment](url)
  s = s.replace(/\[(image|img|screenshot|attachment|photo)\]\((https?:\/\/[^)]+)\)/gi, (_, label, url) => {
    return pushToken(
      `<div class="dc-media-wrap"><a href="${escHtml(url)}" target="_blank" rel="noopener"><img src="${escHtml(url)}" alt="${escHtml(label)}" class="dc-img" loading="lazy" /></a></div>`
    );
  });

  // 3. Video link shortcuts: [video](url), [vid](url), [clip](url)
  s = s.replace(/\[(video|vid|clip)\]\((https?:\/\/[^)]+)\)/gi, (_, _label, url) => {
    return pushToken(
      `<div class="dc-media-wrap"><video src="${escHtml(url)}" controls class="dc-video" preload="metadata"></video></div>`
    );
  });

  // 4. Standard markdown links: [text](url)
  s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, (_, label, url) => {
    if (
      isImageUrl(url) &&
      (label.toLowerCase() === 'image' ||
        label.toLowerCase() === 'img' ||
        label.toLowerCase() === 'screenshot')
    ) {
      return pushToken(
        `<div class="dc-media-wrap"><a href="${escHtml(url)}" target="_blank" rel="noopener"><img src="${escHtml(url)}" alt="image" class="dc-img" loading="lazy" /></a></div>`
      );
    }
    return pushToken(
      `<a href="${escHtml(url)}" target="_blank" rel="noopener">${escHtml(label)}</a>`
    );
  });

  // 5. Discord angle bracket links: <https://...>
  s = s.replace(/<(https?:\/\/[^\s>]+)>/g, (_, url) => {
    return pushToken(
      `<a href="${escHtml(url)}" target="_blank" rel="noopener">${escHtml(url)}</a>`
    );
  });

  // 6. Bare URLs (auto-linking)
  s = s.replace(/(https?:\/\/[^\s<)\]>"']+)/g, (url) => {
    if (isImageUrl(url)) {
      return pushToken(
        `<div class="dc-media-wrap"><a href="${escHtml(url)}" target="_blank" rel="noopener"><img src="${escHtml(url)}" alt="Attachment" class="dc-img" loading="lazy" /></a></div>`
      );
    }
    if (isVideoUrl(url)) {
      return pushToken(
        `<div class="dc-media-wrap"><video src="${escHtml(url)}" controls class="dc-video" preload="metadata"></video><div class="dc-media-link"><a href="${escHtml(url)}" target="_blank" rel="noopener">${escHtml(url)}</a></div></div>`
      );
    }
    return pushToken(
      `<a href="${escHtml(url)}" target="_blank" rel="noopener">${escHtml(url)}</a>`
    );
  });

  // Safe HTML escaping for remaining non-token characters
  s = escHtml(s);

  // 7. Inline code: `code`
  s = s.replace(/`([^`]+)`/g, (_, c) => `<code class="dc-code">${c}</code>`);

  // 8. Text formatting: **bold**, __underline__, ~~strike~~
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/__([^_]+)__/g, '<u>$1</u>');
  s = s.replace(/~~([^~]+)~~/g, '<s>$1</s>');

  // 9. Restore placeholders with exact token HTML
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
