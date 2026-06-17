'use client';

import { useState, useTransition } from 'react';
import { saveQuestionnaire, deleteQuestionnaire, FormQuestion, FormOption } from '@/app/actions/forms';
import Swal from 'sweetalert2';
import { useRouter } from 'next/navigation';

interface FormBuilderClientProps {
  appId: string;
  formId: string;
  initialName: string;
  initialDescription: string;
  initialQuestions: any[];
  initialStatus?: string;
}

export default function FormBuilderClient({ 
  appId, 
  formId, 
  initialName, 
  initialDescription, 
  initialQuestions,
  initialStatus = 'draft'
}: FormBuilderClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription || '');
  const [status, setStatus] = useState(initialStatus);
  const [questions, setQuestions] = useState<FormQuestion[]>(initialQuestions);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question_type: 'single_choice',
        label: 'Yeni Soru',
        description_html: '',
        is_required: true,
        options: [
          { option_label: 'Seçenek 1', score: 0 }
        ]
      }
    ]);
  };

  const removeQuestion = (qIndex: number) => {
    setQuestions(questions.filter((_, i) => i !== qIndex));
  };

  const updateQuestion = (qIndex: number, field: keyof FormQuestion, value: any) => {
    const newQuestions = [...questions];
    newQuestions[qIndex] = { ...newQuestions[qIndex], [field]: value };
    setQuestions(newQuestions);
  };

  const addOption = (qIndex: number) => {
    const newQuestions = [...questions];
    const q = newQuestions[qIndex];
    if (!q.options) q.options = [];
    q.options.push({ option_label: `Seçenek ${q.options.length + 1}`, score: 0 });
    setQuestions(newQuestions);
  };

  const removeOption = (qIndex: number, oIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options = newQuestions[qIndex].options.filter((_, i) => i !== oIndex);
    setQuestions(newQuestions);
  };

  const updateOption = (qIndex: number, oIndex: number, field: keyof FormOption, value: any) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options[oIndex] = { ...newQuestions[qIndex].options[oIndex], [field]: value };
    setQuestions(newQuestions);
  };

  const handleSave = () => {
    if (!name.trim()) {
      Swal.fire('Hata', 'Anket adı boş olamaz.', 'error');
      return;
    }

    startTransition(async () => {
      const res = await saveQuestionnaire(appId, formId, name, description, questions, status);
      if (res?.error) {
        Swal.fire('Hata', res.error, 'error');
      } else {
        Swal.fire({
          title: 'Başarılı',
          text: 'Anket başarıyla kaydedildi.',
          icon: 'success',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000
        });
      }
    });
  };

  const handleDelete = () => {
    Swal.fire({
      title: 'Anketi Silmek İstediğinize Emin Misiniz?',
      text: "Bu anket arşivlenecek ve silinecektir. Bu işlem geri alınamaz!",
      icon: 'error',
      showCancelButton: true,
      confirmButtonColor: '#d63939',
      cancelButtonColor: '#6c7a91',
      confirmButtonText: 'Evet, Kalıcı Olarak Sil',
      cancelButtonText: 'İptal'
    }).then((result) => {
      if (result.isConfirmed) {
        startTransition(async () => {
          const res = await deleteQuestionnaire(appId, formId);
          if (res?.error) {
            Swal.fire('Hata', res.error, 'error');
          } else {
            Swal.fire('Silindi!', 'Anket başarıyla silindi.', 'success').then(() => {
              router.push(`/apps/${appId}/forms`);
            });
          }
        });
      }
    });
  };

  return (
    <div className="row g-4">
      {/* Settings Panel */}
      <div className="col-md-4 order-md-2">
        <div className="card sticky-top" style={{ top: '20px' }}>
          <div className="card-header">
            <h3 className="card-title">Anket Ayarları</h3>
          </div>
          <div className="card-body">
            <div className="mb-3">
              <label className="form-label">Anket Adı</label>
              <input 
                type="text" 
                className="form-control" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                placeholder="Örn: Depresyon Ölçeği"
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Açıklama (Opsiyonel)</label>
              <textarea 
                className="form-control" 
                rows={4} 
                value={description} 
                onChange={e => setDescription(e.target.value)}
                placeholder="Hastanın ankete başlamadan önce göreceği bilgilendirme metni."
              ></textarea>
            </div>
            <div className="mb-3">
              <label className="form-label required">Anket Durumu</label>
              <select className="form-select" value={status} onChange={e => setStatus(e.target.value)}>
                <option value="draft">Taslak (Uygulamada Görünmez)</option>
                <option value="published">Yayında (Aktif)</option>
                <option value="archived">Arşivlendi (Gizli)</option>
              </select>
            </div>
            
            <button className="btn btn-primary w-100 mt-4" onClick={handleSave} disabled={isPending}>
              {isPending ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
            </button>
          </div>
        </div>

        <div className="card shadow-sm border-danger mt-4">
          <div className="card-header bg-danger-lt text-danger">
            <h3 className="card-title">Tehlikeli Bölge</h3>
          </div>
          <div className="card-body text-center">
            <p className="text-muted">Bu anketi sildiğinizde, hastalara atanmış olan versiyonları arşivlenecektir.</p>
            <button type="button" onClick={handleDelete} className="btn btn-outline-danger w-100" disabled={isPending}>
              Anketi Tamamen Sil
            </button>
          </div>
        </div>
      </div>

      {/* Editor Panel */}
      <div className="col-md-8 order-md-1">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="m-0">Sorular ({questions.length})</h2>
          <button className="btn btn-outline-primary" onClick={addQuestion}>
            <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 5l0 14" /><path d="M5 12l14 0" /></svg>
            Yeni Soru Ekle
          </button>
        </div>

        {questions.length === 0 ? (
          <div className="card card-body text-center py-5">
            <p className="text-muted mb-0">Henüz hiç soru eklenmedi. Sağ üstteki butondan soru eklemeye başlayın.</p>
          </div>
        ) : (
          <div className="d-flex flex-column gap-4">
            {questions.map((q, qIndex) => (
              <div key={qIndex} className="card shadow-sm border-0">
                <div className="card-header bg-light d-flex gap-3 align-items-center p-3">
                  <span className="badge bg-primary text-white rounded-circle fs-4 shadow-sm" style={{width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                    {qIndex + 1}
                  </span>
                  <div className="flex-fill">
                    <textarea 
                      className="form-control form-control-lg fw-bold border-0 bg-transparent px-0 shadow-none" 
                      value={q.label} 
                      onChange={e => updateQuestion(qIndex, 'label', e.target.value)}
                      placeholder="Soru metnini girin..."
                      rows={2}
                      style={{ fontSize: '1.2rem', resize: 'vertical' }}
                    />
                  </div>
                  <div>
                    <button className="btn btn-icon btn-ghost-danger" onClick={() => removeQuestion(qIndex)} title="Soruyu Sil">
                      <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 7h16" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" /><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" /></svg>
                    </button>
                  </div>
                </div>
                
                <div className="card-body p-4">
                  <div className="row mb-4">
                    <div className="col-md-6">
                      <label className="form-label">Soru Tipi</label>
                      <select 
                        className="form-select" 
                        value={q.question_type} 
                        onChange={e => updateQuestion(qIndex, 'question_type', e.target.value)}
                      >
                        <option value="single_choice">Tekten Seçmeli (Radyo)</option>
                        <option value="multiple_choice">Çoktan Seçmeli (Onay Kutusu)</option>
                        <option value="text">Açık Uçlu (Metin)</option>
                        <option value="scale">Derecelendirme (Scale)</option>
                      </select>
                    </div>
                    <div className="col-md-6 d-flex align-items-end">
                      <label className="form-check form-switch m-0 mt-3">
                        <input 
                          className="form-check-input" 
                          type="checkbox" 
                          checked={q.is_required} 
                          onChange={e => updateQuestion(qIndex, 'is_required', e.target.checked)} 
                        />
                        <span className="form-check-label">Bu soru zorunlu olsun</span>
                      </label>
                    </div>
                  </div>

                  {(q.question_type === 'single_choice' || q.question_type === 'multiple_choice') && (
                    <div className="mt-4">
                      <label className="form-label mb-3 fw-medium text-muted">Seçenekler ve Puanlama</label>
                      <div className="d-flex flex-column gap-2">
                        {q.options?.map((opt, oIndex) => (
                          <div key={oIndex} className="d-flex gap-2 align-items-center">
                            <div className="text-muted">
                              {q.question_type === 'single_choice' ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /></svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z" /></svg>
                              )}
                            </div>
                            <input 
                              type="text" 
                              className="form-control" 
                              value={opt.option_label} 
                              onChange={e => updateOption(qIndex, oIndex, 'option_label', e.target.value)}
                              placeholder="Seçenek metni"
                            />
                            <div className="input-group" style={{ width: '250px' }}>
                              <span className="input-group-text bg-light border-end-0">Puan</span>
                              <input 
                                type="text" 
                                className="form-control" 
                                value={opt.score} 
                                onChange={e => updateOption(qIndex, oIndex, 'score', e.target.value)}
                                placeholder="0"
                              />
                            </div>
                            <button className="btn btn-icon btn-ghost-secondary" onClick={() => removeOption(qIndex, oIndex)}>
                              <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M18 6l-12 12" /><path d="M6 6l12 12" /></svg>
                            </button>
                          </div>
                        ))}
                      </div>
                      <button className="btn btn-ghost-primary mt-3 btn-sm" onClick={() => addOption(qIndex)}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 5l0 14" /><path d="M5 12l14 0" /></svg>
                        Yeni Seçenek Ekle
                      </button>
                    </div>
                  )}

                  {q.question_type === 'text' && (
                    <div className="mt-4 p-4 bg-light rounded text-muted text-center border">
                      Hastalar buraya serbest metin gireceklerdir. (Örn: "Daha iyi hissediyorum")
                    </div>
                  )}

                  {q.question_type === 'scale' && (
                    <div className="mt-4 p-4 bg-light rounded text-muted text-center border d-flex justify-content-between align-items-center px-5">
                      <span>0 (Çok Kötü)</span>
                      <div className="progress flex-fill mx-3" style={{height: '8px'}}>
                        <div className="progress-bar" style={{width: '50%'}}></div>
                      </div>
                      <span>10 (Çok İyi)</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
