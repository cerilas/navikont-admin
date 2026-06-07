'use client';

export default function MeasurementForm({ initialData, onChange }: { initialData: any, onChange: (data: any) => void }) {
  const metrics = initialData.metrics || [];

  const handleAddMetric = () => {
    const newMetrics = [...metrics, { id: Date.now().toString(), name: '', unit: '', type: 'number' }];
    onChange({ ...initialData, metrics: newMetrics });
  };

  const handleUpdateMetric = (index: number, field: string, value: any) => {
    const newMetrics = [...metrics];
    newMetrics[index] = { ...newMetrics[index], [field]: value };
    onChange({ ...initialData, metrics: newMetrics });
  };

  const handleRemoveMetric = (index: number) => {
    const newMetrics = metrics.filter((_: any, i: number) => i !== index);
    onChange({ ...initialData, metrics: newMetrics });
  };

  return (
    <div className="card bg-light mb-3">
      <div className="card-body">
        <h4 className="card-title">Ölçüm / Veri Girişi Ayarları</h4>
        <div className="alert alert-info">Hastadan alınacak her bir veri için (Örn: Sistolik Tansiyon, Kilo) bir ölçüm birimi ekleyin.</div>
        
        {metrics.map((m: any, mIndex: number) => (
          <div key={m.id} className="row g-2 align-items-end mb-3 p-3 border bg-white rounded">
            <div className="col-md-4">
              <label className="form-label required small">Ölçüm Adı</label>
              <input 
                type="text" 
                className="form-control" 
                value={m.name} 
                onChange={e => handleUpdateMetric(mIndex, 'name', e.target.value)} 
                placeholder="Örn: Kilo" 
                required 
              />
            </div>
            <div className="col-md-3">
              <label className="form-label required small">Birim</label>
              <input 
                type="text" 
                className="form-control" 
                value={m.unit} 
                onChange={e => handleUpdateMetric(mIndex, 'unit', e.target.value)} 
                placeholder="Örn: kg" 
                required 
              />
            </div>
            <div className="col-md-3">
              <label className="form-label required small">Veri Tipi</label>
              <select className="form-select" value={m.type} onChange={e => handleUpdateMetric(mIndex, 'type', e.target.value)}>
                <option value="number">Sayısal (Ondalık)</option>
                <option value="integer">Sayısal (Tam Sayı)</option>
                <option value="boolean">Evet/Hayır</option>
              </select>
            </div>
            <div className="col-md-2">
              <button type="button" className="btn btn-outline-danger w-100" onClick={() => handleRemoveMetric(mIndex)}>Sil</button>
            </div>
          </div>
        ))}

        <button type="button" className="btn btn-outline-primary w-100" onClick={handleAddMetric}>
          <svg xmlns="http://www.w3.org/2000/svg" className="icon me-1" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 5l0 14" /><path d="M5 12l14 0" /></svg>
          Yeni Ölçüm Ekle
        </button>
      </div>
    </div>
  );
}
