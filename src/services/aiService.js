const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";

// Plan de respaldo mejorado (sin el fallo de las 30:00 horas y con soporte de precios)
const buildFallbackTripPlan = (formData) => {
  const destination = formData.destination?.trim() || "tu próximo destino";
  const days = Number(formData.days || 3);
  const transport = formData.transport || "transporte principal";
  const style = formData.style || "equilibrado";
  const budget = formData.budget || "Medio";

  const dayTemplates = [
    {
      theme: "Llegada y monumentos principales",
      activities: [
        { desc: "Recorrer el centro histórico, calles principales y tomar un café típico.", loc: "Centro Histórico / Plaza Mayor", time: "09:30", price: "Gratis" },
        { desc: "Visitar el monumento más emblemático y popular del destino.", loc: "Monumento Central", time: "14:00", price: "15€ aprox" },
        { desc: "Disfrutar de una cena con gastronomía local en una zona animada.", loc: "Barrio Tradicional", time: "20:30", price: "25€ aprox" }
      ]
    },
    {
      theme: "Inmersión cultural y atracciones top",
      activities: [
        { desc: "Visitar el museo principal o galería de arte recomendada.", loc: "Museo de la Ciudad", time: "10:00", price: "12€ aprox" },
        { desc: "Paseo por parques emblemáticos y parada para fotos panorámicas.", loc: "Mirador / Parque Principal", time: "15:30", price: "Gratis" },
        { desc: "Cena en un restaurante de comida típica recomendado por locales.", loc: "Zona Gastronómica", time: "21:00", price: "30€ aprox" }
      ]
    }
  ];

  return {
    destination,
    estimatedBudget: `${budget} · estimación orientativa`,
    summary: `Itinerario optimizado para ${destination}. Diseñado para un viaje de ${days} días con un enfoque de ${style.toLowerCase()} moviéndose en ${transport.toLowerCase()}.`,
    days: Array.from({ length: days }, (_, index) => {
      const template = dayTemplates[index % dayTemplates.length];
      return {
        dayNumber: index + 1,
        theme: template.theme,
        activities: template.activities.map((act) => ({
          time: act.time,
          description: act.desc,
          location: `${destination} - ${act.loc}`,
          price: act.price, // Campo de precio adaptado en el fallback
          transportNote: `Trayecto sugerido en ${transport.toLowerCase()}.`
        }))
      };
    }),
    recommendations: [
      "Reserva online con antelación para evitar colas en los monumentos más populares.",
      "Comprueba los horarios de apertura de los lugares culturales antes de ir.",
      "Lleva calzado cómodo; las zonas emblemáticas se disfrutan más a pie."
    ],
    packingList: ["Ropa cómoda", "Calzado de caminata", "Cargador portátil", "Documentación"],
    transportAdvice: {
      summary: `Guía práctica para trasladarse usando ${transport.toLowerCase()}.`,
      estimatedCost: "Sujeto a tarifas locales de la temporada",
      bookingSites: [
        { name: "Google Maps", url: "https://maps.google.com" },
        { name: "Rome2Rio", url: "https://www.rome2rio.com" }
      ]
    }
  };
};

