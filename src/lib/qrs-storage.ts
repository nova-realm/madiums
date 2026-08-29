import fs from 'fs';
import path from 'path';
import type { QR } from './types';
import fallbackQRs from '@data/qrs.json';

const LIVE_RAILWAY_API_URL = 'https://madiums-production.up.railway.app/api/all';
const BASE_DOMAIN_URL = 'https://madiums-production.up.railway.app';
const DISCORD_CDN_REGEX = /https?:\/\/(?:cdn\.discordapp\.com|media\.discordapp\.net)\/attachments\/[^\s)\]>"']+/gi;

function getStoragePaths(): string[] {
  const cwd = process.cwd();
  return [
    path.join(cwd, 'data', 'qrs.json'),
    path.join(cwd, 'public', 'data', 'qrs.json'),
  ];
}

/** Get the primary path for qrs.json */
function getPrimaryPath(): string {
  return path.join(process.cwd(), 'data', 'qrs.json');
}

/** Helper to ensure data/uploads directory exists and save uploaded buffer */
function saveFileToUploads(fileName: string, buffer: Buffer): void {
  const dataDir = path.join(process.cwd(), 'data', 'uploads');
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(path.join(dataDir, fileName), buffer);
  } catch (err) {
    console.error('Failed to save file to data/uploads:', err);
  }
}

/** Helper to delete uploaded file from data/uploads */
function deleteUploadedFile(fileName: string): void {
  if (!fileName) return;
  const dataPath = path.join(process.cwd(), 'data', 'uploads', fileName);
  try {
    if (fs.existsSync(dataPath)) {
      fs.unlinkSync(dataPath);
    }
  } catch (err) {
    console.error('Failed to delete file from data/uploads:', err);
  }
}

export interface DiscordAttachmentInput {
  url?: string;
  proxy_url?: string;
  name?: string;
  filename?: string;
  content_type?: string;
  size?: number;
  [key: string]: any;
}

export interface QRMutationInput {
  key?: string;
  id?: string;
  title?: string;
  desc?: string;
  text?: string;
  description?: string;
  content?: string;
  body?: string;
  attachments?: Array<string | DiscordAttachmentInput>;
  attachment?: string | DiscordAttachmentInput;
  image?: string | DiscordAttachmentInput;
  images?: Array<string | DiscordAttachmentInput>;
  file?: string | DiscordAttachmentInput;
  files?: Array<string | DiscordAttachmentInput>;
  media?: Array<string | DiscordAttachmentInput> | string;
  attachment_url?: string;
  attachment_urls?: string[];
  attachmentUrl?: string;
  attachmentUrls?: string[];
  enabled?: boolean;
  newKey?: string;
  new_key?: string;
  [key: string]: any;
}

export interface QRMutationResult {
  action: 'created' | 'updated';
  qr: {
    key: string;
    id: string;
    title: string;
    text: string;
    desc: string;
    attachments: string[];
    attachment: string | null;
    image: string | null;
    images: string[];
    enabled: boolean;
  };
}

export interface SyncOptions {
  removeMissing?: boolean;
}

export interface SyncResult {
  success: boolean;
  action: 'synced';
  summary: {
    total: number;
    added: number;
    updated: number;
    removed: number;
    unchanged: number;
  };
  changes: {
    added: string[];
    updated: string[];
    removed: string[];
    unchanged: string[];
  };
  qrs: Array<{
    key: string;
    id: string;
    title: string;
    desc: string;
    text: string;
    attachments: string[];
    attachment: string | null;
    image: string | null;
    images: string[];
    enabled: boolean;
  }>;
}

/**
 * Downloads a Discord attachment URL and saves it to `/data/uploads/`.
 * Returns the permanent absolute API URL `https://madiums-production.up.railway.app/api/uploads/<filename>`.
 */
