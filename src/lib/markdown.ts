/** Escape HTML special chars */
export function escHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Inline Discord markdown → HTML */
function inline(raw: string): string {
  let s = escHtml(raw);
  s = s.replace(/`([^`]+)`/g, (_, c) => `<code class="dc-code">${c}</code>`);
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/__([^_]+)__/g, '<u>$1</u>');
  s = s.replace(/~~([^~]+)~~/g, '<s>$1</s>');
  s = s.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener">$1</a>'
  );
  s = s.replace(
    /&lt;(https?:\/\/[^\s&]+)&gt;/g,
    '<a href="$1" target="_blank" rel="noopener">$1</a>'
  );
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

    if (!ln.trim()) {
      out += '<div class="dc-spacer"></div>';
      i++;
      continue;
    }

    const h = ln.match(/^(#{1,3})\s+(.*)/);
    if (h) {
      out += `<div class="dc-h${h[1].length}">${inline(h[2])}</div>`;
      i++;
      continue;
    }

    const sub = ln.match(/^-#\s+(.*)/);
    if (sub) {
      out += `<div class="dc-subtext">${inline(sub[1])}</div>`;
      i++;
      continue;
    }

    if (/^>\s?/.test(ln)) {
      const qs: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        qs.push(inline(lines[i].replace(/^>\s?/, '')));
        i++;
      }
      out += `<blockquote class="dc-quote">${qs.join('<br>')}</blockquote>`;
      continue;
    }

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
