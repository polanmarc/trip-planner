import React from 'react';

export const NumberInputBase = ({ name, value, onChange, min, max, icon: Icon }) => (
  <div className="relative">
    {Icon && (
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <Icon className="h-5 w-5 text-slate-400" />
      </div>
    )}
    <input
      type="number"
      name={name}
      value={value}
      onChange={onChange}
      min={min}
      max={max}
      className={`block w-full ${Icon ? 'pl-11' : 'px-4'} pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all`}
    />
  </div>
);