import React from 'react';
import { Info } from 'lucide-react';

export const FormField = ({ label, helperText, children }) => (
  <div>
    <label className="block text-sm font-semibold text-slate-700 mb-2">{label}</label>
    {children}
    {helperText && (
      <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1">
        <Info className="w-3.5 h-3.5 text-indigo-500" />
        {helperText}
      </p>
    )}
  </div>
);