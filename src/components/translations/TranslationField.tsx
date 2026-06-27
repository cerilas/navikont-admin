'use client';

import React from 'react';

interface TranslationFieldProps {
  label: string;
  originalText: string;
  translatedText: string;
  onChange: (newText: string) => void;
  isHtml?: boolean;
}

export function TranslationField({
  label,
  originalText,
  translatedText,
  onChange,
  isHtml = false,
}: TranslationFieldProps) {
  // Determine rows based on content length to keep textareas roughly equal
  const rows = isHtml ? 8 : (originalText?.length > 150 ? 5 : 2);

  return (
    <div className="mb-4">
      <label className="form-label fw-bold mb-3">{label}</label>
      <div className="row g-3 align-items-start">
        {/* Original */}
        <div className="col-md-6">
          <div className="d-flex justify-content-between mb-1">
            <span className="text-muted small fw-medium">Orijinal İçerik (TR)</span>
          </div>
          {isHtml ? (
            <div 
              className="form-control bg-light text-muted overflow-auto" 
              style={{ minHeight: '180px', maxHeight: '400px' }}
              dangerouslySetInnerHTML={{ __html: originalText || '<span class="fst-italic opacity-50">Boş içerik</span>' }}
            />
          ) : (
            <textarea
              className="form-control bg-light text-muted"
              value={originalText || ''}
              disabled
              rows={rows}
              placeholder="Boş içerik"
            />
          )}
        </div>

        {/* Translation */}
        <div className="col-md-6">
          <div className="d-flex justify-content-between mb-1">
            <span className="text-primary small fw-medium">Çeviri</span>
          </div>
          <textarea
            className="form-control border-primary-subtle"
            value={translatedText}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Bu alan için çeviri girin..."
            rows={rows}
            style={{ minHeight: isHtml ? '180px' : 'auto' }}
          />
        </div>
      </div>
    </div>
  );
}
