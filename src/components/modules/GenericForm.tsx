'use client';

export default function GenericForm({ initialData, onChange, moduleName }: { initialData: any, onChange: (data: any) => void, moduleName: string }) {
  const handleChange = (field: string, value: any) => {
    onChange({ ...initialData, [field]: value });
  };

  return (
    <div className="card bg-light mb-3 border-warning">
      <div className="card-body">
        <h4 className="card-title text-warning">Dinamik Modül Ayarları ({moduleName})</h4>
        <div className="alert alert-warning mb-3">
          Bu modül tipi için özel arayüz henüz eklenmedi. Tüm konfigürasyonu standart anahtar-değer (Key-Value) veya doğrudan JSON metni olarak yönetebilirsiniz.
        </div>
        
        <div className="mb-3">
          <label className="form-label">Standart Metin / Yönerge</label>
          <textarea 
            className="form-control" 
            rows={3} 
            value={initialData.text || ''} 
            onChange={e => handleChange('text', e.target.value)} 
            placeholder="Kullanıcıya gösterilecek ana metin veya uyarı..."
          ></textarea>
        </div>
        
        <div className="mb-3">
          <label className="form-label">Sayısal Parametre (Opsiyonel)</label>
          <input 
            type="number" 
            className="form-control" 
            value={initialData.numericValue || ''} 
            onChange={e => handleChange('numericValue', parseInt(e.target.value) || 0)} 
            placeholder="Örn: 10 (Saniye, Adet vs.)"
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Gelişmiş JSON Verisi (Opsiyonel)</label>
          <textarea 
            className="form-control text-monospace" 
            rows={5} 
            value={initialData.rawJson || ''} 
            onChange={e => handleChange('rawJson', e.target.value)} 
            placeholder='{"key": "value"}'
            style={{ fontFamily: 'monospace', fontSize: '13px' }}
          ></textarea>
        </div>
      </div>
    </div>
  );
}
