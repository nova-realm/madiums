import { NextRequest, NextResponse } from 'next/server';
import {
  getQRs,
  addOrUpdateQR,
  deleteQR,
  syncQRs,
  QRMutationInput,
} from '@/lib/qrs-storage';

export const dynamic = 'force-dynamic';

// ── GET: Read QR(s) ────────────────────────────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;
    const normalised = key.trim().toLowerCase();
    const qrs = await getQRs();

    // /api/all -> return every enabled QR as a list
    if (normalised === 'all' || normalised === 'sync') {
      const all = qrs
        .filter((q) => q.enabled !== false)
        .map((q) => ({
          key: q.id,
          title: q.title,
          desc: q.text,
          text: q.text,
          enabled: q.enabled ?? true,
        }));

      return NextResponse.json(all, {
        headers: { 'Cache-Control': 'no-store' },
      });
    }

    // /api/[key] -> return single QR by id
    const qr = qrs.find(
      (q) => q.id.toLowerCase() === normalised && q.enabled !== false
    );

    if (!qr) {
      return NextResponse.json(
        { error: `No quick reply found for key "${key}".` },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        key: qr.id,
        title: qr.title,
        desc: qr.text,
        text: qr.text,
        enabled: qr.enabled ?? true,
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to fetch quick reply.' },
      { status: 500 }
    );
  }
}

// ── POST / PUT / PATCH: Add or Edit QR or Batch Sync ───────────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  return handleMutation(req, params);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  return handleMutation(req, params);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  return handleMutation(req, params);
}

async function handleMutation(
  req: NextRequest,
  paramsPromise: Promise<{ key: string }>
) {
  try {
    const { key: paramKey } = await paramsPromise;
    let body: any = {};

    try {
      body = await req.json();
    } catch {
      // Body might be empty or not JSON
    }

    // Check if client sent batch sync array or { qrs: [...] } to /api/all or /api/sync
    if (
      Array.isArray(body) ||
      (body && Array.isArray(body.qrs)) ||
      paramKey.toLowerCase() === 'sync' ||
      (paramKey.toLowerCase() === 'all' && (Array.isArray(body) || (body && body.qrs)))
    ) {
      const incomingList = Array.isArray(body) ? body : (body?.qrs || []);
      const removeMissing =
        body?.removeMissing !== undefined
          ? Boolean(body.removeMissing)
          : body?.mode === 'merge'
          ? false
          : true;

      const syncResult = await syncQRs(incomingList, { removeMissing });
      return NextResponse.json(syncResult, { status: 200 });
    }

    // If client requested deletion via POST body (action: 'delete' / 'remove')
    const actionType = (body.action || '').toLowerCase();
    if (actionType === 'delete' || actionType === 'remove') {
      const targetKey = (body.key || body.id || paramKey).trim();
      const removed = await deleteQR(targetKey);
      if (!removed) {
        return NextResponse.json(
          { error: `No quick reply found for key "${targetKey}" to delete.` },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        action: 'deleted',
        message: `Quick reply "${targetKey}" was successfully removed.`,
        deleted: {
          key: removed.id,
          title: removed.title,
          desc: removed.text,
          text: removed.text,
        },
      });
    }

    // Determine target key
    let targetKey = paramKey;
    const isReserved =
      paramKey.toLowerCase() === 'all' ||
      paramKey.toLowerCase() === 'qrs' ||
      paramKey.toLowerCase() === 'add' ||
      paramKey.toLowerCase() === 'edit';

    if (isReserved || !targetKey) {
      targetKey = (body.key || body.id || '').trim();
    }

    if (!targetKey) {
      return NextResponse.json(
        {
          error:
            'Missing "key". Please provide a key in the URL path (e.g. /api/crash) or in the JSON body { "key": "crash", ... }',
        },
        { status: 400 }
      );
    }

    if (targetKey.toLowerCase() === 'all' || targetKey.toLowerCase() === 'sync') {
      return NextResponse.json(
        { error: 'Cannot use reserved word as a QR key.' },
        { status: 400 }
      );
    }

    const result = await addOrUpdateQR(targetKey, body);

    return NextResponse.json(
      {
        success: true,
        action: result.action, // 'created' or 'updated'
        message:
          result.action === 'created'
            ? `Quick reply "${result.qr.key}" created successfully.`
            : `Quick reply "${result.qr.key}" updated successfully.`,
        key: result.qr.key,
        title: result.qr.title,
        desc: result.qr.text,
        text: result.qr.text,
        enabled: result.qr.enabled,
      },
      { status: result.action === 'created' ? 201 : 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to process request.' },
      { status: 500 }
    );
  }
}

// ── DELETE: Remove QR ──────────────────────────────────────────────────────
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key: paramKey } = await params;
    let targetKey = paramKey.trim();

    // If key in path was 'all' or 'qrs', check query param or body
    if (targetKey.toLowerCase() === 'all' || targetKey.toLowerCase() === 'qrs') {
      const url = new URL(req.url);
      const queryKey = url.searchParams.get('key') || url.searchParams.get('id');
      if (queryKey) {
        targetKey = queryKey.trim();
      } else {
        try {
          const body = await req.json();
          targetKey = (body.key || body.id || '').trim();
        } catch {
          // ignore
        }
      }
    }

    if (!targetKey || targetKey.toLowerCase() === 'all') {
      return NextResponse.json(
        { error: 'Please specify the QR key to delete (e.g. DELETE /api/crash).' },
        { status: 400 }
      );
    }

    const removed = await deleteQR(targetKey);
    if (!removed) {
      return NextResponse.json(
        { error: `No quick reply found for key "${targetKey}".` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      action: 'deleted',
      message: `Quick reply "${targetKey}" was successfully removed.`,
      deleted: {
        key: removed.id,
        title: removed.title,
        desc: removed.text,
        text: removed.text,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to delete quick reply.' },
      { status: 500 }
    );
  }
}
