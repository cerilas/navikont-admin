'use client';

export default function TextForm({ initialData, onChange }: { initialData: any, onChange: (data: any) => void }) {
  const handleChange = (field: string, value: any) => {
    onChange({ ...initialData, [field]: value });
  };

  return (
    <div className="card bg-light mb-3">
      <div className="card-body">
        <h4 className="card-title">Metin İçeriği</h4>
        <div className="mb-3">
          <label className="form-label required">Zengin Metin (HTML/Markdown destekli)</label>
          <textarea 
            className="form-control" 
            rows={10} 
            value={initialData.html || ''} 
            onChange={e => handleChange('html', e.target.value)} 
            required 
            placeholder="Makale veya bilgilendirme metnini buraya girin..."
          ></textarea>
          <small className="form-hint mt-2">Uygulama bu alanı doğrudan zengin metin olarak render edecektir.</small>
        </div>
        <div className="mb-3">
          <label className="form-label">Okuma Süresi (Dakika)</label>
          <input 
            type="number" 
            className="form-control" 
            value={initialData.readTime || ''} 
            onChange={e => handleChange('readTime', parseInt(e.target.value) || 0)} 
            min="1" 
            placeholder="Örn: 3"
          />
        </div>
      </div>
    </div>
  );
}
