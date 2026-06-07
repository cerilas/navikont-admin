'use client';

import { useState, useTransition } from 'react';
import { addJourneyStep, removeJourneyStep, updateJourneyDuration } from '@/app/actions/journeys';
import Swal from 'sweetalert2';
import SelectInput from '@/components/ui/SelectInput';

export default function JourneyBuilderClient({ journey, initialSteps, modules }: { journey: any, initialSteps: any[], modules: any[] }) {
  const [steps, setSteps] = useState(initialSteps);
  const [isPending, startTransition] = useTransition();
  
  // Standart DiGA Tedavi Süresi (Varsayılan 90, ama veritabanından gelir)
  const totalDays = journey.duration_days || 90; 
  const [activeDay, setActiveDay] = useState<number>(1);

  const handleChangeDuration = () => {
    Swal.fire({
      title: 'Akış Süresini Belirle',
      input: 'number',
      inputLabel: 'Kaç günlük bir program oluşturuyorsunuz?',
      inputValue: totalDays,
      showCancelButton: true,
      confirmButtonText: 'Kaydet',
      cancelButtonText: 'İptal',
      inputValidator: (value) => {
        if (!value || parseInt(value) <= 0) return 'Lütfen geçerli bir gün sayısı girin.';
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const newDuration = parseInt(result.value);
        startTransition(async () => {
          const res = await updateJourneyDuration(journey.id, newDuration);
          if (res.error) Swal.fire('Hata', res.error, 'error');
          else window.location.reload();
        });
      }
    });
  };

  const handleDeleteStep = (stepId: string) => {
    Swal.fire({
      title: 'Emin misiniz?',
      text: "Bu modülü gün akışından kaldırmak istiyor musunuz?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d63939',
      cancelButtonColor: '#6c7a91',
      confirmButtonText: 'Evet, Kaldır',
      cancelButtonText: 'İptal'
    }).then((result) => {
      if (result.isConfirmed) {
        startTransition(async () => {
          const formData = new FormData();
          formData.append('stepId', stepId);
          await removeJourneyStep(formData);
          setSteps(steps.filter(s => s.id !== stepId));
        });
      }
    });
  };

  const handleAddStep = async (e: React.FormEvent<HTMLFormElement>, dayNumber: number) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.append('journeyId', journey.id);
    formData.append('dayNumber', dayNumber.toString());

    startTransition(async () => {
      const res = await addJourneyStep(null, formData);
      if (res?.error) {
        Swal.fire('Hata', res.error, 'error');
      } else {
        window.location.reload();
      }
    });
  };

  const moduleOptions = modules.map(m => ({ label: `${m.name} (${m.type_name})`, value: m.id }));
  const activeDaySteps = steps.filter(s => s.day_number === activeDay).sort((a, b) => a.order_in_day - b.order_in_day);

  // Helper to check if a day has any modules
  const getDayModuleCount = (day: number) => steps.filter(s => s.day_number === day).length;

  // Generate Calendar Matrix (7 columns for weeks)
  const calendarDays = Array.from({ length: totalDays }, (_, i) => i + 1);

  return (
    <div className="journey-builder">
      <div className="row g-4">
        
        {/* Calendar Sidebar */}
        <div className="col-lg-5 col-12">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-dark text-white d-flex justify-content-between align-items-center">
              <h3 className="card-title text-white mb-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="icon me-2 text-white" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12z" /><path d="M16 3v4" /><path d="M8 3v4" /><path d="M4 11h16" /><path d="M11 15h1" /><path d="M12 15v3" /></svg>
                {totalDays} Günlük Tedavi Takvimi
              </h3>
              <button onClick={handleChangeDuration} className="btn btn-sm btn-outline-light" disabled={isPending} title="Süreyi Değiştir">
                <svg xmlns="http://www.w3.org/2000/svg" className="icon m-0" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z" /><path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /></svg>
              </button>
            </div>
            <div className="card-body p-3">
              <div className="d-flex flex-wrap gap-2 justify-content-center">
                {calendarDays.map(day => {
                  const modCount = getDayModuleCount(day);
                  const isActive = activeDay === day;
                  
                  let btnClass = "btn btn-sm ";
                  if (isActive) btnClass += "btn-primary shadow ";
                  else if (modCount > 0) btnClass += "btn-outline-primary ";
                  else btnClass += "btn-outline-secondary ";

                  return (
                    <button 
                      key={day} 
                      onClick={() => setActiveDay(day)}
                      className={btnClass}
                      style={{ width: '45px', height: '45px', padding: '0', position: 'relative' }}
                      title={`${day}. Gün`}
                    >
                      {day}
                      {modCount > 0 && (
                        <span className="badge bg-green badge-notification badge-pill" style={{ top: '-5px', right: '-5px' }}>{modCount}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Selected Day Content */}
        <div className="col-lg-7 col-12">
          <div className="card shadow-sm border-primary" style={{ borderTopWidth: '3px' }}>
            <div className="card-header">
              <h3 className="card-title text-primary fs-2">
                {activeDay}. Gün İçerikleri
              </h3>
              <div className="card-actions">
                <span className="badge bg-primary-lt px-3 py-2 fs-5">{activeDaySteps.length} Modül Atandı</span>
              </div>
            </div>
            
            <div className="card-body">
              {activeDaySteps.length === 0 ? (
                <div className="empty">
                  <div className="empty-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M9 12l2 2l4 -4" /></svg>
                  </div>
                  <p className="empty-title">Bu gün için modül yok</p>
                  <p className="empty-subtitle text-muted">Aşağıdaki formu kullanarak {activeDay}. güne bir görev veya eğitim atayabilirsiniz.</p>
                </div>
              ) : (
                <div className="list-group list-group-flush mb-4">
                  {activeDaySteps.map((step, idx) => (
                    <div key={step.id} className="list-group-item d-flex align-items-center bg-light rounded mb-2 border">
                      <span className="badge bg-primary me-3 fs-4 px-2 py-2">{idx + 1}</span>
                      <div className="flex-fill">
                        <div className="fw-bold fs-4">{step.module_name}</div>
                        <div className="text-muted mt-1 d-flex align-items-center gap-2">
                          <span className={`badge ${step.is_required ? 'bg-red-lt' : 'bg-green-lt'}`}>
                            {step.is_required ? 'Zorunlu Modül' : 'Opsiyonel'}
                          </span>
                          {step.delay_minutes > 0 && (
                            <span className="badge bg-orange-lt">
                              <svg xmlns="http://www.w3.org/2000/svg" className="icon me-1" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M12 7l0 5l3 3" /></svg>
                              {step.delay_minutes} dk gecikme
                            </span>
                          )}
                        </div>
                      </div>
                      <button onClick={() => handleDeleteStep(step.id)} className="btn btn-icon btn-outline-danger" title="Kaldır" disabled={isPending}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 7l16 0" /><path d="M10 11l0 6" /><path d="M14 11l0 6" /><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" /><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <hr />
              
              <h4 className="card-title text-muted mb-3">Yeni Modül Ekle</h4>
              <form onSubmit={(e) => handleAddStep(e, activeDay)} className="row g-3 align-items-end p-3 border rounded bg-white shadow-sm">
                <div className="col-md-12 mb-2">
                  <label className="form-label required">Modül Seç</label>
                  <SelectInput name="moduleId" options={moduleOptions} required={true} placeholder="Bu gün için kütüphaneden bir modül arayın..." />
                </div>
                
                <div className="col-md-4">
                  <label className="form-label">Gecikme (Dakika)</label>
                  <input type="number" className="form-control" name="delayMinutes" defaultValue="0" min="0" title="0 = Hemen Göster" />
                </div>
                
                <div className="col-md-4 d-flex align-items-center">
                  <label className="form-check form-switch mb-0">
                    <input className="form-check-input" type="checkbox" name="isRequired" defaultChecked />
                    <span className="form-check-label fw-bold">Zorunlu</span>
                  </label>
                </div>
                
                <div className="col-md-4">
                  <button type="submit" className="btn btn-primary w-100" disabled={isPending}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 5l0 14" /><path d="M5 12l14 0" /></svg>
                    Ekle
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