export async function downloadAndSaveDiscordAttachment(
  discordUrl: string,
  qrId: string
): Promise<string> {
  if (!discordUrl) return discordUrl;

  // Already hosted locally
  if (discordUrl.includes('/api/uploads/') || discordUrl.includes('/uploads/')) {
    if (discordUrl.startsWith('/api/uploads/')) {
      return `${BASE_DOMAIN_URL}${discordUrl}`;
    }
    if (discordUrl.startsWith('/uploads/')) {
      return `${BASE_DOMAIN_URL}/api${discordUrl}`;
    }
    return discordUrl;
  }

  if (!discordUrl.includes('discordapp.')) {
    return discordUrl;
  }

  try {
    const res = await fetch(discordUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });
    if (!res.ok) {
      console.warn(`Failed to fetch Discord attachment from ${discordUrl}: ${res.status} ${res.statusText}`);
      return discordUrl;
    }

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Determine clean filename
    const cleanUrl = discordUrl.split('?')[0];
    const originalName = cleanUrl.split('/').pop() || 'attachment';
    const ext = path.extname(originalName) || '.png';
    const baseName = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_-]/g, '_');

    // Prefix with sanitized QR id for clear association
    const safeQrId = (qrId || 'qr').toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `${safeQrId}-${baseName}${ext}`;

    saveFileToUploads(fileName, buffer);

    return `${BASE_DOMAIN_URL}/api/uploads/${fileName}`;
  } catch (err) {
    console.error(`Error downloading Discord attachment ${discordUrl}:`, err);
  }

  return discordUrl;
}

/**
 * Deletes all uploaded files belonging to a QR from `/data/uploads/`.
 */
