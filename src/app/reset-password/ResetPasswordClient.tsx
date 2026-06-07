'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { resetPassword } from '@/app/actions/auth';
import Swal from 'sweetalert2';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary w-100" disabled={pending}>
      {pending ? 'Kaydediliyor...' : 'Şifreyi Kaydet'}
    </button>
  );
}

export default function ResetPasswordClient({ token, email }: { token: string, email: string }) {
  const [state, formAction] = useActionState(async (prevState: any, formData: FormData) => {
    const res = await resetPassword(prevState, formData);
    if (res?.success) {
      Swal.fire({
        title: 'Başarılı!',
        text: 'Şifreniz başarıyla oluşturuldu. Artık yeni şifrenizle giriş yapabilirsiniz.',
        icon: 'success',
        confirmButtonText: 'Tamam'
      }).then(() => {
        // Normally redirect to login page for the mobile app or web portal
        window.location.href = '/'; 
      });
    }
    return res;
  }, null);

  return (
    <form className="card card-md" action={formAction}>
      <input type="hidden" name="token" value={token} />
      <div className="card-body">
        <h2 className="card-title text-center mb-4">Yeni Şifre Belirleme</h2>
        
        <div className="alert alert-info d-flex flex-column align-items-center text-center">
          <div className="mb-2">
            <strong>{email}</strong>
          </div>
          <div className="text-muted">
            Hesabınız için yeni bir şifre belirliyorsunuz. Lütfen en az 6 karakterli güçlü bir şifre seçin.
          </div>
        </div>

        {state?.error && <div className="alert alert-danger">{state.error}</div>}

        <div className="mb-3">
          <label className="form-label required">Yeni Şifre</label>
          <input 
            type="password" 
            className="form-control" 
            name="password" 
            placeholder="En az 6 karakter" 
            required 
            minLength={6} 
          />
        </div>

        <div className="mb-3">
          <label className="form-label required">Şifre Tekrar</label>
          <input 
            type="password" 
            className="form-control" 
            name="confirmPassword" 
            placeholder="Şifrenizi tekrar girin" 
            required 
            minLength={6} 
          />
        </div>

        <div className="form-footer">
          <SubmitButton />
        </div>
      </div>
    </form>
  );
}
