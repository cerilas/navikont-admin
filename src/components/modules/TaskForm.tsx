'use client';

export default function TaskForm({ initialData, onChange }: { initialData: any, onChange: (data: any) => void }) {
  const handleChange = (field: string, value: any) => {
    onChange({ ...initialData, [field]: value });
  };

  return (
    <div className="card bg-light mb-3">
      <div className="card-body">
        <h4 className="card-title">Günlük Görev Ayarları</h4>
        
        <div className="row g-3">
          <div className="col-md-8">
            <label className="form-label required">Görev Adı / Tanımı</label>
            <input 
              type="text" 
              className="form-control" 
              value={initialData.taskName || ''} 
              onChange={e => handleChange('taskName', e.target.value)} 
              placeholder="Örn: 20 Dakika Orta Tempolu Yürüyüş"
              required 
            />
          </div>

          <div className="col-md-4">
            <label className="form-label required">Tahmini Süre (Dakika)</label>
            <input 
              type="number" 
              className="form-control" 
              value={initialData.estimatedDuration || 20} 
              onChange={e => handleChange('estimatedDuration', parseInt(e.target.value) || 0)} 
              required 
              min="1" 
            />
          </div>

          <div className="col-12">
            <label className="form-label">Görevin Yapılış Talimatları</label>
            <textarea 
              className="form-control" 
              rows={4} 
              value={initialData.instructions || ''} 
              onChange={e => handleChange('instructions', e.target.value)} 
              placeholder="Örn: 1. Rahat bir spor ayakkabı giyin.\n2. Düz bir parkurda 20 dakika boyunca durmaksızın yürüyün..."
            ></textarea>
          </div>
        </div>
      </div>
    </div>
  );
}
