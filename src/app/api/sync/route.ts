import { NextRequest, NextResponse } from 'next/server';
import { getQRs, syncQRs, QRMutationInput } from '@/lib/qrs-storage';

export const dynamic = 'force-dynamic';

// ── GET /api/sync: Return current list ─────────────────────────────────────
export async function GET() {
  try {
    const qrs = await getQRs();
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

// ── POST /api/sync: Batch sync full list from bot ──────────────────────────
export async function POST(req: NextRequest) {
  try {
    let body: any = null;

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          error:
            'Invalid JSON payload. Please send an array of quick replies or { "qrs": [...] }',
        },
        { status: 400 }
      );
    }

    let incomingList: QRMutationInput[] = [];
    let removeMissing = true;

    if (Array.isArray(body)) {
      incomingList = body;
    } else if (body && Array.isArray(body.qrs)) {
      incomingList = body.qrs;
      if (body.removeMissing !== undefined) {
        removeMissing = Boolean(body.removeMissing);
      } else if (body.mode === 'merge') {
        removeMissing = false;
      }
    } else {
      return NextResponse.json(
        {
          error:
            'Expected an array of quick replies [ { key, title, desc }, ... ] or { "qrs": [...] }',
        },
        { status: 400 }
      );
    }

    const result = await syncQRs(incomingList, { removeMissing });

    return NextResponse.json(result, {
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to sync quick replies.' },
      { status: 500 }
    );
  }
}
