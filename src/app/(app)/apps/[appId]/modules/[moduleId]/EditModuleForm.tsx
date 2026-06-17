'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { updateModule } from '@/app/actions/modules';
import SelectInput from '@/components/ui/SelectInput';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary" disabled={pending}>
      {pending ? 'Güncelleniyor...' : 'Değişiklikleri Kaydet'}
    </button>
  );
}

export default function EditModuleForm({ appId, moduleData, moduleTypes }: { appId: string, moduleData: any, moduleTypes: any[] }) {
  const [state, formAction] = useActionState(updateModule, null);

  return (
    <form action={formAction}>
      <input type="hidden" name="appId" value={appId} />
      <input type="hidden" name="moduleId" value={moduleData.id} />
      
      {state?.error && (
        <div className="alert alert-danger" role="alert">
          {state.error}
        </div>
      )}
      
      <div className="mb-3">
          <label className="form-label required">Modül Adı</label>
          <input type="text" className="form-control" name="name" defaultValue={moduleData.name} required />
          <small className="form-hint">Kullanıcının uygulamada göreceği isimdir.</small>
        </div>

        <div className="mb-3">
          <label className="form-label required">Modül Tipi</label>
          <SelectInput 
            name="module_type_id" 
            options={moduleTypes.map(t => ({ label: `${t.name} (${t.description})`, value: t.id }))} 
            defaultValue={moduleData.module_type_id}
            required={true} 
            placeholder="Lütfen içerik tipini seçin"
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Sistem İçi Adı (Opsiyonel)</label>
          <input type="text" className="form-control" name="internal_name" defaultValue={moduleData.internal_name || ''} />
          <small className="form-hint">Sadece adminlerin ve editörlerin takibi içindir.</small>
        </div>

        <div className="mb-3">
          <label className="form-label">Kısa Açıklama (Opsiyonel)</label>
          <textarea className="form-control" name="description" rows={3} defaultValue={moduleData.description || ''}></textarea>
        </div>

        <div className="mb-3">
          <label className="form-label required">Modül Durumu</label>
          <select className="form-select" name="status" defaultValue={moduleData.status || 'draft'}>
            <option value="draft">Taslak (Uygulamada Görünmez)</option>
            <option value="published">Yayında (Aktif)</option>
            <option value="archived">Arşivlendi (Gizli)</option>
          </select>
        </div>

      <div className="mt-4">
        <SubmitButton />
      </div>
    </form>
  );
}
