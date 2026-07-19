import React from 'react';
import { MapPin, Calendar, Car, AlertCircle, Sparkles, Users, Plane } from 'lucide-react';
import { FormField } from '../molecules/FormField';
import { InputBase } from '../atoms/InputBase';
import { SelectBase } from '../atoms/SelectBase';
import { Checkbox } from '../atoms/Checkbox';
import { Button } from '../atoms/Button';

export const PlannerForm = ({ formData, onChange, onThemeToggle, onSubmit, error }) => {
  const budgetOptions = [
    { value: 'Económico (Mochilero)', label: 'Económico (Mochilero)' },
    { value: 'Medio', label: 'Medio (Estándar)' },
    { value: 'Alto (Lujo)', label: 'Alto (Lujo)' }
  ];

  const transportOptions = [
    { value: 'Coche Propio / Alquiler', label: '🚗 Coche (Propio o Alquiler)' },
    { value: 'Transporte Público (Metro/Autobús)', label: '🚌 Transporte Público' },
    { value: 'Tren de Alta Velocidad (AVE / Larga Distancia)', label: '🚄 Tren / AVE' },
    { value: 'Avión', label: '✈️ Avión (Vuelo)' },
    { value: 'Barco / Ferry', label: '🚢 Barco / Ferry' },
    { value: 'A pie / Bicicleta', label: '🚶 A pie o Bicicleta' }
  ];

  const themeOptions = [
    { value: 'Cultura y Patrimonio', label: 'Cultura y Patrimonio' },
    { value: 'Naturaleza y Senderismo', label: 'Naturaleza y Senderismo' },
    { value: 'Gastronomía Local', label: 'Gastronomía Local' },
    { value: 'Playas y Relax', label: 'Playas y Relax' },
    { value: 'Fotografía', label: 'Fotografía' },
    { value: 'Vida Nocturna', label: 'Vida Nocturna' }
  ];

  const companionOptions = [
    { value: 'Solo', label: 'Solo/a' },
    { value: 'Pareja', label: 'En Pareja' },
    { value: 'Familia', label: 'Familia (con niños)' },
    { value: 'Amigos', label: 'Grupo de Amigos' }
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700 mb-4">
          <Plane className="h-4 w-4" />
          Tu próximo viaje, en una sola pantalla
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Planifica tu próximo <span className="text-indigo-600">viaje soñado</span>
        </h1>
        <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
          Completa los datos básicos y deja que la IA cree un itinerario adaptado a tus gustos.
        </p>
      </div>

      <form onSubmit={onSubmit} className="bg-white p-5 sm:p-8 rounded-2xl shadow-[0_20px_60px_-25px_rgba(15,23,42,0.3)] border border-slate-200 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <FormField label="Origen del viaje">
            <InputBase name="origin" value={formData.origin} onChange={onChange} placeholder="Ej. Madrid, Valencia..." icon={MapPin} required />
          </FormField>
          <FormField label="Destino final">
            <InputBase name="destination" value={formData.destination} onChange={onChange} placeholder="Ej. Tokio, París..." icon={MapPin} required />
          </FormField>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <FormField label="Fecha de ida">
            <InputBase type="date" name="departureDate" value={formData.departureDate} onChange={onChange} icon={Calendar} required />
          </FormField>
          <FormField label="Fecha de vuelta">
            <InputBase type="date" name="returnDate" value={formData.returnDate} onChange={onChange} icon={Calendar} required />
          </FormField>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <FormField label="¿Con quién viajas?" helperText="Ajústalo al tipo de experiencia.">
            <SelectBase name="companions" value={formData.companions} onChange={onChange} options={companionOptions} icon={Users} />
          </FormField>
          <FormField label="Medio de transporte principal" helperText="La IA adaptará las rutas del itinerario basándose en tu transporte.">
            <SelectBase name="transport" value={formData.transport} onChange={onChange} options={transportOptions} icon={Car} />
          </FormField>
        </div>

        <FormField label="Temáticas que te interesan" helperText="Selecciona una o varias para que la IA sugiera sitios más alineados con tus gustos.">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {themeOptions.map((theme) => (
              <label key={theme.value} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-indigo-200 cursor-pointer transition-all">
                <Checkbox checked={formData.themes?.includes(theme.value)} onChange={() => onThemeToggle(theme.value)} />
                <span className="text-sm font-medium text-slate-700">{theme.label}</span>
              </label>
            ))}
          </div>
        </FormField>

        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-2 text-sm border border-red-100">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <Button type="submit" className="w-full rounded-xl py-3.5">
          <Sparkles className="w-5 h-5" /> Generar Itinerario Personalizado
        </Button>
      </form>
    </div>
  );
};