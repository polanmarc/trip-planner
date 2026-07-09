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
    destination: '',
    days: 3,
    budget: 'Medio',
    style: 'Cultura y Turismo',
    companions: 'Pareja',
    transport: 'Coche Propio / Alquiler'
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.destination.trim()) {
      setError('Por favor, ingresa un destino.');
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
          <PlannerForm formData={formData} onChange={handleInputChange} onSubmit={handleSubmit} error={error} />
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
                days={formData.days}
                style={formData.style}
                transport={formData.transport}
              />
            }
            mainContent={<DailyItineraryTimeline days={tripData.days} transportType={formData.transport} />}
            sidebarContent={
              <>
                <LogisticsPanel transport={formData.transport} transportAdvice={tripData.transportAdvice} destination={tripData.destination} />
                
                <RecommendationsPanel recommendations={tripData.recommendations} />
              </>
            }
          />
        )}
      </main>
    </div>
  );
}