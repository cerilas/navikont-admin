'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { invitePatientToApp } from '@/app/actions/patients';
import Swal from 'sweetalert2';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary" disabled={pending}>
      {pending ? 'Ekleniyor...' : 'Davet Et'}
    </button>
  );
}

export default function InvitePatientForm({ appId, journeys }: { appId: string, journeys: any[] }) {
  const [selectedJourney, setSelectedJourney] = useState<string>('');
  const [state, formAction] = useActionState(async (prevState: any, formData: FormData) => {
    const res = await invitePatientToApp(prevState, formData);
    if (res?.success) {
      Swal.fire('Başarılı', res.message, 'success').then(() => {
        window.location.reload();
      });
    }
    return res;
  }, null);

  return (
    <>
      <button className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#invitePatientModal">
        <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0" /><path d="M16 19h6" /><path d="M19 16v6" /><path d="M6 21v-2a4 4 0 0 1 4 -4h4" /></svg>
        Yeni Hasta Davet Et
      </button>

      <div className="modal modal-blur fade" id="invitePatientModal" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered" role="document">
          <form action={formAction} className="modal-content">
            <input type="hidden" name="appId" value={appId} />
            <div className="modal-header">
              <h5 className="modal-title">Yeni Hasta Davet Et</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              {state?.error && <div className="alert alert-danger">{state.error}</div>}
              
              <div className="mb-3">
                <label className="form-label required">Hasta Adı Soyadı</label>
                <input type="text" className="form-control" name="fullName" required placeholder="Örn: Ahmet Yılmaz" />
              </div>
              
              <div className="mb-3">
                <label className="form-label required">E-posta Adresi</label>
                <input type="email" className="form-control" name="email" required placeholder="hasta@ornek.com" />
                <small className="form-hint">Eğer hastanın platformda hesabı yoksa, bu mail adresiyle otomatik hesap oluşturulur.</small>
              </div>

              <div className="mb-3">
                <label className="form-label">Tedavi Akışı (Journey)</label>
                <select 
                  className="form-select" 
                  name="journeyId" 
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
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-link link-secondary" data-bs-dismiss="modal">İptal</button>
              <SubmitButton />
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
