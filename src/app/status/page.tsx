import type { Metadata } from 'next';
import Topbar from '@/components/Topbar';
import StatusTable from '@/components/StatusTable';
import config from '@data/config.json';
import type { StatusData } from '@/lib/types';

export const metadata: Metadata = { title: 'Status' };

// Force dynamic so this is never cached — status is always fetched fresh
export const dynamic = 'force-dynamic';

export default async function StatusPage() {
  // Read status.json from the public folder at request time
  // This is served as a static file so we fetch it to bypass build-time cache
  let statusData: StatusData;

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'}/data/status.json`,
      { cache: 'no-store' }
    );
    statusData = await res.json();
  } catch {
    // Fallback to local import if fetch fails (e.g. during build)
    const fallback = await import('@data/status.json');
    statusData = fallback.default as StatusData;
  }

  const checkedAt = new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <>
      <Topbar activePage="status" config={config} />
      <main id="page-status">
        <div className="status-header">
          <h1>Service Status</h1>
          <p className="status-updated">Checked at {checkedAt}</p>
        </div>
        <StatusTable data={statusData} />
      </main>
    </>
  );
}
