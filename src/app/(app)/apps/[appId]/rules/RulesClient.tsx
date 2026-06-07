'use client';

import { useState, useTransition } from 'react';
import { saveOnboardingRules } from '@/app/actions/rules';
import Swal from 'sweetalert2';

interface RulesClientProps {
  appId: string;
  questionnaires: { id: string, title: string }[];
  journeys: { id: string, name: string }[];
  initialQuestionnaireId: string | null;
  initialAssignments: { min: number, max: number, journeyId: string }[];
}

export default function RulesClient({ appId, questionnaires, journeys, initialQuestionnaireId, initialAssignments }: RulesClientProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<string>(initialQuestionnaireId || '');
  const [assignments, setAssignments] = useState(initialAssignments);

  const handleAddAssignment = () => {
    setAssignments([...assignments, { min: 0, max: 10, journeyId: '' }]);
  };

  const handleRemoveAssignment = (index: number) => {
    setAssignments(assignments.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, field: string, value: string | number) => {
    const newAssignments = [...assignments];
    newAssignments[index] = { ...newAssignments[index], [field]: value };
    setAssignments(newAssignments);
  };

  const handleSave = () => {
    // Validation
    if (selectedQuestionnaire && assignments.some(a => !a.journeyId)) {
      Swal.fire('Hata', 'Lütfen tüm koşullar için bir akış seçin.', 'error');
      return;
    }

    Swal.fire({
      title: 'Kaydedilsin mi?',
      text: 'Otomasyon kuralları kaydedilecek ve hastalara uygulanmaya başlayacak.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Evet, Kaydet',
      cancelButtonText: 'İptal',
    }).then((result) => {
      if (result.isConfirmed) {
        startTransition(async () => {
          const res = await saveOnboardingRules(appId, selectedQuestionnaire || null, assignments);
          if (res?.error) {
            Swal.fire('Hata', res.error, 'error');
          } else {
            Swal.fire('Başarılı', 'Kurallar başarıyla kaydedildi.', 'success');
          }
        });
      }
    });
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Başlangıç Testi ve Koşullu Akış</h3>
      </div>
      <div className="card-body">
        <div className="mb-4">
          <label className="form-label">Başlangıç Anketi (Onboarding Testi)</label>
          <div className="text-muted mb-2 small">
            Uygulamaya yeni kayıt olan hastaların ilk çözmesi gereken anketi seçin. Test bittikten sonra aşağıdaki kurallara göre otomatik bir Akış (Journey) atanacaktır.
          </div>
          <select 
            className="form-select" 
            value={selectedQuestionnaire} 
            onChange={(e) => setSelectedQuestionnaire(e.target.value)}
          >
            <option value="">-- Anket Seçin (İptal Et) --</option>
            {questionnaires.map(q => (
              <option key={q.id} value={q.id}>{q.title}</option>
            ))}
          </select>
        </div>

        {selectedQuestionnaire && (
          <div className="mt-5">
            <h4 className="mb-3">Skor Bazlı Akış Atama Kuralları</h4>
            
            {assignments.length === 0 && (
              <div className="alert alert-warning">
                Henüz bir kural eklemediniz. Bu durumda hastalara otomatik akış atanmayacaktır.
              </div>
            )}

            {assignments.map((assignment, idx) => (
              <div key={idx} className="row g-3 align-items-end mb-3 p-3 border rounded bg-light shadow-sm">
                <div className="col-md-2">
                  <label className="form-label text-muted fw-semibold">Min Skor</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    value={assignment.min} 
                    onChange={e => handleChange(idx, 'min', parseInt(e.target.value) || 0)} 
                  />
                </div>
                <div className="col-md-2">
                  <label className="form-label text-muted fw-semibold">Max Skor</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    value={assignment.max} 
                    onChange={e => handleChange(idx, 'max', parseInt(e.target.value) || 0)} 
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted fw-semibold">Atanacak Akış (Journey)</label>
                  <select 
                    className="form-select" 
                    value={assignment.journeyId} 
                    onChange={e => handleChange(idx, 'journeyId', e.target.value)}
                  >
                    <option value="">-- Akış Seçin --</option>
                    {journeys.map(j => (
                      <option key={j.id} value={j.id}>{j.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-2">
                  <button 
                    className="btn btn-outline-danger w-100" 
                    onClick={() => handleRemoveAssignment(idx)}
                    title="Kuralı Sil"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="icon me-1" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 7h16" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" /><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" /></svg>
                    Sil
                  </button>
                </div>
              </div>
            ))}

            <button className="btn btn-outline-primary mt-2" onClick={handleAddAssignment}>
              <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 5l0 14" /><path d="M5 12l14 0" /></svg>
              Yeni Kural Ekle
            </button>
          </div>
        )}
      </div>
      <div className="card-footer text-end">
        <button className="btn btn-primary" onClick={handleSave} disabled={isPending}>
          {isPending ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
        </button>
      </div>
    </div>
  );
}
