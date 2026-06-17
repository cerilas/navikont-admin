'use client';

export default function ReminderForm({ initialData, onChange }: { initialData: any, onChange: (data: any) => void }) {
  const handleChange = (field: string, value: any) => {
    onChange({ ...initialData, [field]: value });
  };

  return (
    <div className="card bg-light mb-3">
      <div className="card-body">
        <h4 className="card-title">Hatırlatıcı Ayarları</h4>
        
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label required">Hatırlatma Saati</label>
            <input 
              type="time" 
              className="form-control" 
              value={initialData.reminderTime || '09:00'} 
              onChange={e => handleChange('reminderTime', e.target.value)} 
              required 
            />
          </div>

          <div className="col-md-6">
            <label className="form-label required">Sıklık</label>
            <select 
              className="form-select" 
              value={initialData.frequency || 'daily'} 
              onChange={e => handleChange('frequency', e.target.value)}
              required
            >
              <option value="daily">Günlük (Her gün)</option>
              <option value="weekdays">Sadece Hafta İçi (Pzt-Cum)</option>
              <option value="weekly">Haftada Bir</option>
            </select>
          </div>

          <div className="col-12">
            <label className="form-label required">Bildirim Başlığı</label>
            <input 
              type="text" 
              className="form-control" 
              value={initialData.title || ''} 
              onChange={e => handleChange('title', e.target.value)} 
              placeholder="Örn: Egzersiz Zamanı!"
              required
            />
          </div>

          <div className="col-12">
            <label className="form-label required">Bildirim Mesajı (Gövde)</label>
            <textarea 
              className="form-control" 
              rows={2} 
              value={initialData.body || ''} 
              onChange={e => handleChange('body', e.target.value)} 
              placeholder="Örn: Bugün henüz pelvik egzersizlerini yapmadın. Hadi 2 dakikanı ayır."
              required
            ></textarea>
          </div>
        </div>
      </div>
    </div>
  );
}
