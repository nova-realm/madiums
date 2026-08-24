import type { Metadata } from 'next';
import Topbar from '@/components/Topbar';
import QRTable from '@/components/QRTable';
import config from '@data/config.json';
import { getQRs } from '@/lib/qrs-storage';

export const metadata: Metadata = { title: 'Quick Replies' };
export const dynamic = 'force-dynamic';

export default async function QRsPage() {
  const allQRs = await getQRs();
  const qrs = allQRs.filter((q) => q.enabled !== false);

  return (
    <>
      <Topbar activePage="qrs" config={config} />
      <main id="page-qrs">
        <QRTable qrs={qrs} config={config} />
      </main>
    </>
  );
}
