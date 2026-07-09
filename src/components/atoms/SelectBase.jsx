import React from 'react';

export const SelectBase = ({ name, value, onChange, options, icon: Icon }) => (
  <div className="relative">
    {Icon && (
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <Icon className="h-5 w-5 text-slate-400" />
      </div>
    )}
    <select
      name={name}
      value={value}
      onChange={onChange}
      className={`block w-full ${Icon ? 'pl-11' : 'px-4'} pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all appearance-none`}
    >
      {options.map((opt, i) => (
        <option key={i} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);