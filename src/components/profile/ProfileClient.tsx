'use client';

import { useState, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { updateProfile, updatePassword } from '@/app/actions/profile';
import Swal from 'sweetalert2';

function SubmitProfileButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary" disabled={pending}>
      {pending ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
    </button>
  );
}

function SubmitPasswordButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary" disabled={pending}>
      {pending ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
    </button>
  );
}

export default function ProfileClient({ profile }: { profile: any }) {
  const [activeTab, setActiveTab] = useState('info');

  const [profileState, profileAction] = useActionState(async (prevState: any, formData: FormData) => {
    const res = await updateProfile(prevState, formData);
    if (res?.success) {
      Swal.fire({
        title: 'Başarılı!',
        text: res.message,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    }
    return res;
  }, null);

  const [passwordState, passwordAction] = useActionState(async (prevState: any, formData: FormData) => {
    const res = await updatePassword(prevState, formData);
    if (res?.success) {
      Swal.fire({
        title: 'Başarılı!',
        text: res.message,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
      // Optionally reset form here using a form ref, but simple approach is fine
    }
    return res;
  }, null);

  const isDoctor = profile.user_type === 'doctor';

  return (
    <div className="card">
      <div className="card-header">
        <ul className="nav nav-tabs card-header-tabs" data-bs-toggle="tabs">
          <li className="nav-item">
            <a 
              href="#" 
              className={`nav-link ${activeTab === 'info' ? 'active' : ''}`} 
              onClick={(e) => { e.preventDefault(); setActiveTab('info'); }}
            >
              Profil Bilgileri
            </a>
          </li>
          <li className="nav-item">
            <a 
              href="#" 
              className={`nav-link ${activeTab === 'password' ? 'active' : ''}`} 
              onClick={(e) => { e.preventDefault(); setActiveTab('password'); }}
            >
              Şifre Değiştir
            </a>
          </li>
        </ul>
      </div>
      <div className="card-body">
        <div className="tab-content">
          {/* PROFILE INFO TAB */}
          <div className={`tab-pane ${activeTab === 'info' ? 'active show' : ''}`}>
            <form action={profileAction}>
              {profileState?.error && <div className="alert alert-danger">{profileState.error}</div>}
              
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label required">Ad Soyad</label>
                  <input type="text" className="form-control" name="full_name" defaultValue={profile.full_name} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label required">E-posta</label>
                  <input type="email" className="form-control" name="email" defaultValue={profile.email} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Telefon</label>
                  <input type="text" className="form-control" name="phone" defaultValue={profile.phone || ''} />
                </div>

                {isDoctor && (
                  <>
                    <div className="col-12 mt-4">
                      <h4 className="card-title">Doktor Detayları</h4>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Kurum</label>
                      <input type="text" className="form-control" name="institution" defaultValue={profile.institution || ''} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Uzmanlık</label>
                      <input type="text" className="form-control" name="specialty" defaultValue={profile.specialty || ''} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Yaş</label>
                      <input type="number" className="form-control" name="age" defaultValue={profile.age || ''} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Adres</label>
                      <input type="text" className="form-control" name="address" defaultValue={profile.address || ''} />
                    </div>
                  </>
                )}
              </div>

              <div className="mt-4 text-end">
                <SubmitProfileButton />
              </div>
            </form>
          </div>

          {/* PASSWORD UPDATE TAB */}
          <div className={`tab-pane ${activeTab === 'password' ? 'active show' : ''}`}>
            <form action={passwordAction}>
              {passwordState?.error && <div className="alert alert-danger">{passwordState.error}</div>}
              
              <div className="row g-3">
                <div className="col-md-12">
                  <label className="form-label required">Mevcut Şifre</label>
                  <input type="password" className="form-control" name="current_password" required />
                </div>
                <div className="col-md-6">
                  <label className="form-label required">Yeni Şifre</label>
                  <input type="password" className="form-control" name="new_password" required minLength={6} />
                </div>
                <div className="col-md-6">
                  <label className="form-label required">Yeni Şifre (Tekrar)</label>
                  <input type="password" className="form-control" name="confirm_password" required minLength={6} />
                </div>
              </div>

              <div className="mt-4 text-end">
                <SubmitPasswordButton />
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
