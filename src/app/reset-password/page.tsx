import db from '@/lib/db';
import Link from 'next/link';
import ResetPasswordClient from './ResetPasswordClient';

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  console.log("ResetPasswordPage hit!");
  const { token } = await searchParams;
  console.log("Token is:", token);

  let isValid = false;
  let userEmail = '';
  let errorMessage = '';

  if (token) {
    const userRes = await db.query(`
      SELECT email, reset_token_expires 
      FROM core_users 
      WHERE reset_token = $1
    `, [token]);

    if (userRes.rows.length > 0) {
      const user = userRes.rows[0];
      if (new Date() > new Date(user.reset_token_expires)) {
        errorMessage = 'Bu sıfırlama bağlantısının süresi dolmuş. Lütfen yeni bir bağlantı talep edin.';
      } else {
        isValid = true;
        userEmail = user.email;
      }
    } else {
      errorMessage = 'Geçersiz veya kullanılmış sıfırlama bağlantısı.';
    }
  } else {
    errorMessage = 'Şifre sıfırlama bağlantısı (token) bulunamadı.';
  }

  return (
    <div className="page page-center">
      <div className="container container-tight py-4">
        <div className="text-center mb-4">
          <Link href="/" className="navbar-brand navbar-brand-autodark">
            <img src="/logo.png" alt="Cerilas DiGA Base Logo" style={{ maxHeight: '80px', width: 'auto', objectFit: 'contain' }} />
          </Link>
        </div>
        
        {isValid ? (
          <ResetPasswordClient token={token as string} email={userEmail} />
        ) : (
          <div className="card card-md">
            <div className="card-body text-center py-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="icon text-danger mb-2" width="48" height="48" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M12 9v2m0 4v.01" /></svg>
              <h2 className="card-title">Bağlantı Geçersiz</h2>
              <p className="text-muted">{errorMessage}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
