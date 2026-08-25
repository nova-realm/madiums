import { NextRequest, NextResponse } from 'next/server';
import {
  getQRs,
  addOrUpdateQR,
  deleteQR,
  syncQRs,
  extractAttachmentUrls,
  QRMutationInput,
} from '@/lib/qrs-storage';

export const dynamic = 'force-dynamic';

async function parseBody(req: NextRequest): Promise<any> {
  const contentType = req.headers.get('content-type') || '';

  if (
    contentType.includes('multipart/form-data') ||
    contentType.includes('application/x-www-form-urlencoded')
  ) {
    try {
      const formData = await req.formData();
      const body: Record<string, any> = {};
      const attachments: string[] = [];

      for (const [k, v] of formData.entries()) {
        if (typeof v === 'string') {
          if (
            k === 'attachments' ||
            k === 'attachment' ||
            k === 'images' ||
            k === 'image' ||
            k === 'files' ||
            k === 'file' ||
            k === 'media'
          ) {
            if (v.startsWith('http')) {
              attachments.push(v);
            } else {
              try {
                const parsed = JSON.parse(v);
                attachments.push(...extractAttachmentUrls({ attachments: parsed }));
              } catch {
                body[k] = v;
              }
            }
          } else {
            body[k] = v;
          }
        }
      }

      if (attachments.length > 0) {
        body.attachments = attachments;
      }

      return body;
    } catch (err) {
      console.warn('Failed to parse form-data body:', err);
    }
  }

  try {
    return await req.json();
  } catch {
    try {
      const text = await req.text();
      if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
        return JSON.parse(text);
      }
      return { text };
    } catch {
      return {};
    }
  }
}

// ── GET: Read QR(s) ────────────────────────────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;
    const normalised = key.trim().toLowerCase();
    const qrs = await getQRs();

    // /api/all -> return every enabled QR as a list with attachments
    if (normalised === 'all' || normalised === 'sync') {
      const all = qrs
        .filter((q) => q.enabled !== false)
        .map((q) => {
          const atts = q.attachments || extractAttachmentUrls({ text: q.text });
          const firstAtt = atts[0] || null;
          return {
            key: q.id,
            id: q.id,
            title: q.title,
            desc: q.text,
            text: q.text,
            attachments: atts,
            attachment: firstAtt,
            image: firstAtt,
            images: atts,
            enabled: q.enabled ?? true,
          };
        });

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

    const atts = qr.attachments || extractAttachmentUrls({ text: qr.text });
    const firstAtt = atts[0] || null;

    return NextResponse.json(
      {
        key: qr.id,
        id: qr.id,
        title: qr.title,
        desc: qr.text,
        text: qr.text,
        attachments: atts,
        attachment: firstAtt,
        image: firstAtt,
        images: atts,
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
    const body: any = await parseBody(req);

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
          id: removed.id,
          title: removed.title,
          desc: removed.text,
          text: removed.text,
          attachments: removed.attachments || [],
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
        id: result.qr.id,
        title: result.qr.title,
        desc: result.qr.text,
        text: result.qr.text,
        attachments: result.qr.attachments,
        attachment: result.qr.attachment,
        image: result.qr.image,
        images: result.qr.images,
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
          const body = await parseBody(req);
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
        id: removed.id,
        title: removed.title,
        desc: removed.text,
        text: removed.text,
        attachments: removed.attachments || [],
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to delete quick reply.' },
      { status: 500 }
    );
  }
}
