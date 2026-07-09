import React from 'react';
import { Car, Bus, Train, Plane, Ship, Compass } from 'lucide-react';

export const TransportIcon = ({ type, className = "w-5 h-5 text-indigo-600" }) => {
  if (type.includes('Coche')) return <Car className={className} />;
  if (type.includes('Público')) return <Bus className={className} />;
  if (type.includes('AVE') || type.includes('Tren')) return <Train className={className} />;
  if (type.includes('Avión')) return <Plane className={className} />;
  if (type.includes('Barco') || type.includes('Ferry')) return <Ship className={className} />;
  return <Compass className={className} />;
};