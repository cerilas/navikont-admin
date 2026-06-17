'use client';

import { useState, useTransition } from 'react';
import { 
  saveNotificationTemplate, 
  deleteNotificationTemplate, 
  toggleNotificationTemplateStatus,
  sendNotificationToAll,
  NotificationTemplateInput 
} from '@/app/actions/notifications';
import Swal from 'sweetalert2';

interface Template {
  id?: string;
  code: string;
  channel: 'push' | 'sms' | 'email' | 'in_app';
  title_template: string;
  body_template: string;
  variables: string[];
  is_active: boolean;
}

interface NotificationHistoryItem {
  batch_id: string;
  template_id: string;
  template_code: string;
  channel: string;
  sent_at: string;
  total_sent: string | number;
  total_read: string | number;
}

interface NotificationsClientProps {
  appId: string;
  initialTemplates: Template[];
  initialHistory?: NotificationHistoryItem[];
}

export default function NotificationsClient({ appId, initialTemplates, initialHistory = [] }: NotificationsClientProps) {
  const [activeTab, setActiveTab] = useState<'templates' | 'history'>('templates');
  const [templates, setTemplates] = useState<Template[]>(initialTemplates);
  const [history, setHistory] = useState<NotificationHistoryItem[]>(initialHistory);
  const [isPending, startTransition] = useTransition();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChannelFilter, setSelectedChannelFilter] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  // Form State
  const [formCode, setFormCode] = useState('');
  const [formChannel, setFormChannel] = useState<'push' | 'sms' | 'email' | 'in_app'>('push');
  const [formTitle, setFormTitle] = useState('');
  const [formBody, setFormBody] = useState('');
  const [formVariablesStr, setFormVariablesStr] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);

  // Open Modal for Create
  const handleOpenCreateModal = () => {
    setEditingTemplate(null);
    setFormCode('');
    setFormChannel('push');
    setFormTitle('');
    setFormBody('');
    setFormVariablesStr('patient_name');
    setFormIsActive(true);
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEditModal = (template: Template) => {
    setEditingTemplate(template);
    setFormCode(template.code);
    setFormChannel(template.channel);
    setFormTitle(template.title_template || '');
    setFormBody(template.body_template);
    setFormVariablesStr(template.variables.join(', '));
    setFormIsActive(template.is_active);
    setIsModalOpen(true);
  };

  // Close Modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTemplate(null);
  };

  // Handle Save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formCode.trim()) {
      Swal.fire('Hata', 'Lütfen benzersiz bir şablon kodu giriniz.', 'error');
      return;
    }
    if (!formBody.trim()) {
      Swal.fire('Hata', 'Lütfen bildirim gövde şablonunu giriniz.', 'error');
      return;
    }

    const variablesArr = formVariablesStr
      .split(',')
      .map(v => v.trim())
      .filter(Boolean);

    const inputData: NotificationTemplateInput = {
      id: editingTemplate?.id,
      code: formCode,
      channel: formChannel,
      title_template: formTitle,
      body_template: formBody,
      variables: variablesArr,
      is_active: formIsActive
    };

    startTransition(async () => {
      const res = await saveNotificationTemplate(appId, inputData);
      if (res.error) {
        Swal.fire('Hata', res.error, 'error');
      } else {
        Swal.fire('Başarılı', 'Bildirim şablonu başarıyla kaydedildi.', 'success');
        if (editingTemplate?.id) {
          setTemplates(prev => prev.map(t => t.id === editingTemplate.id ? { ...t, ...inputData } : t));
        } else {
          window.location.reload();
        }
        handleCloseModal();
      }
    });
  };

  // Handle Delete
  const handleDelete = (templateId: string, code: string) => {
    Swal.fire({
      title: 'Şablonu silmek istediğinize emin misiniz?',
      text: `'${code}' kodlu bildirim şablonu kalıcı olarak silinecektir!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Evet, Sil',
      cancelButtonText: 'Vazgeç'
    }).then((result) => {
      if (result.isConfirmed) {
        startTransition(async () => {
          const res = await deleteNotificationTemplate(appId, templateId);
          if (res.error) {
            Swal.fire('Hata', res.error, 'error');
          } else {
            Swal.fire('Silindi', 'Şablon başarıyla silindi.', 'success');
            setTemplates(prev => prev.filter(t => t.id !== templateId));
          }
        });
      }
    });
  };

  // Handle Status Toggle
  const handleToggleStatus = async (templateId: string, currentStatus: boolean, code: string) => {
    const nextStatus = !currentStatus;
    startTransition(async () => {
      const res = await toggleNotificationTemplateStatus(appId, templateId, nextStatus);
      if (res.error) {
        Swal.fire('Hata', res.error, 'error');
      } else {
        setTemplates(prev => prev.map(t => t.id === templateId ? { ...t, is_active: nextStatus } : t));
        const statusText = nextStatus ? 'aktif' : 'pasif';
        Swal.fire({
          title: 'Durum Güncellendi',
          text: `'${code}' şablonu ${statusText} hale getirildi.`,
          icon: 'success',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 2000
        });
      }
    });
  };

  // Handle Send to All
  const handleSendToAll = (templateId: string, code: string) => {
    Swal.fire({
      title: 'Tüm Kullanıcılara Bildirim Gönder',
      text: `'${code}' şablonunu kullanan bir bildirim uygulamaya kayıtlı tüm kullanıcılara gönderilecektir. Devam etmek istiyor musunuz?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Evet, Devam Et',
      cancelButtonText: 'İptal',
      confirmButtonColor: '#3085d6',
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Son Onay!',
          text: 'Bu işlem geri alınamaz. Binlerce kişiye aynı anda bildirim gidebilir. Son kez onaylıyor musunuz?',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          cancelButtonColor: '#3085d6',
          confirmButtonText: 'Evet, Kesinlikle Gönder',
          cancelButtonText: 'Vazgeç'
        }).then((finalResult) => {
          if (finalResult.isConfirmed) {
            startTransition(async () => {
              const res = await sendNotificationToAll(appId, templateId);
              if (res.error) {
                Swal.fire('Hata', res.error, 'error');
              } else {
                Swal.fire('Başarılı', 'Bildirimler veritabanına başarıyla eklendi.', 'success');
                // Reload to fetch updated history
                window.location.reload();
              }
            });
          }
        });
      }
    });
  };

  // Filter templates based on search and channel tab selection
  const filteredTemplates = templates.filter(t => {
    const matchesSearch = t.code.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.body_template.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (t.title_template && t.title_template.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesChannel = selectedChannelFilter === 'all' || t.channel === selectedChannelFilter;
    return matchesSearch && matchesChannel;
  });

  const getChannelBadgeClass = (channel: string) => {
    switch (channel) {
      case 'push': return 'badge bg-blue text-blue-fg';
      case 'sms': return 'badge bg-green text-green-fg';
      case 'email': return 'badge bg-purple text-purple-fg';
      case 'in_app': return 'badge bg-yellow text-yellow-fg';
      default: return 'badge bg-secondary';
    }
  };

  const getChannelLabel = (channel: string) => {
    switch (channel) {
      case 'push': return 'Push Bildirim';
      case 'sms': return 'SMS';
      case 'email': return 'E-posta';
      case 'in_app': return 'Uygulama İçi (In-App)';
      default: return channel;
    }
  };

  return (
    <div className="card shadow-sm">
      <div className="card-header bg-transparent border-bottom-0 pt-4 pb-2 px-4 d-flex justify-content-center justify-content-md-start">
        <div className="bg-light p-1 rounded-3 d-inline-flex border">
          <ul className="nav nav-pills" data-bs-toggle="tabs">
            <li className="nav-item m-0">
              <button 
                className={`nav-link rounded-2 fw-semibold px-4 py-2 d-flex align-items-center transition-all ${activeTab === 'templates' ? 'active shadow-sm bg-white text-primary border' : 'text-muted border border-transparent'}`}
                onClick={() => setActiveTab('templates')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="icon me-2" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 4m0 1a1 1 0 0 1 1 -1h14a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-14a1 1 0 0 1 -1 -1z" /><path d="M4 12m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v6a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z" /><path d="M14 12l6 0" /><path d="M14 16l6 0" /><path d="M14 20l6 0" /></svg>
                Şablonlar
              </button>
            </li>
            <li className="nav-item m-0 ms-1">
              <button 
                className={`nav-link rounded-2 fw-semibold px-4 py-2 d-flex align-items-center transition-all ${activeTab === 'history' ? 'active shadow-sm bg-white text-primary border' : 'text-muted border border-transparent'}`}
                onClick={() => setActiveTab('history')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="icon me-2" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 8l0 4l2 2" /><path d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5" /></svg>
                Gönderilen Bildirimler
              </button>
            </li>
          </ul>
        </div>
      </div>

      {activeTab === 'templates' && (
        <>
          <div className="card-header d-flex justify-content-between align-items-center bg-white py-3 border-top">
            <h3 className="card-title fw-bold">Kayıtlı Bildirim Şablonları</h3>
            <button className="btn btn-primary" onClick={handleOpenCreateModal}>
              <svg xmlns="http://www.w3.org/2000/svg" className="icon me-2" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 5l0 14" /><path d="M5 12l14 0" /></svg>
              Yeni Şablon Ekle
            </button>
          </div>

          {/* Filter and Search Bar */}
          <div className="card-body border-bottom bg-light py-3">
            <div className="row g-3">
              <div className="col-md-8">
                <div className="btn-group w-100 w-md-auto" role="group">
                  <button 
                    type="button" 
                    className={`btn ${selectedChannelFilter === 'all' ? 'btn-primary' : 'btn-white'}`}
                    onClick={() => setSelectedChannelFilter('all')}
                  >
                    Tümü
                  </button>
                  <button 
                    type="button" 
                    className={`btn ${selectedChannelFilter === 'push' ? 'btn-primary' : 'btn-white'}`}
                    onClick={() => setSelectedChannelFilter('push')}
                  >
                    Push
                  </button>
                  <button 
                    type="button" 
                    className={`btn ${selectedChannelFilter === 'sms' ? 'btn-primary' : 'btn-white'}`}
                    onClick={() => setSelectedChannelFilter('sms')}
                  >
                    SMS
                  </button>
                  <button 
                    type="button" 
                    className={`btn ${selectedChannelFilter === 'email' ? 'btn-primary' : 'btn-white'}`}
                    onClick={() => setSelectedChannelFilter('email')}
                  >
                    E-posta
                  </button>
                  <button 
                    type="button" 
                    className={`btn ${selectedChannelFilter === 'in_app' ? 'btn-primary' : 'btn-white'}`}
                    onClick={() => setSelectedChannelFilter('in_app')}
                  >
                    In-App
                  </button>
                </div>
              </div>
              <div className="col-md-4">
                <div className="input-icon">
                  <span className="input-icon-addon">
                    <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" /><path d="M21 21l-6 -6" /></svg>
                  </span>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Şablon kodu veya metin ara..." 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Templates Table */}
          <div className="table-responsive">
            <table className="table table-vcenter table-mobile-md card-table table-hover">
              <thead>
                <tr>
                  <th>Şablon Kodu</th>
                  <th>Kanal</th>
                  <th>Başlık Şablonu</th>
                  <th>Gövde Şablonu</th>
                  <th>Değişkenler</th>
                  <th>Durum</th>
                  <th className="w-1 text-end">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filteredTemplates.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-4 text-muted">
                      Kayıtlı bildirim şablonu bulunamadı.
                    </td>
                  </tr>
                ) : (
                  filteredTemplates.map(template => (
                    <tr key={template.id}>
                      <td data-label="Şablon Kodu">
                        <span className="font-monospace fw-bold text-dark">{template.code}</span>
                      </td>
                      <td data-label="Kanal">
                        <span className={getChannelBadgeClass(template.channel)}>
                          {getChannelLabel(template.channel)}
                        </span>
                      </td>
                      <td data-label="Başlık Şablonu">
                        <span className="text-muted small">{template.title_template || '-'}</span>
                      </td>
                      <td data-label="Gövde Şablonu">
                        <div className="text-wrap" style={{ maxWidth: '300px' }}>
                          {template.body_template}
                        </div>
                      </td>
                      <td data-label="Değişkenler">
                        <div className="d-flex flex-wrap gap-1">
                          {template.variables.length === 0 ? (
                            <span className="text-muted small">Yok</span>
                          ) : (
                            template.variables.map(v => (
                              <span key={v} className="badge bg-secondary-lt font-monospace small">{v}</span>
                            ))
                          )}
                        </div>
                      </td>
                      <td data-label="Durum">
                        <label className="form-check form-switch m-0">
                          <input 
                            className="form-check-input cursor-pointer" 
                            type="checkbox" 
                            checked={template.is_active}
                            onChange={() => handleToggleStatus(template.id!, template.is_active, template.code)}
                            disabled={isPending}
                          />
                          <span className={`form-check-label small ${template.is_active ? 'text-success fw-semibold' : 'text-danger'}`}>
                            {template.is_active ? 'Aktif' : 'Pasif'}
                          </span>
                        </label>
                      </td>
                      <td className="text-end">
                        <div className="btn-list flex-nowrap justify-content-end">
                          <button 
                            className="btn btn-outline-success btn-sm"
                            onClick={() => handleSendToAll(template.id!, template.code)}
                            disabled={isPending || !template.is_active}
                            title="Tüm kullanıcılara gönder"
                          >
                            Gönder
                          </button>
                          <button 
                            className="btn btn-white btn-sm"
                            onClick={() => handleOpenEditModal(template)}
                            disabled={isPending}
                          >
                            Duzenle
                          </button>
                          <button 
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => handleDelete(template.id!, template.code)}
                            disabled={isPending}
                          >
                            Sil
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === 'history' && (
        <div className="table-responsive border-top">
          <table className="table table-vcenter table-mobile-md card-table table-hover">
            <thead>
              <tr>
                <th>Gönderim Tarihi</th>
                <th>Şablon Kodu</th>
                <th>Kanal</th>
                <th className="text-end">Toplam Gönderilen</th>
                <th className="text-end">Toplam Okunan</th>
                <th className="text-end">Okunma Oranı</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-muted">
                    Henüz gönderilmiş toplu bildirim bulunmuyor.
                  </td>
                </tr>
              ) : (
                history.map((item) => {
                  const sent = Number(item.total_sent) || 0;
                  const read = Number(item.total_read) || 0;
                  const rate = sent > 0 ? Math.round((read / sent) * 100) : 0;
                  return (
                    <tr key={item.batch_id}>
                      <td data-label="Gönderim Tarihi">
                        {new Date(item.sent_at).toLocaleString('tr-TR')}
                      </td>
                      <td data-label="Şablon Kodu">
                        <span className="font-monospace fw-bold">{item.template_code}</span>
                      </td>
                      <td data-label="Kanal">
                        <span className={getChannelBadgeClass(item.channel)}>
                          {getChannelLabel(item.channel)}
                        </span>
                      </td>
                      <td data-label="Toplam Gönderilen" className="text-end fw-bold text-dark">
                        {sent.toLocaleString('tr-TR')}
                      </td>
                      <td data-label="Toplam Okunan" className="text-end fw-bold text-success">
                        {read.toLocaleString('tr-TR')}
                      </td>
                      <td data-label="Okunma Oranı" className="text-end">
                        <div className="d-flex align-items-center justify-content-end">
                          <span className="me-2">{rate}%</span>
                          <div className="progress" style={{ width: '60px', height: '6px' }}>
                            <div className="progress-bar bg-success" style={{ width: `${rate}%` }}></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal - React Controlled Overlay */}
      {isModalOpen && (
        <>
          <div className="modal modal-blur fade show d-block" tabIndex={-1} role="dialog" style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}>
            <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
              <form className="modal-content shadow-lg" onSubmit={handleSave}>
                <div className="modal-header">
                  <h5 className="modal-title fw-bold">
                    {editingTemplate ? 'Şablonu Düzenle' : 'Yeni Bildirim Şablonu Ekle'}
                  </h5>
                  <button type="button" className="btn-close" onClick={handleCloseModal} aria-label="Kapat"></button>
                </div>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label required">Şablon Kodu</label>
                      <input 
                        type="text" 
                        className="form-control font-monospace" 
                        placeholder="örn: daily_reminder" 
                        value={formCode}
                        onChange={e => setFormCode(e.target.value)}
                        required
                        disabled={!!editingTemplate} 
                      />
                      <small className="form-hint text-muted">
                        Kural motorunda şablonu tetiklemek için kullanılacak benzersiz anahtar.
                      </small>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label required">Gönderim Kanalı</label>
                      <select 
                        className="form-select" 
                        value={formChannel}
                        onChange={e => setFormChannel(e.target.value as any)}
                        required
                      >
                        <option value="push">Push Bildirim</option>
                        <option value="sms">SMS</option>
                        <option value="email">E-posta</option>
                        <option value="in_app">Uygulama İçi (In-App)</option>
                      </select>
                    </div>

                    {(formChannel === 'push' || formChannel === 'email') && (
                      <div className="col-12">
                        <label className="form-label">Başlık Şablonu (Opsiyonel)</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          placeholder="örn: Sayın {{patient_name}}, Hatırlatma!" 
                          value={formTitle}
                          onChange={e => setFormTitle(e.target.value)}
                        />
                      </div>
                    )}

                    <div className="col-12">
                      <label className="form-label required">Gövde Şablonu</label>
                      <textarea 
                        className="form-control" 
                        rows={4} 
                        placeholder="örn: Bugün henüz tansiyon ölçümünüzü girmediniz. Lütfen en kısa zamanda ölçüm yapıp kaydedin." 
                        value={formBody}
                        onChange={e => setFormBody(e.target.value)}
                        required
                      ></textarea>
                      <small className="form-hint text-muted">
                        Değişkenleri {'{{değisken_adı}}'} formatında kullanabilirsiniz.
                      </small>
                    </div>

                    <div className="col-12">
                      <label className="form-label">Kullanılacak Değişkenler</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="örn: patient_name, current_day" 
                        value={formVariablesStr}
                        onChange={e => setFormVariablesStr(e.target.value)}
                      />
                      <small className="form-hint text-muted">
                        Değişkenleri virgülle ayırarak yazın. Örnek: <code className="bg-light px-1 rounded">patient_name, doctor_name, current_day</code>
                      </small>
                    </div>

                    <div className="col-12">
                      <label className="form-check form-switch mt-2">
                        <input 
                          className="form-check-input cursor-pointer" 
                          type="checkbox" 
                          checked={formIsActive}
                          onChange={e => setFormIsActive(e.target.checked)}
                        />
                        <span className="form-check-label fw-medium">Şablon Aktif mi?</span>
                      </label>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-white me-auto" onClick={handleCloseModal}>İptal</button>
                  <button type="submit" className="btn btn-primary" disabled={isPending}>
                    {isPending ? 'Kaydediliyor...' : 'Kaydet'}
                  </button>
                </div>
              </form>
            </div>
          </div>
          <div className="modal-backdrop fade show" style={{ zIndex: 1040 }}></div>
        </>
      )}
    </div>
  );
}
