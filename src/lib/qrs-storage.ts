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
        const liveQRs: QR[] = data.map((d: any) => ({
          id: d.key || d.id,
          title: d.title || d.key || d.id,
          text: d.desc || d.text || '',
          enabled: d.enabled !== false,
        }));

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
      return JSON.parse(raw) as QR[];
    }
  } catch (err) {
    console.error('Error reading qrs.json from disk:', err);
  }

  return fallbackQRs as QR[];
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

export interface QRMutationInput {
  key?: string;
  id?: string;
  title?: string;
  desc?: string;
  text?: string;
  description?: string;
  content?: string;
  body?: string;
  enabled?: boolean;
  newKey?: string;
  new_key?: string;
}

export interface QRMutationResult {
  action: 'created' | 'updated';
  qr: {
    key: string;
    title: string;
    text: string;
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
    title: string;
    desc: string;
    text: string;
    enabled: boolean;
  }>;
}

/** Add a new QR or update an existing one */
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

  const textVal =
    input.text ??
    input.desc ??
    input.description ??
    input.content ??
    input.body ??
    '';

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
      input.body !== undefined
        ? textVal
        : existing.text;
    const updatedEnabled =
      input.enabled !== undefined ? Boolean(input.enabled) : (existing.enabled ?? true);

    const updatedQR: QR = {
      id: updatedId,
      title: updatedTitle,
      text: updatedText,
      enabled: updatedEnabled,
    };

    qrs[index] = updatedQR;
    await saveQRs(qrs);

    return {
      action: 'updated',
      qr: {
        key: updatedQR.id,
        title: updatedQR.title,
        text: updatedQR.text,
        enabled: updatedQR.enabled ?? true,
      },
    };
  } else {
    // Create new
    const newQR: QR = {
      id: newKeyVal ? newKeyVal : keyToFind,
      title: input.title !== undefined ? input.title : keyToFind,
      text: textVal,
      enabled: input.enabled !== undefined ? Boolean(input.enabled) : true,
    };

    qrs.push(newQR);
    await saveQRs(qrs);

    return {
      action: 'created',
      qr: {
        key: newQR.id,
        title: newQR.title,
        text: newQR.text,
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

/** Batch sync full list of QRs, sorting out additions, updates, and removals */
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
    const text =
      item.text ??
      item.desc ??
      item.description ??
      item.content ??
      item.body ??
      '';
    const enabled = item.enabled !== undefined ? Boolean(item.enabled) : true;

    const existing = existingMap.get(normKey);

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
    qrs: finalList.map((q) => ({
      key: q.id,
      title: q.title,
      desc: q.text,
      text: q.text,
      enabled: q.enabled ?? true,
    })),
  };
}
