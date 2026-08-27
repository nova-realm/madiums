import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const MIME_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.txt': 'text/plain; charset=utf-8',
  '.json': 'application/json',
  '.pdf': 'application/pdf',
  '.zip': 'application/zip',
  '.bat': 'text/plain; charset=utf-8',
  '.cmd': 'text/plain; charset=utf-8',
  '.ps1': 'text/plain; charset=utf-8',
  '.sh': 'text/plain; charset=utf-8',
  '.py': 'text/plain; charset=utf-8',
  '.log': 'text/plain; charset=utf-8',
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ file: string }> }
) {
  try {
    const { file } = await params;
    if (!file || file.includes('..') || file.includes('/') || file.includes('\\')) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    const dataPath = path.join(process.cwd(), 'data', 'uploads', file);
    const publicPath = path.join(process.cwd(), 'public', 'uploads', file);

    let targetFilePath = '';
    if (fs.existsSync(dataPath)) {
      targetFilePath = dataPath;
    } else if (fs.existsSync(publicPath)) {
      targetFilePath = publicPath;
    }

    if (!targetFilePath) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const ext = path.extname(file).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const fileBuffer = await fs.promises.readFile(targetFilePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${encodeURIComponent(file)}"`,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to serve upload file.' },
      { status: 500 }
    );
  }
}
