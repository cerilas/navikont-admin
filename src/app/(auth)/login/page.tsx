'use client';

import { useFormStatus } from 'react-dom';
import { useActionState } from 'react';
import { login } from '@/app/actions/auth';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary w-100" disabled={pending}>
      {pending ? 'Giriş yapılıyor...' : 'Giriş Yap'}
    </button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useActionState(login, null);

  return (
    <div className="page page-center">
      <div className="container container-tight py-4">
        <div className="text-center mb-4">
          <a href="." className="navbar-brand navbar-brand-autodark">
            <img src="/logo.png" alt="Cerilas DiGA Base Logo" style={{ maxHeight: '80px', width: 'auto', objectFit: 'contain' }} />
          </a>
        </div>
        <div className="card card-md">
          <div className="card-body">
            <h2 className="h2 text-center mb-4">Hesabınıza giriş yapın</h2>
            <form action={formAction}>
              {state?.error && (
                <div className="alert alert-danger" role="alert">
                  {state.error}
                </div>
              )}
              <div className="mb-3">
                <label className="form-label">E-posta adresi</label>
                <input
                  type="email"
                  name="email"
                  className="form-control"
                  placeholder="admin@navikont.com"
                  autoComplete="off"
                  required
                />
              </div>
              <div className="mb-2">
                <label className="form-label">
                  Şifre
                </label>
                <div className="input-group input-group-flat">
                  <input
                    type="password"
                    name="password"
                    className="form-control"
                    placeholder="Şifreniz"
                    autoComplete="off"
                    required
                  />
                </div>
              </div>
              <div className="form-footer">
                <SubmitButton />
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
