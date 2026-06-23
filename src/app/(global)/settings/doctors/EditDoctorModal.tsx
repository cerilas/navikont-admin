'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { updateDoctor, sendPasswordReset, sendPasswordResetSMS } from '@/app/actions/doctors';
import Swal from 'sweetalert2';

import AvatarUploader from '@/components/profile/AvatarUploader';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary" disabled={pending}>
      {pending ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
    </button>
  );
}

export default function EditDoctorModal({ doctor, apps }: { doctor: any, apps: any[] }) {
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [isSendingSMS, setIsSendingSMS] = useState(false);
  const modalId = `modal-edit-doctor-${doctor.id}`;

  const [state, formAction] = useActionState(async (prevState: any, formData: FormData) => {
    const res = await updateDoctor(prevState, formData);
    if (res?.success) {
      Swal.fire({
        title: 'Başarılı',
        text: res.message,
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
      const modalEl = document.getElementById(modalId);
      if (modalEl) {
        // @ts-ignore
        const bsModal = window.bootstrap?.Modal?.getInstance(modalEl);
        bsModal?.hide();
      }
    }
    return res;
  }, null);

  const handleSendReset = async () => {
    setIsSendingReset(true);
    const res = await sendPasswordReset(doctor.id);
    setIsSendingReset(false);
    
    if (res.success) {
      Swal.fire('Başarılı', res.message, 'success');
    } else {
      Swal.fire('Hata', res.error, 'error');
    }
  };

  const handleSendResetSMS = async () => {
    setIsSendingSMS(true);
    const res = await sendPasswordResetSMS(doctor.id);
    setIsSendingSMS(false);
    
    if (res.success) {
      Swal.fire('Başarılı', res.message, 'success');
    } else {
      Swal.fire('Hata', res.error, 'error');
    }
  };

  return (
    <div className="modal modal-blur fade" id={modalId} tabIndex={-1} role="dialog" aria-hidden="true">
      <div className="modal-dialog modal-dialog-centered" role="document">
        <form className="modal-content" action={formAction}>
          <input type="hidden" name="id" value={doctor.id} />
          <div className="modal-header">
            <h5 className="modal-title">Doktor Yönetimi - {doctor.full_name}</h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Kapat"></button>
          </div>
          <div className="modal-body">
            {state?.error && <div className="alert alert-danger">{state.error}</div>}
            
            <AvatarUploader defaultValue={doctor.avatar_url || ''} />

            <div className="mb-3">
              <label className="form-label required">Ad Soyad</label>
              <input type="text" className="form-control" name="full_name" defaultValue={doctor.full_name} required />
            </div>
            
            <div className="mb-3">
              <label className="form-label required">E-posta</label>
              <input type="email" className="form-control" name="email" defaultValue={doctor.email} required />
            </div>
            
            <div className="mb-3">
              <label className="form-label">Telefon</label>
              <input type="tel" className="form-control" name="phone" defaultValue={doctor.phone || ''} />
            </div>

            <div className="mb-3">
              <label className="form-label required">Atanan Uygulamalar</label>
              {apps && apps.length > 0 ? (
                <div className="form-selectgroup form-selectgroup-pills">
                  {apps.map((a: any) => (
                    <label className="form-selectgroup-item" key={a.id}>
                      <input 
                        type="checkbox" 
                        name="app_ids" 
                        value={a.id} 
                        className="form-selectgroup-input" 
                        defaultChecked={doctor.app_ids?.includes(a.id)}
                      />
                      <span className="form-selectgroup-label">{a.icon_emoji || '📱'} {a.name}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="text-muted small">Sistemde uygulama bulunamadı.</div>
              )}
            </div>

            <div className="hr-text">Profil Bilgileri (Opsiyonel)</div>

            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Kurum</label>
                <input type="text" className="form-control" name="institution" defaultValue={doctor.institution || ''} placeholder="Çalıştığı Kurum" />
              </div>
              <div className="col-md-6">
                <label className="form-label">Uzmanlık</label>
                <input type="text" className="form-control" name="specialty" defaultValue={doctor.specialty || ''} placeholder="Kardiyoloji" />
              </div>
            </div>

            <div className="row g-3 mt-1 mb-3">
              <div className="col-md-4">
                <label className="form-label">Yaş</label>
                <input type="number" className="form-control" name="age" defaultValue={doctor.age || ''} placeholder="45" min="18" max="100" />
              </div>
              <div className="col-md-8">
                <label className="form-label">Adres</label>
                <input type="text" className="form-control" name="address" defaultValue={doctor.address || ''} placeholder="İl, İlçe, Mahalle..." />
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label">Hesap Durumu</label>
              <select className="form-select" name="status" defaultValue={doctor.status}>
                <option value="active">Aktif</option>
                <option value="inactive">Pasif</option>
              </select>
            </div>

            <div className="card border-primary">
              <div className="card-body">
                <h3 className="card-title">Güvenlik İşlemleri</h3>
                <p className="text-muted">Doktora yeni bir şifre belirlemesi için tek seferlik bir bağlantı gönderebilirsiniz.</p>
                <div className="d-flex gap-2">
                  <button type="button" className="btn btn-outline-primary" onClick={handleSendReset} disabled={isSendingReset}>
                    {isSendingReset ? 'Gönderiliyor...' : 'E-posta ile Gönder'}
                  </button>
                  <button type="button" className="btn btn-outline-success" onClick={handleSendResetSMS} disabled={isSendingSMS || !doctor.phone}>
                    {isSendingSMS ? 'Gönderiliyor...' : 'SMS ile Gönder'}
                  </button>
                </div>
                {!doctor.phone && <small className="text-danger d-block mt-2">SMS gönderebilmek için doktorun telefonu sisteme kayıtlı olmalıdır.</small>}
              </div>
            </div>

          </div>
          <div className="modal-footer">
            <button type="button" className="btn me-auto" data-bs-dismiss="modal">İptal</button>
            <SubmitButton />
          </div>
        </form>
      </div>
    </div>
  );
}
