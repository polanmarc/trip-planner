import React from 'react';
import { Star, ChevronRight } from 'lucide-react';
import { RecommendationItem } from '../molecules/RecommendationItem';
import { Button } from '../atoms/Button';

export const RecommendationsPanel = ({ recommendations }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-4">
      <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" /> Recomendaciones Top
    </h3>
    <ul className="space-y-4">
      {recommendations.map((rec, idx) => (
        <RecommendationItem key={idx} text={rec} />
      ))}
    </ul>
    <div className="mt-8 pt-6 border-t border-slate-100">
      <Button className="w-full py-2 text-sm">
        Guardar Itinerario <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  </div>
);