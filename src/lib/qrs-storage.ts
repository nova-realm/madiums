import fs from 'fs';
import path from 'path';
import type { QR } from './types';
import fallbackQRs from '@data/qrs.json';

const LIVE_RAILWAY_API_URL = 'https://madiums-production.up.railway.app/api/all';

function getStoragePaths(): string[] {
  const cwd = process.cwd();
  return [
    path.join(cwd, 'data', 'qrs.json'),
    path.join(cwd, 'public', 'data', 'qrs.json'),
    path.join(cwd, '..', 'data', 'qrs.json'),
  ];
}

/** Get the primary path for qrs.json */
function getPrimaryPath(): string {
  return path.join(process.cwd(), 'data', 'qrs.json');
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

/** Helper: Extract all Discord / media attachment URLs from input payload */
export function extractAttachmentUrls(input: any): string[] {
  if (!input) return [];
  const urls = new Set<string>();

  const checkAndAdd = (val: any) => {
    if (!val) return;
    if (typeof val === 'string') {
      const trimmed = val.trim();
      if (/^https?:\/\//i.test(trimmed)) {
        urls.add(trimmed);
      }
    } else if (typeof val === 'object') {
      const candidate = val.url || val.proxy_url || val.href || val.src || val.link;
      if (typeof candidate === 'string' && /^https?:\/\//i.test(candidate.trim())) {
        urls.add(candidate.trim());
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

  // Also extract Discord CDN attachment URLs found directly inside text or markdown
  const textContent =
    input.text ??
    input.desc ??
    input.description ??
    input.content ??
    input.body ??
    '';

  if (typeof textContent === 'string' && textContent) {
    const discordCdnRegex = /https?:\/\/(?:cdn\.discordapp\.com|media\.discordapp\.net)\/attachments\/[^\s)\]>"']+/gi;
    const matches = textContent.match(discordCdnRegex);
    if (matches) {
      for (const m of matches) {
        urls.add(m);
      }
    }
  }

  return Array.from(urls);
}

/** Helper: Merge base text with attachment URLs formatted for Discord and web */
export function buildMergedText(baseText: string, attachments: string[]): string {
  let merged = (baseText || '').trim();
  for (const url of attachments) {
    if (!merged.includes(url)) {
      const isImg =
        /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(url) ||
        url.includes('cdn.discordapp.com/attachments/') ||
        url.includes('media.discordapp.net/attachments/');
      const formatted = isImg ? `[image](${url})` : url;
      merged = merged ? `${merged}\n${formatted}` : formatted;
    }
  }
  return merged;
}

/** Read all QRs by GET fetching from live Railway API, with fallback to local disk */
export async function getQRs(): Promise<QR[]> {
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
          const attachments = extractAttachmentUrls(d);
          return {
            id: d.key || d.id,
            title: d.title || d.key || d.id,
            text: rawText,
            attachments: attachments.length > 0 ? attachments : undefined,
            enabled: d.enabled !== false,
          };
        });

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
        return parsed.map((d: any) => ({
          id: d.key || d.id,
          title: d.title || d.key || d.id,
          text: d.desc || d.text || '',
          attachments: extractAttachmentUrls(d),
          enabled: d.enabled !== false,
        }));
      }
    }
  } catch (err) {
    console.error('Error reading qrs.json from disk:', err);
  }

  return (fallbackQRs as any[]).map((d: any) => ({
    id: d.key || d.id,
    title: d.title || d.key || d.id,
    text: d.desc || d.text || '',
    attachments: extractAttachmentUrls(d),
    enabled: d.enabled !== false,
  }));
}

/** Save QRs array to all relevant data directories */
export async function saveQRs(qrs: QR[]): Promise<void> {
  const content = JSON.stringify(qrs, null, 2);
  const paths = getStoragePaths();

  for (const filePath of paths) {
    try {
      const dir = path.dirname(filePath);
      if (fs.existsSync(dir)) {
        await fs.promises.writeFile(filePath, content, 'utf-8');
      }
    } catch (err) {
      console.error(`Failed to write qrs.json to ${filePath}:`, err);
    }
  }
}

/** Add a new QR or update an existing one with Discord attachment handling */
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
  const finalText = buildMergedText(rawText, attachmentUrls);
  const newKeyVal = (input.newKey || input.new_key || '').trim();

  if (index >= 0) {
    // Update existing
    const existing = qrs[index];
    const updatedId = newKeyVal ? newKeyVal : existing.id;
    const updatedTitle = input.title !== undefined ? input.title : existing.title;
    const updatedText =
      input.text !== undefined ||
      input.desc !== undefined ||
      input.description !== undefined ||
      input.content !== undefined ||
      input.body !== undefined ||
      attachmentUrls.length > 0
        ? finalText
        : existing.text;
    const updatedEnabled =
      input.enabled !== undefined ? Boolean(input.enabled) : (existing.enabled ?? true);

    const mergedAttachments = Array.from(
      new Set([...(existing.attachments || []), ...attachmentUrls, ...extractAttachmentUrls({ text: updatedText })])
    );

    const updatedQR: QR = {
      id: updatedId,
      title: updatedTitle,
      text: updatedText,
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
    const finalAttachments = Array.from(
      new Set([...attachmentUrls, ...extractAttachmentUrls({ text: finalText })])
    );

    const newQR: QR = {
      id: newKeyVal ? newKeyVal : keyToFind,
      title: input.title !== undefined ? input.title : keyToFind,
      text: finalText,
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

/** Delete / remove a QR by its key */
export async function deleteQR(keyToDelete: string): Promise<QR | null> {
  const qrs = await getQRs();
  const normalised = keyToDelete.trim().toLowerCase();

  const index = qrs.findIndex((q) => q.id.toLowerCase() === normalised);
  if (index === -1) {
    return null;
  }

  const [removed] = qrs.splice(index, 1);
  await saveQRs(qrs);
  return removed;
}

/** Batch sync full list of QRs with Discord attachment support */
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
    if (processedKeys.has(normKey)) continue; // prevent duplicates in payload
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
    const text = buildMergedText(rawText, attachmentUrls);
    const enabled = item.enabled !== undefined ? Boolean(item.enabled) : true;

    const existing = existingMap.get(normKey);

    const mergedAttachments = Array.from(
      new Set([...(existing?.attachments || []), ...attachmentUrls, ...extractAttachmentUrls({ text })])
    );

    if (existing) {
      const hasChanged =
        existing.title !== title ||
        existing.text !== text ||
        (existing.enabled ?? true) !== enabled ||
        existing.id !== rawKey;

      const updatedItem: QR = {
        id: rawKey,
        title,
        text,
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
        text,
        attachments: mergedAttachments.length > 0 ? mergedAttachments : undefined,
        enabled,
      };
      finalList.push(newItem);
      added.push(rawKey);
    }
  }

  // Check for removals
  for (const [normKey, existing] of existingMap.entries()) {
    if (!processedKeys.has(normKey)) {
      if (removeMissing) {
        removed.push(existing.id);
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
