import React from 'react';
import { Navigation, MapPin } from 'lucide-react';
import { ResourceLink } from '../molecules/ResourceLink';

export const LogisticsPanel = ({ origin, transport, transportAdvice, destination }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-4">
      <Navigation className="w-5 h-5 text-indigo-600" /> Logística de Transporte
    </h3>
    <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100/50 mb-4">
      <p className="text-sm text-indigo-900 leading-relaxed">{transportAdvice?.summary}</p>
    </div>
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 mb-4">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Transporte</span>
        <p className="mt-2 text-sm text-slate-700">{transport}</p>
      </div>
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 mb-4">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Costo estimado</span>
        <p className="mt-2 text-sm font-semibold text-slate-900">{transportAdvice?.travelCost || transportAdvice?.estimatedCost}</p>
      </div>
    <div className="space-y-3 mb-4">
      <div>
        <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Enlaces de reserva</span>
        <div className="space-y-2 mt-2">
          {transportAdvice?.bookingSites?.map((site, sIdx) => (
            <ResourceLink key={sIdx} name={site.name} url={site.url} />
          ))}
        </div>
      </div>
      <ResourceLink
        name="Ruta recomendada en Google Maps"
        url={`https://www.google.com/maps/dir/${encodeURIComponent(origin || '')}/${encodeURIComponent(destination || '')}`}
        icon={MapPin}
        variant="emerald"
      />
    </div>
    <p className="text-sm text-slate-500">Usa los enlaces para comparar precios reales y reservar tu trayecto desde {origin} hasta {destination}.</p>
  </div>
);