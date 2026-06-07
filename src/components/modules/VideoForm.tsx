'use client';

export default function VideoForm({ initialData, onChange }: { initialData: any, onChange: (data: any) => void }) {
  const handleChange = (field: string, value: any) => {
    onChange({ ...initialData, [field]: value });
  };

  return (
    <div className="card bg-light mb-3">
      <div className="card-body">
        <h4 className="card-title">Video Ayarları</h4>
        <div className="mb-3">
          <label className="form-label required">Video URL (Vimeo / YouTube / S3)</label>
          <input 
            type="url" 
            className="form-control" 
            value={initialData.videoUrl || ''} 
            onChange={e => handleChange('videoUrl', e.target.value)} 
            required 
            placeholder="https://vimeo.com/..." 
          />
        </div>
        <div className="mb-3">
          <label className="form-label required">Süre (Dakika)</label>
          <input 
            type="number" 
            className="form-control" 
            value={initialData.duration || ''} 
            onChange={e => handleChange('duration', parseInt(e.target.value) || 0)} 
            required 
            min="1" 
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Video İçi Etkileşimler (Opsiyonel)</label>
          <input 
            type="text" 
            className="form-control" 
            value={initialData.interactions || ''} 
            onChange={e => handleChange('interactions', e.target.value)} 
            placeholder="Örn: 5. dakikada durdur ve soru sor (JSON)" 
          />
          <small className="form-hint">İleride videonun belirli saniyelerinde çıkacak pop-up sorular buraya eklenebilir.</small>
        </div>
      </div>
    </div>
  );
}
