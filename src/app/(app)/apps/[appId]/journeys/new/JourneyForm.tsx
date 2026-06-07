'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { createJourney } from '@/app/actions/journeys';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary" disabled={pending}>
      {pending ? 'Oluşturuluyor...' : 'Akışı Kaydet'}
    </button>
  );
}

export default function JourneyForm({ appId }: { appId: string }) {
  const [state, formAction] = useActionState(createJourney, null);

  return (
    <form action={formAction}>
      <input type="hidden" name="appId" value={appId} />
      <div className="card-body">
        {state?.error && (
          <div className="alert alert-danger" role="alert">
            {state.error}
          </div>
        )}
        
        <div className="mb-3">
          <label className="form-label required">Akış Adı</label>
          <input type="text" className="form-control" name="name" placeholder="Örn: Hipertansiyon Standart Reçete" required />
          <small className="form-hint">Bu isim hastalar tarafından görünmez, sadece yöneticiler içindir.</small>
        </div>

        <div className="mb-3">
          <label className="form-label">Açıklama (Opsiyonel)</label>
          <textarea className="form-control" name="description" rows={3} placeholder="Akışın amacını kısaca özetleyin..."></textarea>
        </div>

        <div className="mb-3">
          <label className="form-check form-switch">
            <input className="form-check-input" type="checkbox" name="is_default" defaultChecked />
            <span className="form-check-label">Varsayılan (Default) Akış Olsun</span>
          </label>
          <small className="form-hint">Eğer seçiliyse, bu uygulamaya kayıt olan tüm hastalara standart olarak bu akış atanır. Diğer varsaılan akışlar iptal edilir.</small>
        </div>

      </div>
      <div className="card-footer text-end">
        <SubmitButton />
      </div>
    </form>
  );
}
