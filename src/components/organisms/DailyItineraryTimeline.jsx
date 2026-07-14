import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Map } from 'lucide-react';
import { TimelineActivity } from '../molecules/TimelineActivity';

export const DailyItineraryTimeline = ({ days, transportType }) => {
  const [currentDayIndex, setCurrentDayIndex] = useState(0);

  useEffect(() => {
    setCurrentDayIndex(0);
  }, [days?.length]);

  const safeDays = Array.isArray(days) ? days : [];
  const hasMultipleDays = safeDays.length > 1;
  const currentDay = safeDays[currentDayIndex];

  const goToPreviousDay = () => {
    setCurrentDayIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : prevIndex));
  };

  const goToNextDay = () => {
    setCurrentDayIndex((prevIndex) => (prevIndex < safeDays.length - 1 ? prevIndex + 1 : prevIndex));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Map className="w-6 h-6 text-indigo-600" /> Tu Itinerario Diario Adaptado
        </h3>
        {hasMultipleDays && (
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 shadow-sm">
            <button
              type="button"
              onClick={goToPreviousDay}
              disabled={currentDayIndex === 0}
              className="rounded-full p-2 text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Día anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold text-slate-700">
              Día {currentDayIndex + 1} de {safeDays.length}
            </span>
            <button
              type="button"
              onClick={goToNextDay}
              disabled={currentDayIndex === safeDays.length - 1}
              className="rounded-full p-2 text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Día siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {currentDay ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
            <h4 className="font-bold text-lg text-slate-900">
              Día {currentDay.dayNumber}: <span className="text-indigo-600 font-semibold">{currentDay.theme}</span>
            </h4>
          </div>
          <div className="p-6">
            <div className="relative border-l-2 border-indigo-100 ml-3 md:ml-4 space-y-8">
              {currentDay.activities.map((activity, aIdx) => (
                <TimelineActivity
                  key={aIdx}
                  time={activity.time}
                  location={activity.location}
                  description={activity.description}
                  price={activity.price}
                  transportNote={activity.transportNote}
                  transportType={transportType}
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-500">No hay días de itinerario disponibles todavía.</p>
      )}
    </div>
  );
};