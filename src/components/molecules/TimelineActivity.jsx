import React from 'react';
import { Clock } from 'lucide-react';
import { Badge } from '../atoms/Badge';
import { TransportIcon } from '../atoms/TransportIcon';

export const TimelineActivity = ({ time, location, description, transportNote, transportType }) => (
  <div className="relative pl-6 md:pl-8">
    <div className="absolute w-4 h-4 bg-indigo-600 rounded-full -left-[9px] top-1 border-4 border-white shadow-sm"></div>
    <div className="flex flex-col md:flex-row md:items-start gap-2 md:gap-4">
      <div className="md:w-24 flex-shrink-0 pt-0.5">
        <Badge icon={Clock} variant="indigo">{time}</Badge>
      </div>
      <div className="flex-grow">
        <h5 className="text-base font-bold text-slate-900 mb-1">{location}</h5>
        <p className="text-slate-600 text-sm leading-relaxed mb-2">{description}</p>
        {transportNote && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium">
            <TransportIcon type={transportType} className="w-3.5 h-3.5 text-slate-500" />
            <span>{transportNote}</span>
          </div>
        )}
      </div>
    </div>
  </div>
);