'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getFaqs, createFaq, updateFaq, deleteFaq } from '@/app/actions/faqs';
import Swal from 'sweetalert2';

export default function FaqsPage() {
  const params = useParams();
  const appId = params.appId as string;

  const [faqs, setFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  const [editingFaq, setEditingFaq] = useState<any>(null);
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    order_index: 0,
    is_active: true
  });

  const loadFaqs = async () => {
    setLoading(true);
    const res = await getFaqs(appId);
    if (res.success && res.data) {
      setFaqs(res.data);
    } else {
      Swal.fire({ icon: 'error', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, title: res.error || 'Veriler yüklenemedi.' });
    }
    setLoading(false);
  };

  useEffect(() => {
    loadFaqs();
  }, [appId]);

  const handleOpenModal = (faq?: any) => {
    if (faq) {
      setEditingFaq(faq);
      setFormData({
        question: faq.question,
        answer: faq.answer,
        order_index: faq.order_index,
        is_active: faq.is_active
      });
    } else {
      setEditingFaq(null);
      setFormData({ question: '', answer: '', order_index: 0, is_active: true });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingFaq(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingFaq) {
      const res = await updateFaq(editingFaq.id, appId, formData);
      if (res.success) {
        Swal.fire({ icon: 'success', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, title: 'SSS başarıyla güncellendi.' });
        handleCloseModal();
        loadFaqs();
      } else {
        Swal.fire({ icon: 'error', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, title: res.error });
      }
    } else {
      const res = await createFaq(appId, formData);
      if (res.success) {
        Swal.fire({ icon: 'success', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, title: 'SSS başarıyla eklendi.' });
        handleCloseModal();
        loadFaqs();
      } else {
        Swal.fire({ icon: 'error', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, title: res.error });
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bu SSS kaydını silmek istediğinize emin misiniz?')) {
      const res = await deleteFaq(id, appId);
      if (res.success) {
        Swal.fire({ icon: 'success', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, title: 'SSS başarıyla silindi.' });
        loadFaqs();
      } else {
        Swal.fire({ icon: 'error', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, title: res.error });
      }
    }
  };

  return (
    <>
      <div className="container-xl">
        <div className="page-header d-print-none">
          <div className="row align-items-center">
            <div className="col">
              <h2 className="page-title">Sıkça Sorulan Sorular (S.S.S.)</h2>
              <div className="text-muted mt-1">Uygulamanın yardım merkezinde gösterilecek SSS listesini yönetin.</div>
            </div>
            <div className="col-auto ms-auto d-print-none">
              <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 5l0 14"/><path d="M5 12l14 0"/></svg>
                Yeni SSS Ekle
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="page-body">
        <div className="container-xl">
          <div className="card shadow-sm border-0">
            {loading ? (
              <div className="card-body text-center py-6">
                <div className="spinner-border text-primary" role="status"></div>
                <div className="mt-3 text-muted">Yükleniyor...</div>
              </div>
            ) : faqs.length === 0 ? (
              <div className="card-body text-center py-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-info-circle text-muted mb-3" width="48" height="48" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" /><path d="M12 9h.01" /><path d="M11 12h1v4h1" /></svg>
                <p className="text-muted fs-3">Henüz hiç SSS eklenmemiş.</p>
                <button className="btn btn-primary mt-2" onClick={() => handleOpenModal()}>İlk Soruyu Ekle</button>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table card-table table-vcenter text-nowrap datatable table-hover">
                  <thead>
                    <tr>
                      <th className="w-1">Sıra</th>
                      <th>Soru ve Cevap</th>
                      <th>Durum</th>
                      <th className="text-end">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {faqs.map(faq => (
                      <tr key={faq.id}>
                        <td><span className="text-muted">{faq.order_index}</span></td>
                        <td className="text-wrap" style={{ minWidth: '300px' }}>
                          <div className="font-weight-bold text-dark fs-4 mb-1">{faq.question}</div>
                          <div className="text-muted text-truncate" style={{ maxWidth: '500px', whiteSpace: 'normal', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                            {faq.answer}
                          </div>
                        </td>
                        <td>
                          {faq.is_active ? (
                            <span className="badge bg-success-lt text-success px-3 py-2 rounded-pill fs-5">Aktif</span>
                          ) : (
                            <span className="badge bg-secondary-lt text-secondary px-3 py-2 rounded-pill fs-5">Pasif</span>
                          )}
                        </td>
                        <td className="text-end">
                          <button className="btn btn-sm btn-ghost-primary me-2" onClick={() => handleOpenModal(faq)}>Düzenle</button>
                          <button className="btn btn-sm btn-ghost-danger" onClick={() => handleDelete(faq.id)}>Sil</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal modal-blur fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
            <form className="modal-content" onSubmit={handleSave}>
              <div className="modal-header">
                <h5 className="modal-title">{editingFaq ? 'SSS Düzenle' : 'Yeni SSS Ekle'}</h5>
                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Soru</label>
                  <input type="text" className="form-control" required value={formData.question} onChange={e => setFormData({ ...formData, question: e.target.value })} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Cevap</label>
                  <textarea className="form-control" rows={4} required value={formData.answer} onChange={e => setFormData({ ...formData, answer: e.target.value })}></textarea>
                </div>
                <div className="row">
                  <div className="col-lg-6">
                    <div className="mb-3">
                      <label className="form-label">Sıra (Order Index)</label>
                      <input type="number" className="form-control" value={formData.order_index} onChange={e => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })} />
                    </div>
                  </div>
                  <div className="col-lg-6">
                    <div className="mb-3">
                      <label className="form-label">Durum</label>
                      <label className="form-check form-switch mt-2">
                        <input className="form-check-input" type="checkbox" checked={formData.is_active} onChange={e => setFormData({ ...formData, is_active: e.target.checked })} />
                        <span className="form-check-label">Aktif olarak göster</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-link link-secondary" onClick={handleCloseModal}>İptal</button>
                <button type="submit" className="btn btn-primary ms-auto">Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
