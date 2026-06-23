'use client';

import { useState } from 'react';
import { IconUpload, IconUserCircle, IconX } from '@tabler/icons-react';

export default function AvatarUploader({ 
  name = 'avatar_url', 
  defaultValue = '' 
}: { 
  name?: string, 
  defaultValue?: string 
}) {
  const [avatarUrl, setAvatarUrl] = useState(defaultValue);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Dosya boyutu en fazla 5MB olabilir.');
      return;
    }

    setIsUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setAvatarUrl(data.url);
      } else {
        setError(data.error || 'Dosya yüklenemedi.');
      }
    } catch (err) {
      setError('Bir hata oluştu.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setAvatarUrl('');
  };

  return (
    <div className="mb-3">
      <label className="form-label">Profil Fotoğrafı</label>
      <input type="hidden" name={name} value={avatarUrl} />
      <div className="d-flex align-items-center gap-3">
        <span className="avatar avatar-xl bg-transparent border-0 text-muted shadow-sm" style={{ backgroundImage: avatarUrl ? `url(${avatarUrl})` : 'none' }}>
          {!avatarUrl && <IconUserCircle size={64} stroke={1} />}
        </span>
        <div className="d-flex flex-column gap-2">
          <div className="d-flex gap-2">
            <label className={`btn btn-outline-primary btn-sm ${isUploading ? 'disabled' : ''}`}>
              <IconUpload size={16} className="me-1" />
              {isUploading ? 'Yükleniyor...' : 'Fotoğraf Yükle'}
              <input type="file" className="d-none" accept="image/png, image/jpeg, image/jpg, image/webp" onChange={handleFileChange} disabled={isUploading} />
            </label>
            {avatarUrl && (
              <button type="button" className="btn btn-outline-danger btn-sm" onClick={handleRemove} disabled={isUploading}>
                <IconX size={16} className="me-1" />
                Kaldır
              </button>
            )}
          </div>
          {error && <small className="text-danger">{error}</small>}
          <small className="text-muted">Önerilen boyut 256x256px. Maksimum 5MB (JPG, PNG, WEBP).</small>
        </div>
      </div>
    </div>
  );
}
