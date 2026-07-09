import React, { useState } from 'react';
import { Briefcase, CheckCircle } from 'lucide-react';
import { PackingItem } from '../molecules/PackingItem';

export const PackingListPanel = ({ packingList }) => {
  // Guardamos un objeto con los índices de los elementos completados { 0: true, 2: true... }
  const [checkedItems, setCheckedItems] = useState({});

  const toggleItem = (index) => {
    setCheckedItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const totalItems = packingList?.length || 0;
  const completedItems = Object.values(checkedItems).filter(Boolean).length;
  const progressPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-indigo-600" /> Lista de Equipaje
        </h3>
        <span className="text-xs font-semibold bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md">
          {completedItems}/{totalItems}
        </span>
      </div>

      {/* Barra de progreso */}
      <div className="w-full bg-slate-100 rounded-full h-2 mb-6">
        <div 
          className="bg-indigo-600 h-2 rounded-full transition-all duration-300" 
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>

      {/* Lista de cosas por empacar */}
      <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
        {packingList.map((item, idx) => (
          <PackingItem
            key={idx}
            item={item}
            isChecked={!!checkedItems[idx]}
            onToggle={() => toggleItem(idx)}
          />
        ))}
      </div>

      {progressPercentage === 100 && totalItems > 0 && (
        <div className="mt-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-medium animate-bounce">
          <CheckCircle className="w-4 h-4 text-emerald-600" /> ¡Maleta lista! No te olvidas de nada.
        </div>
      )}
    </div>
  );
};