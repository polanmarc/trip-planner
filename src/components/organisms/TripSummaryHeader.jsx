import React from 'react';
import { MapPin, DollarSign } from 'lucide-react';
import { Badge } from '../atoms/Badge';

export const TripSummaryHeader = ({ destination, summary, budget, days, style, transport }) => (
  <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-200 relative overflow-hidden">
    <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-2">
        <Badge icon={MapPin} variant="indigo">Plan Generado con Éxito</Badge>
        <h2 className="text-4xl font-extrabold text-slate-900 mb-4 mt-2">{destination}</h2>
        <p className="text-lg text-slate-600 leading-relaxed">{summary}</p>
      </div>
      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex flex-col justify-center">
        <div className="text-slate-500 text-sm font-semibold mb-1 flex items-center gap-2">
          <DollarSign className="w-4 h-4" /> Presupuesto Estimado
        </div>
        <div className="text-3xl font-bold text-indigo-600 mb-4">{budget}</div>
        <div className="space-y-2 text-sm text-slate-600">
          <div className="flex justify-between"><span>Duración:</span><span className="font-semibold">{days} días</span></div>
          <div className="flex justify-between"><span>Estilo:</span><span className="font-semibold">{style}</span></div>
          <div className="flex justify-between"><span>Transporte:</span><span className="font-semibold text-indigo-600">{transport.split(' ')[0]}</span></div>
        </div>
      </div>
    </div>
  </div>
);