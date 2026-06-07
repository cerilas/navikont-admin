'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { createModule } from '@/app/actions/modules';
import SelectInput from '@/components/ui/SelectInput';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary" disabled={pending}>
      {pending ? 'Kaydediliyor...' : 'Modülü Kaydet'}
    </button>
  );
}

export default function ModuleForm({ appId, moduleTypes }: { appId: string, moduleTypes: any[] }) {
  const [state, formAction] = useActionState(createModule, null);

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
          <label className="form-label required">Modül Adı</label>
          <input type="text" className="form-control" name="name" placeholder="Örn: Hafta 1 - Sağlıklı Beslenme Videosu" required />
          <small className="form-hint">Kullanıcının uygulamada göreceği isimdir.</small>
        </div>

        <div className="mb-3">
          <label className="form-label required">Modül Tipi</label>
          <SelectInput 
            name="module_type_id" 
            options={moduleTypes.map(t => ({ label: `${t.name} (${t.description})`, value: t.id }))} 
            required={true} 
            placeholder="Lütfen içerik tipini seçin"
          />
        </div>
        
        <div className="mb-3">
          <label className="form-label">Sistem İçi Adı (Opsiyonel)</label>
          <input type="text" className="form-control" name="internal_name" placeholder="Örn: h1_beslenme_video" />
          <small className="form-hint">Sadece adminlerin ve editörlerin takibi içindir.</small>
        </div>

        <div className="mb-3">
          <label className="form-label">Kısa Açıklama (Opsiyonel)</label>
          <textarea className="form-control" name="description" rows={3} placeholder="Modülün amacını kısaca özetleyin..."></textarea>
        </div>

      </div>
      <div className="card-footer text-end">
        <SubmitButton />
      </div>
    </form>
  );
}
