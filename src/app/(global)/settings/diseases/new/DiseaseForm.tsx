'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { createDisease } from '@/app/actions/diseases';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary" disabled={pending}>
      {pending ? 'Kaydediliyor...' : 'Hastalığı Kaydet'}
    </button>
  );
}

export default function DiseaseForm() {
  const [state, formAction] = useActionState(createDisease, null);

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
          <input type="text" className="form-control" name="name" placeholder="Örn: Hipertansiyon" required />
        </div>
        
        <div className="mb-3">
          <label className="form-label required">URL Kısa Adı (Slug)</label>
          <input type="text" className="form-control" name="slug" placeholder="Örn: hipertansiyon" required />
          <small className="form-hint">Bağlantılarda kullanılacaktır. Sadece küçük harf, rakam ve tire (-) kullanın.</small>
        </div>

        <div className="mb-3">
          <label className="form-label">ICD Kodu (Opsiyonel)</label>
          <input type="text" className="form-control" name="icd_code" placeholder="Örn: I10" />
        </div>
      </div>
      <div className="card-footer text-end">
        <SubmitButton />
      </div>
    </form>
  );
}
