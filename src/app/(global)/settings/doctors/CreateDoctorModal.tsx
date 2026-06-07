'use client';

import { useActionState, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { createDoctor } from '@/app/actions/doctors';
import Swal from 'sweetalert2';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary" disabled={pending}>
      {pending ? 'Ekleniyor...' : 'Doktor Ekle'}
    </button>
  );
}

export default function CreateDoctorModal() {
  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction] = useActionState(async (prevState: any, formData: FormData) => {
    const res = await createDoctor(prevState, formData);
    if (res?.success) {
      Swal.fire({
        title: 'Başarılı',
        text: res.message,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
      formRef.current?.reset();
      // Close modal using standard bootstrap approach or just let the user close it
      const modalEl = document.getElementById('modal-create-doctor');
      if (modalEl) {
        // @ts-ignore
        const bsModal = window.bootstrap?.Modal?.getInstance(modalEl);
        bsModal?.hide();
      }
    }
    return res;
  }, null);

  return (
    <div className="modal modal-blur fade" id="modal-create-doctor" tabIndex={-1} role="dialog" aria-hidden="true">
      <div className="modal-dialog modal-dialog-centered" role="document">
        <form className="modal-content" action={formAction} ref={formRef}>
          <div className="modal-header">
            <h5 className="modal-title">Yeni Doktor Ekle</h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Kapat"></button>
          </div>
          <div className="modal-body">
            {state?.error && <div className="alert alert-danger">{state.error}</div>}
            
            <div className="mb-3">
              <label className="form-label required">Ad Soyad</label>
              <input type="text" className="form-control" name="full_name" placeholder="Dr. Ali Yılmaz" required />
            </div>
            
            <div className="mb-3">
              <label className="form-label required">E-posta</label>
              <input type="email" className="form-control" name="email" placeholder="ali@hastane.com" required />
              <small className="form-hint">Bu e-posta adresine şifre belirleme bağlantısı gönderilecektir.</small>
            </div>
            
            <div className="mb-3">
              <label className="form-label">Telefon (Opsiyonel)</label>
              <input type="tel" className="form-control" name="phone" placeholder="+90 555 555 5555" />
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
