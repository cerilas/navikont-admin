'use client';

export default function GoalForm({ initialData, onChange }: { initialData: any, onChange: (data: any) => void }) {
  const handleChange = (field: string, value: any) => {
    onChange({ ...initialData, [field]: value });
  };

  return (
    <div className="card bg-light mb-3">
      <div className="card-body">
        <h4 className="card-title">Hedef Modülü Ayarları</h4>
        
        <div className="row g-3">
          <div className="col-md-4">
            <label className="form-label required">Hedef Türü</label>
            <select 
              className="form-select" 
              value={initialData.goalType || 'steps'} 
              onChange={e => handleChange('goalType', e.target.value)}
              required
            >
              <option value="steps">Günlük Adım Hedefi</option>
              <option value="water">Günlük Su Tüketimi</option>
              <option value="sleep">Günlük Uyku Süresi</option>
              <option value="activity">Günlük Egzersiz Süresi</option>
              <option value="custom">Özel Hedef</option>
            </select>
          </div>

          <div className="col-md-4">
            <label className="form-label required">Hedef Değer</label>
            <input 
              type="number" 
              className="form-control" 
              value={initialData.targetValue || 10000} 
              onChange={e => handleChange('targetValue', parseInt(e.target.value) || 0)} 
              required 
              min="1" 
            />
          </div>

          <div className="col-md-4">
            <label className="form-label required">Birim</label>
            <input 
              type="text" 
              className="form-control" 
              value={initialData.unit || 'adım'} 
              onChange={e => handleChange('unit', e.target.value)} 
              required 
              placeholder="Örn: ml, saat, dakika, adım" 
            />
          </div>

          <div className="col-12">
            <label className="form-label">Hedef Talimatları</label>
            <textarea 
              className="form-control" 
              rows={3} 
              value={initialData.instructions || ''} 
              onChange={e => handleChange('instructions', e.target.value)} 
              placeholder="Örn: Günde en az 10.000 adım atarak aktif kalmaya özen gösterin..."
            ></textarea>
          </div>
        </div>
      </div>
    </div>
  );
}
