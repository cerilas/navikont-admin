'use client';

export default function BreathingForm({ initialData, onChange }: { initialData: any, onChange: (data: any) => void }) {
  const handleChange = (field: string, value: any) => {
    onChange({ ...initialData, [field]: value });
  };

  return (
    <div className="card bg-light mb-3">
      <div className="card-body">
        <h4 className="card-title">Nefes Egzersizi Ayarları</h4>
        
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label required">Toplam Egzersiz Süresi (Saniye)</label>
            <input 
              type="number" 
              className="form-control" 
              value={initialData.duration || 120} 
              onChange={e => handleChange('duration', parseInt(e.target.value) || 0)} 
              required 
              min="10" 
            />
          </div>

          <div className="col-md-6">
            <label className="form-label required">Nefes Alma Süresi (Saniye)</label>
            <input 
              type="number" 
              className="form-control" 
              value={initialData.inhaleDuration || 4} 
              onChange={e => handleChange('inhaleDuration', parseInt(e.target.value) || 0)} 
              required 
              min="1" 
            />
          </div>

          <div className="col-md-4">
            <label className="form-label required">Dolu Tutma Süresi (Saniye)</label>
            <input 
              type="number" 
              className="form-control" 
              value={initialData.holdDuration || 4} 
              onChange={e => handleChange('holdDuration', parseInt(e.target.value) || 0)} 
              required 
              min="0" 
            />
          </div>

          <div className="col-md-4">
            <label className="form-label required">Nefes Verme Süresi (Saniye)</label>
            <input 
              type="number" 
              className="form-control" 
              value={initialData.exhaleDuration || 4} 
              onChange={e => handleChange('exhaleDuration', parseInt(e.target.value) || 0)} 
              required 
              min="1" 
            />
          </div>

          <div className="col-md-4">
            <label className="form-label required">Boş Tutma Süresi (Saniye)</label>
            <input 
              type="number" 
              className="form-control" 
              value={initialData.holdEmptyDuration || 4} 
              onChange={e => handleChange('holdEmptyDuration', parseInt(e.target.value) || 0)} 
              required 
              min="0" 
            />
          </div>

          <div className="col-12">
            <label className="form-label">Egzersiz Talimatları</label>
            <textarea 
              className="form-control" 
              rows={3} 
              value={initialData.instructions || ''} 
              onChange={e => handleChange('instructions', e.target.value)} 
              placeholder="Örn: Rahat bir pozisyonda oturun. Akciğerlerinizi tamamen boşaltın ve başlayın..."
            ></textarea>
          </div>
        </div>
      </div>
    </div>
  );
}
