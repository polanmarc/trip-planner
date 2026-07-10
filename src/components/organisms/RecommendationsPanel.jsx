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
  </div>
);