import React from 'react';
import { Plane } from 'lucide-react';
import { Button } from '../atoms/Button';

export const Navbar = ({ onLogoClick, showNewTripButton }) => (
  <nav className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <div className="flex items-center gap-2 cursor-pointer" onClick={onLogoClick}>
        <div className="bg-indigo-600 p-2 rounded-xl text-white">
          <Plane className="w-5 h-5" />
        </div>
        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
          ViajeIA
        </span>
      </div>
      {showNewTripButton && (
        <Button variant="ghost" onClick={onLogoClick}>Nuevo Viaje</Button>
      )}
    </div>
  </nav>
);