export const generateTripPlan = async (formData) => {
  if (!apiKey) {
    console.warn("No hay API key configurada. Se usará el itinerario de respaldo mejorado.");
    return buildFallbackTripPlan(formData);
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  // PROMPT POTENCIADO: Ahora exige lugares reales y populares según la temática, costes y horas lógicas
  const prompt = `Actúa como un guía turístico local experto y un planificador de viajes profesional de élite. 
  Tu objetivo es diseñar un itinerario de viaje 100% real, ultra-detallado y totalmente personalizado en español para el destino: ${formData.destination}.

  Parámetros del viaje a cumplir estrictamente:
  - Duración: ${formData.days} días.
  - Presupuesto: ${formData.budget}.
  - Estilo/Temática principal: ${formData.style}.
  - Compañía: ${formData.companions}.
  - Medio de transporte principal: ${formData.transport}.
  
  REQUISITOS CRUCIALES DE CONTENIDO (INCUMPLIRLOS ROMPERÁ LA APLICACIÓN):
  1. ESPECIFICIDAD ABSOLUTA EN LUGARES ('location'): Está terminantemente PROHIBIDO usar nombres genéricos o abstractos como "Zona 1", "Centro histórico", "Restaurante local" o "Monumento principal". Debes nombrar LUGARES REALES, CONCRETOS Y FAMOSOS del destino que existan en Google Maps. Por ejemplo, si el destino es "Barcelona", debes recomendar ubicaciones exactas en el campo 'location' como "Plaça de Catalunya", "La Sagrada Família", "Parque Güell", "Casa Batlló", "Barrio Gótico", "Mercado de la Boquería" o destinos emblemáticos cercanos si la duración lo permite (ej: "Costa Brava - Tossa de Mar", "Calella de Palafrugell"). Si el destino es París, usa "Museo del Louvre", "Torre Eiffel", "Montmartre", etc.
  2. COHERENCIA CON LA TEMÁTICA: Las actividades y lugares sugeridos deben girar estrictamente en torno al estilo elegido (${formData.style}). Si es "Cultura y Turismo", prioriza museos, iglesias, plazas históricas y patrimonio; si es "Relax y Playa", prioriza calas, paseos marítimos y zonas de descanso; si es "Aventura", naturaleza, senderismo o experiencias de acción.
  3. HORARIOS LÓGICOS Y REALISTAS ('time'): Usa el formato de 24 horas (ej: "09:00", "13:30", "16:15", "20:30"). Las horas deben ser coherentes con la actividad, el tiempo de desplazamiento y la distancia entre sitios. No programes 6 visitas en 3 horas. Organiza el día con sentido: mañana, mediodía, tarde y noche. Si vas a unir varios lugares, agrúpalos por zona para que el recorrido tenga sentido. Por ejemplo, en una ciudad, no pongas una visita de museo a las 09:00 y otra a 09:30 en otro extremo de la ciudad si no hay tiempo real para llegar. Si se trata de una excursión, deja margen de desplazamiento y horario de regreso.
  4. PRECIOS REALISTAS ('price'): Indica el coste estimado real en la moneda local o en euros por persona de la entrada o el gasto medio (ej: "Gratis", "26€ (Entrada general)", "15€ - 25€ (Gasto medio)", "10€ (Ticket)"). No dejes este campo vacío.
  5. NOTAS DE TRANSPORTE ÚTILES ('transportNote'): Explica brevemente cómo llegar a ese punto exacto o cómo moverse allí optimizando el uso de ${formData.transport} (ej: "Aparcar en el parking subterráneo de la plaza", "Línea 3 del metro hasta la parada Liceu", "Desplazamiento en coche de 25 minutos hasta la costa").
  6. CALIDAD DEL ITINERARIO: El resultado debe parecer un plan pensado para un viajero real, no una lista genérica. Cada actividad debe tener un sentido claro dentro del día y estar alineada con el tiempo que se va a dedicar a visitar ese lugar.

  Devuelve el JSON estructurado con itinerario, presupuesto, resumen del viaje, recomendaciones, consejos de transporte y la lista de equipaje de forma estricta.`;
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          destination: { type: "STRING" },
          estimatedBudget: { type: "STRING" },
          summary: { type: "STRING" },
          days: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                dayNumber: { type: "INTEGER" },
                theme: { type: "STRING" },
                activities: {
                  type: "ARRAY",
                  items: {
                    type: "OBJECT",
                    properties: {
                      time: { type: "STRING" },
                      description: { type: "STRING" },
                      location: { type: "STRING" }, // Nombres reales (Ej: "Museo del Louvre")
                      price: { type: "STRING" },    // <-- NUEVO CAMPO PARA EL PRECIO
                      transportNote: { type: "STRING" }
                    },
                    required: ["time", "description", "location", "price", "transportNote"] // Requerido ahora
                  }
                }
              },
              required: ["dayNumber", "theme", "activities"]
            }
          },
          recommendations: { type: "ARRAY", items: { type: "STRING" } },
          packingList: { type: "ARRAY", items: { type: "STRING" } },
          transportAdvice: {
            type: "OBJECT",
            properties: {
              summary: { type: "STRING" },
              estimatedCost: { type: "STRING" },
              bookingSites: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: { name: { type: "STRING" }, url: { type: "STRING" } },
                  required: ["name", "url"]
                }
              }
            },
            required: ["summary", "estimatedCost", "bookingSites"]
          }
        },
        required: ["destination", "estimatedBudget", "summary", "days", "recommendations", "packingList", "transportAdvice"]
      }
    }
  };

  const delays = [1000, 2000, 4000, 8000, 16000];
  for (let i = 0; i < 5; i++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error(`Error de API: ${response.status}`);
      const data = await response.json();
      const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!resultText) throw new Error("Respuesta vacía de la IA");
      return JSON.parse(resultText);
    } catch (error) {
      console.error(`Intento ${i + 1} fallido:`, error);
      if (i === 4) return buildFallbackTripPlan(formData);
      await new Promise(res => setTimeout(res, delays[i]));
    }
  }
  return buildFallbackTripPlan(formData);
};