export async function deleteQRFiles(qr: QR | { id: string; attachments?: string[]; text?: string }): Promise<void> {
  if (!qr) return;

  const fileNames = new Set<string>();

  const checkAndAdd = (val: string) => {
    if (val && typeof val === 'string') {
      const match = val.match(/\/api\/uploads\/([^"'\s)>]+)/) || val.match(/\/uploads\/([^"'\s)>]+)/);
      if (match && match[1]) {
        fileNames.add(match[1]);
      }
    }
  };

  (qr.attachments || []).forEach(checkAndAdd);
  if (qr.text) {
    const matches = qr.text.match(/\/(?:api\/)?uploads\/([^"'\s)>]+)/g) || [];
    matches.forEach(checkAndAdd);
  }

  for (const fileName of fileNames) {
    deleteUploadedFile(fileName);
  }
}

/**
 * Normalizes an attachment list:
 * If any local /api/uploads/ URL exists, purges replaced or expired discord CDN URLs
 * so duplicate and old links never linger.
 */
export function purgeDiscordCdnUrlsIfRehosted(attachments: string[]): string[] {
  if (!attachments || attachments.length === 0) return [];
  
  const unique = Array.from(new Set(attachments.map((a) => (typeof a === 'string' ? a.trim() : '')))).filter(Boolean);
  
  // If there are rehosted URLs, purge any cdn.discordapp.com / media.discordapp.net URLs
  const hasRehosted = unique.some((u) => u.includes('/api/uploads/') || u.includes('/uploads/'));
  if (hasRehosted) {
    return unique.filter((u) => !u.includes('discordapp.com') && !u.includes('discordapp.net'));
  }
  
  return unique;
}

/**
 * Strips all attachment URLs (Discord CDN URLs and /api/uploads/ URLs) from the text,
 * leaving only clean human text so the bot does not duplicate images in Discord.
 */
export function stripAttachmentUrlsFromText(text: string, attachmentUrls: string[] = []): string {
  if (!text) return '';
  let cleaned = text;

  // Strip markdown image wrappers like ![alt](url) or [image](url)
  cleaned = cleaned.replace(/!\[[^\]]*\]\([^)]+\)/gi, '');
  cleaned = cleaned.replace(/\[(?:image|img|attachment|photo|screenshot|video|clip)\]\([^)]+\)/gi, '');

  // Strip explicit attachment URLs
  for (const url of attachmentUrls) {
    if (url) {
      cleaned = cleaned.replaceAll(url, '');
      const cleanPath = url.replace(/^https?:\/\/[^\/]+/, '');
      if (cleanPath) {
        cleaned = cleaned.replaceAll(cleanPath, '');
      }
    }
  }

  // Strip any Discord CDN URLs
  cleaned = cleaned.replace(DISCORD_CDN_REGEX, '');

  // Strip any local upload URLs
  cleaned = cleaned.replace(/https?:\/\/[^\s)\]>"']+\/api\/uploads\/[^\s)\]>"']+/gi, '');
  cleaned = cleaned.replace(/\/api\/uploads\/[^\s)\]>"']+/gi, '');

  // Clean up extra blank lines / trailing whitespace
  return cleaned
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line, i, arr) => line !== '' || (i > 0 && arr[i - 1] !== ''))
    .join('\n')
    .trim();
}

/**
 * Intercepts, downloads, and re-hosts all Discord attachments in a QR payload,
 * strips attachment links from text, and returns clean text + attachment array.
 */
export async function processQRDiscordAttachments(
  qrId: string,
  rawText: string,
  attachmentUrls: string[]
): Promise<{ text: string; attachments: string[] }> {
  const finalAttachments: string[] = [];

  // 1. Process explicit attachment URLs
  for (const url of attachmentUrls) {
    if (url.includes('discordapp.')) {
      const localUrl = await downloadAndSaveDiscordAttachment(url, qrId);
      finalAttachments.push(localUrl);
    } else {
      const normalizedUrl = url.startsWith('/api/uploads/') ? `${BASE_DOMAIN_URL}${url}` : url;
      finalAttachments.push(normalizedUrl);
    }
  }

  // 2. Also search for any remaining Discord URLs embedded inside text/markdown
  const embeddedMatches = (rawText || '').match(DISCORD_CDN_REGEX) || [];
  for (const url of embeddedMatches) {
    const localUrl = await downloadAndSaveDiscordAttachment(url, qrId);
    if (!finalAttachments.includes(localUrl)) {
      finalAttachments.push(localUrl);
    }
  }

  // 3. Purge raw Discord URLs if local URLs exist
  const purgedAttachments = purgeDiscordCdnUrlsIfRehosted(finalAttachments);

  // 4. Strip all attachment URLs from text so the bot doesn't send duplicate images
  const cleanText = stripAttachmentUrlsFromText(rawText, [...finalAttachments, ...attachmentUrls]);

  return {
    text: cleanText,
    attachments: purgedAttachments,
  };
}

/** Helper: Extract all Discord / media attachment URLs from input payload */
export function extractAttachmentUrls(input: any): string[] {
  if (!input) return [];
  const urls = new Set<string>();

  const checkAndAdd = (val: any) => {
    if (!val) return;
    if (typeof val === 'string') {
      let trimmed = val.trim();
      const wrapperMatch = trimmed.match(/^\[(?:image|img|attachment|photo|screenshot|video|clip)\]\(([^)]+)\)$/i);
      if (wrapperMatch) {
        trimmed = wrapperMatch[1].trim();
      }
      if (trimmed.startsWith('/api/uploads/')) {
        trimmed = `${BASE_DOMAIN_URL}${trimmed}`;
      }
      if (/^https?:\/\//i.test(trimmed)) {
        urls.add(trimmed);
      }
    } else if (typeof val === 'object') {
      const candidate = val.url || val.proxy_url || val.href || val.src || val.link;
      if (typeof candidate === 'string') {
        let trimmed = candidate.trim();
        if (trimmed.startsWith('/api/uploads/')) {
          trimmed = `${BASE_DOMAIN_URL}${trimmed}`;
        }
        if (/^https?:\/\//i.test(trimmed)) {
          urls.add(trimmed);
        }
      }
    }
  };

  const fields = [
    input.attachments,
    input.attachment,
    input.image,
    input.images,
    input.file,
    input.files,
    input.media,
    input.attachment_url,
    input.attachment_urls,
    input.attachmentUrl,
    input.attachmentUrls,
  ];

  for (const f of fields) {
    if (!f) continue;
    if (Array.isArray(f)) {
      for (const item of f) {
        checkAndAdd(item);
      }
    } else {
      checkAndAdd(f);
    }
  }

  // Also extract Discord CDN attachment URLs or uploads found directly inside text or markdown
  const textContent =
    input.text ??
    input.desc ??
    input.description ??
    input.content ??
    input.body ??
    '';

  if (typeof textContent === 'string' && textContent) {
    const matches = textContent.match(DISCORD_CDN_REGEX);
    if (matches) {
      for (const m of matches) {
        urls.add(m);
      }
    }
    const uploadMatches = textContent.match(/https?:\/\/[^\s)\]>"']+\/api\/uploads\/[^\s)\]>"']+/g);
    if (uploadMatches) {
      for (const m of uploadMatches) {
        urls.add(m);
      }
    }
    const relMatches = textContent.match(/\/api\/uploads\/[^\s)\]>"']+/g);
    if (relMatches) {
      for (const m of relMatches) {
        urls.add(`${BASE_DOMAIN_URL}${m}`);
      }
    }
  }

  return purgeDiscordCdnUrlsIfRehosted(Array.from(urls));
}

