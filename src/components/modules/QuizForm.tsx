'use client';

export default function QuizForm({ initialData, onChange }: { initialData: any, onChange: (data: any) => void }) {
  const questions = initialData.questions || [];

  const handleAddQuestion = () => {
    const newQuestions = [...questions, { id: Date.now().toString(), type: 'single_choice', text: '', options: ['', ''], correctOptionIndex: 0 }];
    onChange({ ...initialData, questions: newQuestions });
  };

  const handleUpdateQuestion = (index: number, field: string, value: any) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    onChange({ ...initialData, questions: newQuestions });
  };

  const handleRemoveQuestion = (index: number) => {
    const newQuestions = questions.filter((_: any, i: number) => i !== index);
    onChange({ ...initialData, questions: newQuestions });
  };

  const handleOptionChange = (qIndex: number, optIndex: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options[optIndex] = value;
    onChange({ ...initialData, questions: newQuestions });
  };

  const handleAddOption = (qIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options.push('');
    onChange({ ...initialData, questions: newQuestions });
  };

  return (
    <div className="card bg-light mb-3">
      <div className="card-body">
        <h4 className="card-title">Test / Soru-Cevap Ayarları</h4>
        
        {questions.map((q: any, qIndex: number) => (
          <div key={q.id} className="card mb-3 border-primary">
            <div className="card-header p-2 bg-white d-flex justify-content-between align-items-center">
              <strong>Soru {qIndex + 1}</strong>
              <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => handleRemoveQuestion(qIndex)}>Sil</button>
            </div>
            <div className="card-body p-3 bg-white">
              <div className="mb-2">
                <label className="form-label required">Soru Metni</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={q.text} 
                  onChange={e => handleUpdateQuestion(qIndex, 'text', e.target.value)} 
                  required 
                />
              </div>
              <div className="mb-2">
                <label className="form-label required">Soru Tipi</label>
                <select 
                  className="form-select" 
                  value={q.type} 
                  onChange={e => handleUpdateQuestion(qIndex, 'type', e.target.value)}
                >
                  <option value="single_choice">Tekli Seçim (Radyo)</option>
                  <option value="multiple_choice">Çoklu Seçim (Checkbox)</option>
                  <option value="open_text">Açık Uçlu (Metin)</option>
                </select>
              </div>

              {q.type !== 'open_text' && (
                <div className="mt-3 p-2 border rounded bg-light">
                  <label className="form-label">Şıklar (Doğru cevabı radyo butonundan seçin)</label>
                  {q.options.map((opt: string, optIndex: number) => (
                    <div key={optIndex} className="d-flex mb-2 align-items-center">
                      <div className="me-2">
                        <input 
                          type="radio" 
                          className="form-check-input m-0" 
                          name={`correct_${q.id}`} 
                          checked={q.correctOptionIndex === optIndex}
                          onChange={() => handleUpdateQuestion(qIndex, 'correctOptionIndex', optIndex)}
                        />
                      </div>
                      <input 
                        type="text" 
                        className="form-control form-control-sm" 
                        value={opt} 
                        onChange={e => handleOptionChange(qIndex, optIndex, e.target.value)} 
                        placeholder={`Şık ${optIndex + 1}`} 
                        required 
                      />
                    </div>
                  ))}
                  <button type="button" className="btn btn-sm btn-outline-primary mt-1" onClick={() => handleAddOption(qIndex)}>+ Şık Ekle</button>
                </div>
              )}
            </div>
          </div>
        ))}

        <button type="button" className="btn btn-outline-primary w-100" onClick={handleAddQuestion}>
          <svg xmlns="http://www.w3.org/2000/svg" className="icon me-1" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 5l0 14" /><path d="M5 12l14 0" /></svg>
          Yeni Soru Ekle
        </button>
      </div>
    </div>
  );
}
