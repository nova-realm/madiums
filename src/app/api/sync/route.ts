import { NextRequest, NextResponse } from 'next/server';
import { getQRs, syncQRs, extractAttachmentUrls, QRMutationInput } from '@/lib/qrs-storage';

export const dynamic = 'force-dynamic';

async function parseBody(req: NextRequest): Promise<any> {
  const contentType = req.headers.get('content-type') || '';

  if (
    contentType.includes('multipart/form-data') ||
    contentType.includes('application/x-www-form-urlencoded')
  ) {
    try {
      const formData = await req.formData();
      const rawPayload = formData.get('payload') || formData.get('qrs') || formData.get('data');
      if (typeof rawPayload === 'string') {
        return JSON.parse(rawPayload);
      }
    } catch (err) {
      console.warn('Failed to parse form-data in /api/sync:', err);
    }
  }

  try {
    return await req.json();
  } catch {
    return null;
  }
}

// ── GET /api/sync: Return current list with attachments ────────────────────
export async function GET() {
  try {
    const qrs = await getQRs();
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

// ── POST /api/sync: Batch sync full list from bot with attachments ─────────
export async function POST(req: NextRequest) {
  try {
    const body = await parseBody(req);

    if (!body) {
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
            'Expected an array of quick replies [ { key, title, desc, attachments }, ... ] or { "qrs": [...] }',
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
