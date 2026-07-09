import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export const RecommendationItem = ({ text }) => (
  <li className="flex gap-3 items-start">
    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
    <span className="text-sm text-slate-700 leading-relaxed">{text}</span>
  </li>
);