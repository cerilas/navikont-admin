'use client';

import { useTransition } from 'react';
import { deleteJourney } from '@/app/actions/journeys';
import Swal from 'sweetalert2';

export default function DeleteJourneyForm({ appId, journeyId }: { appId: string, journeyId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    Swal.fire({
      title: 'Emin misiniz?',
      text: "Bu akışı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d63939',
      cancelButtonColor: '#6c7a91',
      confirmButtonText: 'Evet, Sil',
      cancelButtonText: 'İptal'
    }).then((result) => {
      if (result.isConfirmed) {
        startTransition(async () => {
          const formData = new FormData();
          formData.append('appId', appId);
          formData.append('journeyId', journeyId);
          await deleteJourney(formData);
          
          Swal.fire({
            title: 'Silindi!',
            text: 'Akış başarıyla silindi.',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
          });
        });
      }
    });
  };

  return (
    <button type="button" onClick={handleDelete} disabled={isPending} className="btn btn-sm btn-danger ms-2">
      {isPending ? 'Siliniyor...' : 'Sil'}
    </button>
  );
}
