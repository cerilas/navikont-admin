'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCheckinTemplate } from '@/app/actions/forms';

export default function CreateCheckinButton({ appId }: { appId: string }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const handleCreate = async () => {
    setIsPending(true);
    const res = await createCheckinTemplate(appId);
    if (res.error) {
      alert(res.error);
      setIsPending(false);
    } else if (res.success && res.checkinId) {
      router.push(`/apps/${appId}/forms/checkin/${res.checkinId}`);
    }
  };

  return (
    <button 
      className="btn btn-outline-primary" 
      onClick={handleCreate} 
      disabled={isPending}
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M9 11l3 3l8 -8" /><path d="M20 12v6a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h9" /></svg>
      {isPending ? 'Oluşturuluyor...' : 'Yeni Check-in Oluştur'}
    </button>
  );
}
