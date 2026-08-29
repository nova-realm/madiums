import type { Metadata } from 'next';
import Topbar from '@/components/Topbar';
import HomeCards from '@/components/HomeCards';
import config from '@data/config.json';
import { getQRs } from '@/lib/qrs-storage';

export const metadata: Metadata = { title: 'Home' };
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const allQRs = await getQRs();
  const qrCount = allQRs.filter((q) => q.enabled !== false).length;

  return (
    <>
      <Topbar activePage="home" config={config} />
      <main id="page-home" className="home-dashboard-wrapper">
        <div className="home-left-col">
          <div className="home-header">
            <h1>Support Desk</h1>
            <p>Quick replies, status, and resources for the Madium support team.</p>
          </div>

          <HomeCards config={config} qrCount={qrCount} />

          <div className="home-meta">
            <div className="home-meta-item">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span>
                <strong>{qrCount}</strong> active quick replies
              </span>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
