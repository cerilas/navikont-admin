'use client';

import { useState } from 'react';
import { setSetting } from '@/app/actions/settings';
import Swal from 'sweetalert2';

export default function SupportSettingsClient({ initialEmail }: { initialEmail: string }) {
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await setSetting('support_email', email);
      if (res.success) {
        Swal.fire('Başarılı', 'Destek e-posta adresi güncellendi.', 'success');
      } else {
        Swal.fire('Hata', res.error, 'error');
      }
    } catch (err) {
      Swal.fire('Hata', 'Bir hata oluştu.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="row g-3">
      <div className="col-12 col-md-6">
        <label className="form-label">Destek E-posta Adresi</label>
        <input 
          type="email" 
          className="form-control" 
          value={email} 
          onChange={e => setEmail(e.target.value)} 
          placeholder="Orn: destek@firma.com"
        />
        <small className="form-hint mt-2">
          Doktor panelinden gönderilen destek talepleri bu e-posta adresine iletilecektir. Boş bırakırsanız e-posta bildirimi gitmez.
        </small>
      </div>
      <div className="col-12 mt-4">
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
      </div>
    </form>
  );
}
