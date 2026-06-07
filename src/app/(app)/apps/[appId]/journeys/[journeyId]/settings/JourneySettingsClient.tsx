'use client';

import { useActionState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import { updateJourney, hardDeleteJourney } from '@/app/actions/journeys';
import Swal from 'sweetalert2';
import { useRouter } from 'next/navigation';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary w-100" disabled={pending}>
      {pending ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
    </button>
  );
}

export default function JourneySettingsClient({ journey, appId }: { journey: any, appId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [state, formAction] = useActionState(async (prevState: any, formData: FormData) => {
    const res = await updateJourney(prevState, formData);
    if (res?.success) {
      Swal.fire({
        toast: true, position: 'top-end', icon: 'success', title: res.message, showConfirmButton: false, timer: 1500
      });
      router.refresh();
    }
    return res;
  }, null);

  const handleDelete = () => {
    Swal.fire({
      title: 'Akışı Silmek İstediğinize Emin Misiniz?',
      text: "Bu akış ve içine atanmış olan TÜM GÜNLÜK GÖREVLER (modüller) kalıcı olarak silinecektir. Bu işlem geri alınamaz!",
      icon: 'error',
      showCancelButton: true,
      confirmButtonColor: '#d63939',
      cancelButtonColor: '#6c7a91',
      confirmButtonText: 'Evet, Kalıcı Olarak Sil',
      cancelButtonText: 'İptal'
    }).then((result) => {
      if (result.isConfirmed) {
        startTransition(async () => {
          const formData = new FormData();
          formData.append('journeyId', journey.id);
          const res = await hardDeleteJourney(formData);
          if (res?.error) {
            Swal.fire('Hata', res.error, 'error');
          } else {
            Swal.fire('Silindi!', 'Akış başarıyla silindi.', 'success').then(() => {
              router.push(`/apps/${appId}/journeys`);
            });
          }
        });
      }
    });
  };

  return (
    <div className="row justify-content-center">
      <div className="col-lg-6">
        <form action={formAction} className="card shadow-sm mb-4">
          <input type="hidden" name="journeyId" value={journey.id} />
          
          <div className="card-header bg-light">
            <h3 className="card-title">Temel Bilgiler</h3>
          </div>
          <div className="card-body">
            {state?.error && <div className="alert alert-danger">{state.error}</div>}
            
            <div className="mb-3">
              <label className="form-label required">Akış Adı</label>
              <input type="text" className="form-control" name="name" defaultValue={journey.name} required />
            </div>
            
            <div className="mb-3">
              <label className="form-label">Açıklama (Opsiyonel)</label>
              <textarea className="form-control" name="description" rows={3} defaultValue={journey.description || ''}></textarea>
            </div>
            
            <div className="mb-3">
              <label className="form-check form-switch">
                <input className="form-check-input" type="checkbox" name="isDefault" value="true" defaultChecked={journey.is_default} />
                <span className="form-check-label">
                  Varsayılan Akış Yap
                  <br />
                  <small className="text-muted">Bu seçilirse, sisteme kaydolan yeni hastalar otomatik olarak bu akışa dahil edilir.</small>
                </span>
              </label>
            </div>
          </div>
          <div className="card-footer text-end">
            <SubmitButton />
          </div>
        </form>

        <div className="card shadow-sm border-danger">
          <div className="card-header bg-danger-lt text-danger">
            <h3 className="card-title">Tehlikeli Bölge</h3>
          </div>
          <div className="card-body text-center">
            <p className="text-muted">Bu akışı sildiğinizde, atanmış olan tüm günlük içerikler de silinir.</p>
            <button type="button" onClick={handleDelete} className="btn btn-outline-danger w-100" disabled={isPending}>
              Akışı Tamamen Sil
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
