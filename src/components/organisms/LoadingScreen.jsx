import React from 'react';
import { LoadingSpinner } from '../atoms/LoadingSpinner';

export const LoadingScreen = ({ destination, transport }) => (
  <div className="flex flex-col items-center justify-center py-20">
    <LoadingSpinner />
    <h2 className="text-2xl font-bold text-slate-800 mb-2 mt-8">Diseñando tu viaje perfecto...</h2>
    <p className="text-slate-500 text-center max-w-md animate-pulse">
      La IA está buscando rutas viables en {destination} para tu viaje en <strong className="text-indigo-600">{transport}</strong>.
    </p>
  </div>
);