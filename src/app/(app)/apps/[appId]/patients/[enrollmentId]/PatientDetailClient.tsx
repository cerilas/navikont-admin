'use client';

import { useState, useTransition } from 'react';
import { useParams } from 'next/navigation';
import { updateEnrollmentStatus, deletePatientEnrollment } from '@/app/actions/patients';
import { sendPasswordResetEmail, sendPasswordResetSMS } from '@/app/actions/auth';
import EditPatientModal from './EditPatientModal';
import Swal from 'sweetalert2';

export default function PatientDetailClient({ patient, journeys }: { patient: any, journeys: any[] }) {
  const params = useParams();
  const appId = params.appId as string;
  const [activeTab, setActiveTab] = useState('overview');
  const [isPending, startTransition] = useTransition();

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()}`;
  };

  const handleStatusChange = (newStatus: string) => {
    const statusMap: Record<string, string> = {
      'active': 'Aktif',
      'paused': 'Dondurulmuş',
      'cancelled': 'İptal Edilmiş'
    };
    
    Swal.fire({
      title: 'Emin misiniz?',
      text: `Hastanın durumunu "${statusMap[newStatus]}" olarak değiştirmek istediğinize emin misiniz?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Evet, Değiştir',
      cancelButtonText: 'Vazgeç'
    }).then((result) => {
      if (result.isConfirmed) {
        startTransition(async () => {
          const res = await updateEnrollmentStatus(patient.enrollment_id, newStatus);
          if (res?.error) {
            Swal.fire('Hata', res.error, 'error');
          } else {
            Swal.fire('Başarılı', 'Hastanın durumu güncellendi.', 'success').then(() => {
              window.location.reload();
            });
          }
        });
      }
    });
  };

  const handleSendResetEmail = () => {
    Swal.fire({
      title: 'E-posta Gönderilsin mi?',
      text: 'Hastaya şifre belirleme/sıfırlama e-postası gönderilecek. Onaylıyor musunuz?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Evet, Gönder',
      cancelButtonText: 'İptal',
      showLoaderOnConfirm: true,
      preConfirm: async () => {
        const res = await sendPasswordResetEmail(patient.user_id, appId);
        if (res?.error) {
          Swal.showValidationMessage(res.error);
        }
        return res;
      },
      allowOutsideClick: () => !Swal.isLoading()
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire('Gönderildi!', result.value?.message || 'E-posta başarıyla iletildi.', 'success');
      }
    });
  };

  const handleSendResetSMS = () => {
    Swal.fire({
      title: 'SMS Gönderilsin mi?',
      text: 'Hastaya SMS ile şifre belirleme/sıfırlama bağlantısı gönderilecek. Onaylıyor musunuz?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Evet, SMS Gönder',
      cancelButtonText: 'İptal',
      showLoaderOnConfirm: true,
      preConfirm: async () => {
        const res = await sendPasswordResetSMS(patient.user_id, appId);
        if (res?.error) {
          Swal.showValidationMessage(res.error);
        }
        return res;
      },
      allowOutsideClick: () => !Swal.isLoading()
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire('Gönderildi!', result.value?.message || 'SMS başarıyla iletildi.', 'success');
      }
    });
  };

  const handleDeletePatient = () => {
    Swal.fire({
      title: 'Dikkat! Tehlikeli İşlem',
      text: 'Hastayı bu programdan silmek üzeresiniz. Bu işlem geri alınamaz ve hastanın tüm ilerlemesi kaybolur. Silmek istediğinize emin misiniz?',
      icon: 'error',
      showCancelButton: true,
      confirmButtonText: 'Evet, Tamamen Sil',
      confirmButtonColor: '#d33',
      cancelButtonText: 'İptal',
      showLoaderOnConfirm: true,
      preConfirm: async () => {
        const res = await deletePatientEnrollment(patient.enrollment_id, appId);
        if (res?.error) {
          Swal.showValidationMessage(res.error);
        }
        return res;
      },
      allowOutsideClick: () => !Swal.isLoading()
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire('Silindi!', 'Hasta sistemden başarıyla silindi.', 'success').then(() => {
          window.location.href = `/apps/${appId}/patients`;
        });
      }
    });
  };

  return (
    <>
      <div className="card">
        <div className="card-header">
          <ul className="nav nav-tabs card-header-tabs">
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`} 
                onClick={() => setActiveTab('overview')}
              >
                Genel Bakış
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'progress' ? 'active' : ''}`} 
                onClick={() => setActiveTab('progress')}
              >
                Günlük İlerleme
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'health' ? 'active' : ''}`} 
                onClick={() => setActiveTab('health')}
              >
                Sağlık Verileri
              </button>
            </li>
          </ul>
        </div>
        
        <div className="card-body">
          {activeTab === 'overview' && (
            <div className="row g-4">
              <div className="col-md-6">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h3 className="card-title m-0">Hasta Bilgileri</h3>
                  <button className="btn btn-sm btn-outline-primary" data-bs-toggle="modal" data-bs-target="#editPatientModal">
                    <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5v4" /><path d="M13.5 6.5l4 4" /></svg>
                    Düzenle
                  </button>
                </div>
                <div className="mb-3">
                  <div className="text-muted mb-1">E-posta</div>
                  <div>{patient.email}</div>
                </div>
                <div className="mb-3">
                  <div className="text-muted mb-1">Kayıt Tarihi</div>
                  <div>{formatDate(patient.created_at)}</div>
                </div>
                <div className="mb-3">
                  <div className="text-muted mb-1">Başlangıç Tarihi (Tedavi)</div>
                  <div>{formatDate(patient.start_date)}</div>
                </div>
                <div className="mb-3">
                  <div className="text-muted mb-1">Atanan Akış (Journey)</div>
                  <div>{patient.journey_name || 'Belirtilmemiş'}</div>
                </div>
                <div className="mb-3">
                  <div className="text-muted mb-1">Telefon Numarası</div>
                  <div>{patient.phone || <span className="text-secondary fst-italic">Belirtilmemiş</span>}</div>
                </div>
                <div className="mb-3">
                  <div className="text-muted mb-1">Fiziksel Özellikler</div>
                  {patient.birth_date || patient.height_cm || patient.weight_kg ? (
                    <ul className="list-unstyled mb-0">
                      {patient.birth_date && <li><strong>Doğum Tarihi:</strong> {formatDate(patient.birth_date)}</li>}
                      {patient.gender && <li><strong>Cinsiyet:</strong> {patient.gender === 'male' ? 'Erkek' : patient.gender === 'female' ? 'Kadın' : patient.gender === 'other' ? 'Diğer' : 'Belirtilmemiş'}</li>}
                      {patient.height_cm && <li><strong>Boy:</strong> {patient.height_cm} cm</li>}
                      {patient.weight_kg && <li><strong>Kilo:</strong> {patient.weight_kg} kg</li>}
                      {patient.blood_type && <li><strong>Kan Grubu:</strong> {patient.blood_type}</li>}
                    </ul>
                  ) : (
                    <div className="text-secondary fst-italic">Fiziksel bilgiler henüz girilmemiş.</div>
                  )}
                </div>
              </div>
              
              <div className="col-md-6">
                <h3 className="card-title">Durum Yönetimi</h3>
                <div className="alert alert-info">
                  Hastanın programını geçici olarak dondurabilir, aktifleştirebilir veya tamamen iptal edebilirsiniz.
                </div>
                
                <div className="d-flex flex-column gap-2 mt-3">
                  {patient.status !== 'active' && (
                    <button onClick={() => handleStatusChange('active')} disabled={isPending} className="btn btn-outline-success">
                      Programı Başlat / Aktifleştir
                    </button>
                  )}
                  {patient.status === 'active' && (
                    <button onClick={() => handleStatusChange('paused')} disabled={isPending} className="btn btn-outline-warning">
                      Programı Dondur (Pause)
                    </button>
                  )}
                  {patient.status !== 'cancelled' && (
                    <button onClick={() => handleStatusChange('cancelled')} disabled={isPending} className="btn btn-outline-danger">
                      Programı İptal Et
                    </button>
                  )}
                </div>

                <h3 className="card-title mt-5">Hesap Yönetimi</h3>
                <div className="d-flex flex-column gap-2">
                  <button onClick={handleSendResetEmail} className="btn btn-outline-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 7a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-10z" /><path d="M3 7l9 6l9 -6" /></svg>
                    Şifre Sıfırlama E-postası Gönder
                  </button>
                  <button onClick={handleSendResetSMS} className="btn btn-outline-success" disabled={!patient.phone}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 4h4l2 5l-2.5 1.5a11 11 0 0 0 5 5l1.5 -2.5l5 2v4a2 2 0 0 1 -2 2a16 16 0 0 1 -15 -15a2 2 0 0 1 2 -2" /></svg>
                    Şifre Sıfırlama SMS'i Gönder
                  </button>
                  {!patient.phone && (
                    <div className="text-muted small mt-1">
                      * SMS gönderebilmek için önce hastayı düzenleyerek telefon numarasını girin.
                    </div>
                  )}
                </div>

                <h3 className="card-title mt-5 text-danger border-bottom pb-2 border-danger border-opacity-25">Tehlike Bölgesi</h3>
                <div className="alert alert-danger bg-danger-lt">
                  <strong>Dikkat:</strong> Hastayı sildiğinizde, hastanın bu uygulamadaki tüm ilerlemesi, form yanıtları ve modül istatistikleri kalıcı olarak silinecektir.
                </div>
                <button onClick={handleDeletePatient} disabled={isPending} className="btn btn-danger w-100">
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 7l16 0" /><path d="M10 11l0 6" /><path d="M14 11l0 6" /><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" /><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" /></svg>
                  Hastayı Sistemden Sil
                </button>
              </div>
            </div>
          )}

          {activeTab === 'progress' && (
            <div>
              <h3 className="card-title">Son Tamamlanan Görevler</h3>
              <p className="text-muted">Hastanın mobil uygulama üzerinden tamamladığı eğitimler, videolar ve anketler burada listelenir.</p>
              
              <div className="empty">
                <div className="empty-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M12 12l3 2" /><path d="M12 7v5" /></svg>
                </div>
                <p className="empty-title">Henüz Aktivite Yok</p>
                <p className="empty-subtitle text-muted">
                  Kullanıcı henüz hiçbir modülü tamamlamadı. Kullanıcı uygulamayı kullanmaya başladığında bu ekran dolacaktır.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'health' && (
            <div>
              <h3 className="card-title">Sağlık Verileri ve Ölçümler</h3>
              <p className="text-muted">Hastanın check-in ekranlarından veya cihazlarından gelen veriler grafiksel olarak burada görüntülenir.</p>
              
              <div className="row g-3">
                <div className="col-md-6">
                  <div className="card card-sm border-0 shadow-none bg-light h-100">
                    <div className="card-body">
                      <div className="d-flex align-items-center mb-3">
                        <span className="bg-red text-white avatar rounded me-3">
                          <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M19.5 12.572l-7.5 7.428l-7.5 -7.428a5 5 0 1 1 7.5 -6.566a5 5 0 1 1 7.5 6.572" /></svg>
                        </span>
                        <div>
                          <div className="font-weight-medium">Kan Basıncı (Tansiyon)</div>
                          <div className="text-muted text-xs">Son 7 Günlük Trend</div>
                        </div>
                      </div>
                      <div className="alert alert-secondary mb-0 border-0 text-center">Veri Bekleniyor</div>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="card card-sm border-0 shadow-none bg-light h-100">
                    <div className="card-body">
                      <div className="d-flex align-items-center mb-3">
                        <span className="bg-blue text-white avatar rounded me-3">
                          <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 19l16 0" /><path d="M4 15l4 -6l4 2l4 -5l4 4" /></svg>
                        </span>
                        <div>
                          <div className="font-weight-medium">Kilo Takibi</div>
                          <div className="text-muted text-xs">Aylık Değişim Grafiği</div>
                        </div>
                      </div>
                      <div className="alert alert-secondary mb-0 border-0 text-center">Veri Bekleniyor</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Edit Patient Modal */}
      <EditPatientModal patient={patient} journeys={journeys} />
    </>
  );
}
