import React from 'react';
import { Clock, MapPin, Coins, Car, Train, Footprints } from 'lucide-react'; // <-- Cambiado Walk por Footprints

export const TimelineActivity = ({ time, location, description, price, transportNote, transportType }) => {
  // Selector dinámico de iconos de transporte para la nota inferior
  const getTransportIcon = () => {
    switch (transportType?.toLowerCase()) {
      case 'coche': return <Car className="w-3.5 h-3.5" />;
      case 'tren': return <Train className="w-3.5 h-3.5" />;
      default: return <Footprints className="w-3.5 h-3.5" />; // <-- Cambiado aquí también
    }
  };

  return (
    <div className="relative pl-6 md:pl-8 group">
      {/* Indicador de la línea de tiempo (Círculo) */}
      <div className="absolute -left-[9px] top-1.5 bg-white border-4 border-indigo-500 rounded-full w-4 h-4 group-hover:border-indigo-600 transition-colors"></div>
      
      {/* Contenido de la Actividad */}
      <div className="space-y-2">
        {/* Fila superior: Hora */}
        <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 w-max px-2 py-0.5 rounded-md">
          <Clock className="w-3.5 h-3.5" />
          {time}
        </div>

        {/* Descripción principal */}
        <p className="text-base font-semibold text-slate-800 leading-snug">
          {description}
        </p>

        {/* Fila de metadatos: Ubicación y Precio */}
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4 text-slate-400" />
            <span className="font-medium text-slate-600">{location}</span>
          </div>
          
          {/* Renderizado condicional del precio con estilo esmeralda */}
          {price && (
            <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-xs font-bold border border-emerald-100">
              <Coins className="w-3.5 h-3.5 text-emerald-600" />
              {price}
            </div>
          )}
        </div>

        {/* Nota de transporte adaptada */}
        {transportNote && (
          <p className="text-xs text-slate-400 flex items-center gap-1 bg-slate-50 p-2 rounded-lg border border-slate-100 w-max max-w-full">
            {getTransportIcon()}
            <span className="italic">{transportNote}</span>
          </p>
        )}
      </div>
    </div>
  );
};