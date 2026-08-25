import { NextRequest, NextResponse } from 'next/server';
import {
  getQRs,
  addOrUpdateQR,
  deleteQR,
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
      console.warn('Failed to parse form-data body in /api:', err);
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

// ── GET: Read all or by ?key=... ──────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const key = (url.searchParams.get('key') || url.searchParams.get('id') || '').trim();
    const qrs = await getQRs();

    if (key && key.toLowerCase() !== 'all') {
      const qr = qrs.find(
        (q) => q.id.toLowerCase() === key.toLowerCase() && q.enabled !== false
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
    }

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
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to fetch quick replies.' },
      { status: 500 }
    );
  }
}

// ── POST / PUT / PATCH: Add / Edit / Remove via body ──────────────────────
export async function POST(req: NextRequest) {
  try {
    const body: (QRMutationInput & { action?: string }) = await parseBody(req);

    const action = (body.action || '').toLowerCase();
    const targetKey = (body.key || body.id || '').trim();

    if (!targetKey) {
      return NextResponse.json(
        { error: 'Missing "key" in request body.' },
        { status: 400 }
      );
    }

    if (action === 'delete' || action === 'remove') {
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
    }

    const result = await addOrUpdateQR(targetKey, body);

    return NextResponse.json(
      {
        success: true,
        action: result.action,
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

export async function PUT(req: NextRequest) {
  return POST(req);
}

export async function PATCH(req: NextRequest) {
  return POST(req);
}

// ── DELETE: Remove QR by ?key=... or body ─────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    let targetKey = (url.searchParams.get('key') || url.searchParams.get('id') || '').trim();

    if (!targetKey) {
      try {
        const body = await parseBody(req);
        targetKey = (body.key || body.id || '').trim();
      } catch {
        // ignore
      }
    }

    if (!targetKey) {
      return NextResponse.json(
        { error: 'Missing "key" query parameter or in request body.' },
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
