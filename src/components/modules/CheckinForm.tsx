'use client';

export default function CheckinForm({ initialData, onChange }: { initialData: any, onChange: (data: any) => void }) {
  const handleChange = (field: string, value: any) => {
    onChange({ ...initialData, [field]: value });
  };

  return (
    <div className="card bg-light mb-3">
      <div className="card-body">
        <h4 className="card-title">Check-in Ayarları</h4>
        
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label required">Check-in Şablon Kodu / ID</label>
            <input 
              type="text" 
              className="form-control" 
              value={initialData.checkinTemplateId || ''} 
              onChange={e => handleChange('checkinTemplateId', e.target.value)} 
              required 
              placeholder="örn: daily_hipertansiyon_checkin" 
            />
            <small className="form-hint">İlgili check-in veri şablonunun benzersiz kodu.</small>
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
