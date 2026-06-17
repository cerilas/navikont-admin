'use client';

export default function RiskAlertForm({ initialData, onChange }: { initialData: any, onChange: (data: any) => void }) {
  const handleChange = (field: string, value: any) => {
    onChange({ ...initialData, [field]: value });
  };

  return (
    <div className="card bg-light mb-3">
      <div className="card-body">
        <h4 className="card-title">Klinik Risk Uyarı Ayarları</h4>
        
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label required">Tetiklenme Türü</label>
            <select 
              className="form-select" 
              value={initialData.conditionType || 'score_threshold'} 
              onChange={e => handleChange('conditionType', e.target.value)}
              required
            >
              <option value="score_threshold">Anket Skor Eşiği (Score Threshold)</option>
              <option value="critical_value">Ölçüm Kritik Değeri (Critical Value)</option>
            </select>
          </div>

          <div className="col-md-6">
            <label className="form-label required">Eşik / Kritik Değer</label>
            <input 
              type="number" 
              className="form-control" 
              value={initialData.threshold || 0} 
              onChange={e => handleChange('threshold', parseInt(e.target.value) || 0)} 
              required 
            />
          </div>

          <div className="col-12">
            <label className="form-label required">Hastaya Gösterilecek Uyarı Mesajı</label>
            <textarea 
              className="form-control" 
              rows={2} 
              value={initialData.alertMessage || ''} 
              onChange={e => handleChange('alertMessage', e.target.value)} 
              placeholder="Örn: Tansiyon değerleriniz klinik limitlerin üzerindedir. Lütfen hekiminize başvurun."
              required
            ></textarea>
          </div>

          <div className="col-12">
            <label className="form-check">
              <input 
                className="form-check-input" 
                type="checkbox" 
                checked={initialData.notifyDoctor ?? true} 
                onChange={e => handleChange('notifyDoctor', e.target.checked)} 
              />
              <span className="form-check-label">Hekim paneline yüksek öncelikli risk uyarısı düşür</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
