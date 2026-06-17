'use client';

export default function RiskAlertForm({ initialData, onChange, availableModules = [] }: { initialData: any, onChange: (data: any) => void, availableModules?: any[] }) {
  const handleChange = (field: string, value: any) => {
    onChange({ ...initialData, [field]: value });
  };

  // Sadece Soru-Cevap (Form Builder ile yapılmış) modüllerini filtrele
  // Quiz/Test modüllerinin formId'si olmadığı için mobil uygulamada anket ekranıyla açılamaz.
  const surveyModules = availableModules.filter(m => 
    m.type_name?.toLowerCase().includes('soru-cevap') || 
    m.type_name?.toLowerCase().includes('anket')
  );

  return (
    <div className="card bg-light mb-3">
      <div className="card-body">
        <h4 className="card-title">Klinik Risk Uyarı Ayarları</h4>
        
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label required">Hedef Anket</label>
            <select 
              className="form-select" 
              value={initialData.targetSurvey || ''} 
              onChange={e => handleChange('targetSurvey', e.target.value)} 
              required 
            >
              <option value="" disabled>Lütfen bir anket seçin</option>
              {surveyModules.map(m => (
                <option key={m.id} value={m.id}>{m.title}</option>
              ))}
            </select>
          </div>

          <div className="col-md-6">
            <label className="form-label required">Risk Puanı Eşiği</label>
            <input 
              type="number" 
              className="form-control" 
              value={initialData.threshold !== undefined ? initialData.threshold : ''} 
              onChange={e => {
                const val = e.target.value;
                onChange({
                  ...initialData,
                  threshold: val === '' ? '' : parseInt(val, 10),
                  conditionType: 'score_threshold'
                });
              }} 
              required 
            />
          </div>

          <div className="col-12">
            <label className="form-label required">Riskliyse Gösterilecek Uyarı Mesajı (Risk Aşıldı)</label>
            <textarea 
              className="form-control" 
              rows={2} 
              value={initialData.alertMessage || ''} 
              onChange={e => handleChange('alertMessage', e.target.value)} 
              placeholder="Örn: Değerleriniz klinik limitlerin üzerindedir. Lütfen hekiminize başvurun."
              required
            ></textarea>
          </div>

          <div className="col-12">
            <label className="form-label required">Risk Yoksa Gösterilecek Mesaj (Güvenli)</label>
            <textarea 
              className="form-control" 
              rows={2} 
              value={initialData.safeMessage || ''} 
              onChange={e => handleChange('safeMessage', e.target.value)} 
              placeholder="Örn: Değerleriniz gayet normal görünüyor. Harika gidiyorsunuz, tedavinize aynen devam edin!"
              required
            ></textarea>
          </div>

          <div className="col-12">
            <label className="form-label required">Anket Çözülmediyse Gösterilecek Mesaj (Veri Yok)</label>
            <textarea 
              className="form-control" 
              rows={2} 
              value={initialData.missingMessage || ''} 
              onChange={e => handleChange('missingMessage', e.target.value)} 
              placeholder="Örn: Durumunuzu analiz edebilmemiz için öncelikle ilgili değerlendirmeyi tamamlamanız gerekmektedir."
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
