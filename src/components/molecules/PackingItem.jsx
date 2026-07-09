import React from 'react';
import { Checkbox } from '../atoms/Checkbox';

export const PackingItem = ({ item, isChecked, onToggle }) => (
  <label className="flex items-center gap-3 p-2.5 hover:bg-slate-50 rounded-xl cursor-pointer transition-all group">
    <Checkbox checked={isChecked} onChange={onToggle} />
    <span className={`text-sm font-medium transition-all ${
      isChecked 
        ? 'line-through text-slate-400' 
        : 'text-slate-700 group-hover:text-indigo-600'
    }`}>
      {item}
    </span>
  </label>
);