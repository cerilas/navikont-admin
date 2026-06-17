'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { saveModuleContent } from '@/app/actions/modules';
import Swal from 'sweetalert2';

// Import Module Forms
import VideoForm from '@/components/modules/VideoForm';
import TextForm from '@/components/modules/TextForm';
import PdfForm from '@/components/modules/PdfForm';
import QuizForm from '@/components/modules/QuizForm';
import MeasurementForm from '@/components/modules/MeasurementForm';
import GenericForm from '@/components/modules/GenericForm';
import BreathingForm from '@/components/modules/BreathingForm';
import TimerForm from '@/components/modules/TimerForm';
import CheckinForm from '@/components/modules/CheckinForm';
import DiaryForm from '@/components/modules/DiaryForm';
import GoalForm from '@/components/modules/GoalForm';
import ReminderForm from '@/components/modules/ReminderForm';
import ConsentForm from '@/components/modules/ConsentForm';
import RiskAlertForm from '@/components/modules/RiskAlertForm';
import TaskForm from '@/components/modules/TaskForm';
import QuestionnaireForm from '@/components/modules/QuestionnaireForm';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary" disabled={pending}>
      {pending ? 'Kaydediliyor...' : 'İçeriği Taslak Olarak Kaydet'}
    </button>
  );
}

export default function ContentFormClient({ appId, moduleId, moduleType, existingVersion, availableModules, availableForms }: any) {
  const [state, formAction] = useActionState(async (prevState: any, formData: FormData) => {
    const res = await saveModuleContent(prevState, formData);
    if (res?.success) {
      Swal.fire({
        title: 'Başarılı!',
        text: res.message,
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
    }
    return res;
  }, null);

  // Unified State Object for all module types
  const [contentObj, setContentObj] = useState<any>(existingVersion?.content || {});

  const handleCopyJson = () => {
    const payload = JSON.stringify(contentObj, null, 2);
    navigator.clipboard.writeText(payload);
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Canlı JSON kopyalandı!',
      showConfirmButton: false,
      timer: 2000
    });
  };

  const type = moduleType?.toLocaleLowerCase('tr-TR') || '';

  // Routing Logic
  let ActiveForm;
  if (type.includes('video')) ActiveForm = VideoForm;
  else if (type.includes('yazılı içerik') || type.includes('makale') || type.includes('html_content')) ActiveForm = TextForm;
  else if (type.includes('dosya') || type.includes('pdf') || type.includes('file_pdf')) ActiveForm = PdfForm;
  else if (type.includes('soru-cevap') || type.includes('question_answer')) ActiveForm = (props: any) => <QuestionnaireForm {...props} availableForms={availableForms} />;
  else if (type.includes('quiz') || type.includes('test')) ActiveForm = QuizForm;
  else if (type.includes('ölçüm') || type.includes('measurement_input')) ActiveForm = MeasurementForm;
  else if (type.includes('nefes') || type.includes('breathing')) ActiveForm = BreathingForm;
  else if (type.includes('sayaç') || type.includes('timer')) ActiveForm = TimerForm;
  else if (type.includes('checkin') || type.includes('check-in')) ActiveForm = CheckinForm;
  else if (type.includes('günlük') || type.includes('diary')) ActiveForm = DiaryForm;
  else if (type.includes('hedef') || type.includes('goal')) ActiveForm = GoalForm;
  else if (type.includes('hatırlatıcı') || type.includes('reminder')) ActiveForm = ReminderForm;
  else if (type.includes('onam') || type.includes('consent')) ActiveForm = ConsentForm;
  else if (type.includes('risk') || type.includes('risk_alert')) ActiveForm = (props: any) => <RiskAlertForm {...props} availableModules={availableModules} />;
  else if (type.includes('görev') || type.includes('task')) ActiveForm = TaskForm;
  else ActiveForm = GenericForm;

  return (
    <div className="row g-4">
      <div className="col-lg-8 col-12">
        <form action={formAction}>
          <input type="hidden" name="appId" value={appId} />
          <input type="hidden" name="moduleId" value={moduleId} />
          
          {/* We stringify the entire complex object into a single JSON string payload to save via Server Action */}
          <input type="hidden" name="content" value={JSON.stringify(contentObj)} />

          {state?.error && (
            <div className="alert alert-danger" role="alert">
              {state.error}
            </div>
          )}

      <div className="mb-3">
        <label className="form-label required">Başlık (Uygulamada Görünecek)</label>
        <input type="text" className="form-control" name="title" defaultValue={existingVersion?.title || ''} required placeholder="Örn: Hipertansiyona Giriş" />
      </div>

      <div className="mb-4">
        <label className="form-label">Alt Başlık (Opsiyonel)</label>
        <input type="text" className="form-control" name="subtitle" defaultValue={existingVersion?.subtitle || ''} placeholder="Kısa bir alt başlık..." />
      </div>

          <ActiveForm 
            appId={appId}
            initialData={contentObj} 
            onChange={setContentObj} 
            moduleName={moduleType} 
          />

          <div className="mt-4 border-top pt-3">
            <div className="d-flex justify-content-between align-items-center">
              <small className="text-muted">Bu form içeriği JSON olarak DiGA mimarisine uygun kaydedilir.</small>
              <SubmitButton />
            </div>
          </div>
        </form>
      </div>

      <div className="col-lg-4 col-12">
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-primary text-white" style={{ borderTopLeftRadius: '4px', borderTopRightRadius: '4px' }}>
            <h3 className="card-title text-white d-flex align-items-center mb-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="icon me-3 text-white" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M13 3l0 7l6 0l-8 11l0 -7l-6 0l8 -11" /></svg>
              İçerik Bilgisi
            </h3>
          </div>
          <div className="card-body">
            <div className="mb-4">
              <div className="text-muted mb-1 text-uppercase fw-bold" style={{fontSize: '11px', letterSpacing: '0.5px'}}>Seçili Modül Tipi</div>
              <div className="fs-3 fw-bold text-primary">{moduleType}</div>
            </div>
            
            <div className="alert alert-primary bg-primary-lt mb-4" style={{ border: 'none' }}>
              <div className="d-flex align-items-start">
                <div className="me-3 mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon alert-icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" /><path d="M12 9h.01" /><path d="M11 12h1v4h1" /></svg>
                </div>
                <div>
                  Şu an bu modül için <strong>{moduleType}</strong> formunu dolduruyorsunuz. İçerikleriniz DiGA mimarisi için otomatik olarak <span className="badge bg-primary text-white ms-1">JSON</span> formatına çevrilip versiyonlanarak kaydedilir.
                </div>
              </div>
            </div>

            <button type="button" className="btn btn-outline-primary w-100 fw-bold" onClick={handleCopyJson}>
              <svg xmlns="http://www.w3.org/2000/svg" className="icon me-2" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M9 5h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2h-2" /><path d="M9 3m0 2a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v0a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2z" /></svg>
              Canlı JSON Olarak Kopyala
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
