'use client';

import React from 'react';

interface TranslationProgressProps {
  total: number;
  completed: number;
  languageName: string;
}

export function TranslationProgress({ total, completed, languageName }: TranslationProgressProps) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border mb-6 flex items-center justify-between">
      <div>
        <h3 className="text-sm font-medium text-gray-700">Genel İlerleme ({languageName})</h3>
        <p className="text-xs text-gray-500 mt-1">
          {completed} / {total} alan çevrildi
        </p>
      </div>
      <div className="flex-1 max-w-md ml-8">
        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
          <span>0%</span>
          <span className="font-bold text-blue-600">{percentage}%</span>
          <span>100%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}