let memoryCacheQRs: QR[] | null = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 20 * 1000; // 20 seconds fast memory cache

export function invalidateQRsCache(): void {
  memoryCacheQRs = null;
  lastCacheTime = 0;
}

/** Read all QRs by GET fetching from live Railway API, with fallback to local disk */
export async function getQRs(forceRefresh = false): Promise<QR[]> {
  const now = Date.now();
  if (!forceRefresh && memoryCacheQRs && now - lastCacheTime < CACHE_TTL_MS) {
    return memoryCacheQRs;
  }

  try {
    const res = await fetch(LIVE_RAILWAY_API_URL, {
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const liveQRs: QR[] = data.map((d: any) => {
          const rawText = d.desc || d.text || '';
          const attachments = purgeDiscordCdnUrlsIfRehosted(extractAttachmentUrls(d));
          const cleanText = stripAttachmentUrlsFromText(rawText, attachments);
          return {
            id: d.key || d.id,
            title: d.title || d.key || d.id,
            text: cleanText,
            attachments: attachments.length > 0 ? attachments : undefined,
            enabled: d.enabled !== false,
          };
        });

        memoryCacheQRs = liveQRs;
        lastCacheTime = Date.now();

        // Persist fresh live copy to local disk asynchronously
        saveQRs(liveQRs).catch(() => {});

        return liveQRs;
      }
    }
  } catch (err) {
    console.warn(`Could not fetch live QRs from ${LIVE_RAILWAY_API_URL}, falling back to disk:`, err);
  }

  // Fallback to disk if network request fails
  const primary = getPrimaryPath();
  try {
    if (fs.existsSync(primary)) {
      const raw = await fs.promises.readFile(primary, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((d: any) => {
          const rawText = d.desc || d.text || '';
          const attachments = purgeDiscordCdnUrlsIfRehosted(extractAttachmentUrls(d));
          const cleanText = stripAttachmentUrlsFromText(rawText, attachments);
          return {
            id: d.key || d.id,
            title: d.title || d.key || d.id,
            text: cleanText,
            attachments: attachments.length > 0 ? attachments : undefined,
            enabled: d.enabled !== false,
          };
        });
      }
    }
  } catch (err) {
    console.error('Error reading qrs.json from disk:', err);
  }

  return (fallbackQRs as any[]).map((d: any) => {
    const rawText = d.desc || d.text || '';
    const attachments = purgeDiscordCdnUrlsIfRehosted(extractAttachmentUrls(d));
    const cleanText = stripAttachmentUrlsFromText(rawText, attachments);
    return {
      id: d.key || d.id,
      title: d.title || d.key || d.id,
      text: cleanText,
      attachments: attachments.length > 0 ? attachments : undefined,
      enabled: d.enabled !== false,
    };
  });
}

/** Save QRs array to all relevant data directories */
export async function saveQRs(qrs: QR[]): Promise<void> {
  memoryCacheQRs = qrs;
  lastCacheTime = Date.now();

  const content = JSON.stringify(qrs, null, 2);
  const paths = getStoragePaths();

  for (const filePath of paths) {
    try {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      await fs.promises.writeFile(filePath, content, 'utf-8');
    } catch (err) {
      console.error(`Failed to write qrs.json to ${filePath}:`, err);
    }
  }
}

