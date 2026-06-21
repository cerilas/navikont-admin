'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function DoctorsSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');

  useEffect(() => {
    const handler = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (searchTerm) {
        params.set('q', searchTerm);
      } else {
        params.delete('q');
      }
      // Reset to page 1 when searching
      params.set('page', '1');
      
      router.push(`${pathname}?${params.toString()}`);
    }, 500);

    return () => clearTimeout(handler);
  }, [searchTerm, pathname, router, searchParams]);

  return (
    <div className="input-icon">
      <span className="input-icon-addon">
        <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" /><path d="M21 21l-6 -6" /></svg>
      </span>
      <input 
        type="text" 
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="form-control" 
        placeholder="Doktor ara..." 
        aria-label="Doktor arama" 
      />
    </div>
  );
}
