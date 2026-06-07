'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function ModuleTabs({ appId, moduleId }: { appId: string, moduleId: string }) {
  const pathname = usePathname();
  const isContent = pathname.includes('/content');

  return (
    <ul className="nav nav-tabs card-header-tabs">
      <li className="nav-item">
        <Link href={`/apps/${appId}/modules/${moduleId}`} className={`nav-link ${!isContent ? 'active' : ''}`}>
          Temel Bilgiler
        </Link>
      </li>
      <li className="nav-item">
        <Link href={`/apps/${appId}/modules/${moduleId}/content`} className={`nav-link ${isContent ? 'active' : ''}`}>
          İçerik Editörü
        </Link>
      </li>
    </ul>
  );
}
