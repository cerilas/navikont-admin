'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

export default function Pagination({ totalPages, currentPage }: { totalPages: number, currentPage: number }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  return (
    <ul className="pagination m-0 ms-auto">
      <li className={`page-item ${currentPage <= 1 ? 'disabled' : ''}`}>
        <Link className="page-link" href={createPageURL(currentPage - 1)} tabIndex={-1} aria-disabled={currentPage <= 1}>
          <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M15 6l-6 6l6 6" /></svg>
          önceki
        </Link>
      </li>
      
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
          <Link className="page-link" href={createPageURL(page)}>
            {page}
          </Link>
        </li>
      ))}

      <li className={`page-item ${currentPage >= totalPages ? 'disabled' : ''}`}>
        <Link className="page-link" href={createPageURL(currentPage + 1)} aria-disabled={currentPage >= totalPages}>
          sonraki
          <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M9 6l6 6l-6 6" /></svg>
        </Link>
      </li>
    </ul>
  );
}
