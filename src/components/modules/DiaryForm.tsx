'use client';

export default function DiaryForm({ initialData, onChange }: { initialData: any, onChange: (data: any) => void }) {
  const handleChange = (field: string, value: any) => {
    onChange({ ...initialData, [field]: value });
  };

  return (
    <div className="card bg-light mb-3">
      <div className="card-body">
        <h4 className="card-title">Günlük / Diary Ayarları</h4>
        
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label required">Günlük Türü</label>
            <select 
              className="form-select" 
              value={initialData.diaryType || 'food'} 
              onChange={e => handleChange('diaryType', e.target.value)}
              required
            >
              <option value="food">Yemek / Beslenme Günlüğü</option>
              <option value="bladder">İdrar / İşeme Günlüğü</option>
              <option value="symptom">Semptom Günlüğü</option>
              <option value="mood">Duygu Durum (Mood) Günlüğü</option>
              <option value="custom">Özel Günlük</option>
            </select>
          </div>

          <div className="col-md-6 d-flex align-items-end">
            <label className="form-check mb-2">
              <input 
                className="form-check-input" 
                type="checkbox" 
                checked={initialData.allowPhotos || false} 
                onChange={e => handleChange('allowPhotos', e.target.checked)} 
              />
              <span className="form-check-label">Fotoğraf yüklemeye izin ver</span>
            </label>
          </div>

          <div className="col-12">
            <label className="form-label">Günlük Kullanım Talimatları</label>
            <textarea 
              className="form-control" 
              rows={3} 
              value={initialData.instructions || ''} 
              onChange={e => handleChange('instructions', e.target.value)} 
              placeholder="Örn: Gün boyunca tükettiğiniz tüm yiyecek ve içecekleri porsiyonlarıyla birlikte kaydedin..."
            ></textarea>
          </div>
        </div>
      </div>
    </div>
  );
}
