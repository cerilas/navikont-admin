'use client';

import { useState } from 'react';
import { resolveSupportRequest } from '@/app/actions/support';
import Swal from 'sweetalert2';

export default function SupportRequestClient({ initialRequests }: { initialRequests: any[] }) {
  const [requests, setRequests] = useState(initialRequests);

  const handleShowDetails = (r: any) => {
    Swal.fire({
      title: r.subject,
      html: `
        <div class="text-start">
          <p><strong>Doktor:</strong> ${r.doctor_name} (${r.doctor_email})</p>
          <p><strong>Tarih:</strong> ${new Date(r.created_at).toLocaleString('tr-TR')}</p>
          <hr />
          <div style="white-space: pre-wrap; word-break: break-word;">${r.message}</div>
        </div>
      `,
      confirmButtonText: 'Kapat',
      width: '600px'
    });
  };

  const handleResolve = async (id: string) => {
    const result = await Swal.fire({
      title: 'Talebi kapatmak istediğinize emin misiniz?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Evet, Kapat',
      cancelButtonText: 'İptal'
    });

    if (result.isConfirmed) {
      const res = await resolveSupportRequest(id);
      if (res.success) {
        setRequests(requests.map(r => r.id === id ? { ...r, status: 'resolved' } : r));
        Swal.fire('Başarılı', 'Talep durumu güncellendi.', 'success');
      } else {
        Swal.fire('Hata', res.error, 'error');
      }
    }
  };

  return (
    <div className="card">
      <div className="table-responsive">
        <table className="table table-vcenter card-table">
          <thead>
            <tr>
              <th>Tarih</th>
              <th>Doktor</th>
              <th>Konu</th>
              <th>Mesaj</th>
              <th>Durum</th>
              <th className="w-1"></th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-muted py-4">Henüz bir talep bulunmuyor.</td>
              </tr>
            ) : (
              requests.map((r: any) => (
                <tr key={r.id}>
                  <td className="text-muted text-nowrap">
                    {new Date(r.created_at).toLocaleString('tr-TR')}
                  </td>
                  <td>
                    <div className="font-weight-medium">{r.doctor_name}</div>
                    <div className="text-muted small">{r.doctor_email}</div>
                  </td>
                  <td>
                    {r.subject}
                  </td>
                  <td>
                    <div className="text-truncate" style={{ maxWidth: '300px' }} title={r.message}>
                      {r.message}
                    </div>
                  </td>
                  <td>
                    {r.status === 'new' ? (
                      <span className="badge bg-blue-lt">Yeni</span>
                    ) : (
                      <span className="badge bg-green-lt">Çözüldü</span>
                    )}
                  </td>
                  <td>
                    <div className="btn-list flex-nowrap">
                      <button 
                        className="btn btn-sm btn-outline-primary" 
                        onClick={() => handleShowDetails(r)}
                      >
                        Detay
                      </button>
                      {r.status === 'new' && (
                        <button 
                          className="btn btn-sm btn-outline-success" 
                          onClick={() => handleResolve(r.id)}
                        >
                          Çözüldü
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
