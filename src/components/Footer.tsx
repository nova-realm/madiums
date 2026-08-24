import Image from 'next/image';
import type { Config } from '@/lib/types';

export default function Footer({ config }: { config: Config }) {
  return (
    <footer className="site-footer">
      <span className="footer-text">Made by</span>
      <Image
        src={`/assets/${config.footerAvatar.split('/').pop()}`}
        alt={config.footerName}
        width={18}
        height={18}
        className="footer-avatar"
      />
      <span className="footer-name">{config.footerName}</span>
    </footer>
  );
}
