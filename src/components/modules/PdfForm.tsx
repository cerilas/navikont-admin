'use client';

export default function PdfForm({ initialData, onChange }: { initialData: any, onChange: (data: any) => void }) {
  const handleChange = (field: string, value: any) => {
    onChange({ ...initialData, [field]: value });
  };

  return (
    <div className="card bg-light mb-3">
      <div className="card-body">
        <h4 className="card-title">Dosya / PDF Ayarları</h4>
        <div className="mb-3">
          <label className="form-label required">Dosya URL'si (CDN / S3 Linki)</label>
          <input 
            type="url" 
            className="form-control" 
            value={initialData.fileUrl || ''} 
            onChange={e => handleChange('fileUrl', e.target.value)} 
            required 
            placeholder="https://cdn.navikont.com/documents/..." 
          />
        </div>
        <div className="mb-3">
          <label className="form-label required">Dosya Tipi</label>
          <select 
            className="form-select" 
            value={initialData.fileType || 'pdf'} 
            onChange={e => handleChange('fileType', e.target.value)}
          >
            <option value="pdf">PDF Belgesi</option>
            <option value="image">Görsel (JPG, PNG)</option>
            <option value="audio">Ses Dosyası (MP3)</option>
          </select>
        </div>
        <div className="mb-3">
          <label className="form-check">
            <input 
              className="form-check-input" 
              type="checkbox" 
              checked={initialData.isDownloadable || false} 
              onChange={e => handleChange('isDownloadable', e.target.checked)} 
            />
            <span className="form-check-label">Kullanıcı bu dosyayı cihazına indirebilsin</span>
          </label>
        </div>
      </div>
    </div>
  );
}
