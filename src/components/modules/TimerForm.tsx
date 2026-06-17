'use client';

export default function TimerForm({ initialData, onChange }: { initialData: any, onChange: (data: any) => void }) {
  const handleChange = (field: string, value: any) => {
    onChange({ ...initialData, [field]: value });
  };

  return (
    <div className="card bg-light mb-3">
      <div className="card-body">
        <h4 className="card-title">Sayaç / Timer Ayarları</h4>
        
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label required">Süre (Saniye)</label>
            <input 
              type="number" 
              className="form-control" 
              value={initialData.duration || 60} 
              onChange={e => handleChange('duration', parseInt(e.target.value) || 0)} 
              required 
              min="1" 
            />
          </div>

          <div className="col-md-6">
            <label className="form-label required">Sayaç Türü</label>
            <select 
              className="form-select" 
              value={initialData.timerType || 'countdown'} 
              onChange={e => handleChange('timerType', e.target.value)}
              required
            >
              <option value="countdown">Geri Sayım (Countdown)</option>
              <option value="stopwatch">Kronometre (Stopwatch)</option>
            </select>
          </div>

          <div className="col-12">
            <label className="form-label">Sayaç Açıklaması / Etiketi</label>
            <input 
              type="text" 
              className="form-control" 
              value={initialData.label || ''} 
              onChange={e => handleChange('label', e.target.value)} 
              placeholder="Örn: 1 dakika boyunca nefesinizi tutun."
            />
          </div>

          <div className="col-12">
            <label className="form-check">
              <input 
                className="form-check-input" 
                type="checkbox" 
                checked={initialData.audioOnComplete ?? true} 
                onChange={e => handleChange('audioOnComplete', e.target.checked)} 
              />
              <span className="form-check-label">Süre dolduğunda sesli uyarı ver</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
