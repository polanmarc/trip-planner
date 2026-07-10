import React, { useState } from 'react';
import { generateTripPlan } from './services/aiService';
import { Navbar } from './components/organisms/Navbar';
import { PlannerForm } from './components/organisms/PlannerForm';
import { LoadingScreen } from './components/organisms/LoadingScreen';
import { TripSummaryHeader } from './components/organisms/TripSummaryHeader';
import { DailyItineraryTimeline } from './components/organisms/DailyItineraryTimeline';
import { LogisticsPanel } from './components/organisms/LogisticsPanel';
import { RecommendationsPanel } from './components/organisms/RecommendationsPanel';
import { ResultsPageTemplate } from './components/templates/ResultsPageTemplate';
import { PackingListPanel } from './components/organisms/PackingListPanel';

export default function App() {
  const [step, setStep] = useState('form'); 
  const [error, setError] = useState('');
  const [tripData, setTripData] = useState(null);
  
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    departureDate: '',
    returnDate: '',
    budget: 'Medio',
    style: 'Cultura y Turismo',
    companions: 'Pareja',
    transport: 'Coche Propio / Alquiler',
    themes: []
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleThemeToggle = (theme) => {
    setFormData(prev => {
      const alreadySelected = prev.themes.includes(theme);
      return {
        ...prev,
        themes: alreadySelected
          ? prev.themes.filter((item) => item !== theme)
          : [...prev.themes, theme]
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.origin.trim() || !formData.destination.trim()) {
      setError('Por favor, ingresa el origen y el destino final.');
      return;
    }

    if (!formData.departureDate || !formData.returnDate) {
      setError('Por favor, selecciona la fecha de ida y la fecha de vuelta.');
      return;
    }

    const departure = new Date(formData.departureDate);
    const arrival = new Date(formData.returnDate);

    if (Number.isNaN(departure.getTime()) || Number.isNaN(arrival.getTime())) {
      setError('Las fechas ingresadas no son válidas. Por favor, verifica los valores.');
      return;
    }

    if (arrival < departure) {
      setError('La fecha de vuelta debe ser igual o posterior a la fecha de ida.');
      return;
    }
    
    setError('');
    setStep('loading');
    
    try {
      const result = await generateTripPlan(formData);
      setTripData(result);
      setStep('result');
    } catch (err) {
      console.error(err);
      setError('Hubo un problema al generar tu itinerario. Por favor, intenta de nuevo.');
      setStep('form');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <Navbar onLogoClick={() => setStep('form')} showNewTripButton={step === 'result'} />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {step === 'form' && (
          <PlannerForm
            formData={formData}
            onChange={handleInputChange}
            onThemeToggle={handleThemeToggle}
            onSubmit={handleSubmit}
            error={error}
          />
        )}
        {step === 'loading' && (
          <LoadingScreen destination={formData.destination} transport={formData.transport} />
        )}
        {step === 'result' && tripData && (
          <ResultsPageTemplate
            header={
              <TripSummaryHeader
                destination={tripData.destination}
                summary={tripData.summary}
                budget={tripData.estimatedBudget}
                days={tripData.days?.length || 0}
                style={formData.style}
                transport={formData.transport}
                formData={formData}
                tripData={tripData}
              />
            }
            mainContent={<DailyItineraryTimeline days={tripData.days} transportType={formData.transport} />}
            sidebarContent={
              <>
                <LogisticsPanel origin={formData.origin} destination={tripData.destination} transport={formData.transport} transportAdvice={tripData.transportAdvice} />
                
                <RecommendationsPanel recommendations={tripData.recommendations} siteIdeas={tripData.siteIdeas} />
              </>
            }
          />
        )}
      </main>
    </div>
  );
}