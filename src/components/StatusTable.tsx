import type { StatusData } from '@/lib/types';

interface Props {
  data: StatusData;
}

// Spinning circle icon for "updating" state
const SpinnerIcon = () => (
  <svg
    className="status-spinner"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    aria-hidden
  >
    <path d="M12 2a10 10 0 0 1 10 10" />
  </svg>
);

export default function StatusTable({ data }: Props) {
  const m = data.madium;
  const s = data.support;

  // ── Madium row ──────────────────────────────────────────────────────
  const madiumIsOk      = m.status === 'working';
  const madiumUpdating  = m.status === 'updating';
  const madiumDowngrade = m.status === 'downgrade';

  const madiumLabel = madiumIsOk      ? 'Operational'
                    : madiumUpdating  ? 'Updating'
                    :                   'Issue detected';

  const madiumClass = madiumIsOk      ? 'ok'
                    : madiumUpdating  ? 'updating'
                    :                   'warn';

  const madiumSub = madiumIsOk
    ? (m.workingMsg || 'All systems operational.')
    : madiumUpdating
    ? 'An update is being rolled out. Brief downtime may occur.'
    : 'Outdated, downgrade required.';

  // ── Support row ─────────────────────────────────────────────────────
  const supportOk = s.status !== 'unavailable';
  const supportSub = supportOk
    ? 'Support server is online.'
    : 'Support server is currently unavailable.';

  // ── Overall banner ───────────────────────────────────────────────────
  const allOk = madiumIsOk && supportOk;
  const anyUpdating = madiumUpdating && supportOk;

  const bannerClass = allOk       ? 'ok'
                    : anyUpdating ? 'updating'
                    :               'warn';

  const bannerLabel = allOk       ? 'All Systems Operational'
                    : anyUpdating ? 'Update in Progress'
                    :               'Incident Detected';

  return (
    <>
      <div className={`status-banner ${bannerClass}`}>
        <div className={`status-banner-dot ${bannerClass}`} />
        <span>{bannerLabel}</span>
      </div>

      <div className="status-table">
        {/* Madium row */}
        <div className="status-row">
          <div className="status-row-left">
            <span className="status-row-name">
              Madium
              {m.version && (
                <span className="status-version">v{m.version}</span>
              )}
            </span>
            <span className="status-row-sub">{madiumSub}</span>
          </div>
          <span className={`status-word ${madiumClass}`}>
            {madiumUpdating && <SpinnerIcon />}
            {madiumLabel}
          </span>
        </div>

        {/* Support row */}
        <div className="status-row">
          <div className="status-row-left">
            <span className="status-row-name">Madium Support</span>
            <span className="status-row-sub">{supportSub}</span>
          </div>
          <span className={`status-word ${supportOk ? 'ok' : 'warn'}`}>
            {supportOk ? 'Operational' : 'Unavailable'}
          </span>
        </div>
      </div>
    </>
  );
}
