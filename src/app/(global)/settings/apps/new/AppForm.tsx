'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { createApp } from '@/app/actions/apps';
import SelectInput from '@/components/ui/SelectInput';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary" disabled={pending}>
      {pending ? 'Oluşturuluyor...' : 'Uygulamayı Kaydet'}
    </button>
  );
}

export default function AppForm({ diseases }: { diseases: any[] }) {
  const [state, formAction] = useActionState(createApp, null);

  return (
    <form action={formAction}>
      <div className="card-body">
        {state?.error && (
          <div className="alert alert-danger" role="alert">
            {state.error}
          </div>
        )}
        
        <div className="mb-3">
          <label className="form-label required">Uygulama Adı</label>
          <input type="text" className="form-control" name="name" placeholder="Örn: Hipertansiyon Uygulaması v1" required />
        </div>
        
        <div className="mb-3">
          <label className="form-label required">URL Kısa Adı (Slug)</label>
          <input type="text" className="form-control" name="slug" placeholder="Örn: hipertansiyon-v1" required />
          <small className="form-hint">Bu isim bağlantılarda kullanılacaktır. Sadece küçük harf, rakam ve tire (-) kullanın.</small>
        </div>

        <div className="mb-3">
          <label className="form-label required">İlişkili Hastalık Alanı</label>
          <SelectInput 
            name="disease_id" 
            options={diseases.map(d => ({ label: d.name, value: d.id }))} 
            required={true} 
            placeholder="Lütfen bir hastalık seçin"
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Kısa Açıklama</label>
          <textarea className="form-control" name="short_description" rows={3} placeholder="Uygulamanın amacını kısaca özetleyin..."></textarea>
        </div>

      </div>
      <div className="card-footer text-end">
        <SubmitButton />
      </div>
    </form>
  );
}
