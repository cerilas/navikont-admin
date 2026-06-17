'use client';

export default function QuestionnaireForm({ initialData, onChange, availableForms = [] }: { initialData: any, onChange: (data: any) => void, availableForms?: any[] }) {
  const handleChange = (field: string, value: any) => {
    onChange({ ...initialData, [field]: value });
  };

  return (
    <div className="card bg-light mb-3">
      <div className="card-body">
        <h4 className="card-title">Soru-Cevap (Anket) Ayarları</h4>
        
        <div className="row g-3">
          <div className="col-12">
            <label className="form-label required">Kullanılacak Formu Seçin</label>
            <p className="text-muted small">Bu modülde gösterilecek anketi Form Oluşturucu ile önceden hazırlamış olmanız gerekmektedir.</p>
            <select 
              className="form-select" 
              value={initialData.formId || ''} 
              onChange={e => handleChange('formId', e.target.value)} 
              required 
            >
              <option value="" disabled>Lütfen bir anket formu seçin</option>
              {availableForms.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
