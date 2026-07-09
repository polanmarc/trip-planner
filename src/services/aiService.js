const apiKey = import.meta.env.VITE_GEMINI_API_KEY || ""; // Reemplaza con tu API Key real

export const generateTripPlan = async (formData) => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  
  const prompt = `Actúa como un expertísimo planificador de viajes. Crea un itinerario detallado en español para un viaje a ${formData.destination}. 
  Duración: ${formData.days} días.
  Presupuesto estimado: ${formData.budget}.
  Estilo de viaje: ${formData.style}.
  Compañía: ${formData.companions}.
  Medio de transporte principal: ${formData.transport}.
  
  REQUISITOS ADICIONALES:
  1. Adapta el itinerario según el medio de transporte elegido.
  2. Genera una lista de equipaje sugerida de entre 8 y 12 elementos basados de forma estricta en el clima típico del destino y el estilo de viaje (${formData.style}).
  
  Devuelve un JSON estructurado con itinerario, presupuesto, resumen del viaje, recomendaciones, consejos de transporte y la lista de equipaje.`;

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
                      location: { type: "STRING" },
                      transportNote: { type: "STRING" }
                    },
                    required: ["time", "description", "location", "transportNote"]
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
        required: ["destination", "estimatedBudget", "summary", "days", "recommendations", "packingList", "transportAdvice"] // <-- AÑADIDO AQUÍ TAMBIÉN
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
      if (i === 4) throw error;
      await new Promise(res => setTimeout(res, delays[i]));
    }
  }
};