/** Add a new QR or update an existing one with Discord attachment handling and automatic re-hosting */
export async function addOrUpdateQR(
  inputKey: string,
  input: QRMutationInput
): Promise<QRMutationResult> {
  const qrs = await getQRs();

  const keyToFind = (inputKey || input.key || input.id || '').trim();
  if (!keyToFind) {
    throw new Error('QR key (id) is required.');
  }

  const normalised = keyToFind.toLowerCase();
  const index = qrs.findIndex((q) => q.id.toLowerCase() === normalised);

  const rawText =
    input.text ??
    input.desc ??
    input.description ??
    input.content ??
    input.body ??
    '';

  const attachmentUrls = extractAttachmentUrls(input);
  const newKeyVal = (input.newKey || input.new_key || '').trim();
  const targetId = newKeyVal ? newKeyVal : (index >= 0 ? qrs[index].id : keyToFind);

  // Automatically intercept and download any Discord attachments to data/uploads
  const processed = await processQRDiscordAttachments(targetId, rawText, attachmentUrls);

  if (index >= 0) {
    // Update existing
    const existing = qrs[index];
    const updatedId = targetId;
    const updatedTitle = input.title !== undefined ? input.title : existing.title;
    const updatedText =
      input.text !== undefined ||
      input.desc !== undefined ||
      input.description !== undefined ||
      input.content !== undefined ||
      input.body !== undefined ||
      attachmentUrls.length > 0
        ? processed.text
        : existing.text;
    const updatedEnabled =
      input.enabled !== undefined ? Boolean(input.enabled) : (existing.enabled ?? true);

    const filteredExisting = (existing.attachments || []).filter(
      (u) => !u.includes('discordapp.com') && !u.includes('discordapp.net')
    );

    const mergedAttachments = purgeDiscordCdnUrlsIfRehosted([
      ...filteredExisting,
      ...processed.attachments,
    ]);

    const updatedQR: QR = {
      id: updatedId,
      title: updatedTitle,
      text: stripAttachmentUrlsFromText(updatedText, mergedAttachments),
      attachments: mergedAttachments.length > 0 ? mergedAttachments : undefined,
      enabled: updatedEnabled,
    };

    qrs[index] = updatedQR;
    await saveQRs(qrs);

    const firstAtt = updatedQR.attachments?.[0] || null;

    return {
      action: 'updated',
      qr: {
        key: updatedQR.id,
        id: updatedQR.id,
        title: updatedQR.title,
        text: updatedQR.text,
        desc: updatedQR.text,
        attachments: updatedQR.attachments || [],
        attachment: firstAtt,
        image: firstAtt,
        images: updatedQR.attachments || [],
        enabled: updatedQR.enabled ?? true,
      },
    };
  } else {
    // Create new
    const finalAttachments = purgeDiscordCdnUrlsIfRehosted(processed.attachments);

    const newQR: QR = {
      id: targetId,
      title: input.title !== undefined ? input.title : keyToFind,
      text: stripAttachmentUrlsFromText(processed.text, finalAttachments),
      attachments: finalAttachments.length > 0 ? finalAttachments : undefined,
      enabled: input.enabled !== undefined ? Boolean(input.enabled) : true,
    };

    qrs.push(newQR);
    await saveQRs(qrs);

    const firstAtt = newQR.attachments?.[0] || null;

    return {
      action: 'created',
      qr: {
        key: newQR.id,
        id: newQR.id,
        title: newQR.title,
        text: newQR.text,
        desc: newQR.text,
        attachments: newQR.attachments || [],
        attachment: firstAtt,
        image: firstAtt,
        images: newQR.attachments || [],
        enabled: newQR.enabled ?? true,
      },
    };
  }
}

