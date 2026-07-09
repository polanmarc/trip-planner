import React from 'react';
import { Map } from 'lucide-react';
import { TimelineActivity } from '../molecules/TimelineActivity';

export const DailyItineraryTimeline = ({ days, transportType }) => (
  <div className="space-y-6">
    <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2 mb-6">
      <Map className="w-6 h-6 text-indigo-600" /> Tu Itinerario Diario Adaptado
    </h3>
    {days.map((day, idx) => (
      <div key={idx} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
          <h4 className="font-bold text-lg text-slate-900">
            Día {day.dayNumber}: <span className="text-indigo-600 font-semibold">{day.theme}</span>
          </h4>
        </div>
        <div className="p-6">
          <div className="relative border-l-2 border-indigo-100 ml-3 md:ml-4 space-y-8">
            {day.activities.map((activity, aIdx) => (
              <TimelineActivity
                key={aIdx}
                time={activity.time}
                location={activity.location}
                description={activity.description}
                transportNote={activity.transportNote}
                transportType={transportType}
              />
            ))}
          </div>
        </div>
      </div>
    ))}
  </div>
);