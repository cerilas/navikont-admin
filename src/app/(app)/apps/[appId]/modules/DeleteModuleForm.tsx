'use client';

import { useTransition } from 'react';
import { deleteModule } from '@/app/actions/modules';
import Swal from 'sweetalert2';

export default function DeleteModuleForm({ appId, moduleId }: { appId: string, moduleId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    Swal.fire({
      title: 'Emin misiniz?',
      text: "Bu modülü silmek istediğinize emin misiniz? Bu işlem geri alınamaz.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d63939', // Tabler danger
      cancelButtonColor: '#6c7a91', // Tabler secondary
      confirmButtonText: 'Evet, Sil',
      cancelButtonText: 'İptal'
    }).then((result) => {
      if (result.isConfirmed) {
        startTransition(async () => {
          const formData = new FormData();
          formData.append('appId', appId);
          formData.append('moduleId', moduleId);
          await deleteModule(formData);
          
          // Optional success toast
          Swal.fire({
            title: 'Silindi!',
            text: 'Modül başarıyla silindi.',
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
