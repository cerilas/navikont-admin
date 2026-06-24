'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { updateAppBasicInfo } from '@/app/actions/apps';
import Swal from 'sweetalert2';
import AppLogoUploader from '@/components/apps/AppLogoUploader';

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
  const [languages, setLanguages] = useState<string[]>(app.supported_languages || ['tr']);

  const [state, formAction] = useActionState(async (prevState: any, formData: FormData) => {
    formData.set('supported_platforms', JSON.stringify(platforms));
    formData.set('supported_languages', JSON.stringify(languages));
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

  const handleLanguageToggle = (lang: string) => {
    if (lang === 'tr') return; // Türkçe zorunlu
    if (languages.includes(lang)) {
      setLanguages(languages.filter(l => l !== lang));
    } else {
      setLanguages([...languages, lang]);
    }
  };

  const LANGS = [
    { code: 'tr', label: 'Türkçe', flag: '🇹🇷', required: true },
    { code: 'en', label: 'İngilizce', flag: '🇬🇧', required: false },
    { code: 'de', label: 'Almanca', flag: '🇩🇪', required: false },
  ];

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
            <AppLogoUploader name="logo_url" defaultValue={app.logo_url || ''} />
          </div>
        </div>

        <div className="row">
          <div className="col-md-4 mb-3">
            <label className="form-label">Odaklanılan Hastalık</label>
            <select className="form-select" name="disease_id" defaultValue={app.disease_id || ''}>
              <option value="">Seçiniz</option>
              {diseases.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div className="col-md-4 mb-3">
            <label className="form-label">Sorumlu Doktor</label>
            <select className="form-select" name="medical_director_id" defaultValue={app.medical_director_id || ''}>
              <option value="">Atanmamış</option>
              {doctors.map(d => (
                <option key={d.id} value={d.id}>{d.full_name}</option>
              ))}
            </select>
          </div>
          <div className="col-md-4 mb-3">
            <label className="form-label">Uygulama Durumu</label>
            <select className="form-select" name="status" defaultValue={app.status || 'draft'}>
              <option value="draft">Taslak</option>
              <option value="published">Yayında / Aktif</option>
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
          <label className="form-label">Desteklenen Diller</label>
          <div className="text-muted small mb-2">Türkçe varsayılan dildir ve kaldırılamaz.</div>
          <div className="d-flex gap-3 flex-wrap">
            {LANGS.map(lang => (
              <label key={lang.code} className={`form-selectgroup-item ${lang.required ? '' : ''}`}>
                <input
                  type="checkbox"
                  className="form-selectgroup-input"
                  checked={languages.includes(lang.code)}
                  onChange={() => handleLanguageToggle(lang.code)}
                  disabled={lang.required}
                />
                <span className="form-selectgroup-label d-flex align-items-center gap-2 px-3">
                  <span style={{ fontSize: '1.2rem' }}>{lang.flag}</span>
                  <span>{lang.label}</span>
                  {lang.required && <span className="badge bg-secondary-lt ms-1" style={{ fontSize: '0.65rem' }}>Varsayılan</span>}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label">Desteklenen Platformlar</label>
          <div className="d-flex gap-3">
            <label className="form-selectgroup-item" title="iOS">
              <input type="checkbox" className="form-selectgroup-input" checked={platforms.includes('ios')} onChange={() => handlePlatformToggle('ios')} />
              <span className="form-selectgroup-label d-flex align-items-center p-2">
                <img src="/platform-logolar/2.png" alt="iOS" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
              </span>
            </label>
            <label className="form-selectgroup-item" title="Android">
              <input type="checkbox" className="form-selectgroup-input" checked={platforms.includes('android')} onChange={() => handlePlatformToggle('android')} />
              <span className="form-selectgroup-label d-flex align-items-center p-2">
                <img src="/platform-logolar/3.png" alt="Android" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
              </span>
            </label>
            <label className="form-selectgroup-item" title="HuaweiOS">
              <input type="checkbox" className="form-selectgroup-input" checked={platforms.includes('huawei')} onChange={() => handlePlatformToggle('huawei')} />
              <span className="form-selectgroup-label d-flex align-items-center p-2">
                <img src="/platform-logolar/1.png" alt="Huawei" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
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
