'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { updatePatientProfile } from '@/app/actions/patients';
import Swal from 'sweetalert2';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary" disabled={pending}>
      {pending ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
    </button>
  );
}

export default function EditPatientModal({ patient, journeys, allDiseases = [] }: { patient: any, journeys: any[], allDiseases?: any[] }) {
  const [selectedJourney, setSelectedJourney] = useState<string>(patient.journey_id || '');
  const [state, formAction] = useActionState(async (prevState: any, formData: FormData) => {
    const res = await updatePatientProfile(prevState, formData);
    if (res?.success) {
      Swal.fire('Başarılı', 'Hasta bilgileri başarıyla güncellendi.', 'success').then(() => {
        window.location.reload();
      });
    }
    return res;
  }, null);

  return (
    <div className="modal modal-blur fade" id="editPatientModal" tabIndex={-1} aria-hidden="true">
      <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
        <form action={formAction} className="modal-content">
          <input type="hidden" name="user_id" value={patient.user_id} />
          <input type="hidden" name="enrollment_id" value={patient.enrollment_id} />
          
          <div className="modal-header">
            <h5 className="modal-title">Hasta Profilini Düzenle</h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          
          <div className="modal-body">
            {state?.error && <div className="alert alert-danger">{state.error}</div>}

            <h3 className="mb-3 border-bottom pb-2">Kişisel Bilgiler</h3>
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label className="form-label required">Ad Soyad</label>
                <input type="text" className="form-control" name="full_name" defaultValue={patient.full_name} required />
              </div>
              <div className="col-md-6">
                <label className="form-label">E-posta (Salt Okunur)</label>
                <input type="email" className="form-control" defaultValue={patient.email} disabled />
                <small className="form-hint">E-posta adresi giriş anahtarı olduğu için değiştirilemez.</small>
              </div>
              <div className="col-md-6">
                <label className="form-label">Telefon Numarası</label>
                <input type="tel" className="form-control" name="phone" defaultValue={patient.phone || ''} placeholder="Örn: +90 555 123 45 67" />
              </div>
            </div>

            <h3 className="mb-3 border-bottom pb-2">Fiziksel Özellikler</h3>
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label className="form-label">Doğum Tarihi</label>
                <input type="date" className="form-control" name="birth_date" defaultValue={patient.birth_date ? new Date(patient.birth_date).toISOString().split('T')[0] : ''} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Cinsiyet</label>
                <select className="form-select" name="gender" defaultValue={patient.gender || ''}>
                  <option value="">Belirtilmemiş</option>
                  <option value="male">Erkek</option>
                  <option value="female">Kadın</option>
                  <option value="other">Diğer</option>
                  <option value="prefer_not_to_say">Söylemek İstemiyorum</option>
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label">Boy (cm)</label>
                <input type="number" className="form-control" name="height_cm" defaultValue={patient.height_cm || ''} step="0.1" />
              </div>
              <div className="col-md-4">
                <label className="form-label">Kilo (kg)</label>
                <input type="number" className="form-control" name="weight_kg" defaultValue={patient.weight_kg || ''} step="0.1" />
              </div>
              <div className="col-md-4">
                <label className="form-label">Kan Grubu</label>
                <select className="form-select" name="blood_type" defaultValue={patient.blood_type || ''}>
                  <option value="">Seçiniz</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
            </div>

            <h3 className="mb-3 border-bottom pb-2">Sahip Olunan Diğer Hastalıklar</h3>
            <div className="mb-4">
              <label className="form-label">Hastanın mevcut hastalık geçmişini seçiniz (Çoklu seçim yapabilirsiniz)</label>
              <div className="row g-2">
                {allDiseases.map(d => (
                  <div key={d.id} className="col-md-6 col-lg-4">
                    <label className="form-check form-switch form-switch-lg mb-0">
                      <input 
                        className="form-check-input" 
                        type="checkbox" 
                        name="disease_ids" 
                        value={d.id} 
                        defaultChecked={patient.disease_ids?.includes(d.id)}
                      />
                      <span className="form-check-label text-truncate" title={d.name}>{d.name}</span>
                    </label>
                  </div>
                ))}
                {allDiseases.length === 0 && (
                  <div className="text-muted small">Aktif hastalık bulunamadı. Lütfen "Hastalık Yönetimi" menüsünden hastalık ekleyin.</div>
                )}
              </div>
            </div>

            <h3 className="mb-3 border-bottom pb-2">Tedavi (Uygulama) Bilgileri</h3>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Atanan Akış (Journey)</label>
                <select 
                  className="form-select" 
                  name="journey_id" 
                  value={selectedJourney}
                  onChange={(e) => setSelectedJourney(e.target.value)}
                >
                  <option value="">-- Otomatik Koşullu Atama --</option>
                  {journeys.map(j => (
                    <option key={j.id} value={j.id}>{j.name} {j.is_default ? '(Varsayılan)' : ''}</option>
                  ))}
                </select>
                {selectedJourney ? (
                  <div className="alert alert-warning mt-2 mb-0 py-2">
                    <div className="d-flex align-items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="icon me-2" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 9v2m0 4v.01" /><path d="M5 19h14a2 2 0 0 0 1.84 -2.75l-7.1 -12.25a2 2 0 0 0 -3.5 0l-7.1 12.25a2 2 0 0 0 1.75 2.75" /></svg>
                      <small><strong>Dikkat:</strong> Özel akış seçimi, anket skoruna dayalı otomatik atamayı devre dışı bırakır.</small>
                    </div>
                  </div>
                ) : (
                  <small className="form-hint mt-2">Hastaya başlangıç testindeki skorlarına göre sistem tarafından otomatik akış atanacaktır.</small>
                )}
              </div>
              <div className="col-md-6">
                <label className="form-label required">Başlangıç Tarihi</label>
                <input type="date" className="form-control" name="start_date" required defaultValue={patient.start_date ? new Date(patient.start_date).toISOString().split('T')[0] : ''} />
              </div>
            </div>

          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-link link-secondary" data-bs-dismiss="modal">İptal</button>
            <SubmitButton />
          </div>
        </form>
      </div>
    </div>
  );
}
