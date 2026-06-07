'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createQuestionnaire } from '@/app/actions/forms';

export default function CreateFormButton({ appId }: { appId: string }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const handleCreate = async () => {
    setIsPending(true);
    const res = await createQuestionnaire(appId);
    if (res.error) {
      alert(res.error);
      setIsPending(false);
    } else if (res.success && res.questionnaireId) {
      router.push(`/apps/${appId}/forms/${res.questionnaireId}`);
    }
  };

  return (
    <button 
      className="btn btn-primary" 
      onClick={handleCreate} 
      disabled={isPending}
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 5l0 14" /><path d="M5 12l14 0" /></svg>
      {isPending ? 'Oluşturuluyor...' : 'Yeni Anket Oluştur'}
    </button>
  );
}
