const fs = require('fs');
const file = '/Users/deniz/Documents/navikont-admin-2/src/app/(app)/apps/[appId]/patients/[enrollmentId]/PatientDetailClient.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1
content = content.replace(
  "if (log.module_type === 'checkin' || log.module_type === 'questionnaire') {",
  "if (log.module_type === 'checkin' || log.module_type === 'questionnaire' || log.module_type === 'question_answer') {"
);

// 2
content = content.replace(
  "{log.result_data || ['checkin', 'questionnaire'].includes(log.module_type) ? (",
  "{log.result_data || ['checkin', 'questionnaire', 'question_answer'].includes(log.module_type) ? ("
);

// 3
const riskUI = `                              {['risk', 'risk_alert'].includes(log.module_type) && log.result_data && typeof log.result_data === 'object' && log.result_data.score !== undefined && (
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
                              )}`;

content = content.replace(
  ") : '-'}\n                            </td>",
  `) : '-'}\n${riskUI}\n                            </td>`
);

// 4
content = content.replace(
  "{ans.answer_value.replace(/['\"]+/g, '')}",
  "{ans.option_label ? ans.option_label : ans.answer_value.replace(/['\"]+/g, '')}"
);

fs.writeFileSync(file, content);
console.log('Patched');
