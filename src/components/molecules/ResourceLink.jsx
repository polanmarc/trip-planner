import React from 'react';
import { ExternalLink } from 'lucide-react';

export const ResourceLink = ({ name, url, icon: Icon = ExternalLink, variant = 'slate' }) => {
  const isEmerald = variant === 'emerald';
  const containerClasses = isEmerald
    ? "flex items-center justify-between p-3 bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-100 rounded-xl transition-all group mt-2"
    : "flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all group";
  
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={containerClasses}>
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${isEmerald ? 'text-emerald-600' : 'text-slate-400 group-hover:text-indigo-600'}`} />
        <span className={`text-sm font-semibold ${isEmerald ? 'text-emerald-800' : 'text-slate-700 group-hover:text-indigo-600'}`}>{name}</span>
      </div>
      <span className={`text-xs ${isEmerald ? 'text-emerald-700' : 'text-indigo-600'} font-medium group-hover:underline`}>Visitar →</span>
    </a>
  );
};