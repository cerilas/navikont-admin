'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { updateAppBasicInfo } from '@/app/actions/apps';
import Swal from 'sweetalert2';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary" disabled={pending}>
      {pending ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
    </button>
  );
}

export default function AppSettingsForm({ app, diseases = [], doctors = [] }: { app: any, diseases?: any[], doctors?: any[] }) {
  const [platforms, setPlatforms] = useState<string[]>(app.supported_platforms || []);

  const [state, formAction] = useActionState(async (prevState: any, formData: FormData) => {
    // Inject the JSON string for platforms
    formData.set('supported_platforms', JSON.stringify(platforms));
    
    const res = await updateAppBasicInfo(prevState, formData);
    if (res?.success) {
      Swal.fire({
        title: 'Başarılı',
        text: res.message,
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
    }
    return res;
  }, null);

  const handlePlatformToggle = (platform: string) => {
    if (platforms.includes(platform)) {
      setPlatforms(platforms.filter(p => p !== platform));
    } else {
      setPlatforms([...platforms, platform]);
    }
  };

  return (
    <form className="card" action={formAction}>
      <input type="hidden" name="appId" value={app.id} />
      <div className="card-header">
        <h3 className="card-title">Temel Bilgiler</h3>
      </div>
      <div className="card-body">
        {state?.error && <div className="alert alert-danger">{state.error}</div>}

        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label required">Uygulama Adı</label>
            <input type="text" className="form-control" name="name" defaultValue={app.name} required />
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label">Temsili İkon (Emoji)</label>
            <div className="input-group">
              <span className="input-group-text">{app.icon_emoji || '📱'}</span>
              <input type="text" className="form-control" name="icon_emoji" defaultValue={app.icon_emoji || ''} placeholder="Örn: 🫀, 🧠, 🏃‍♂️" maxLength={5} />
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label">Odaklanılan Hastalık</label>
            <select className="form-select" name="disease_id" defaultValue={app.disease_id || ''}>
              <option value="">Seçiniz</option>
              {diseases.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label">Sorumlu Doktor (Tıbbi Yönetici)</label>
            <select className="form-select" name="medical_director_id" defaultValue={app.medical_director_id || ''}>
              <option value="">Atanmamış</option>
              {doctors.map(d => (
                <option key={d.id} value={d.id}>{d.full_name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label">Slogan / Motto</label>
          <input type="text" className="form-control" name="motto" defaultValue={app.motto || ''} placeholder="Örn: Kalbini Koru, Hayatı Yakala!" />
        </div>

        <div className="mb-3">
          <label className="form-label">Kısa Açıklama</label>
          <textarea className="form-control" name="short_description" rows={3} defaultValue={app.short_description || ''} placeholder="Vitrin kartlarında gösterilecek kısa özet..."></textarea>
        </div>

        <div className="mb-3">
          <label className="form-label">Detaylı Açıklama</label>
          <textarea className="form-control" name="long_description" rows={6} defaultValue={app.long_description || ''} placeholder="Uygulamanın kapsamlı açıklaması..."></textarea>
        </div>

        <div className="mb-3">
          <label className="form-label">Desteklenen Platformlar</label>
          <div className="d-flex gap-3">
            <label className="form-selectgroup-item">
              <input type="checkbox" className="form-selectgroup-input" checked={platforms.includes('ios')} onChange={() => handlePlatformToggle('ios')} />
              <span className="form-selectgroup-label d-flex align-items-center p-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="icon me-1" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M9 7c-3 0 -4 3 -4 5.5c0 3 2 7.5 4 7.5c1.088 -.046 1.679 -.5 3 -.5c1.312 0 1.5 .5 3 .5s4 -3 4 -5c-.028 -.01 -2.472 -.403 -2.5 -3c-.019 -2.17 2.416 -2.954 2.5 -3c-1.023 -1.492 -2.951 -1.963 -3.5 -2c-1.433 -.111 -2.83 1 -3.5 1c-.68 0 -1.9 -1 -3 -1z" /><path d="M12 4a2 2 0 0 0 2 -2a2 2 0 0 0 -2 2" /></svg>
                iOS
              </span>
            </label>
            <label className="form-selectgroup-item">
              <input type="checkbox" className="form-selectgroup-input" checked={platforms.includes('android')} onChange={() => handlePlatformToggle('android')} />
              <span className="form-selectgroup-label d-flex align-items-center p-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="icon me-1" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 10l0 6" /><path d="M20 10l0 6" /><path d="M7 9h10v8a1 1 0 0 1 -1 1h-8a1 1 0 0 1 -1 -1v-8a5 5 0 0 1 10 0" /><path d="M8 3l1 2" /><path d="M16 3l-1 2" /><path d="M9 18l0 3" /><path d="M15 18l0 3" /></svg>
                Android
              </span>
            </label>
            <label className="form-selectgroup-item">
              <input type="checkbox" className="form-selectgroup-input" checked={platforms.includes('huawei')} onChange={() => handlePlatformToggle('huawei')} />
              <span className="form-selectgroup-label d-flex align-items-center p-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="icon me-1" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" /><path d="M12 12l0 9" /><path d="M12 12l-7 -5" /><path d="M12 12l7 -5" /></svg>
                HuaweiOS
              </span>
            </label>
          </div>
        </div>
      </div>
      <div className="card-footer text-end">
        <SubmitButton />
      </div>
    </form>
  );
}
