import type { Metadata } from 'next';
import Topbar from '@/components/Topbar';
import GuideContent from '@/components/GuideContent';
import config from '@data/config.json';
import { getQRs } from '@/lib/qrs-storage';

export const metadata: Metadata = {
  title: 'Support Guide',
  description: 'Official troubleshooting guide, staff protocols, and role expectations for Madium support staff.',
};

export const dynamic = 'force-dynamic';

export default async function GuidePage() {
  const allQRs = await getQRs();
  const activeQRs = allQRs.filter((q) => q.enabled !== false);

  return (
    <>
      <Topbar activePage="guide" config={config} />
      <main id="page-guide" className="guide-main-container">
        <GuideContent qrs={activeQRs} />
      </main>
    </>
  );
}
