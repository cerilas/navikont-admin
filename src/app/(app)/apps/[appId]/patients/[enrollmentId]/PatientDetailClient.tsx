'use client';

import { useState, useTransition } from 'react';
import { useParams } from 'next/navigation';
import { updateEnrollmentStatus, deletePatientEnrollment, getDetailedModuleAnswers, resetPatientProgress, assignDoctorToPatient } from '@/app/actions/patients';
import { sendPasswordResetEmail, sendPasswordResetSMS } from '@/app/actions/auth';
import EditPatientModal from './EditPatientModal';
import Swal from 'sweetalert2';

export default function PatientDetailClient({ patient, journeys, doctors = [], allDiseases = [], progressLogs = [], unassignedInfo = null, auditLogs = [] }: { patient: any, journeys: any[], doctors?: any[], allDiseases?: any[], progressLogs?: any[], unassignedInfo?: any, auditLogs?: any[] }) {
  const params = useParams();
  const appId = params.appId as string;
  const [activeTab, setActiveTab] = useState('overview');
  const [isPending, startTransition] = useTransition();

  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [detailedData, setDetailedData] = useState<any>(null);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);

  const handleViewDetails = async (log: any) => {
    setSelectedLog(log);
    setDetailedData(null);
    setIsFetchingDetails(false);

    if (log.module_type === 'checkin' || log.module_type === 'questionnaire' || log.module_type === 'question_answer') {
      setIsFetchingDetails(true);
      try {
        const details = await getDetailedModuleAnswers(
          patient.enrollment_id,
          patient.user_id,
          log.module_type,
          log.completed_at,
          log.module_version_id
        );
        setDetailedData(details);
      } catch (err) {
        console.error('Failed to fetch details:', err);
      } finally {
        setIsFetchingDetails(false);
      }
    }
  };


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
          const basePath = window.location.pathname.startsWith('/dr') ? `/dr/apps/${appId}/patients` : `/apps/${appId}/patients`;
          window.location.href = basePath;
        });
      }
    });
  };

  const handleResetProgress = () => {
    Swal.fire({
      title: 'Tüm İlerlemeyi Sıfırla?',
      text: 'Hastanın bugüne kadar yaptığı tüm görevler, anketler ve gün ilerlemeleri tamamen silinecek ve 1. Güne geri dönecektir. Emin misiniz?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Evet, İlerlemeyi Sıfırla',
      confirmButtonColor: '#ff9800',
      cancelButtonText: 'İptal',
      showLoaderOnConfirm: true,
      preConfirm: async () => {
        const res = await resetPatientProgress(patient.enrollment_id);
        if (res?.error) {
          Swal.showValidationMessage(res.error);
        }
        return res;
      },
      allowOutsideClick: () => !Swal.isLoading()
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire('Sıfırlandı!', 'Hastanın ilerlemesi başarıyla sıfırlandı.', 'success').then(() => {
          window.location.reload();
        });
      }
    });
  };

  const handleChangeDoctor = () => {
    let doctorOptions = `<option value="">-- Doktor Atanmasın --</option>`;
    doctors.forEach(d => {
      const selected = d.id === patient.doctor_user_id ? 'selected' : '';
      doctorOptions += `<option value="${d.id}" ${selected}>${d.full_name} (${d.email})</option>`;
    });

    Swal.fire({
      title: 'Doktor Ata / Değiştir',
      html: `
        <div class="text-start mt-3">
          <label class="form-label">Sorumlu Doktor Seçin:</label>
          <select id="doctorSelect" class="form-select">
            ${doctorOptions}
          </select>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Kaydet',
      cancelButtonText: 'İptal',
      showLoaderOnConfirm: true,
      preConfirm: async () => {
        const selectEl = document.getElementById('doctorSelect') as HTMLSelectElement;
        const newDoctorId = selectEl.value || null;
        
        if (newDoctorId === patient.doctor_user_id) return true; // no change
        
        const res = await assignDoctorToPatient(patient.enrollment_id, newDoctorId);
        if (res?.error) {
          Swal.showValidationMessage(res.error);
        }
        return res;
      },
      allowOutsideClick: () => !Swal.isLoading()
    }).then((result) => {
      if (result.isConfirmed && result.value?.success) {
        Swal.fire('Başarılı!', result.value.message, 'success').then(() => {
          window.location.reload();
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
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'audit' ? 'active' : ''}`} 
                onClick={() => setActiveTab('audit')}
              >
                Geçmiş / Loglar
              </button>
            </li>
          </ul>
        </div>
        
        <div className="card-body">
          {activeTab === 'overview' && (
            <div className="row g-4">
              {unassignedInfo && (
                <div className="col-12">
                  <div className="alert alert-warning" style={{ borderLeft: '4px solid #f59e0b', background: '#fffbeb' }}>
                    <div className="d-flex align-items-start gap-3">
                      <div className="flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4"></path><path d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.875h16.214a1.914 1.914 0 0 0 1.636 -2.875l-8.106 -13.534a1.914 1.914 0 0 0 -3.274 0z"></path><path d="M12 16h.01"></path></svg>
                      </div>
                      <div className="flex-grow-1">
                        <h4 className="alert-title mb-2" style={{ color: '#92400e' }}>Koşullu Atama Eşleşmedi</h4>
                        <p className="mb-2" style={{ color: '#78350f' }}>
                          Hasta <strong>&quot;{unassignedInfo.questionnaireName}&quot;</strong> anketinden <span className="badge bg-danger-lt fs-5 px-2 py-1 mx-1" style={{ fontSize: '1rem' }}>{unassignedInfo.score} puan</span> aldı. Bu puan mevcut atama kurallarının hiçbirine uymuyor.
                        </p>
                        {unassignedInfo.rules && unassignedInfo.rules.length > 0 && (
                          <div className="mt-3">
                            <div className="fw-semibold mb-2" style={{ color: '#92400e' }}>Mevcut Atama Kuralları:</div>
                            <table className="table table-sm table-bordered mb-0" style={{ maxWidth: '500px', background: 'white' }}>
                              <thead>
                                <tr style={{ background: '#fef3c7' }}>
                                  <th style={{ color: '#92400e' }}>Puan Aralığı</th>
                                  <th style={{ color: '#92400e' }}>Atanan Akış</th>
                                </tr>
                              </thead>
                              <tbody>
                                {unassignedInfo.rules.map((rule: any, i: number) => (
                                  <tr key={i}>
                                    <td><code>{rule.scoreMin ?? '∞'} - {rule.scoreMax ?? '∞'}</code></td>
                                    <td>{rule.journeyName}</td>
                                  </tr>
                                ))}
                                <tr style={{ background: '#fef2f2' }}>
                                  <td><code className="text-danger">{unassignedInfo.score} puan</code></td>
                                  <td className="text-danger fw-semibold">❌ Eşleşme Yok</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        )}
                        <div className="mt-3 d-flex gap-2 align-items-center">
                          <span className="text-muted" style={{ fontSize: '0.85rem' }}>
                            Anket tarihi: {new Date(unassignedInfo.submittedAt).toLocaleString('tr-TR')}
                          </span>
                          <span className="text-muted">•</span>
                          <span className="text-muted" style={{ fontSize: '0.85rem' }}>
                            Lütfen hastayı manuel olarak bir akışa atayın veya puan aralığını güncelleyin.
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
                  <div className="d-flex align-items-center gap-2">
                    <span className="fw-medium text-dark">{patient.journey_name || 'Koşullu Atama Bekleniyor'}</span>
                    {patient.metadata?.auto_assigned && (
                      <span className="badge bg-purple-lt px-2 py-1" title="Bu akış hasta anketi çözünce sistem tarafından otomatik atanmıştır.">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon me-1"><path d="M13 3l0 7l6 0l-8 11l0 -7l-6 0l8 -11"></path></svg>
                        Oto-Atandı
                      </span>
                    )}
                  </div>
                </div>
                <div className="mb-3">
                  <div className="text-muted mb-1 d-flex align-items-center justify-content-between">
                    <span>Sorumlu Doktor</span>
                    <button onClick={handleChangeDoctor} className="btn btn-sm btn-link py-0 text-primary text-decoration-none">
                      Değiştir
                    </button>
                  </div>
                  <div>
                    {patient.doctor_name ? (
                      <span className="badge bg-blue-lt text-blue fs-6 px-2 py-1">{patient.doctor_name}</span>
                    ) : (
                      <span className="text-secondary fst-italic">Doktor atanmamış</span>
                    )}
                  </div>
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
                <button onClick={handleDeletePatient} disabled={isPending} className="btn btn-danger w-100 mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 7l16 0" /><path d="M10 11l0 6" /><path d="M14 11l0 6" /><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" /><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" /></svg>
                  Hastayı Sistemden Sil
                </button>
                <button onClick={handleResetProgress} disabled={isPending} className="btn btn-warning w-100 text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M19.95 11a8 8 0 1 0 -.5 4m.5 5v-5h-5" /></svg>
                  Tüm İlerlemeyi Sıfırla
                </button>
              </div>
            </div>
          )}

          {activeTab === 'progress' && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="card-title m-0">Günlük İlerleme</h3>
              </div>

              {progressLogs.length > 0 ? (
                <>
                  <div className="table-responsive">
                    <table className="table table-vcenter card-table table-striped">
                      <thead>
                        <tr>
                          <th>Tarih</th>
                          <th>Modül Adı</th>
                          <th>Gün</th>
                          <th>Durum</th>
                          <th>Başlama / Bitiş</th>
                          <th>İlerleme</th>
                          <th>İşlemler</th>
                        </tr>
                      </thead>
                      <tbody>
                        {progressLogs.map((log: any) => (
                          <tr key={log.id}>
                            <td>{log.completed_at ? new Date(log.completed_at).toLocaleString('tr-TR', { dateStyle: 'short' }) : '-'}</td>
                            <td>
                              <div className="fw-medium">{log.module_title || log.module_name}</div>
                              <div className="text-muted small">{log.module_type}</div>
                            </td>
                            <td>{log.day_number}</td>
                            <td>
                              {log.status === 'completed' ? (
                                <span className="badge bg-success-lt">Tamamlandı</span>
                              ) : log.status === 'in_progress' ? (
                                <span className="badge bg-warning-lt">Devam Ediyor</span>
                              ) : (
                                <span className="badge bg-secondary-lt">{log.status}</span>
                              )}
                            </td>
                            <td>
                              <div className="small text-muted mb-1">
                                <strong>B:</strong> {log.started_at ? new Date(log.started_at).toLocaleString('tr-TR', { timeStyle: 'short' }) : '-'}
                              </div>
                              <div className="small text-muted">
                                <strong>B:</strong> {log.completed_at ? new Date(log.completed_at).toLocaleString('tr-TR', { timeStyle: 'short' }) : '-'}
                              </div>
                            </td>
                            <td>
                              {log.progress_percent !== null ? (
                                <div className="d-flex align-items-center gap-2">
                                  <span>%{Number(log.progress_percent || 0).toFixed(0)}</span>
                                  <div className="progress progress-sm" style={{ width: '40px' }}>
                                    <div className="progress-bar bg-primary" style={{ width: `${Number(log.progress_percent || 0)}%` }}></div>
                                  </div>
                                </div>
                              ) : '-'}
                              {['risk', 'risk_alert'].includes(log.module_type) && log.result_data && typeof log.result_data === 'object' && log.result_data.score !== undefined && (
                                <div className={`mt-2 p-3 rounded border d-flex flex-column gap-2 ${log.result_data.riskStatus === 'risk' ? 'bg-danger-lt border-danger border-opacity-50' : 'bg-success-lt border-success border-opacity-50'}`} style={{ minWidth: '220px' }}>
                                  <div className="d-flex align-items-center justify-content-between">
                                    <span className={`fw-bold d-flex align-items-center gap-1 ${log.result_data.riskStatus === 'risk' ? 'text-danger' : 'text-success'}`}>
                                      {log.result_data.riskStatus === 'risk' ? (
                                        <>
                                          <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 9v4" /><path d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0z" /><path d="M12 16h.01" /></svg>
                                          Riskli
                                        </>
                                      ) : (
                                        <>
                                          <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M9 12l2 2l4 -4" /></svg>
                                          Güvenli
                                        </>
                                      )}
                                    </span>
                                    <span className="badge bg-white text-dark shadow-sm border">
                                      Puan: {log.result_data.score}
                                    </span>
                                  </div>
                                  <div className="progress progress-sm" title={`Eşik Değeri: ${log.result_data.threshold}`}>
                                    <div 
                                      className={`progress-bar ${log.result_data.riskStatus === 'risk' ? 'bg-danger' : 'bg-success'}`} 
                                      style={{ width: `${Math.min(100, (Number(log.result_data.score) / (Number(log.result_data.threshold) * 1.5 || 10)) * 100)}%`}}
                                    ></div>
                                  </div>
                                  <div className="text-muted text-xs d-flex justify-content-between align-items-center">
                                    <span>0</span>
                                    <span className="fw-medium px-1 bg-white rounded border">Eşik: {log.result_data.threshold}</span>
                                  </div>
                                </div>
                              )}
                            </td>
                            <td>
                              <div className="d-flex gap-2">
                                {log.result_data || ['checkin', 'questionnaire', 'question_answer'].includes(log.module_type) ? (
                                  <button className="btn btn-sm btn-outline-primary" data-bs-toggle="modal" data-bs-target="#logDetailsModal" onClick={() => handleViewDetails(log)}>
                                    Detay
                                  </button>
                                ) : (
                                  <span className="text-muted small align-self-center">Detay Yok</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="empty">
                  <div className="empty-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M12 12l3 2" /><path d="M12 7v5" /></svg>
                  </div>
                  <p className="empty-title">Henüz Aktivite Yok</p>
                  <p className="empty-subtitle text-muted">
                    Kullanıcı henüz hiçbir modülü tamamlamadı. Kullanıcı uygulamayı kullanmaya başladığında bu ekran dolacaktır.
                  </p>
                </div>
              )}
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

          {activeTab === 'audit' && (
            <div>
              <h3 className="card-title mb-4">Profil Değişiklik Geçmişi</h3>
              {auditLogs.length > 0 ? (
                <div className="timeline">
                  {auditLogs.map((log: any) => {
                    const oldData = typeof log.old_data === 'string' ? JSON.parse(log.old_data) : log.old_data;
                    const newData = typeof log.new_data === 'string' ? JSON.parse(log.new_data) : log.new_data;
                    
                    const changes: any[] = [];
                    if (newData) {
                      Object.keys(newData).forEach(key => {
                        const oldVal = oldData?.[key];
                        const newVal = newData[key];
                        if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
                          changes.push({ key, oldVal, newVal });
                        }
                      });
                    }

                    return (
                      <div className="timeline-event" key={log.id}>
                        <div className="timeline-event-icon bg-blue-lt">
                          <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 8l0 4l2 2" /><path d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5" /></svg>
                        </div>
                        <div className="card timeline-event-card">
                          <div className="card-body">
                            <div className="text-muted float-end text-xs">{formatDate(log.created_at)} {new Date(log.created_at).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})}</div>
                            <h4>
                              {!log.actor_user_id ? (
                                <span className="badge bg-secondary-lt">Sistem Tarafından Değiştirildi</span>
                              ) : log.actor_user_id === log.entity_id ? (
                                <span className="badge bg-green-lt">Hasta Tarafından Değiştirildi</span>
                              ) : log.actor_role === 'doctor' ? (
                                <span className="badge bg-blue-lt">Doktor Tarafından Değiştirildi ({log.actor_name})</span>
                              ) : (
                                <span className="badge bg-purple-lt">Admin Tarafından Değiştirildi ({log.actor_name})</span>
                              )}
                            </h4>
                            <div className="text-secondary mt-2">
                              {changes.length > 0 ? (
                                <ul className="list-unstyled mb-0">
                                  {changes.map((c, i) => {
                                    const formatValue = (key: string, val: any) => {
                                      if (key === 'disease_ids') {
                                        if (!Array.isArray(val) || val.length === 0) return 'Yok';
                                        return val.map(id => {
                                          const d = allDiseases.find((d: any) => d.id === id || d.disease_id === id);
                                          return d ? d.name : id;
                                        }).join(', ');
                                      }
                                      if (key === 'gender') {
                                        return val === 'male' ? 'Erkek' : val === 'female' ? 'Kadın' : val || 'Yok';
                                      }
                                      return Array.isArray(val) ? val.join(', ') || 'Yok' : val || 'Yok';
                                    };

                                    return (
                                      <li key={i} className="mb-1">
                                        <strong>{c.key === 'birth_date' ? 'Doğum Tarihi' : c.key === 'gender' ? 'Cinsiyet' : c.key === 'height_cm' ? 'Boy (cm)' : c.key === 'weight_kg' ? 'Kilo (kg)' : c.key === 'blood_type' ? 'Kan Grubu' : c.key === 'disease_ids' ? 'Hastalıklar' : c.key}:</strong>{' '}
                                        <span className="text-danger text-decoration-line-through">{formatValue(c.key, c.oldVal)}</span>
                                        {' '}
                                        <svg xmlns="http://www.w3.org/2000/svg" className="icon text-muted mx-1" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 12l14 0" /><path d="M15 16l4 -4" /><path d="M15 8l4 4" /></svg>
                                        {' '}
                                        <span className="text-success fw-bold">{formatValue(c.key, c.newVal)}</span>
                                      </li>
                                    );
                                  })}
                                </ul>
                              ) : (
                                <span className="text-muted">Detaylı değişiklik verisi bulunamadı.</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="alert alert-secondary">
                  Bu hastanın profiliyle ilgili herhangi bir değişiklik geçmişi (log) bulunmamaktadır.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Edit Patient Modal */}
      <EditPatientModal patient={patient} journeys={journeys} allDiseases={allDiseases} />
    

      {/* Log Details Modal */}
      <div className="modal modal-blur fade" id="logDetailsModal" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
          <div className="modal-content shadow-lg border-0">
            <div className="modal-header bg-light">
              <h5 className="modal-title text-dark">
                <svg xmlns="http://www.w3.org/2000/svg" className="icon text-primary me-2" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M9 5h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2h-2" /><path d="M9 3m0 2a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v0a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2z" /><path d="M9 14l2 2l4 -4" /></svg>
                {selectedLog?.module_title || selectedLog?.module_name} Detayları
              </h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body p-4">
              {isFetchingDetails ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status"></div>
                  <div className="mt-2 text-muted">Detaylar yükleniyor...</div>
                </div>
              ) : detailedData ? (
                <div>
                  {selectedLog?.module_type === 'checkin' ? (
                    <div>
                      <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
                        <h4 className="m-0 text-primary">Check-in Sonuçları</h4>
                      </div>
                      
                      <div className="row g-3">
                        {detailedData.answers.map((ans: any, idx: number) => (
                          <div key={idx} className="col-md-6">
                            <div className="card card-sm shadow-none border bg-light h-100">
                              <div className="card-body">
                                <div className="text-muted small fw-medium mb-2">{ans.label}</div>
                                <div className="fs-4 fw-bold text-dark">
                                  {ans.field_type === 'boolean' ? (
                                    ans.boolean_value ? <span className="text-success"><svg xmlns="http://www.w3.org/2000/svg" className="icon me-1" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 12l5 5l10 -10" /></svg>Evet</span> : <span className="text-danger"><svg xmlns="http://www.w3.org/2000/svg" className="icon me-1" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M18 6l-12 12" /><path d="M6 6l12 12" /></svg>Hayır</span>
                                  ) : ans.field_type === 'number' || ans.field_type === 'slider' ? (
                                    ans.numeric_value
                                  ) : (
                                    ans.text_value || ans.value
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
                        <h4 className="m-0 text-primary d-flex align-items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-md" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M9 5h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2h-2" /><path d="M9 3m0 2a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v0a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2z" /><path d="M9 14l2 2l4 -4" /></svg>
                          Anket Sonuçları
                        </h4>
                        <div className="text-end">
                          <div className="small text-muted mb-1 fw-medium text-uppercase">Toplam Puan</div>
                          <div className="fs-1 fw-bold text-dark">{detailedData.summary.total_score}</div>
                        </div>
                      </div>

                      <div className="list-group list-group-flush border rounded shadow-sm">
                        {detailedData.answers.map((ans: any, idx: number) => (
                          <div key={idx} className="list-group-item p-4 bg-white">
                            <div className="d-flex justify-content-between align-items-start gap-4">
                              <div className="flex-grow-1">
                                <div className="text-muted text-xs fw-bold text-uppercase mb-2 d-flex align-items-center gap-2">
                                  <span className="badge bg-primary-lt">Soru {idx + 1}</span>
                                </div>
                                <div className="fw-medium text-dark mb-3 fs-4">{ans.question_text}</div>
                                <div className="d-inline-flex align-items-center gap-2 px-3 py-2 bg-light rounded text-primary fw-bold border border-primary border-opacity-25">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="icon text-primary" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M8 9h8" /><path d="M8 13h6" /><path d="M18 4a3 3 0 0 1 3 3v8a3 3 0 0 1 -3 3h-5l-5 3v-3h-2a3 3 0 0 1 -3 -3v-8a3 3 0 0 1 3 -3h12z" /></svg>
                                  {ans.option_label ? ans.option_label : (ans.answer_value || '').replace(/['"]+/g, '')}
                                </div>
                              </div>
                              <div className="d-flex flex-column align-items-center justify-content-center">
                                {ans.score > 0 ? (
                                  <div className="avatar bg-success-lt text-success fw-bold border border-success border-opacity-25" title="Kazanılan Puan">+{ans.score}</div>
                                ) : (
                                  <div className="avatar bg-secondary-lt text-secondary fw-bold" title="Puan Yok">0</div>
                                )}
                                <span className="text-muted text-xs mt-1">Puan</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : selectedLog?.result_data && typeof selectedLog.result_data === 'object' ? (
                <div>
                  <h4 className="text-primary mb-3 pb-2 border-bottom">Gönderilen Yanıtlar</h4>
                  <div className="table-responsive border rounded">
                    <table className="table table-vcenter card-table table-striped mb-0">
                      <thead>
                        <tr>
                          <th>Veri / Alan</th>
                          <th>Değer / Yanıt</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(selectedLog.result_data).map(([key, value], idx) => (
                          <tr key={idx}>
                            <td className="fw-medium text-capitalize">
                              {(() => {
                                let label = key.replace(/[-_]/g, ' ');
                                if (selectedLog?.module_content?.metrics && Array.isArray(selectedLog.module_content.metrics)) {
                                  const metric = selectedLog.module_content.metrics.find((m: any) => m.id === key);
                                  if (metric && metric.name) {
                                    label = metric.name;
                                    if (metric.unit) label += ` (${metric.unit})`;
                                  }
                                }
                                return label;
                              })()}
                            </td>
                            <td>
                              {typeof value === 'boolean' 
                                ? (value ? 'Evet' : 'Hayır') 
                                : (typeof value === 'object' ? JSON.stringify(value) : String(value))
                              }
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : selectedLog?.result_data ? (
                <div>
                  <h4 className="text-primary mb-3 pb-2 border-bottom">Gönderilen Yanıtlar</h4>
                  <div className="p-3 bg-light rounded border">{String(selectedLog.result_data)}</div>
                </div>
              ) : (
                <div className="text-center text-muted py-5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon mb-2 text-secondary" width="48" height="48" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 7v4a1 1 0 0 0 1 1h3" /><path d="M7 7v10" /><path d="M10 8v8a1 1 0 0 0 1 1h2a1 1 0 0 0 1 -1v-8a1 1 0 0 0 -1 -1h-2a1 1 0 0 0 -1 1z" /><path d="M17 7v4a1 1 0 0 0 1 1h3" /><path d="M21 7v10" /></svg>
                  <p>Bu modül için gösterilecek detaylı bir veri bulunamadı.</p>
                </div>
              )}
            </div>
            <div className="modal-footer bg-light">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Kapat</button>
            </div>
          </div>
        </div>
      </div>

    </>
  );
}
