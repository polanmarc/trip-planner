import React from 'react';
import { Navigation, MapPin } from 'lucide-react';
import { ResourceLink } from '../molecules/ResourceLink';

export const LogisticsPanel = ({ transport, transportAdvice, destination }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-4">
      <Navigation className="w-5 h-5 text-indigo-600" /> Logística de Transporte
    </h3>
    <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100/50 mb-4">
      <p className="text-sm text-indigo-900 leading-relaxed">{transportAdvice?.summary}</p>
    </div>
    <div className="mb-4">
      <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider mb-1">Costo Estimado</span>
      <span className="text-lg font-bold text-slate-800">{transportAdvice?.estimatedCost}</span>
    </div>
    <div className="space-y-3">
      <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Enlaces de Reserva</span>
      {transportAdvice?.bookingSites?.map((site, sIdx) => (
        <ResourceLink key={sIdx} name={site.name} url={site.url} />
      ))}
      <ResourceLink 
        name="Ver Mapa en Tiempo Real" 
        url={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}`} 
        icon={MapPin}
        variant="emerald"
      />
    </div>
  </div>
);