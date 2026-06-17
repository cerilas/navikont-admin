'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveCheckinTemplate } from '@/app/actions/forms';

export default function CheckinClient({ appId, checkin, initialFields = [] }: { appId: string, checkin: any, initialFields?: any[] }) {
  const router = useRouter();
  
  const [name, setName] = useState(checkin.name || '');
  const [description, setDescription] = useState(checkin.description || '');
  const [frequency, setFrequency] = useState(checkin.frequency || 'daily');
  const [streakEnabled, setStreakEnabled] = useState(checkin.streak_enabled ?? true);
  const [status, setStatus] = useState(checkin.status || 'draft');
  const [fields, setFields] = useState<any[]>(initialFields);
  
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const addField = () => {
    setFields([...fields, {
      id: crypto.randomUUID(),
      field_key: `field_${Date.now()}`,
      field_type: 'boolean',
      label: 'Yeni Soru/Alan',
      unit: '',
      is_required: true
    }]);
  };

  const updateField = (index: number, key: string, value: any) => {
    const updated = [...fields];
    updated[index] = { ...updated[index], [key]: value };
    setFields(updated);
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };
  
  const moveField = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      const updated = [...fields];
      const temp = updated[index - 1];
      updated[index - 1] = updated[index];
      updated[index] = temp;
      setFields(updated);
    } else if (direction === 'down' && index < fields.length - 1) {
      const updated = [...fields];
      const temp = updated[index + 1];
      updated[index + 1] = updated[index];
      updated[index] = temp;
      setFields(updated);
    }
  };

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
      status,
      fields
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
      
      {/* Checkin Fields Editor */}
      <div className="col-12 mt-4">
        <div className="card shadow-sm border-0">
          <div className="card-header bg-light d-flex justify-content-between align-items-center">
            <h3 className="card-title mb-0">Check-in Soruları (Alanlar)</h3>
            <button className="btn btn-outline-primary btn-sm" onClick={addField}>
              <svg xmlns="http://www.w3.org/2000/svg" className="icon me-1" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 5l0 14" /><path d="M5 12l14 0" /></svg>
              Yeni Alan Ekle
            </button>
          </div>
          <div className="card-body">
            {fields.length === 0 ? (
              <div className="text-center text-muted py-5">
                Henüz hiç soru alanı eklenmemiş. Lütfen yeni bir alan ekleyerek başlayın.
              </div>
            ) : (
              <div className="list-group list-group-flush">
                {fields.map((f, i) => (
                  <div key={f.id || i} className="list-group-item px-0 py-4 border-bottom">
                    <div className="row g-3 align-items-start">
                      <div className="col-auto mt-4">
                        <div className="d-flex flex-column gap-1">
                          <button className="btn btn-sm btn-icon btn-ghost-secondary" disabled={i === 0} onClick={() => moveField(i, 'up')}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 5l0 14" /><path d="M16 9l-4 -4l-4 4" /></svg>
                          </button>
                          <button className="btn btn-sm btn-icon btn-ghost-secondary" disabled={i === fields.length - 1} onClick={() => moveField(i, 'down')}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 5l0 14" /><path d="M16 15l-4 4l-4 -4" /></svg>
                          </button>
                        </div>
                      </div>
                      
                      <div className="col">
                        <div className="row g-3">
                          <div className="col-md-5">
                            <label className="form-label required">Soru Metni (Kullanıcıya Görünecek)</label>
                            <input type="text" className="form-control" value={f.label} onChange={(e) => updateField(i, 'label', e.target.value)} placeholder="Örn: Bugün ağrınız var mı?" />
                          </div>
                          <div className="col-md-3">
                            <label className="form-label required">Tür (Type)</label>
                            <select className="form-select" value={f.field_type} onChange={(e) => updateField(i, 'field_type', e.target.value)}>
                              <option value="boolean">Evet / Hayır</option>
                              <option value="emoji">Emoji Seçimi</option>
                              <option value="number">Sayısal (Ölçüm)</option>
                              <option value="text">Açık Metin</option>
                              <option value="scale">1-10 Ölçek</option>
                            </select>
                          </div>
                          <div className="col-md-2">
                            <label className="form-label">Birim (Opsiyonel)</label>
                            <input type="text" className="form-control" value={f.unit || ''} onChange={(e) => updateField(i, 'unit', e.target.value)} placeholder="Örn: kg, mmHg" disabled={f.field_type !== 'number'} />
                          </div>
                          <div className="col-md-2">
                            <label className="form-label">&nbsp;</label>
                            <label className="form-check pt-1 mt-1">
                              <input className="form-check-input" type="checkbox" checked={f.is_required} onChange={(e) => updateField(i, 'is_required', e.target.checked)} />
                              <span className="form-check-label">Zorunlu</span>
                            </label>
                          </div>
                        </div>
                      </div>
                      
                      <div className="col-auto mt-4">
                        <button className="btn btn-outline-danger btn-icon" onClick={() => removeField(i)} title="Alanı Sil">
                          <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 7l16 0" /><path d="M10 11l0 6" /><path d="M14 11l0 6" /><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" /><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" /></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="card-footer text-end">
             <button className="btn btn-primary" onClick={handleSave} disabled={isSaving || !name}>
               {isSaving ? 'Kaydediliyor...' : 'Tüm Değişiklikleri Kaydet'}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
