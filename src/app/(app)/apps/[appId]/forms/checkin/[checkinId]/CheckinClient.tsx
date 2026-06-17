'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveCheckinTemplate } from '@/app/actions/forms';

export default function CheckinClient({ appId, checkin }: { appId: string, checkin: any }) {
  const router = useRouter();
  
  const [name, setName] = useState(checkin.name || '');
  const [description, setDescription] = useState(checkin.description || '');
  const [frequency, setFrequency] = useState(checkin.frequency || 'daily');
  const [streakEnabled, setStreakEnabled] = useState(checkin.streak_enabled ?? true);
  const [status, setStatus] = useState(checkin.status || 'draft');
  
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    const res = await saveCheckinTemplate(
      appId,
      checkin.id,
      name,
      description,
      frequency,
      streakEnabled,
      status
    );

    setIsSaving(false);
    if (res.error) {
      setMessage({ type: 'error', text: res.error });
    } else {
      setMessage({ type: 'success', text: 'Check-in şablonu başarıyla kaydedildi.' });
      router.refresh();
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <div className="row g-4">
      <div className="col-lg-8 col-12">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Temel Ayarlar</h3>
          </div>
          <div className="card-body">
            {message && (
              <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'}`}>
                {message.text}
              </div>
            )}
            
            <div className="mb-3">
              <label className="form-label required">Şablon Kodu / Adı</label>
              <input 
                type="text" 
                className="form-control" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                placeholder="Örn: daily_checkin_hipertansiyon"
              />
              <small className="form-hint">Bu kod, Modül Kütüphanesindeki Check-in modülüne yazılacak benzersiz koddur.</small>
            </div>

            <div className="mb-3">
              <label className="form-label">Açıklama</label>
              <textarea 
                className="form-control" 
                rows={3} 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                placeholder="Check-in amacı (sadece yönetim paneli içindir)..."
              ></textarea>
            </div>

            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label className="form-label required">Sıklık</label>
                <select 
                  className="form-select" 
                  value={frequency} 
                  onChange={e => setFrequency(e.target.value)}
                >
                  <option value="daily">Günlük (Her gün doldurulur)</option>
                  <option value="weekly">Haftalık (Haftada 1 doldurulur)</option>
                  <option value="custom">Özel (Kendi kuralınız)</option>
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label">Oyunlaştırma (Gamification)</label>
                <div className="form-check mt-2">
                  <input 
                    className="form-check-input" 
                    type="checkbox" 
                    id="streakEnabled" 
                    checked={streakEnabled} 
                    onChange={e => setStreakEnabled(e.target.checked)} 
                  />
                  <label className="form-check-label" htmlFor="streakEnabled">
                    Alev/Seri (Streak) Özelliği Aktif
                  </label>
                </div>
                <small className="form-hint">Her gün doldurdukça hastanın serisi artar, motivasyon sağlar.</small>
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label required">Şablon Durumu</label>
              <select className="form-select" value={status} onChange={e => setStatus(e.target.value)}>
                <option value="draft">Taslak (Uygulamada Görünmez)</option>
                <option value="published">Yayında (Aktif)</option>
                <option value="archived">Arşivlendi (Gizli)</option>
              </select>
            </div>
            
          </div>
          <div className="card-footer text-end">
            <button className="btn btn-primary" onClick={handleSave} disabled={isSaving || !name}>
              {isSaving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
            </button>
          </div>
        </div>
      </div>

      <div className="col-lg-4 col-12">
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-primary text-white" style={{ borderTopLeftRadius: '4px', borderTopRightRadius: '4px' }}>
            <h3 className="card-title text-white d-flex align-items-center mb-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="icon me-3 text-white" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M13 3l0 7l6 0l-8 11l0 -7l-6 0l8 -11" /></svg>
              Bilgi
            </h3>
          </div>
          <div className="card-body">
            <p>
              <strong>Check-in şablonu</strong>, hastanın her gün girmesini istediğiniz anket ve ölçüm serisini belirler.
            </p>
            <p className="text-secondary">
              Burada oluşturduğunuz <strong>{name || 'Şablon Kodu'}</strong> değerini kopyalayıp, <em>Modül Kütüphanesi</em> içerisinde "Check-in Modülü" türündeki içeriğe yapıştırabilirsiniz.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
