'use client';

import { useState } from 'react';
import Swal from 'sweetalert2';
import { useRouter } from 'next/navigation';
import { deleteCheckinTemplate } from '@/app/actions/forms';

export default function DeleteCheckinButton({ appId, checkinId }: { appId: string, checkinId: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    // Ilk olarak normal silme isteği atıyoruz (force = false)
    setIsDeleting(true);
    try {
      const res = await deleteCheckinTemplate(appId, checkinId, false);
      
      if (res.error) {
        Swal.fire('Hata', res.error, 'error');
        setIsDeleting(false);
        return;
      }

      if (res.inUse) {
        // Uyarı gösteriyoruz
        Swal.fire({
          title: 'Dikkat! Bağlı Akışlar Var',
          html: `Bu check-in şu akışlarda kullanılıyor:<br/><br/><b>${res.usages?.join('<br/>')}</b><br/><br/>Yine de silmek istiyor musunuz?`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          cancelButtonColor: '#3085d6',
          confirmButtonText: 'Evet, Yine de Sil',
          cancelButtonText: 'İptal'
        }).then(async (result) => {
          if (result.isConfirmed) {
            const forceRes = await deleteCheckinTemplate(appId, checkinId, true);
            if (forceRes.error) {
              Swal.fire('Hata', forceRes.error, 'error');
            } else {
              Swal.fire('Silindi!', 'Check-in şablonu silindi.', 'success').then(() => {
                router.refresh();
              });
            }
          }
          setIsDeleting(false);
        });
      } else {
        // Kullanımda değilse direkt emin misin diye soralım
        Swal.fire({
          title: 'Emin misiniz?',
          text: "Bu check-in şablonunu silmek istediğinize emin misiniz?",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          cancelButtonColor: '#3085d6',
          confirmButtonText: 'Evet, Sil',
          cancelButtonText: 'İptal'
        }).then(async (result) => {
          if (result.isConfirmed) {
            const forceRes = await deleteCheckinTemplate(appId, checkinId, true);
            if (forceRes.error) {
              Swal.fire('Hata', forceRes.error, 'error');
            } else {
              Swal.fire('Silindi!', 'Check-in şablonu silindi.', 'success').then(() => {
                router.refresh();
              });
            }
          }
          setIsDeleting(false);
        });
      }
    } catch (e) {
      console.error(e);
      Swal.fire('Hata', 'Bir hata oluştu.', 'error');
      setIsDeleting(false);
    }
  };

  return (
    <button 
      className="btn btn-sm btn-outline-danger ms-2" 
      onClick={handleDelete}
      disabled={isDeleting}
    >
      {isDeleting ? 'Siliniyor...' : 'Sil'}
    </button>
  );
}
