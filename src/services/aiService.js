const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";

const calculateTripDays = (departureDate, returnDate) => {
  if (!departureDate || !returnDate) return 3;
  const start = new Date(departureDate);
  const end = new Date(returnDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 3;
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((end - start) / msPerDay) + 1;
};

// Plan de respaldo mejorado (sin el fallo de las 30:00 horas y con soporte de precios)
const buildFallbackTripPlan = (formData) => {
  const origin = formData.origin?.trim() || "tu origen";
  const destination = formData.destination?.trim() || "tu próximo destino";
  const departureDate = formData.departureDate || "";
  const returnDate = formData.returnDate || "";
  const days = calculateTripDays(departureDate, returnDate);
  const transport = formData.transport || "transporte principal";
  const style = formData.style || "equilibrado";
  const budget = formData.budget || "Medio";
  const selectedThemes = (formData.themes || []).length > 0 ? formData.themes : [style];

  const getTravelCostEstimate = (originCity, destinationCity, transportMode) => {
    const normalizedMode = transportMode.toLowerCase();

    if (normalizedMode.includes('avión')) {
      return `Vuelo estimado desde ${originCity} hasta ${destinationCity}: 120€ - 450€ aprox.`;
    }

    if (normalizedMode.includes('tren')) {
      return `Tren estimado desde ${originCity} hasta ${destinationCity}: 40€ - 180€ aprox.`;
    }

    if (normalizedMode.includes('coche')) {
      return `Carretera estimada para ${originCity} → ${destinationCity}: 80€ - 220€ en gasolina y peajes.`;
    }

    if (normalizedMode.includes('transporte público')) {
      return `Transporte público interurbano estimado para ${originCity} → ${destinationCity}: 30€ - 90€.`;
    }

    if (normalizedMode.includes('barco') || normalizedMode.includes('ferry')) {
      return `Ferry estimado para ${originCity} → ${destinationCity}: 80€ - 200€.`;
    }

    return `Costo estimado según el trayecto de ${originCity} a ${destinationCity} y el transporte elegido.`;
  };

  const buildSiteIdeas = () => {
    const ideas = [];

    if (selectedThemes.includes('Cultura y Patrimonio') || selectedThemes.includes('Cultura y Turismo')) {
      ideas.push({
        name: `${destination} - Centro histórico y patrimonio`,
        category: 'Cultura',
        estimatedCost: '10€ - 20€',
        entryTime: '09:30',
        exitTime: '12:30',
        whyItFits: 'Encaja muy bien con el estilo cultural y permite recorrer puntos emblemáticos sin prisas.'
      });
    }

    if (selectedThemes.includes('Naturaleza y Senderismo') || selectedThemes.includes('Aventura y Naturaleza')) {
      ideas.push({
        name: `${destination} - Mirador o ruta natural recomendada`,
        category: 'Naturaleza',
        estimatedCost: 'Gratis - 12€',
        entryTime: '08:30',
        exitTime: '13:00',
        whyItFits: 'Ideal si quieres una experiencia activa y con vistas panorámicas.'
      });
    }

    if (selectedThemes.includes('Gastronomía Local') || selectedThemes.includes('Gastronomía')) {
      ideas.push({
        name: `${destination} - Mercado o ruta gastronómica`,
        category: 'Gastronomía',
        estimatedCost: '15€ - 35€',
        entryTime: '12:30',
        exitTime: '15:00',
        whyItFits: 'Perfecto para disfrutar de la cocina local y probar platos típicos.'
      });
    }

    if (selectedThemes.includes('Playas y Relax') || selectedThemes.includes('Relax y Playa')) {
      ideas.push({
        name: `${destination} - Zona costera o playa recomendada`,
        category: 'Relax',
        estimatedCost: 'Gratis - 10€',
        entryTime: '10:00',
        exitTime: '17:00',
        whyItFits: 'Muy adecuado si buscas desconectar y disfrutar del entorno marítimo.'
      });
    }

    if (ideas.length === 0) {
      ideas.push({
        name: `${destination} - Lugar destacado del destino`,
        category: 'General',
        estimatedCost: '8€ - 25€',
        entryTime: '10:00',
        exitTime: '13:00',
        whyItFits: 'Una propuesta versátil para empezar a descubrir el destino con buen ritmo.'
      });
    }

    return ideas.slice(0, 3);
  };

  const getDestinationDayPlans = (targetDestination) => {
    const normalized = targetDestination.toLowerCase();

    if (normalized.includes('barcelona')) {
      return [
        {
          theme: 'Llegada y primeras postales',
          activities: [
            { desc: 'Visitar Plaça de Catalunya', loc: 'Plaça de Catalunya', time: '09:30', price: 'Gratis' },
            { desc: 'Explorar el Mercado de la Boquería', loc: 'Mercat de Sant Josep de la Boquería', time: '11:30', price: '20€ - 30€' },
            { desc: 'Pasear por Las Ramblas hasta el Port Vell', loc: 'Las Ramblas', time: '14:00', price: 'Gratis' }
          ]
        },
        {
          theme: 'Cultura modernista',
          activities: [
            { desc: 'Visitar La Sagrada Família', loc: 'La Sagrada Família', time: '10:00', price: '26€' },
            { desc: 'Recorrer Casa Batlló', loc: 'Casa Batlló', time: '13:00', price: '35€' },
            { desc: 'Subir al Parque Güell', loc: 'Parc Güell', time: '17:00', price: '10€' }
          ]
        },
        {
          theme: 'Relax y mar',
          activities: [
            { desc: 'Tomar el sol en la playa de la Barceloneta', loc: 'Playa de la Barceloneta', time: '10:00', price: 'Gratis' },
            { desc: 'Comer paella en el barrio del Born', loc: 'El Born', time: '13:00', price: '20€ - 30€' },
            { desc: 'Terminar el día en el parque de la Ciutadella', loc: 'Parc de la Ciutadella', time: '17:00', price: 'Gratis' }
          ]
        }
      ];
    }

    if (normalized.includes('paris')) {
      return [
        {
          theme: 'Llegada y primeras vistas',
          activities: [
            { desc: 'Visitar Place de la Concorde', loc: 'Place de la Concorde', time: '09:30', price: 'Gratis' },
            { desc: 'Pasear por los Campos Elíseos', loc: 'Avenue des Champs-Élysées', time: '11:00', price: 'Gratis' },
            { desc: 'Subir al Arco del Triunfo', loc: 'Arco del Triunfo', time: '13:00', price: '16€' }
          ]
        },
        {
          theme: 'Museos y patrimonio',
          activities: [
            { desc: 'Entrar al Museo del Louvre', loc: 'Museo del Louvre', time: '10:00', price: '22€' },
            { desc: 'Visitar la Sainte-Chapelle', loc: 'Sainte-Chapelle', time: '14:00', price: '12€' },
            { desc: 'Caminar por el Barrio Latino', loc: 'Barrio Latino', time: '16:30', price: 'Gratis' }
          ]
        },
        {
          theme: 'Torre Eiffel y río Sena',
          activities: [
            { desc: 'Ver la Torre Eiffel al atardecer', loc: 'Torre Eiffel', time: '19:00', price: '35€' },
            { desc: 'Paseo en barco por el Sena', loc: 'Río Sena', time: '20:30', price: '18€ - 25€' },
            { desc: 'Cena en el barrio de Saint-Germain', loc: 'Saint-Germain-des-Prés', time: '22:00', price: '30€ - 40€' }
          ]
        }
      ];
    }

    if (normalized.includes('madrid')) {
      return [
        {
          theme: 'Bienvenida y plazas clásicas',
          activities: [
            { desc: 'Recorrer Plaza Mayor', loc: 'Plaza Mayor', time: '09:30', price: 'Gratis' },
            { desc: 'Probar un bocata en el Mercado de San Miguel', loc: 'Mercado de San Miguel', time: '11:30', price: '15€ - 25€' },
            { desc: 'Visitar la Puerta del Sol', loc: 'Puerta del Sol', time: '13:00', price: 'Gratis' }
          ]
        },
        {
          theme: 'Museos y arte',
          activities: [
            { desc: 'Visitar el Museo del Prado', loc: 'Museo del Prado', time: '10:00', price: '15€' },
            { desc: 'Caminar por el Parque del Retiro', loc: 'Parque del Retiro', time: '14:00', price: 'Gratis' },
            { desc: 'Cena en el barrio de La Latina', loc: 'La Latina', time: '20:00', price: '20€ - 30€' }
          ]
        },
        {
          theme: 'Gastronomía y terraceo',
          activities: [
            { desc: 'Tomar churros en San Ginés', loc: 'Chocolatería San Ginés', time: '10:00', price: '7€' },
            { desc: 'Visitar el Palacio Real', loc: 'Palacio Real de Madrid', time: '12:00', price: '14€' },
            { desc: 'Tapear en el Mercado de San Antón', loc: 'Mercado de San Antón', time: '19:00', price: '25€ - 35€' }
          ]
        }
      ];
    }

    if (normalized.includes('valencia')) {
      return [
        {
          theme: 'Ciutat de les Arts i les Ciències',
          activities: [
            { desc: 'Visitar la Ciudad de las Artes y las Ciencias', loc: 'Ciudad de las Artes y las Ciencias', time: '10:00', price: '18€' },
            { desc: 'Almorzar en el Mercado Central', loc: 'Mercat Central', time: '13:00', price: '15€ - 25€' },
            { desc: 'Caminar por el barrio del Carmen', loc: 'Barri del Carme', time: '16:00', price: 'Gratis' }
          ]
        },
        {
          theme: 'Playa y relax',
          activities: [
            { desc: 'Pasar la mañana en la Playa de la Malvarrosa', loc: 'Playa de la Malvarrosa', time: '10:00', price: 'Gratis' },
            { desc: 'Comer una paella junto al mar', loc: 'Playa de la Patacona', time: '14:00', price: '25€ - 35€' },
            { desc: 'Atardecer en la Marina Real', loc: 'Marina Real Juan Carlos I', time: '18:00', price: 'Gratis' }
          ]
        },
        {
          theme: 'Cultura local',
          activities: [
            { desc: 'Visitar la Lonja de la Seda', loc: 'La Lonja de la Seda', time: '10:00', price: '2€' },
            { desc: 'Pasear por los Jardines del Turia', loc: 'Jardines del Turia', time: '12:00', price: 'Gratis' },
            { desc: 'Probar horchata en Alboraia', loc: 'Alboraia', time: '16:00', price: '5€ - 10€' }
          ]
        }
      ];
    }

    return [
      {
        theme: 'Llegada y principales puntos de interés',
        activities: [
          { desc: `Visitar el punto histórico más representativo de ${destination}`, loc: `${destination} - punto histórico principal`, time: '09:30', price: 'Gratis' },
          { desc: `Recorrer el mercado o plaza central de ${destination}`, loc: `${destination} - mercado/plaza central`, time: '12:00', price: 'Gratis - 10€' },
          { desc: `Terminar con un paseo por un parque o mirador de ${destination}`, loc: `${destination} - parque/mirador principal`, time: '17:00', price: 'Gratis' }
        ]
      },
      {
        theme: 'Cultura y patrimonio local',
        activities: [
          { desc: `Visitar un museo o galería representativa de ${destination}`, loc: `${destination} - museo principal`, time: '10:00', price: '10€ - 20€' },
          { desc: `Almorzar en una zona gastronómica típica de ${destination}`, loc: `${destination} - zona gastronómica`, time: '13:00', price: '20€ - 30€' },
          { desc: `Pasear por un barrio histórico o casco antiguo de ${destination}`, loc: `${destination} - barrio histórico`, time: '16:00', price: 'Gratis' }
        ]
      },
      {
        theme: 'Experiencia local y relax',
        activities: [
          { desc: `Descubrir un mercado local o producto típico de ${destination}`, loc: `${destination} - mercado local`, time: '10:30', price: '10€ - 20€' },
          { desc: `Visitar un espacio verde o ruta al aire libre en ${destination}`, loc: `${destination} - espacio verde`, time: '14:00', price: 'Gratis' },
          { desc: `Cena en un restaurante con cocina local`, loc: `${destination} - restaurante recomendado`, time: '20:00', price: '25€ - 35€' }
        ]
      }
    ];
  };

  const buildDailyPlans = (destination, totalDays) => {
    const destinationPlans = getDestinationDayPlans(destination);
    const dailyPlans = [];

    for (let i = 0; i < totalDays; i += 1) {
      const sourcePlan = destinationPlans[i] || destinationPlans[i % destinationPlans.length];
      dailyPlans.push({
        dayNumber: i + 1,
        theme: sourcePlan.theme,
        activities: sourcePlan.activities.map((act, activityIndex) => {
          const baseHour = parseInt(act.time.split(':')[0], 10);
          const shiftedHour = Math.min(baseHour + i, 20);
          const shiftedTime = `${shiftedHour.toString().padStart(2, '0')}:${act.time.split(':')[1]}`;

          return {
            time: shiftedTime,
            description: act.desc,
            location: `${destination} - ${act.loc}`,
            price: act.price,
            transportNote: `Trayecto sugerido en ${transport.toLowerCase()}.`
          };
        })
      });
    }

    return dailyPlans;
  };

  return {
    destination,
    departureDate,
    returnDate,
    estimatedBudget: `${budget} · estimación orientativa`,
    summary: `Itinerario optimizado para ${destination} desde ${origin}, con salida el ${departureDate} y regreso el ${returnDate}. Diseñado para ${days} días con un enfoque de ${style.toLowerCase()} y temáticas ${selectedThemes.join(', ').toLowerCase()}, moviéndose en ${transport.toLowerCase()}.`,
    days: buildDailyPlans(destination, days),
    recommendations: [
      "Reserva online con antelación para evitar colas en los monumentos más populares.",
      "Comprueba los horarios de apertura de los lugares culturales antes de ir.",
      "Lleva calzado cómodo; las zonas emblemáticas se disfrutan más a pie."
    ],
    packingList: ["Ropa cómoda", "Calzado de caminata", "Cargador portátil", "Documentación"],
    siteIdeas: buildSiteIdeas(),
    transportAdvice: {
      summary: `Guía práctica para trasladarte desde ${origin} hasta ${destination} usando ${transport.toLowerCase()}.`,
      travelCost: getTravelCostEstimate(origin, destination, transport),
      estimatedCost: "Gastos principales estimados para el trayecto entre origen y destino."
    }
  };
};

export const generateTripPlan = async (formData) => {
  if (!apiKey) {
    console.warn("No hay API key configurada. Se usará el itinerario de respaldo mejorado.");
    return buildFallbackTripPlan(formData);
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const tripDays = calculateTripDays(formData.departureDate, formData.returnDate);

  // PROMPT POTENCIADO: Ahora exige lugares reales y populares según la temática, costes y horas lógicas
  const prompt = `Actúa como un guía turístico local experto y un planificador de viajes profesional de élite. 
  Tu objetivo es diseñar un itinerario de viaje 100% real, ultra-detallado y totalmente personalizado en español para el destino: ${formData.destination}.

  Parámetros del viaje a cumplir estrictamente:
  - Origen: ${formData.origin || 'No especificado'}.
  - Destino final: ${formData.destination}.
  - Ida: ${formData.departureDate || 'No especificada'}.
  - Vuelta: ${formData.returnDate || 'No especificada'}.
  - Duración total: ${tripDays} días.
  - Presupuesto: ${formData.budget}.
  - Estilo/Temática principal: ${formData.style}.
  - Temáticas adicionales seleccionadas: ${(formData.themes || []).join(', ') || 'Ninguna'}.
  - Compañía: ${formData.companions}.
  - Medio de transporte principal: ${formData.transport}.
  
  REQUISITOS CRUCIALES DE CONTENIDO (INCUMPLIRLOS ROMPERÁ LA APLICACIÓN):
  1. ESPECIFICIDAD ABSOLUTA EN LUGARES ('location'): Está terminantemente PROHIBIDO usar nombres genéricos o abstractos como "Zona 1", "Centro histórico", "Restaurante local" o "Monumento principal". Debes nombrar LUGARES REALES, CONCRETOS Y FAMOSOS del destino que existan en Google Maps. Por ejemplo, si el destino es "Barcelona", debes recomendar ubicaciones exactas en el campo 'location' como "Plaça de Catalunya", "La Sagrada Família", "Parque Güell", "Casa Batlló", "Barrio Gótico", "Mercado de la Boquería" o destinos emblemáticos cercanos si la duración lo permite (ej: "Costa Brava - Tossa de Mar", "Calella de Palafrugell"). Si el destino es París, usa "Museo del Louvre", "Torre Eiffel", "Montmartre", etc.
  2. COHERENCIA CON LA TEMÁTICA: Las actividades y lugares sugeridos deben girar estrictamente en torno al estilo elegido (${formData.style}). Si es "Cultura y Turismo", prioriza museos, iglesias, plazas históricas y patrimonio; si es "Relax y Playa", prioriza calas, paseos marítimos y zonas de descanso; si es "Aventura", naturaleza, senderismo o experiencias de acción.
  3. HORARIOS LÓGICOS Y REALISTAS ('time'): Usa el formato de 24 horas (ej: "09:00", "13:30", "16:15", "20:30"). Las horas deben ser coherentes con la actividad, el tiempo de desplazamiento y la distancia entre sitios. No programes 6 visitas en 3 horas. Organiza el día con sentido: mañana, mediodía, tarde y noche. Si vas a unir varios lugares, agrúpalos por zona para que el recorrido tenga sentido. Por ejemplo, en una ciudad, no pongas una visita de museo a las 09:00 y otra a 09:30 en otro extremo de la ciudad si no hay tiempo real para llegar. Si se trata de una excursión, deja margen de desplazamiento y horario de regreso.
  3b. LUGARES EXACTOS Y CONCRETOS: En cada actividad, el campo 'description' debe empezar con el nombre exacto del sitio y el campo 'location' debe repetir ese mismo lugar, por ejemplo: description: "Visitar La Sagrada Família" y location: "La Sagrada Família". No uses nombres genéricos como 'Monumento Central' o 'Zona 1'.
  4. PRECIOS REALISTAS ('price'): Indica el coste estimado real en la moneda local o en euros por persona de la entrada o el gasto medio (ej: "Gratis", "26€ (Entrada general)", "15€ - 25€ (Gasto medio)", "10€ (Ticket)"). No dejes este campo vacío.
  5. NOTAS DE TRANSPORTE ÚTILES ('transportNote'): Explica brevemente cómo llegar a ese punto exacto o cómo moverse allí optimizando el uso de ${formData.transport} (ej: "Aparcar en el parking subterráneo de la plaza", "Línea 3 del metro hasta la parada Liceu", "Desplazamiento en coche de 25 minutos hasta la costa").
  6. CALIDAD DEL ITINERARIO: El resultado debe parecer un plan pensado para un viajero real, no una lista genérica. Cada actividad debe tener un sentido claro dentro del día y estar alineada con el tiempo que se va a dedicar a visitar ese lugar.
  7. IDEAS DE SITIOS POR TEMÁTICA: Añade un bloque llamado 'siteIdeas' con 3 ideas concretas de sitios que encajen con las temáticas seleccionadas. Cada idea debe incluir: name, category, estimatedCost, entryTime, exitTime y whyItFits. Usa nombres reales de lugares, no genéricos. Si el destino es Barcelona, por ejemplo, puedes incluir sitios como Plaça de Catalunya, La Sagrada Família o Parc de la Ciutadella.
  8. COSTE DE DESPLAZAMIENTO: Usa el origen, el destino y el transporte elegido para hacer la estimación de transporte más útil posible, por ejemplo vuelos, tren, gasolina o transporte público.

  Devuelve el JSON estructurado con itinerario, presupuesto, resumen del viaje, recomendaciones, consejos de transporte, la lista de equipaje y el bloque de siteIdeas de forma estricta.`;
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
          siteIdeas: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                name: { type: "STRING" },
                category: { type: "STRING" },
                estimatedCost: { type: "STRING" },
                entryTime: { type: "STRING" },
                exitTime: { type: "STRING" },
                whyItFits: { type: "STRING" }
              },
              required: ["name", "category", "estimatedCost", "entryTime", "exitTime", "whyItFits"]
            }
          },
          transportAdvice: {
            type: "OBJECT",
            properties: {
              summary: { type: "STRING" },
              travelCost: { type: "STRING" },
              estimatedCost: { type: "STRING" }
            },
            required: ["summary", "travelCost", "estimatedCost"]
          }
        },
        required: ["destination", "estimatedBudget", "summary", "days", "recommendations", "packingList", "siteIdeas", "transportAdvice"]
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