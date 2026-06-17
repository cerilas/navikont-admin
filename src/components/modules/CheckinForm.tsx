'use client';

import { useState, useEffect } from 'react';
import { getCheckinTemplates } from '@/app/actions/forms';

export default function CheckinForm({ appId, initialData, onChange }: { appId?: string, initialData: any, onChange: (data: any) => void }) {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (appId) {
      getCheckinTemplates(appId).then(res => {
        if (res.success && res.templates) {
          setTemplates(res.templates);
        }
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [appId]);

  const handleChange = (field: string, value: any) => {
    onChange({ ...initialData, [field]: value });
  };

  return (
    <div className="card bg-light mb-3">
      <div className="card-body">
        <h4 className="card-title">Check-in Ayarları</h4>
        
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label required">Check-in Şablonu</label>
            {loading ? (
              <div className="form-control text-muted">Şablonlar yükleniyor...</div>
            ) : (
              <select 
                className="form-select" 
                value={initialData.checkinTemplateId || ''} 
                onChange={e => handleChange('checkinTemplateId', e.target.value)} 
                required 
              >
                <option value="" disabled>Lütfen bir şablon seçin</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.name} {t.status === 'draft' ? '(Taslak)' : ''}</option>
                ))}
              </select>
            )}
            <small className="form-hint">Bu modül tetiklendiğinde hangi Check-in formunun açılacağını belirler.</small>
          </div>

          <div className="col-md-6">
            <label className="form-label required">Giriş Sıklığı</label>
            <select 
              className="form-select" 
              value={initialData.frequency || 'daily'} 
              onChange={e => handleChange('frequency', e.target.value)}
              required
            >
              <option value="daily">Günlük (Daily)</option>
              <option value="weekly">Haftalık (Weekly)</option>
              <option value="custom">Özel (Custom)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
