'use client';

export default function ConsentForm({ initialData, onChange }: { initialData: any, onChange: (data: any) => void }) {
  const handleChange = (field: string, value: any) => {
    onChange({ ...initialData, [field]: value });
  };

  return (
    <div className="card bg-light mb-3">
      <div className="card-body">
        <h4 className="card-title">Aydınlatılmış Onam / Rıza Formu Ayarları</h4>
        
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label required">Onam / Versiyon Kodu</label>
            <input 
              type="text" 
              className="form-control" 
              value={initialData.version || 'v1.0'} 
              onChange={e => handleChange('version', e.target.value)} 
              required 
              placeholder="örn: kvkk_v1.0" 
            />
          </div>

          <div className="col-md-6 d-flex align-items-end">
            <label className="form-check mb-2">
              <input 
                className="form-check-input" 
                type="checkbox" 
                checked={initialData.isRequired ?? true} 
                onChange={e => handleChange('isRequired', e.target.checked)} 
              />
              <span className="form-check-label">Bu adımı onaylamak zorunlu (Uygulamaya devam etmek için)</span>
            </label>
          </div>

          <div className="col-12">
            <label className="form-label required">Onam Metni (HTML formatında)</label>
            <textarea 
              className="form-control text-monospace" 
              rows={8} 
              value={initialData.consentTextHtml || ''} 
              onChange={e => handleChange('consentTextHtml', e.target.value)} 
              placeholder="<h3>KVKK Aydınlatma Metni</h3><p>Verileriniz 6698 sayılı kanun kapsamında işlenecektir...</p>"
              required
            ></textarea>
            <small className="form-hint">Hasta mobil uygulamada bu metni kaydırarak okuyacak ve altındaki onay kutusunu işaretleyecektir.</small>
          </div>
        </div>
      </div>
    </div>
  );
}
