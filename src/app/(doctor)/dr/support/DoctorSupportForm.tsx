'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { createSupportRequest } from '@/app/actions/support';
import Swal from 'sweetalert2';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary mt-3" disabled={pending}>
      {pending ? 'Gönderiliyor...' : 'Talebi Gönder'}
    </button>
  );
}

export default function DoctorSupportForm() {
  const [state, formAction] = useActionState(async (prevState: any, formData: FormData) => {
    const res = await createSupportRequest(prevState, formData);
    if (res?.success) {
      Swal.fire('Başarılı', res.message, 'success').then(() => {
        // Formu temizle
        const form = document.getElementById('supportForm') as HTMLFormElement;
        if (form) form.reset();
      });
    }
    return res;
  }, null);

  return (
    <form id="supportForm" action={formAction}>
      {state?.error && <div className="alert alert-danger">{state.error}</div>}
      <div className="mb-3">
        <label className="form-label required">Konu</label>
        <input type="text" className="form-control" name="subject" required placeholder="Mesajınızın konusu" />
      </div>
      <div className="mb-3">
        <label className="form-label required">Mesaj</label>
        <textarea className="form-control" name="message" rows={6} required placeholder="Nasıl yardımcı olabiliriz? Lütfen detayları paylaşın..."></textarea>
      </div>
      <SubmitButton />
    </form>
  );
}
