const fs = require('fs');
const file = '/Users/deniz/Documents/navikont-admin-2/src/app/(app)/apps/[appId]/patients/[enrollmentId]/PatientDetailClient.tsx';
let content = fs.readFileSync(file, 'utf8');

// The replacement for activeTab === 'progress'
const progressReplacement = `{activeTab === 'progress' && (
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
                                    <div className="progress-bar bg-primary" style={{ width: \`\${Number(log.progress_percent || 0)}%\` }}></div>
                                  </div>
                                </div>
                              ) : '-'}
                              {['risk', 'risk_alert'].includes(log.module_type) && log.result_data && typeof log.result_data === 'object' && log.result_data.score !== undefined && (
                                <div className="mt-2 p-2 rounded bg-light border" style={{ minWidth: '150px' }}>
                                  <div className="small text-muted mb-1">
                                    <strong>Puan:</strong> <span className="text-dark fw-bold">{log.result_data.score}</span> 
                                    <span className="mx-1">/</span> 
                                    Eşik: {log.result_data.threshold}
                                  </div>
                                  <div className="small">
                                    <strong>Sonuç: </strong> 
                                    {log.result_data.riskStatus === 'risk' ? (
                                      <span className="text-danger fw-bold badge bg-danger-lt px-2 py-1">Risk Sınırı Aşıldı</span>
                                    ) : log.result_data.riskStatus === 'safe' ? (
                                      <span className="text-success fw-bold badge bg-success-lt px-2 py-1">Güvenli</span>
                                    ) : (
                                      <span className="text-muted">Bilinmiyor</span>
                                    )}
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
          )}`;

content = content.replace(/{activeTab === 'progress' && \([\s\S]*?\)}/, progressReplacement);

// We need to append the modal at the very end
const modalCode = `

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
                        <div className="text-end">
                          <div className="small text-muted mb-1">Seri (Streak)</div>
                          <div className="fs-2 fw-bold text-dark">{detailedData.summary.streak_day} Gün</div>
                        </div>
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
                        <h4 className="m-0 text-primary">Anket Sonuçları</h4>
                        <div className="text-end">
                          <div className="small text-muted mb-1">Toplam Puan</div>
                          <div className="fs-2 fw-bold text-dark">{detailedData.summary.total_score}</div>
                        </div>
                      </div>

                      {detailedData.answers.map((ans: any, idx: number) => (
                        <div key={idx} className="mb-3 bg-white rounded p-3 border shadow-sm">
                          <div className="fw-medium mb-2 text-dark">{idx + 1}. {ans.question_text}</div>
                          <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top border-light">
                            <span className="text-primary fw-bold px-2 py-1 bg-primary-lt rounded">
                              {ans.option_label ? ans.option_label : (ans.answer_value || '').replace(/['"]+/g, '')}
                            </span>
                            {ans.score > 0 && <span className="badge bg-success-lt px-2 py-1">+{ans.score} Puan</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : selectedLog?.result_data ? (
                <div>
                  <h4 className="text-primary mb-3 pb-2 border-bottom">Modül Verisi (JSON)</h4>
                  <pre className="bg-dark text-light p-3 rounded overflow-auto" style={{ maxHeight: '400px' }}>
                    {JSON.stringify(selectedLog.result_data, null, 2)}
                  </pre>
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
`;

content = content.replace("</>\n  );\n}", modalCode + "\n    </>\n  );\n}");

// Add handleViewDetails
const handleViewDetailsStr = `
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
`;

if (!content.includes('handleViewDetails')) {
  content = content.replace("const [isPending, startTransition] = useTransition();", "const [isPending, startTransition] = useTransition();\n" + handleViewDetailsStr);
}

if (!content.includes('getDetailedModuleAnswers')) {
  content = content.replace("import { deletePatient } from '@/app/actions/patients';", "import { deletePatient, getDetailedModuleAnswers } from '@/app/actions/patients';");
}

fs.writeFileSync(file, content);
console.log('Restored UI');
