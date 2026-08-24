import { NextRequest, NextResponse } from 'next/server';
import {
  getQRs,
  addOrUpdateQR,
  deleteQR,
  QRMutationInput,
} from '@/lib/qrs-storage';

export const dynamic = 'force-dynamic';

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
    }

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
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to fetch quick replies.' },
      { status: 500 }
    );
  }
}

// ── POST / PUT: Add / Edit / Remove via body ──────────────────────────────
export async function POST(req: NextRequest) {
  try {
    let body: (QRMutationInput & { action?: string }) = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON request body.' },
        { status: 400 }
      );
    }

    const action = (body.action || '').toLowerCase();
    const targetKey = (body.key || body.id || '').trim();

    if (!targetKey) {
      return NextResponse.json(
        { error: 'Missing "key" in JSON body.' },
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
          title: removed.title,
          desc: removed.text,
          text: removed.text,
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

export async function PUT(req: NextRequest) {
  return POST(req);
}

export async function PATCH(req: NextRequest) {
  return POST(req);
}

// ── DELETE: Remove QR by ?key=... or JSON body ────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    let targetKey = (url.searchParams.get('key') || url.searchParams.get('id') || '').trim();

    if (!targetKey) {
      try {
        const body = await req.json();
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