/** Delete / remove a QR by its key and clean up its stored files */
export async function deleteQR(keyToDelete: string): Promise<QR | null> {
  const qrs = await getQRs();
  const normalised = keyToDelete.trim().toLowerCase();

  const index = qrs.findIndex((q) => q.id.toLowerCase() === normalised);
  if (index === -1) {
    return null;
  }

  const [removed] = qrs.splice(index, 1);
  await saveQRs(qrs);
  await deleteQRFiles(removed);
  return removed;
}

/** Batch sync full list of QRs with Discord attachment interception and file cleanup */
export async function syncQRs(
  incomingList: QRMutationInput[],
  options: SyncOptions = {}
): Promise<SyncResult> {
  const existingQRs = await getQRs();
  const removeMissing = options.removeMissing !== false; // default: true

  const existingMap = new Map<string, QR>();
  for (const qr of existingQRs) {
    existingMap.set(qr.id.toLowerCase(), qr);
  }

  const processedKeys = new Set<string>();
  const finalList: QR[] = [];

  const added: string[] = [];
  const updated: string[] = [];
  const unchanged: string[] = [];
  const removed: string[] = [];

  for (const item of incomingList) {
    const rawKey = (item.key || item.id || '').trim();
    if (!rawKey || rawKey.toLowerCase() === 'all') continue;

    const normKey = rawKey.toLowerCase();
    if (processedKeys.has(normKey)) continue;
    processedKeys.add(normKey);

    const title = item.title !== undefined ? item.title : rawKey;
    const rawText =
      item.text ??
      item.desc ??
      item.description ??
      item.content ??
      item.body ??
      '';

    const attachmentUrls = extractAttachmentUrls(item);
    
    // Automatically intercept Discord attachments
    const processed = await processQRDiscordAttachments(rawKey, rawText, attachmentUrls);
    const enabled = item.enabled !== undefined ? Boolean(item.enabled) : true;

    const existing = existingMap.get(normKey);

    const filteredExisting = (existing?.attachments || []).filter(
      (u) => !u.includes('discordapp.com') && !u.includes('discordapp.net')
    );

    const mergedAttachments = purgeDiscordCdnUrlsIfRehosted([
      ...filteredExisting,
      ...processed.attachments,
    ]);

    const cleanText = stripAttachmentUrlsFromText(processed.text, mergedAttachments);

    if (existing) {
      const hasChanged =
        existing.title !== title ||
        existing.text !== cleanText ||
        (existing.enabled ?? true) !== enabled ||
        existing.id !== rawKey;

      const updatedItem: QR = {
        id: rawKey,
        title,
        text: cleanText,
        attachments: mergedAttachments.length > 0 ? mergedAttachments : undefined,
        enabled,
      };

      finalList.push(updatedItem);

      if (hasChanged) {
        updated.push(rawKey);
      } else {
        unchanged.push(rawKey);
      }
    } else {
      // New addition
      const newItem: QR = {
        id: rawKey,
        title,
        text: cleanText,
        attachments: mergedAttachments.length > 0 ? mergedAttachments : undefined,
        enabled,
      };
      finalList.push(newItem);
      added.push(rawKey);
    }
  }

  // Check for removals and delete their files
  for (const [normKey, existing] of existingMap.entries()) {
    if (!processedKeys.has(normKey)) {
      if (removeMissing) {
        removed.push(existing.id);
        await deleteQRFiles(existing);
      } else {
        finalList.push(existing);
        unchanged.push(existing.id);
      }
    }
  }

  await saveQRs(finalList);

  return {
    success: true,
    action: 'synced',
    summary: {
      total: finalList.length,
      added: added.length,
      updated: updated.length,
      removed: removed.length,
      unchanged: unchanged.length,
    },
    changes: {
      added,
      updated,
      removed,
      unchanged,
    },
    qrs: finalList.map((q) => {
      const firstAtt = q.attachments?.[0] || null;
      return {
        key: q.id,
        id: q.id,
        title: q.title,
        desc: q.text,
        text: q.text,
        attachments: q.attachments || [],
        attachment: firstAtt,
        image: firstAtt,
        images: q.attachments || [],
        enabled: q.enabled ?? true,
      };
    }),
  };
}
