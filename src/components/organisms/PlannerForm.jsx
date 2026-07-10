import React from 'react';
import { MapPin, Calendar, DollarSign, Car, Compass, AlertCircle, Sparkles } from 'lucide-react';
import { FormField } from '../molecules/FormField';
import { InputBase } from '../atoms/InputBase';
import { NumberInputBase } from '../atoms/NumberInputBase';
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

  const styleOptions = [
    { value: 'Cultura y Turismo', label: 'Cultura y Turismo' },
    { value: 'Relax y Playa', label: 'Relax y Playa' },
    { value: 'Aventura y Naturaleza', label: 'Aventura y Naturaleza' },
    { value: 'Gastronomía', label: 'Gastronomía' },
    { value: 'Fiesta y Vida Nocturna', label: 'Fiesta y Vida Nocturna' }
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
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
          Planifica tu próximo<span className="text-indigo-600">viaje soñado</span>
        </h1>
      </div>
      <form onSubmit={onSubmit} className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-100 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <FormField label="Origen del viaje">
            <InputBase name="origin" value={formData.origin} onChange={onChange} placeholder="Ej. Madrid, Valencia..." icon={MapPin} required />
          </FormField>
          <FormField label="Destino final">
            <InputBase name="destination" value={formData.destination} onChange={onChange} placeholder="Ej. Tokio, París..." icon={MapPin} required />
          </FormField>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <FormField label="Duración (Días)">
            <NumberInputBase name="days" min="1" max="14" value={formData.days} onChange={onChange} icon={Calendar} />
          </FormField>
          <FormField label="Presupuesto">
            <SelectBase name="budget" value={formData.budget} onChange={onChange} options={budgetOptions} icon={DollarSign} />
          </FormField>
        </div>
        <FormField label="Medio de Transporte Principal" helperText="La IA adaptará las rutas del itinerario basándose en tu transporte.">
          <SelectBase name="transport" value={formData.transport} onChange={onChange} options={transportOptions} icon={Car} />
        </FormField>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <FormField label="Estilo de Viaje">
            <SelectBase name="style" value={formData.style} onChange={onChange} options={styleOptions} icon={Compass} />
          </FormField>
          <FormField label="¿Con quién viajas?">
            <SelectBase name="companions" value={formData.companions} onChange={onChange} options={companionOptions} />
          </FormField>
        </div>
        <FormField label="Temáticas que te interesan" helperText="Selecciona una o varias para que la IA sugiera sitios más alineados con tus gustos.">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {themeOptions.map((theme) => (
              <label key={theme.value} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer">
                <Checkbox checked={formData.themes?.includes(theme.value)} onChange={() => onThemeToggle(theme.value)} />
                <span className="text-sm font-medium text-slate-700">{theme.label}</span>
              </label>
            ))}
          </div>
        </FormField>
        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-2 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}
        <Button type="submit" className="w-full">
          <Sparkles className="w-5 h-5" /> Generar Itinerario Personalizado
        </Button>
      </form>
    </div>
  );
};