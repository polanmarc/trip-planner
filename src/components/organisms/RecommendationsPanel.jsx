import React from 'react';
import { Star, ChevronRight } from 'lucide-react';
import { RecommendationItem } from '../molecules/RecommendationItem';
import { Button } from '../atoms/Button';

export const RecommendationsPanel = ({ recommendations, siteIdeas = [] }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-4">
      <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" /> Recomendaciones Top
    </h3>
    <ul className="space-y-4">
      {recommendations.map((rec, idx) => (
        <RecommendationItem key={idx} text={rec} />
      ))}
    </ul>

    {siteIdeas.length > 0 && (
      <div className="mt-8 pt-6 border-t border-slate-100">
        <h4 className="text-lg font-semibold text-slate-900 mb-4">Ideas de sitios según tus temáticas</h4>
        <div className="space-y-3">
          {siteIdeas.map((idea, idx) => (
            <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-800">{idea.name}</p>
                  <p className="text-sm text-slate-500">{idea.category}</p>
                </div>
                <span className="text-sm font-semibold text-indigo-600">{idea.estimatedCost}</span>
              </div>
              <div className="mt-2 text-sm text-slate-600 space-y-1">
                <p><span className="font-medium">Entrada:</span> {idea.entryTime}</p>
                <p><span className="font-medium">Salida:</span> {idea.exitTime}</p>
                <p><span className="font-medium">Por qué encaja:</span> {idea.whyItFits}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}

    <div className="mt-8 pt-6 border-t border-slate-100">
      <Button className="w-full py-2 text-sm">
        Guardar Itinerario <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  </div>
);