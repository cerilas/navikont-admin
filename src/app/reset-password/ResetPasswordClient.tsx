'use client';

import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { resetPassword } from '@/app/actions/auth';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary w-100" disabled={pending}>
      {pending ? 'Kaydediliyor...' : 'Şifreyi Kaydet'}
    </button>
  );
}

export default function ResetPasswordClient({ token, email, userType }: { token: string, email: string, userType: string }) {
  const [isSuccess, setIsSuccess] = useState(false);
  const [state, formAction] = useActionState(async (prevState: any, formData: FormData) => {
    const res = await resetPassword(prevState, formData);
    if (res?.success) {
      setIsSuccess(true);
    }
    return res;
  }, null);

  useEffect(() => {
    if (isSuccess && userType === 'patient') {
      // Try to open the mobile app automatically only for patients
      window.location.href = 'navikont://';
    }
  }, [isSuccess, userType]);

  if (isSuccess) {
    if (userType === 'patient') {
      return (
        <div className="card card-md">
          <div className="card-body text-center py-5">
            <div className="mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="icon text-green icon-lg" style={{width: '64px', height: '64px'}} width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M9 12l2 2l4 -4" /></svg>
            </div>
            <h2 className="h1 mb-3">Şifreniz Oluşturuldu!</h2>
            <p className="text-secondary mb-4">
              Hesabınız aktif hale getirildi. Artık telefonunuzdaki uygulamayı açarak giriş yapabilirsiniz.
            </p>
            <p className="text-muted text-sm mb-4">
              <em>Uygulama otomatik açılmazsa, aşağıdaki butonu kullanabilir veya uygulamaya doğrudan giriş yapabilirsiniz.</em>
            </p>
            <a href="navikont://" className="btn btn-primary w-100">
              Uygulamayı Aç
            </a>
          </div>
        </div>
      );
    } else {
      return (
        <div className="card card-md">
          <div className="card-body text-center py-5">
            <div className="mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="icon text-green icon-lg" style={{width: '64px', height: '64px'}} width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M9 12l2 2l4 -4" /></svg>
            </div>
            <h2 className="h1 mb-3">Şifreniz Oluşturuldu!</h2>
            <p className="text-secondary mb-4">
              Hesabınız aktif hale getirildi. Artık sisteme yeni şifrenizle giriş yapabilirsiniz.
            </p>
            <a href="/login" className="btn btn-primary w-100">
              Giriş Yap
            </a>
          </div>
        </div>
      );
    }
  }

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
