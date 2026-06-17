'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { updateDisease, deleteDisease } from '@/app/actions/diseases';
import Swal from 'sweetalert2';
import { useRouter } from 'next/navigation';

interface Disease {
  id: string;
  name: string;
  slug: string;
  icd_code?: string;
  risk_level?: string;
  status?: string;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary" disabled={pending}>
      {pending ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
    </button>
  );
}

export default function EditDiseaseForm({ disease }: { disease: Disease }) {
  const router = useRouter();
  const updateDiseaseWithId = updateDisease.bind(null, disease.id);
  const [state, formAction] = useActionState(updateDiseaseWithId, null);

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: 'Hastalığı Silmek İstediğinize Emin misiniz?',
      text: "Bu hastalığı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Evet, Sil!',
      cancelButtonText: 'İptal'
    });

    if (result.isConfirmed) {
      const res = await deleteDisease(disease.id);
      if (res?.error) {
        Swal.fire({
          title: 'Hata',
          text: res.error,
          icon: 'error'
        });
      } else {
        await Swal.fire({
          title: 'Silindi!',
          text: 'Hastalık başarıyla silindi.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });
        router.push('/settings/diseases');
        router.refresh();
      }
    }
  };

  return (
    <form action={formAction}>
      <div className="card-body">
        {state?.error && (
          <div className="alert alert-danger" role="alert">
            {state.error}
          </div>
        )}
        
        <div className="mb-3">
          <label className="form-label required">Hastalık Adı</label>
          <input 
            type="text" 
            className="form-control" 
            name="name" 
            defaultValue={disease.name} 
            placeholder="Örn: Hipertansiyon" 
            required 
          />
        </div>
        
        <div className="mb-3">
          <label className="form-label required">URL Kısa Adı (Slug)</label>
          <input 
            type="text" 
            className="form-control" 
            name="slug" 
            defaultValue={disease.slug} 
            placeholder="Örn: hipertansiyon" 
            required 
          />
          <small className="form-hint">Bağlantılarda kullanılacaktır. Sadece küçük harf, rakam ve tire (-) kullanın.</small>
        </div>

        <div className="mb-3">
          <label className="form-label">ICD Kodu (Opsiyonel)</label>
          <input 
            type="text" 
            className="form-control" 
            name="icd_code" 
            defaultValue={disease.icd_code || ''} 
            placeholder="Örn: I10" 
          />
        </div>

        <div className="mb-3">
          <label className="form-label required">Risk Seviyesi</label>
          <select className="form-select" name="risk_level" defaultValue={disease.risk_level || 'low'}>
            <option value="low">Düşük</option>
            <option value="medium">Orta</option>
            <option value="high">Yüksek</option>
          </select>
        </div>

        <div className="mb-3">
          <label className="form-label required">Yayın Durumu</label>
          <select className="form-select" name="status" defaultValue={disease.status || 'draft'}>
            <option value="draft">Taslak</option>
            <option value="review">İnceleme</option>
            <option value="active">Aktif</option>
            <option value="passive">Pasif</option>
            <option value="archived">Arşivlendi</option>
          </select>
        </div>
      </div>
      <div className="card-footer d-flex justify-content-between">
        <button type="button" className="btn btn-danger" onClick={handleDelete}>
          Hastalığı Sil
        </button>
        <SubmitButton />
      </div>
    </form>
  );
}
