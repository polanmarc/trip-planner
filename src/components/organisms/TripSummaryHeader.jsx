import React from 'react';
import { Calendar, Tag, Car, Train, Footprints } from 'lucide-react';

export const TripSummaryHeader = ({ destination, summary, budget, days, style, transport }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 flex flex-col md:flex-row gap-6 justify-between items-start w-full">
      
      {/* BLOQUE IZQUIERDO: Título y Descripción */}
      <div className="space-y-4 flex-1">
        <div className="space-y-2">
          <span className="inline-block text-xs font-bold bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-md uppercase tracking-wider">
            Plan Generado con Éxito
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
            {destination}
          </h1>
        </div>
        <p className="text-base text-slate-600 leading-relaxed max-w-2xl">
          {summary}
        </p>
      </div>

      {/* BLOQUE DERECHO: Tarjeta de Presupuesto Limpia */}
      <div className="w-full md:w-80 bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-4 shrink-0 shadow-inner">
        <div>
          <span className="text-xs font-semibold text-slate-400 block mb-1">
            Presupuesto Estimado
          </span>
          <div className="text-xl font-extrabold text-indigo-600 leading-tight">
            {budget}
          </div>
        </div>
        
        <hr className="border-slate-200" />
        
        {/* Detalles rápidos inferiores */}
        <div className="grid grid-cols-2 gap-3 text-xs font-medium text-slate-600">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>{days} días</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Tag className="w-4 h-4 text-slate-400" />
            <span className="truncate">{style}</span>
          </div>
          <div className="col-span-2 flex items-center gap-1.5 bg-white p-2 rounded-lg border border-slate-100">
            {transport?.toLowerCase() === 'coche' ? (
              <Car className="w-4 h-4 text-indigo-500" />
            ) : transport?.toLowerCase() === 'tren' ? (
              <Train className="w-4 h-4 text-indigo-500" />
            ) : (
              <Footprints className="w-4 h-4 text-indigo-500" />
            )}
            <span>Transporte: <strong className="text-slate-800">{transport}</strong></span>
          </div>
        </div>
      </div>

    </div>
  );
};