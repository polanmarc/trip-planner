import React from 'react';
import { Plane } from 'lucide-react';

export const LoadingSpinner = () => (
  <div className="relative w-24 h-24">
    <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
    <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
    <div className="absolute inset-0 flex items-center justify-center text-indigo-600">
      <Plane className="w-8 h-8 animate-pulse" />
    </div>
  </div>
);