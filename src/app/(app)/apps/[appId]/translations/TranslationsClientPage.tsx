'use client';

import React, { useState, useEffect } from 'react';
import { TranslationField } from '@/components/translations/TranslationField';
import { getTranslations, getTranslationsBatch, saveTranslations, saveTranslationsBatch } from '@/app/actions/translations';
import Swal from 'sweetalert2';

export default function TranslationsClientPage({ 
  appId, 
  appName, 
  targetLanguages,
  appInfo,
  notifications,
  modules,
  forms,
  checkins,
  consents,
  diseases,
  faqs
}: any) {
  const [activeLang, setActiveLang] = useState(targetLanguages[0]);
  const [activeTab, setActiveTab] = useState('app');
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadTranslations();
  }, [activeLang, activeTab]);

  const loadTranslations = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'app') {
        const transMap = await getTranslations('content_apps', appInfo.id, activeLang);
        setTranslations(transMap || {});
      } else if (activeTab === 'notifications') {
        if (notifications.length === 0) {
          setTranslations({});
          return;
        }
        const entityIds = notifications.map((n: any) => n.id);
        const transMap = await getTranslationsBatch('content_notification_templates', entityIds, activeLang);
        setTranslations(transMap || {});
      } else if (activeTab === 'modules') {
        if (!modules || modules.length === 0) {
          setTranslations({});
          return;
        }
        const entityIds = modules.map((m: any) => m.id);
        const transMap = await getTranslationsBatch('content_module_versions', entityIds, activeLang);
        setTranslations(transMap || {});
      } else if (activeTab === 'forms') {
        if (!forms || forms.length === 0) {
          setTranslations({});
          return;
        }
        // Fetch Questionnaire Version translations
        const versionIds = forms.map((f: any) => f.version_id);
        const versionsTransMap = await getTranslationsBatch('forms_questionnaire_versions', versionIds, activeLang);
        
        // Fetch Questions translations
        const questionIds: string[] = [];
        forms.forEach((f: any) => f.questions?.forEach((q: any) => questionIds.push(q.id)));
        let questionsTransMap = {};
        if (questionIds.length > 0) {
          questionsTransMap = await getTranslationsBatch('forms_questions', questionIds, activeLang);
        }

        // Fetch Options translations
        const optionIds: string[] = [];
        forms.forEach((f: any) => f.questions?.forEach((q: any) => q.options?.forEach((o: any) => optionIds.push(o.id))));
        let optionsTransMap = {};
        if (optionIds.length > 0) {
          optionsTransMap = await getTranslationsBatch('forms_question_options', optionIds, activeLang);
        }

        setTranslations({
          ...versionsTransMap,
          ...questionsTransMap,
          ...optionsTransMap
        });
      } else if (activeTab === 'checkins') {
        if (!checkins || checkins.length === 0) {
          setTranslations({});
          return;
        }
        const versionIds = checkins.map((c: any) => c.version_id);
        const versionsTransMap = await getTranslationsBatch('forms_checkin_template_versions', versionIds, activeLang);
        
        const fieldIds: string[] = [];
        checkins.forEach((c: any) => c.fields?.forEach((f: any) => fieldIds.push(f.id)));
        let fieldsTransMap = {};
        if (fieldIds.length > 0) {
          fieldsTransMap = await getTranslationsBatch('forms_checkin_fields', fieldIds, activeLang);
        }

        setTranslations({
          ...versionsTransMap,
          ...fieldsTransMap
        });
      } else if (activeTab === 'consents') {
        if (!consents || consents.length === 0) {
          setTranslations({});
          return;
        }
        const entityIds = consents.map((c: any) => c.id);
        const transMap = await getTranslationsBatch('core_consent_documents', entityIds, activeLang);
        setTranslations(transMap || {});
      } else if (activeTab === 'faqs') {
        if (!faqs || faqs.length === 0) {
          setTranslations({});
          return;
        }
        const entityIds = faqs.map((f: any) => f.id);
        const transMap = await getTranslationsBatch('core_faqs', entityIds, activeLang);
        setTranslations(transMap || {});
      } else if (activeTab === 'faqs') {
        const inputs = Object.entries(translations).map(([key, translatedText]) => {
          const [entityId, fieldName] = key.split(':::');
          return { entityId, fieldName, translatedText };
        });
        const res = await saveTranslationsBatch(appId, 'core_faqs', activeLang, inputs);
        handleSaveResponse(res);
      } else if (activeTab === 'diseases') {
        if (!diseases || diseases.length === 0) {
          setTranslations({});
          return;
        }
        const entityIds = diseases.map((d: any) => d.id);
        const transMap = await getTranslationsBatch('medical_diseases', entityIds, activeLang);
        setTranslations(transMap || {});
      }
    } catch (e) {
      console.error(e);
      Swal.fire({
        title: 'Hata',
        text: 'Çeviriler yüklenirken bir sorun oluştu.',
        icon: 'error',
        confirmButtonText: 'Tamam'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (activeTab === 'app') {
        const inputs = Object.entries(translations).map(([fieldName, translatedText]) => ({
          fieldName,
          translatedText
        }));

        const res = await saveTranslations(appId, 'content_apps', appInfo.id, activeLang, inputs);
        handleSaveResponse(res);
      } else if (activeTab === 'notifications') {
        const inputs = Object.entries(translations).map(([key, translatedText]) => {
          const [entityId, fieldName] = key.split(':::');
          return { entityId, fieldName, translatedText };
        });
        const res = await saveTranslationsBatch(appId, 'content_notification_templates', activeLang, inputs);
        handleSaveResponse(res);
      } else if (activeTab === 'modules') {
        const inputs = Object.entries(translations).map(([key, translatedText]) => {
          const [entityId, fieldName] = key.split(':::');
          return { entityId, fieldName, translatedText };
        });
        const res = await saveTranslationsBatch(appId, 'content_module_versions', activeLang, inputs);
        handleSaveResponse(res);
      } else if (activeTab === 'forms') {
        // We have to split the inputs into their respective tables based on whether the entityId belongs to a version, question, or option.
        const versionIds = new Set(forms.map((f: any) => f.version_id));
        const questionIds = new Set<string>();
        const optionIds = new Set<string>();
        forms.forEach((f: any) => {
          f.questions?.forEach((q: any) => {
            questionIds.add(q.id);
            q.options?.forEach((o: any) => optionIds.add(o.id));
          });
        });

        const versionInputs: any[] = [];
        const questionInputs: any[] = [];
        const optionInputs: any[] = [];

        Object.entries(translations).forEach(([key, translatedText]) => {
          const [entityId, fieldName] = key.split(':::');
          if (versionIds.has(entityId)) versionInputs.push({ entityId, fieldName, translatedText });
          else if (questionIds.has(entityId)) questionInputs.push({ entityId, fieldName, translatedText });
          else if (optionIds.has(entityId)) optionInputs.push({ entityId, fieldName, translatedText });
        });

        await saveTranslationsBatch(appId, 'forms_questionnaire_versions', activeLang, versionInputs);
        await saveTranslationsBatch(appId, 'forms_questions', activeLang, questionInputs);
        const res = await saveTranslationsBatch(appId, 'forms_question_options', activeLang, optionInputs);
        handleSaveResponse(res);
      } else if (activeTab === 'checkins') {
        const versionIds = new Set(checkins.map((c: any) => c.version_id));
        const fieldIds = new Set<string>();
        checkins.forEach((c: any) => c.fields?.forEach((f: any) => fieldIds.add(f.id)));

        const versionInputs: any[] = [];
        const fieldInputs: any[] = [];

        Object.entries(translations).forEach(([key, translatedText]) => {
          const [entityId, fieldName] = key.split(':::');
          if (versionIds.has(entityId)) versionInputs.push({ entityId, fieldName, translatedText });
          else if (fieldIds.has(entityId)) fieldInputs.push({ entityId, fieldName, translatedText });
        });

        await saveTranslationsBatch(appId, 'forms_checkin_template_versions', activeLang, versionInputs);
        const res = await saveTranslationsBatch(appId, 'forms_checkin_fields', activeLang, fieldInputs);
        handleSaveResponse(res);
      } else if (activeTab === 'consents') {
        const inputs = Object.entries(translations).map(([key, translatedText]) => {
          const [entityId, fieldName] = key.split(':::');
          return { entityId, fieldName, translatedText };
        });
        const res = await saveTranslationsBatch(appId, 'core_consent_documents', activeLang, inputs);
        handleSaveResponse(res);
      } else if (activeTab === 'faqs') {
        if (!faqs || faqs.length === 0) {
          setTranslations({});
          return;
        }
        const entityIds = faqs.map((f: any) => f.id);
        const transMap = await getTranslationsBatch('core_faqs', entityIds, activeLang);
        setTranslations(transMap || {});
      } else if (activeTab === 'diseases') {
        const inputs = Object.entries(translations).map(([key, translatedText]) => {
          const [entityId, fieldName] = key.split(':::');
          return { entityId, fieldName, translatedText };
        });
        const res = await saveTranslationsBatch(appId, 'medical_diseases', activeLang, inputs);
        handleSaveResponse(res);
      }
    } catch (e) {
      Swal.fire({
        title: 'Hata',
        text: 'Kayıt sırasında sistemsel bir hata oluştu.',
        icon: 'error',
        confirmButtonText: 'Tamam'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveResponse = (res: any) => {
    if (res.success) {
      Swal.fire({
        title: 'Başarılı',
        text: 'Çeviriler başarıyla kaydedildi!',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    } else {
      Swal.fire({
        title: 'Uyarı',
        text: res.error || 'Kaydetme sırasında bir hata oluştu.',
        icon: 'warning',
        confirmButtonText: 'Tamam'
      });
    }
  };

  const handleChange = (fieldName: string, value: string) => {
    setTranslations(prev => ({ ...prev, [fieldName]: value }));
  };

  const handleBatchChange = (entityId: string, fieldName: string, value: string) => {
    setTranslations(prev => ({ ...prev, [`${entityId}:::${fieldName}`]: value }));
  };

  const getLangName = (code: string) => {
    switch (code) {
      case 'en': return 'İngilizce (EN)';
      case 'de': return 'Almanca (DE)';
      default: return code.toUpperCase();
    }
  };

  return (
    <>
      {/* PAGE HEADER */}
      <div className="page-header d-print-none">
        <div className="container-xl">
          <div className="row g-2 align-items-center justify-content-between">
            <div className="col">
              <div className="page-pretitle">
                {appName}
              </div>
              <h2 className="page-title text-primary d-flex align-items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-language me-2" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                  <path d="M4 5h7"></path>
                  <path d="M9 3v2c0 4.418 -2.239 8 -5 8"></path>
                  <path d="M5 9c2.106 -1.996 3.974 -4.01 4.5 -7"></path>
                  <path d="M12 20l4 -9l4 9"></path>
                  <path d="M19.1 18h-6.2"></path>
                </svg>
                Çeviri Yönetimi
              </h2>
            </div>
            <div className="col-auto ms-auto d-print-none">
              <div className="d-flex align-items-center gap-2">
                <span className="text-muted fw-medium fs-5">Düzenlenen Dil:</span>
                <select 
                  value={activeLang} 
                  onChange={(e) => setActiveLang(e.target.value)}
                  className="form-select border-primary text-primary fw-semibold bg-primary-lt"
                  style={{ width: '160px' }}
                >
                  {targetLanguages.map((lang: string) => (
                    <option key={lang} value={lang}>{getLangName(lang)}</option>
                  ))}
                </select>
                <button
                  onClick={handleSave}
                  disabled={isSaving || isLoading}
                  className="btn btn-primary"
                >
                  {isSaving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Kaydediliyor
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-device-floppy" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                        <path d="M6 4h10l4 4v10a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2"></path>
                        <path d="M12 14m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"></path>
                        <path d="M14 4l0 4l-6 0l0 -4"></path>
                      </svg>
                      Kaydet
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PAGE BODY */}
      <div className="page-body">
        <div className="container-xl">
          <div className="card shadow-sm">
            <div className="card-header border-bottom-0">
              <ul className="nav nav-tabs card-header-tabs" data-bs-toggle="tabs">
                <li className="nav-item">
                  <button 
                    className={`nav-link fw-medium fs-5 px-4 ${activeTab === 'app' ? 'active' : ''}`}
                    onClick={() => setActiveTab('app')}
                  >
                    Uygulama Bilgileri
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`nav-link fw-medium fs-5 px-4 ${activeTab === 'modules' ? 'active' : ''}`}
                    onClick={() => setActiveTab('modules')}
                  >
                    Eğitim & İçerik Modülleri
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`nav-link fw-medium fs-5 px-4 ${activeTab === 'forms' ? 'active' : ''}`}
                    onClick={() => setActiveTab('forms')}
                  >
                    Anketler & Formlar
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`nav-link fw-medium fs-5 px-4 ${activeTab === 'checkins' ? 'active' : ''}`}
                    onClick={() => setActiveTab('checkins')}
                  >
                    Check-in Şablonları
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`nav-link fw-medium fs-5 px-4 ${activeTab === 'notifications' ? 'active' : ''}`}
                    onClick={() => setActiveTab('notifications')}
                  >
                    Bildirim Şablonları
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`nav-link fw-medium fs-5 px-4 ${activeTab === 'consents' ? 'active' : ''}`}
                    onClick={() => setActiveTab('consents')}
                  >
                    Sözleşmeler (KVKK vb.)
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`nav-link fw-medium fs-5 px-4 ${activeTab === 'diseases' ? 'active' : ''}`}
                    onClick={() => setActiveTab('diseases')}
                  >
                    Hastalıklar
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`nav-link fw-medium fs-5 px-4 ${activeTab === 'faqs' ? 'active' : ''}`}
                    onClick={() => setActiveTab('faqs')}
                  >
                    S.S.S.
                  </button>
                </li>
              </ul>
            </div>

            <div className="card-body" style={{ minHeight: '60vh' }}>
              {isLoading ? (
                <div className="d-flex flex-column justify-content-center align-items-center h-100 py-6 text-muted">
                  <div className="spinner-border mb-3 text-primary" role="status"></div>
                  <div className="fs-3">İçerikler yükleniyor...</div>
                </div>
              ) : (
                <div className="container-fluid p-0">
                  {activeTab === 'app' && (
                    <div className="row">
                      <div className="col-12">
                        <TranslationField 
                          label="Uygulama Adı" 
                          originalText={appInfo.name} 
                          translatedText={translations['name'] || ''} 
                          onChange={(val) => handleChange('name', val)} 
                        />
                        <div className="hr-text text-muted my-4">Diğer Alanlar</div>
                        <TranslationField 
                          label="Motto / Slogan" 
                          originalText={appInfo.motto} 
                          translatedText={translations['motto'] || ''} 
                          onChange={(val) => handleChange('motto', val)} 
                        />
                        <div className="hr-text text-muted my-4">Uzun Metinler</div>
                        <TranslationField 
                          label="Kısa Açıklama" 
                          originalText={appInfo.short_description} 
                          translatedText={translations['short_description'] || ''} 
                          onChange={(val) => handleChange('short_description', val)} 
                        />
                      </div>
                    </div>
                  )}

                  {activeTab === 'modules' && modules && modules.length > 0 && (
                    <div className="row g-4">
                      <div className="col-12">
                        <div className="alert alert-important alert-info alert-dismissible shadow-sm">
                          <div className="d-flex">
                            <div>
                              <svg xmlns="http://www.w3.org/2000/svg" className="icon alert-icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0"></path><path d="M12 9h.01"></path><path d="M11 12h1v4h1"></path></svg>
                            </div>
                            <div>
                              Aşağıda uygulamaya ait <strong>aktif modüller</strong> listelenmektedir. Modüllerin başlık ve içerik çevirileri, hastanın telefonundaki yerel dile göre gösterilecektir.
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {modules.map((mod: any) => {
                        const translateableKeys = ['html', 'videoUrl', 'descriptionHtml', 'description', 'label', 'instructions', 'startText', 'endText', 'body'];
                        let contentFields: { key: string, label: string, isHtml: boolean, originalText: string }[] = [];
                        
                        if (mod.content) {
                          const parsed = typeof mod.content === 'string' ? JSON.parse(mod.content) : mod.content;
                          for (const key of translateableKeys) {
                            if (parsed[key] && typeof parsed[key] === 'string') {
                              contentFields.push({
                                key: key,
                                label: `İçerik (${key})`,
                                isHtml: key.toLowerCase().includes('html') || key === 'instructions',
                                originalText: parsed[key]
                              });
                            }
                          }
                        }

                        return (
                          <div className="col-12" key={mod.id}>
                            <div className="card border-primary border-opacity-25 shadow-none mb-3">
                              <div className="card-header bg-primary-lt">
                                <h3 className="card-title text-primary d-flex align-items-center">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="icon me-2" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M4 4h16v16H4z" fill="none"></path><path d="M4 8h16"></path><path d="M8 4v4"></path></svg>
                                  {mod.title || 'İsimsiz Modül'}
                                  <span className="badge bg-primary text-white ms-2">{mod.module_type}</span>
                                </h3>
                              </div>
                              <div className="card-body">
                                <TranslationField 
                                  label="Modül Başlığı (Title)" 
                                  originalText={mod.title} 
                                  translatedText={translations[`${mod.id}:::title`] || ''} 
                                  onChange={(val) => handleBatchChange(mod.id, 'title', val)} 
                                />
                                <div className="mb-4"></div>
                                <TranslationField 
                                  label="Modül Alt Başlığı (Subtitle)" 
                                  originalText={mod.subtitle} 
                                  translatedText={translations[`${mod.id}:::subtitle`] || ''} 
                                  onChange={(val) => handleBatchChange(mod.id, 'subtitle', val)} 
                                />
                                
                                {contentFields.map(field => (
                                  <React.Fragment key={field.key}>
                                    <div className="mb-4"></div>
                                    <TranslationField 
                                      label={field.label} 
                                      originalText={field.originalText} 
                                      translatedText={translations[`${mod.id}:::content.${field.key}`] || ''} 
                                      onChange={(val) => handleBatchChange(mod.id, `content.${field.key}`, val)}
                                      isHtml={field.isHtml}
                                    />
                                  </React.Fragment>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {activeTab === 'modules' && (!modules || modules.length === 0) && (
                    <div className="empty">
                      <div className="empty-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-box-off text-muted" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M17.765 17.757l-5.765 3.243l-8 -4.5v-9l2.236 -1.258m2.57 -1.445l3.194 -1.797l8 4.5v8.5"></path><path d="M14.561 10.559l7.439 -4.059"></path><path d="M12 12v9"></path><path d="M12 12l-8 -4.5"></path><path d="M3 3l18 18"></path></svg>
                      </div>
                      <p className="empty-title">Modül Bulunamadı</p>
                      <p className="empty-subtitle text-muted">
                        Bu uygulama için henüz tanımlanmış aktif bir modül (Makale, Video vs.) bulunmuyor.
                      </p>
                    </div>
                  )}

                  {activeTab === 'forms' && forms && forms.length > 0 && (
                    <div className="row g-4">
                      <div className="col-12">
                        <div className="alert alert-important alert-info alert-dismissible shadow-sm">
                          <div className="d-flex">
                            <div>
                              <svg xmlns="http://www.w3.org/2000/svg" className="icon alert-icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0"></path><path d="M12 9h.01"></path><path d="M11 12h1v4h1"></path></svg>
                            </div>
                            <div>
                              Aşağıda uygulamaya ait <strong>yayınlanmış tüm anket ve formlar</strong> listelenmektedir. Form başlıklarını, soruları ve çoktan seçmeli şıkları çevirebilirsiniz.
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {forms.map((form: any) => (
                        <div className="col-12" key={form.version_id}>
                          <div className="card border-primary border-opacity-25 shadow-none mb-3">
                            <div className="card-header bg-primary-lt">
                              <h3 className="card-title text-primary d-flex align-items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="icon me-2" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M9 5h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2h-2" /><path d="M9 3m0 2a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v0a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2z" /><path d="M9 14l2 2l4 -4" /></svg>
                                {form.title || 'İsimsiz Form'}
                              </h3>
                            </div>
                            <div className="card-body">
                              <TranslationField 
                                label="Form Başlığı (Title)" 
                                originalText={form.title} 
                                translatedText={translations[`${form.version_id}:::title`] || ''} 
                                onChange={(val) => handleBatchChange(form.version_id, 'title', val)} 
                              />
                              <div className="mb-4"></div>
                              <TranslationField 
                                label="Açıklama (Description Html)" 
                                originalText={form.description_html} 
                                translatedText={translations[`${form.version_id}:::description_html`] || ''} 
                                onChange={(val) => handleBatchChange(form.version_id, 'description_html', val)} 
                                isHtml={true}
                              />
                              
                              {form.questions && form.questions.length > 0 && (
                                <div className="mt-5">
                                  <h4 className="text-muted border-bottom pb-2 mb-4">Form Soruları</h4>
                                  <div className="accordion" id={`accordion-form-${form.version_id}`}>
                                    {form.questions.map((q: any, idx: number) => (
                                      <div className="accordion-item" key={q.id}>
                                        <h2 className="accordion-header">
                                          <button className="accordion-button collapsed bg-light text-dark fw-medium" type="button" data-bs-toggle="collapse" data-bs-target={`#collapse-${q.id}`}>
                                            Soru {idx + 1}: {q.label}
                                          </button>
                                        </h2>
                                        <div id={`collapse-${q.id}`} className="accordion-collapse collapse" data-bs-parent={`#accordion-form-${form.version_id}`}>
                                          <div className="accordion-body pt-4">
                                            <TranslationField 
                                              label="Soru Metni (Label)" 
                                              originalText={q.label} 
                                              translatedText={translations[`${q.id}:::label`] || ''} 
                                              onChange={(val) => handleBatchChange(q.id, 'label', val)} 
                                            />
                                            {q.placeholder && (
                                              <>
                                                <div className="mb-4"></div>
                                                <TranslationField 
                                                  label="Yer Tutucu Metin (Placeholder)" 
                                                  originalText={q.placeholder} 
                                                  translatedText={translations[`${q.id}:::placeholder`] || ''} 
                                                  onChange={(val) => handleBatchChange(q.id, 'placeholder', val)} 
                                                />
                                              </>
                                            )}
                                            {q.options && q.options.length > 0 && (
                                              <div className="mt-4 p-3 bg-light rounded border">
                                                <h5 className="mb-3 text-muted">Çoktan Seçmeli Şıklar</h5>
                                                {q.options.map((opt: any) => (
                                                  <div className="mb-3" key={opt.id}>
                                                    <TranslationField 
                                                      label="Şık" 
                                                      originalText={opt.label} 
                                                      translatedText={translations[`${opt.id}:::label`] || ''} 
                                                      onChange={(val) => handleBatchChange(opt.id, 'label', val)} 
                                                    />
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {activeTab === 'forms' && (!forms || forms.length === 0) && (
                    <div className="empty">
                      <div className="empty-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-clipboard-text text-muted" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M9 5h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2h-2" /><path d="M9 3m0 2a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v0a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2z" /><path d="M9 12h6" /><path d="M9 16h6" /></svg>
                      </div>
                      <p className="empty-title">Form Bulunamadı</p>
                      <p className="empty-subtitle text-muted">
                        Bu uygulama için henüz yayınlanmış aktif bir anket veya form bulunmuyor.
                      </p>
                    </div>
                  )}

                  {activeTab === 'checkins' && checkins && checkins.length > 0 && (
                    <div className="row g-4">
                      <div className="col-12">
                        <div className="alert alert-important alert-info alert-dismissible shadow-sm">
                          <div className="d-flex">
                            <div>
                              <svg xmlns="http://www.w3.org/2000/svg" className="icon alert-icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0"></path><path d="M12 9h.01"></path><path d="M11 12h1v4h1"></path></svg>
                            </div>
                            <div>
                              Aşağıda uygulamaya ait <strong>yayınlanmış tüm Check-in şablonları</strong> listelenmektedir. Check-in başlıklarını ve metrik isimlerini (sorularını) çevirebilirsiniz.
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {checkins.map((chk: any) => (
                        <div className="col-12" key={chk.version_id}>
                          <div className="card border-primary border-opacity-25 shadow-none mb-3">
                            <div className="card-header bg-primary-lt">
                              <h3 className="card-title text-primary d-flex align-items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="icon me-2" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M9 11l3 3l8 -8" /><path d="M20 12v6a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h9" /></svg>
                                {chk.title || 'İsimsiz Check-in'}
                              </h3>
                            </div>
                            <div className="card-body">
                              <TranslationField 
                                label="Check-in Başlığı (Title)" 
                                originalText={chk.title} 
                                translatedText={translations[`${chk.version_id}:::title`] || ''} 
                                onChange={(val) => handleBatchChange(chk.version_id, 'title', val)} 
                              />
                              
                              {chk.fields && chk.fields.length > 0 && (
                                <div className="mt-5">
                                  <h4 className="text-muted border-bottom pb-2 mb-4">Check-in Metrikleri (Alanlar)</h4>
                                  <div className="row g-3">
                                    {chk.fields.map((f: any) => (
                                      <div className="col-12 col-lg-6" key={f.id}>
                                        <div className="p-3 bg-light rounded border h-100">
                                          <div className="mb-2 fw-medium text-dark d-flex align-items-center">
                                            <span className="badge bg-secondary text-white me-2">{f.field_type}</span>
                                          </div>
                                          <TranslationField 
                                            label="Soru / Metrik (Label)" 
                                            originalText={f.label} 
                                            translatedText={translations[`${f.id}:::label`] || ''} 
                                            onChange={(val) => handleBatchChange(f.id, 'label', val)} 
                                          />
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === 'checkins' && (!checkins || checkins.length === 0) && (
                    <div className="empty">
                      <div className="empty-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-checkbox text-muted" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M9 11l3 3l8 -8" /><path d="M20 12v6a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h9" /></svg>
                      </div>
                      <p className="empty-title">Check-in Bulunamadı</p>
                      <p className="empty-subtitle text-muted">
                        Bu uygulama için henüz yayınlanmış aktif bir check-in şablonu bulunmuyor.
                      </p>
                    </div>
                  )}

                  {activeTab === 'notifications' && notifications.length > 0 && (
                    <div className="row g-4">
                      <div className="col-12">
                        <div className="alert alert-important alert-info alert-dismissible shadow-sm">
                          <div className="d-flex">
                            <div>
                              <svg xmlns="http://www.w3.org/2000/svg" className="icon alert-icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0"></path><path d="M12 9h.01"></path><path d="M11 12h1v4h1"></path></svg>
                            </div>
                            <div>
                              Aşağıda uygulamaya ait <strong>tüm</strong> bildirim şablonları listelenmektedir. Hastanın cihaz diline göre buradaki çeviriler kullanılacaktır.
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {notifications.map((notif: any) => (
                        <div className="col-12" key={notif.id}>
                          <div className="card border-primary border-opacity-25 shadow-none mb-3">
                            <div className="card-header bg-primary-lt">
                              <h3 className="card-title text-primary d-flex align-items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="icon me-2" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M10 5a2 2 0 1 1 4 0a7 7 0 0 1 4 6v3a4 4 0 0 0 2 3h-16a4 4 0 0 0 2 -3v-3a7 7 0 0 1 4 -6"></path><path d="M9 17v1a3 3 0 0 0 6 0v-1"></path></svg>
                                Şablon Kodu: {notif.code}
                              </h3>
                            </div>
                            <div className="card-body">
                              <TranslationField 
                                label="Bildirim Başlığı (Title)" 
                                originalText={notif.title_template} 
                                translatedText={translations[`${notif.id}:::title_template`] || ''} 
                                onChange={(val) => handleBatchChange(notif.id, 'title_template', val)} 
                              />
                              <div className="mb-4"></div>
                              <TranslationField 
                                label="Bildirim Metni (Body)" 
                                originalText={notif.body_template} 
                                translatedText={translations[`${notif.id}:::body_template`] || ''} 
                                onChange={(val) => handleBatchChange(notif.id, 'body_template', val)} 
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {activeTab === 'notifications' && notifications.length === 0 && (
                    <div className="empty">
                      <div className="empty-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-bell-off text-muted" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                          <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                          <path d="M9.346 5.353c.21 -.124 .44 -.23 .684 -.318a2 2 0 1 1 3.94 0a7 7 0 0 1 4.03 5.965l.004 .328v3a4 4 0 0 0 1.64 3.146m-3.644 .354h-12a4 4 0 0 0 2 -3v-3a6.994 6.994 0 0 1 1.127 -3.797"></path>
                          <path d="M9 17v1a3 3 0 0 0 6 0v-1"></path>
                          <path d="M3 3l18 18"></path>
                        </svg>
                      </div>
                      <p className="empty-title">Bildirim Şablonu Bulunamadı</p>
                      <p className="empty-subtitle text-muted">
                        Bu uygulama için tanımlanmış herhangi bir bildirim şablonu bulunmamaktadır. Akış veya sistem kuralları üzerinden yeni bildirim şablonları ekleyebilirsiniz.
                      </p>
                    </div>
                  )}

                  {activeTab === 'consents' && consents && consents.length > 0 && (
                    <div className="row g-4">
                      <div className="col-12">
                        <div className="alert alert-important alert-info alert-dismissible shadow-sm">
                          <div className="d-flex">
                            <div>
                              <svg xmlns="http://www.w3.org/2000/svg" className="icon alert-icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0"></path><path d="M12 9h.01"></path><path d="M11 12h1v4h1"></path></svg>
                            </div>
                            <div>
                              Aşağıda sistemdeki <strong>Onam ve Sözleşme belgeleri (Aydınlatma Metni, KVKK vb.)</strong> listelenmektedir. Bunlar tüm uygulamalar için ortaktır (Global). Çeviriler anında geçerli olacaktır.
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {consents.map((doc: any) => (
                        <div className="col-12" key={doc.id}>
                          <div className="card border-primary border-opacity-25 shadow-none mb-3">
                            <div className="card-header bg-primary-lt">
                              <h3 className="card-title text-primary d-flex align-items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="icon me-2" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" /><path d="M9 15h6" /><path d="M9 11h6" /></svg>
                                {doc.title}
                              </h3>
                            </div>
                            <div className="card-body">
                              <TranslationField 
                                label="Belge Başlığı" 
                                originalText={doc.title} 
                                translatedText={translations[`${doc.id}:::title`] || ''} 
                                onChange={(val) => handleBatchChange(doc.id, 'title', val)} 
                              />
                              <div className="mb-4"></div>
                              <TranslationField 
                                label="Sözleşme İçeriği (HTML)" 
                                originalText={doc.content_html} 
                                translatedText={translations[`${doc.id}:::content_html`] || ''} 
                                onChange={(val) => handleBatchChange(doc.id, 'content_html', val)} 
                                isHtml={true}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === 'diseases' && diseases && diseases.length > 0 && (
                    <div className="row g-4">
                      <div className="col-12">
                        <div className="alert alert-important alert-info alert-dismissible shadow-sm">
                          <div className="d-flex">
                            <div>
                              <svg xmlns="http://www.w3.org/2000/svg" className="icon alert-icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0"></path><path d="M12 9h.01"></path><path d="M11 12h1v4h1"></path></svg>
                            </div>
                            <div>
                              Aşağıda sistemdeki <strong>Hastalık listesi</strong> yer almaktadır. Hastalar uygulamaya kayıt olurken ekranda listelenecek olan tıbbi isimleri çevirebilirsiniz. (Global)
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="col-12">
                        <div className="card shadow-none">
                          <div className="card-body p-0">
                            <div className="list-group list-group-flush">
                              {diseases.map((dis: any) => (
                                <div className="list-group-item p-4" key={dis.id}>
                                  <div className="row align-items-center">
                                    <div className="col-12 col-md-4 mb-3 mb-md-0 fw-medium text-dark d-flex align-items-center">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="icon text-primary me-2" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 4l-.001 5.001" /><path d="M12 13l0 7" /><path d="M9 7l6 0" /><path d="M9 16l6 0" /><path d="M6 12l12 0" /></svg>
                                      {dis.name}
                                    </div>
                                    <div className="col-12 col-md-8">
                                      <TranslationField 
                                        label="Çeviri" 
                                        originalText={dis.name} 
                                        translatedText={translations[`${dis.id}:::name`] || ''} 
                                        onChange={(val) => handleBatchChange(dis.id, 'name', val)} 
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'faqs' && faqs && faqs.length > 0 && (
                    <div className="row g-4">
                      <div className="col-12">
                        <div className="alert alert-important alert-info alert-dismissible shadow-sm">
                          <div className="d-flex">
                            <div>
                              <svg xmlns="http://www.w3.org/2000/svg" className="icon alert-icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0"></path><path d="M12 9h.01"></path><path d="M11 12h1v4h1"></path></svg>
                            </div>
                            <div>
                              Aşağıda sistemdeki <strong>Sıkça Sorulan Sorular (S.S.S.)</strong> yer almaktadır. Hastalar uygulamaya kayıt olurken ekranda listelenecek olan soru ve cevapları çevirebilirsiniz.
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {faqs.map((faq: any) => (
                        <div className="col-12" key={faq.id}>
                          <div className="card border-primary border-opacity-25 shadow-none mb-3">
                            <div className="card-header bg-primary-lt">
                              <h3 className="card-title text-primary d-flex align-items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="icon me-2" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 20l1.3 -3.9a9 8 0 1 1 3.4 2.9l-4.7 1"/><line x1="12" y1="12" x2="12" y2="12.01"/><path d="M12 8a2 2 0 0 1 2 2c0 1 -1.5 1.5 -1.5 2"/></svg>
                                SSS Çevirisi
                              </h3>
                            </div>
                            <div className="card-body">
                              <TranslationField 
                                label="Soru" 
                                originalText={faq.question} 
                                translatedText={translations[`${faq.id}:::question`] || ''} 
                                onChange={(val) => handleBatchChange(faq.id, 'question', val)} 
                              />
                              <div className="mb-4"></div>
                              <TranslationField 
                                label="Cevap" 
                                originalText={faq.answer} 
                                translatedText={translations[`${faq.id}:::answer`] || ''} 
                                onChange={(val) => handleBatchChange(faq.id, 'answer', val)} 
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
