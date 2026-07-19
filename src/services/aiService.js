const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
const geminiModel = import.meta.env.VITE_GEMINI_MODEL || "gemini-3.5-flash";

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent`;
const MAX_ATTEMPTS = 5;
const REQUEST_TIMEOUT_MS = 90_000;
const RETRY_DELAYS_MS = [1_000, 2_000, 4_000, 8_000];

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

const safeText = (value, fallback = "No especificado") => {
  const text = String(value ?? "").trim();
  return text || fallback;
};

const shuffleArray = (items, randomizer = Math.random) => {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(randomizer() * (index + 1));
    const temp = shuffled[index];
    shuffled[index] = shuffled[swapIndex];
    shuffled[swapIndex] = temp;
  }

  return shuffled;
};

const calculateTripDays = (departureDate, returnDate) => {
  if (!departureDate || !returnDate) return 3;

  const start = new Date(`${departureDate}T00:00:00`);
  const end = new Date(`${returnDate}T00:00:00`);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    end < start
  ) {
    return 3;
  }

  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((end - start) / msPerDay) + 1;
};

const normalizeText = value =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " y ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const GENERIC_PLACE_WORDS = new Set([
  "a",
  "al",
  "and",
  "at",
  "avenue",
  "basilica",
  "basilique",
  "basilika",
  "calle",
  "cathedral",
  "catedral",
  "church",
  "de",
  "del",
  "della",
  "der",
  "des",
  "di",
  "du",
  "el",
  "en",
  "glorieta",
  "iglesia",
  "la",
  "las",
  "le",
  "les",
  "los",
  "market",
  "mercado",
  "musee",
  "museo",
  "museum",
  "of",
  "palace",
  "palacio",
  "parc",
  "park",
  "parque",
  "paseo",
  "plaza",
  "place",
  "square",
  "street",
  "the",
  "torre",
  "tower",
  "via"
]);

const VAGUE_SINGLE_TOKENS = new Set([
  "central",
  "centro",
  "historico",
  "local",
  "main",
  "municipal",
  "nacional",
  "national",
  "principal",
  "real",
  "royal"
]);

const getDistinctiveLocationTokens = value => {
  const allTokens = normalizeText(value).split(" ").filter(Boolean);

  const distinctiveTokens = allTokens.filter(
    token => !GENERIC_PLACE_WORDS.has(token)
  );

  if (
    distinctiveTokens.length === 1 &&
    VAGUE_SINGLE_TOKENS.has(distinctiveTokens[0])
  ) {
    return allTokens;
  }

  return distinctiveTokens.length > 0
    ? distinctiveTokens
    : allTokens;
};

const jaccardSimilarity = (tokensA, tokensB) => {
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);

  const intersection = [...setA].filter(
    token => setB.has(token)
  ).length;

  const union = new Set([
    ...setA,
    ...setB
  ]).size;

  return union === 0
    ? 0
    : intersection / union;
};

const areSamePhysicalLocation = (
  locationA,
  locationB
) => {
  const normalizedA = normalizeText(locationA);
  const normalizedB = normalizeText(locationB);

  if (!normalizedA || !normalizedB) {
    return false;
  }

  if (normalizedA === normalizedB) {
    return true;
  }

  const tokensA =
    getDistinctiveLocationTokens(locationA);

  const tokensB =
    getDistinctiveLocationTokens(locationB);

  const keyA = [...tokensA]
    .sort()
    .join(" ");

  const keyB = [...tokensB]
    .sort()
    .join(" ");

  if (keyA && keyA === keyB) {
    return true;
  }

  const smaller =
    tokensA.length <= tokensB.length
      ? tokensA
      : tokensB;

  const larger =
    tokensA.length <= tokensB.length
      ? tokensB
      : tokensA;

  const smallerIsSubset = smaller.every(
    token => larger.includes(token)
  );

  if (
    smaller.length >= 2 &&
    smallerIsSubset
  ) {
    return true;
  }

  return (
    jaccardSimilarity(
      tokensA,
      tokensB
    ) >= 0.8
  );
};

const GENERIC_LOCATION_PATTERNS = [
  /^centro historico(?: de .*)?$/,
  /^casco antiguo(?: de .*)?$/,
  /^restaurante local(?: de .*)?$/,
  /^restaurante recomendado(?: de .*)?$/,
  /^monumento principal(?: de .*)?$/,
  /^museo principal(?: de .*)?$/,
  /^mercado local(?: de .*)?$/,
  /^mercado tipico(?: de .*)?$/,
  /^mercado central(?: de .*)?$/,
  /^parque principal(?: de .*)?$/,
  /^mirador principal(?: de .*)?$/,
  /^mirador recomendado(?: de .*)?$/,
  /^playa cercana(?: de .*)?$/,
  /^playa recomendada(?: de .*)?$/,
  /^zona turistica(?: de .*)?$/,
  /^zona gastronomica(?: de .*)?$/,
  /^zona costera(?: de .*)?$/,
  /^lugar destacado(?: de .*)?$/,
  /^punto historico principal(?: de .*)?$/,
  /^espacio verde(?: de .*)?$/,
  /^barrio historico(?: de .*)?$/,
  /^zona \d+$/
];

const isGenericLocation = location => {
  const normalized =
    normalizeText(location);

  return GENERIC_LOCATION_PATTERNS.some(
    pattern => pattern.test(normalized)
  );
};

const isValidHttpUrl = value => {
  try {
    const url = new URL(
      String(value ?? "")
    );

    return (
      url.protocol === "http:" ||
      url.protocol === "https:"
    );
  } catch {
    return false;
  }
};

const isValidTime = value => {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(
    String(value ?? "")
  );
};

const timeToMinutes = value => {
  const [hours, minutes] = value
    .split(":")
    .map(Number);

  return (
    hours * 60 +
    minutes
  );
};

class TripPlanValidationError extends Error {
  constructor(
    message,
    details = {}
  ) {
    super(message);

    this.name =
      "TripPlanValidationError";

    this.details =
      details;
  }
}

class GeminiRequestError extends Error {
  constructor(
    message,
    status = 0,
    retryable = true
  ) {
    super(message);

    this.name =
      "GeminiRequestError";

    this.status =
      status;

    this.retryable =
      retryable;
  }
}

const buildFallbackActivities = (destination, transport, dayIndex, usedLocations = []) => {
  const destinationName = safeText(destination, "tu destino").trim();
  const transportLabel = safeText(transport, "transporte principal").toLowerCase();
  const normalizedDestination = normalizeText(destinationName);
  const normalizedUsedLocations = new Set(
    Array.from(usedLocations || [], location => normalizeText(location))
  );

  const placeMap = {
    barcelona: [
      [
        { time: "09:00", description: "Visitar Plaça de Catalunya", location: "Plaça de Catalunya", price: "Gratis", priceStatus: "FREE", sourceName: "", sourceUrl: "", transportNote: `Llegar con ${transportLabel} hasta el centro y recorrer la zona a pie.` },
        { time: "12:30", description: "Explorar el Mercado de la Boquería", location: "Mercat de Sant Josep de la Boquería", price: "15€ - 25€ · estimación orientativa", priceStatus: "ESTIMATED", sourceName: "", sourceUrl: "", transportNote: `Desplazarse en ${transportLabel} hasta la zona del mercado.` },
        { time: "17:00", description: "Pasar la tarde por la Barceloneta", location: "Playa de la Barceloneta", price: "Gratis", priceStatus: "FREE", sourceName: "", sourceUrl: "", transportNote: `Continuar en ${transportLabel} hasta la costa.` }
      ],
      [
        { time: "09:30", description: "Recorrer la Sagrada Família", location: "La Sagrada Família", price: "26€ · estimación orientativa", priceStatus: "ESTIMATED", sourceName: "", sourceUrl: "", transportNote: `Llegar en ${transportLabel} hasta la zona de Gaudí.` },
        { time: "13:00", description: "Visitar Casa Batlló", location: "Casa Batlló", price: "35€ · estimación orientativa", priceStatus: "ESTIMATED", sourceName: "", sourceUrl: "", transportNote: `Desplazarse a pie hacia el edificio modernista.` },
        { time: "18:00", description: "Subir al Parque Güell al atardecer", location: "Parque Güell", price: "10€ · estimación orientativa", priceStatus: "ESTIMATED", sourceName: "", sourceUrl: "", transportNote: `Usar ${transportLabel} hasta la entrada principal.` }
      ],
      [
        { time: "10:00", description: "Pasear por el barrio Gótico", location: "Barri Gòtic", price: "Gratis", priceStatus: "FREE", sourceName: "", sourceUrl: "", transportNote: `Llegar en ${transportLabel} y explorar a pie.` },
        { time: "13:30", description: "Probar tapas en el Born", location: "El Born", price: "20€ - 30€ · estimación orientativa", priceStatus: "ESTIMATED", sourceName: "", sourceUrl: "", transportNote: `Moverse a pie desde el casco histórico.` },
        { time: "18:30", description: "Disfrutar del parque de la Ciutadella", location: "Parque de la Ciudadela", price: "Gratis", priceStatus: "FREE", sourceName: "", sourceUrl: "", transportNote: `Terminar en ${transportLabel} o a pie.` }
      ],
      [
        { time: "09:15", description: "Subir a Montjuïc", location: "Montjuïc", price: "Gratis", priceStatus: "FREE", sourceName: "", sourceUrl: "", transportNote: `Llegar en ${transportLabel} y subir en funicular o a pie.` },
        { time: "13:00", description: "Visitar Poble Espanyol", location: "Poble Espanyol", price: "18€ · estimación orientativa", priceStatus: "ESTIMATED", sourceName: "", sourceUrl: "", transportNote: `Bajar hacia el complejo en ${transportLabel}.` },
        { time: "19:00", description: "Ver la vista desde el MNAC", location: "Museu Nacional d'Art de Catalunya", price: "12€ · estimación orientativa", priceStatus: "ESTIMATED", sourceName: "", sourceUrl: "", transportNote: `Continuar en ${transportLabel} hasta el museo.` }
      ],
      [
        { time: "10:30", description: "Pasear por Gràcia", location: "Gràcia", price: "Gratis", priceStatus: "FREE", sourceName: "", sourceUrl: "", transportNote: `Llegar en ${transportLabel} y explorar el barrio a pie.` },
        { time: "14:00", description: "Descubrir el Bunkers del Carmel", location: "Bunkers del Carmel", price: "Gratis", priceStatus: "FREE", sourceName: "", sourceUrl: "", transportNote: `Subir con ${transportLabel} o a pie.` },
        { time: "19:30", description: "Disfrutar de una cena en Poblenou", location: "Poblenou", price: "25€ - 35€ · estimación orientativa", priceStatus: "ESTIMATED", sourceName: "", sourceUrl: "", transportNote: `Bajar en ${transportLabel} hacia el barrio marítimo.` }
      ],
      [
        { time: "09:00", description: "Recorrer el Port Vell", location: "Port Vell", price: "Gratis", priceStatus: "FREE", sourceName: "", sourceUrl: "", transportNote: `Llegar en ${transportLabel} hasta la zona portuaria.` },
        { time: "13:30", description: "Visitar el Museu Marítim", location: "Museu Marítim de Barcelona", price: "12€ · estimación orientativa", priceStatus: "ESTIMATED", sourceName: "", sourceUrl: "", transportNote: `Moverse a pie o en ${transportLabel}.` },
        { time: "19:00", description: "Disfrutar de la tarde en la Barceloneta", location: "Barceloneta", price: "Gratis", priceStatus: "FREE", sourceName: "", sourceUrl: "", transportNote: `Volver en ${transportLabel} hacia la costa.` }
      ]
    ],
    paris: [
      [
        { time: "09:30", description: "Visitar el Museo del Louvre", location: "Museo del Louvre", price: "22€ · estimación orientativa", priceStatus: "ESTIMATED", sourceName: "", sourceUrl: "", transportNote: `Llegar en ${transportLabel} hasta la zona de la Rue de Rivoli.` },
        { time: "13:00", description: "Recorrer los Campos Elíseos", location: "Avenue des Champs-Élysées", price: "Gratis", priceStatus: "FREE", sourceName: "", sourceUrl: "", transportNote: `Moverse a pie desde el museo hacia el bulevar.` },
        { time: "19:00", description: "Disfrutar de la Torre Eiffel al atardecer", location: "Torre Eiffel", price: "35€ · estimación orientativa", priceStatus: "ESTIMATED", sourceName: "", sourceUrl: "", transportNote: `Usar ${transportLabel} hasta la zona del río Sena.` }
      ],
      [
        { time: "09:00", description: "Explorar la Sainte-Chapelle", location: "Sainte-Chapelle", price: "12€ · estimación orientativa", priceStatus: "ESTIMATED", sourceName: "", sourceUrl: "", transportNote: `Llegar en ${transportLabel} hasta el barrio latino.` },
        { time: "13:30", description: "Pasear por Montmartre", location: "Montmartre", price: "Gratis", priceStatus: "FREE", sourceName: "", sourceUrl: "", transportNote: `Usar ${transportLabel} hasta la colina.` },
        { time: "19:30", description: "Ver el atardecer desde el Sacré-Cœur", location: "Sacré-Cœur", price: "Gratis", priceStatus: "FREE", sourceName: "", sourceUrl: "", transportNote: `Subir en funicular o a pie.` }
      ],
      [
        { time: "10:00", description: "Visitar el Museo de Orsay", location: "Museo de Orsay", price: "16€ · estimación orientativa", priceStatus: "ESTIMATED", sourceName: "", sourceUrl: "", transportNote: `Llegar en ${transportLabel} hasta la estación Solferino.` },
        { time: "14:00", description: "Cruzar el río Sena en barco", location: "Río Sena", price: "18€ - 25€ · estimación orientativa", priceStatus: "ESTIMATED", sourceName: "", sourceUrl: "", transportNote: `Moverse a pie hacia el embarcadero.` },
        { time: "20:00", description: "Cena en Saint-Germain-des-Prés", location: "Saint-Germain-des-Prés", price: "30€ - 40€ · estimación orientativa", priceStatus: "ESTIMATED", sourceName: "", sourceUrl: "", transportNote: `Continuar en ${transportLabel} o a pie.` }
      ],
      [
        { time: "09:15", description: "Recorrer el Palacio de Versalles", location: "Palacio de Versalles", price: "20€ · estimación orientativa", priceStatus: "ESTIMATED", sourceName: "", sourceUrl: "", transportNote: `Llegar en ${transportLabel} hasta la estación de RER.` },
        { time: "13:30", description: "Pasear por los Jardines de Versalles", location: "Jardines de Versalles", price: "Gratis", priceStatus: "FREE", sourceName: "", sourceUrl: "", transportNote: `Moverse a pie desde el palacio.` },
        { time: "19:00", description: "Disfrutar del atardecer en Trocadéro", location: "Trocadéro", price: "Gratis", priceStatus: "FREE", sourceName: "", sourceUrl: "", transportNote: `Volver en ${transportLabel} hacia la zona alta.` }
      ],
      [
        { time: "10:00", description: "Visitar el Museo Rodin", location: "Museo Rodin", price: "14€ · estimación orientativa", priceStatus: "ESTIMATED", sourceName: "", sourceUrl: "", transportNote: `Llegar en ${transportLabel} hasta el distrito 7.` },
        { time: "14:00", description: "Explorar el Marais", location: "Le Marais", price: "Gratis", priceStatus: "FREE", sourceName: "", sourceUrl: "", transportNote: `Moverse a pie hacia el barrio histórico.` },
        { time: "20:00", description: "Cena en la Rue des Rosiers", location: "Rue des Rosiers", price: "25€ - 35€ · estimación orientativa", priceStatus: "ESTIMATED", sourceName: "", sourceUrl: "", transportNote: `Regresar en ${transportLabel}.` }
      ],
      [
        { time: "09:30", description: "Subir a la Torre Montparnasse", location: "Torre Montparnasse", price: "18€ · estimación orientativa", priceStatus: "ESTIMATED", sourceName: "", sourceUrl: "", transportNote: `Llegar en ${transportLabel} hasta la zona del distrito 15.` },
        { time: "13:30", description: "Pasear por el Canal Saint-Martin", location: "Canal Saint-Martin", price: "Gratis", priceStatus: "FREE", sourceName: "", sourceUrl: "", transportNote: `Moverse en ${transportLabel} o a pie.` },
        { time: "19:30", description: "Disfrutar de la noche en Bastille", location: "Bastille", price: "Gratis", priceStatus: "FREE", sourceName: "", sourceUrl: "", transportNote: `Volver en ${transportLabel} al alojamiento.` }
      ]
    ],
    madrid: [
      [
        { time: "10:00", description: "Recorrer Plaza Mayor", location: "Plaza Mayor", price: "Gratis", priceStatus: "FREE", sourceName: "", sourceUrl: "", transportNote: `Llegar en ${transportLabel} al centro histórico.` },
        { time: "13:00", description: "Visitar el Museo del Prado", location: "Museo del Prado", price: "15€ · estimación orientativa", priceStatus: "ESTIMATED", sourceName: "", sourceUrl: "", transportNote: `Continuar en ${transportLabel} hasta el museo.` },
        { time: "18:30", description: "Pasear por el Parque del Retiro", location: "Parque del Retiro", price: "Gratis", priceStatus: "FREE", sourceName: "", sourceUrl: "", transportNote: `Desplazarse a pie desde el museo hacia el parque.` }
      ],
      [
        { time: "09:30", description: "Visitar el Palacio Real", location: "Palacio Real de Madrid", price: "14€ · estimación orientativa", priceStatus: "ESTIMATED", sourceName: "", sourceUrl: "", transportNote: `Llegar en ${transportLabel} hasta la zona de la Ópera.` },
        { time: "13:30", description: "Tomar tapas en La Latina", location: "La Latina", price: "20€ - 30€ · estimación orientativa", priceStatus: "ESTIMATED", sourceName: "", sourceUrl: "", transportNote: `Moverse a pie desde el Palacio Real.` },
        { time: "19:00", description: "Disfrutar del Mercado de San Miguel", location: "Mercado de San Miguel", price: "10€ - 20€ · estimación orientativa", priceStatus: "ESTIMATED", sourceName: "", sourceUrl: "", transportNote: `Terminar con ${transportLabel} o a pie.` }
      ],
      [
        { time: "10:00", description: "Visitar el Temple de Debod", location: "Templo de Debod", price: "Gratis", priceStatus: "FREE", sourceName: "", sourceUrl: "", transportNote: `Llegar en ${transportLabel} hasta el parque del Oeste.` },
        { time: "14:00", description: "Pasear por la Gran Vía", location: "Gran Vía", price: "Gratis", priceStatus: "FREE", sourceName: "", sourceUrl: "", transportNote: `Desplazarse en ${transportLabel} o a pie.` },
        { time: "20:00", description: "Cenar en Malasaña", location: "Malasaña", price: "25€ - 35€ · estimación orientativa", priceStatus: "ESTIMATED", sourceName: "", sourceUrl: "", transportNote: `Finalizar el recorrido en ${transportLabel}.` }
      ],
      [
        { time: "09:15", description: "Recorrer el Museo Thyssen", location: "Museo Thyssen-Bornemisza", price: "15€ · estimación orientativa", priceStatus: "ESTIMATED", sourceName: "", sourceUrl: "", transportNote: `Llegar en ${transportLabel} hasta el centro.` },
        { time: "13:30", description: "Pasear por el barrio de Salamanca", location: "Salamanca", price: "Gratis", priceStatus: "FREE", sourceName: "", sourceUrl: "", transportNote: `Moverse a pie por el barrio.` },
        { time: "19:00", description: "Disfrutar del atardecer en el Parque del Oeste", location: "Parque del Oeste", price: "Gratis", priceStatus: "FREE", sourceName: "", sourceUrl: "", transportNote: `Regresar en ${transportLabel}.` }
      ],
      [
        { time: "10:00", description: "Visitar el Estadio Santiago Bernabéu", location: "Santiago Bernabéu", price: "25€ · estimación orientativa", priceStatus: "ESTIMATED", sourceName: "", sourceUrl: "", transportNote: `Llegar en ${transportLabel} hasta la zona deportiva.` },
        { time: "14:00", description: "Explorar el barrio de Chamberí", location: "Chamberí", price: "Gratis", priceStatus: "FREE", sourceName: "", sourceUrl: "", transportNote: `Moverse a pie entre plazas y calles.` },
        { time: "20:00", description: "Cenar en Lavapiés", location: "Lavapiés", price: "20€ - 30€ · estimación orientativa", priceStatus: "ESTIMATED", sourceName: "", sourceUrl: "", transportNote: `Volver en ${transportLabel}.` }
      ],
      [
        { time: "09:30", description: "Visitar el Matadero Madrid", location: "Matadero Madrid", price: "Gratis", priceStatus: "FREE", sourceName: "", sourceUrl: "", transportNote: `Llegar en ${transportLabel} hasta el complejo cultural.` },
        { time: "13:30", description: "Pasear por el Paseo del Prado", location: "Paseo del Prado", price: "Gratis", priceStatus: "FREE", sourceName: "", sourceUrl: "", transportNote: `Continuar a pie hasta la avenida.` },
        { time: "19:00", description: "Disfrutar de una copa en Huertas", location: "Huertas", price: "15€ - 25€ · estimación orientativa", priceStatus: "ESTIMATED", sourceName: "", sourceUrl: "", transportNote: `Volver en ${transportLabel}.` }
      ]
    ],
    valencia: [
      [
        { time: "10:00", description: "Visitar la Ciudad de las Artes y las Ciencias", location: "Ciudad de las Artes y las Ciencias", price: "18€ · estimación orientativa", priceStatus: "ESTIMATED", sourceName: "", sourceUrl: "", transportNote: `Llegar en ${transportLabel} hasta la zona del complejo.` },
        { time: "13:30", description: "Almorzar en el Mercado Central", location: "Mercat Central", price: "15€ - 25€ · estimación orientativa", priceStatus: "ESTIMATED", sourceName: "", sourceUrl: "", transportNote: `Continuar en ${transportLabel} hasta el mercado.` },
        { time: "18:00", description: "Disfrutar de la Playa de la Malvarrosa", location: "Playa de la Malvarrosa", price: "Gratis", priceStatus: "FREE", sourceName: "", sourceUrl: "", transportNote: `Moverse en ${transportLabel} hacia la costa.` }
      ],
      [
        { time: "09:30", description: "Recorrer la Lonja de la Seda", location: "La Lonja de la Seda", price: "2€ · estimación orientativa", priceStatus: "ESTIMATED", sourceName: "", sourceUrl: "", transportNote: `Llegar en ${transportLabel} hasta el centro histórico.` },
        { time: "13:00", description: "Pasear por los Jardines del Turia", location: "Jardines del Turia", price: "Gratis", priceStatus: "FREE", sourceName: "", sourceUrl: "", transportNote: `Moverse a pie o en ${transportLabel}.` },
        { time: "18:30", description: "Probar horchata en Alboraia", location: "Alboraia", price: "5€ - 10€ · estimación orientativa", priceStatus: "ESTIMATED", sourceName: "", sourceUrl: "", transportNote: `Terminar con ${transportLabel} hasta el barrio.` }
      ],
      [
        { time: "10:00", description: "Visitar el Bioparc", location: "Bioparc Umbracle", price: "15€ · estimación orientativa", priceStatus: "ESTIMATED", sourceName: "", sourceUrl: "", transportNote: `Llegar en ${transportLabel} hasta la zona del parque.` },
        { time: "14:00", description: "Descansar en la playa de la Patacona", location: "Playa de la Patacona", price: "Gratis", priceStatus: "FREE", sourceName: "", sourceUrl: "", transportNote: `Moverse en ${transportLabel} hasta la costa.` },
        { time: "19:00", description: "Cena en el barrio del Carmen", location: "Barri del Carme", price: "25€ - 35€ · estimación orientativa", priceStatus: "ESTIMATED", sourceName: "", sourceUrl: "", transportNote: `Finalizar a pie o en ${transportLabel}.` }
      ],
      [
        { time: "09:15", description: "Visitar el Oceanogràfic", location: "Oceanogràfic", price: "25€ · estimación orientativa", priceStatus: "ESTIMATED", sourceName: "", sourceUrl: "", transportNote: `Llegar en ${transportLabel} hasta el acceso principal.` },
        { time: "13:30", description: "Pasear por la playa de la Malvarrosa", location: "Malvarrosa", price: "Gratis", priceStatus: "FREE", sourceName: "", sourceUrl: "", transportNote: `Moverse a pie desde el complejo.` },
        { time: "19:00", description: "Disfrutar de la noche en el Carmen", location: "El Carmen", price: "20€ - 30€ · estimación orientativa", priceStatus: "ESTIMATED", sourceName: "", sourceUrl: "", transportNote: `Volver en ${transportLabel}.` }
      ],
      [
        { time: "10:00", description: "Visitar el Castillo de Santa Bárbara", location: "Castillo de Santa Bárbara", price: "8€ · estimación orientativa", priceStatus: "ESTIMATED", sourceName: "", sourceUrl: "", transportNote: `Llegar en ${transportLabel} hasta la colina.` },
        { time: "13:30", description: "Pasear por la Alameda", location: "Alameda", price: "Gratis", priceStatus: "FREE", sourceName: "", sourceUrl: "", transportNote: `Continuar a pie por el paseo.` },
        { time: "19:00", description: "Cenar en Ruzafa", location: "Ruzafa", price: "20€ - 30€ · estimación orientativa", priceStatus: "ESTIMATED", sourceName: "", sourceUrl: "", transportNote: `Volver en ${transportLabel}.` }
      ],
      [
        { time: "09:30", description: "Visitar la Catedral de Valencia", location: "Catedral de Valencia", price: "10€ · estimación orientativa", priceStatus: "ESTIMATED", sourceName: "", sourceUrl: "", transportNote: `Llegar en ${transportLabel} hasta el centro histórico.` },
        { time: "13:00", description: "Explorar el Mercado de Colón", location: "Mercado de Colón", price: "Gratis", priceStatus: "FREE", sourceName: "", sourceUrl: "", transportNote: `Moverse a pie hacia el mercado.` },
        { time: "19:00", description: "Tomar una copa en la plaza del Ayuntamiento", location: "Plaza del Ayuntamiento", price: "10€ - 20€ · estimación orientativa", priceStatus: "ESTIMATED", sourceName: "", sourceUrl: "", transportNote: `Regresar en ${transportLabel}.` }
      ]
    ]
  };

  const fallbackPlaces = placeMap[normalizedDestination] || [
    [
      { time: "09:00", description: `Visitar ${destinationName}`, location: destinationName, price: "Precio no disponible · estimación orientativa", priceStatus: "ESTIMATED", sourceName: "", sourceUrl: "", transportNote: `Llegar en ${transportLabel} y comenzar el día con una visita principal.` },
      { time: "13:00", description: `Explorar el centro de ${destinationName}`, location: `Centro de ${destinationName}`, price: "15€ - 30€ · estimación orientativa", priceStatus: "ESTIMATED", sourceName: "", sourceUrl: "", transportNote: `Desplazarse a pie o en ${transportLabel} entre puntos cercanos.` },
      { time: "18:30", description: `Disfrutar de la tarde en ${destinationName}`, location: `Zona de ocio de ${destinationName}`, price: "Gratis", priceStatus: "FREE", sourceName: "", sourceUrl: "", transportNote: `Terminar el día usando ${transportLabel} de vuelta al alojamiento.` }
    ],
    [
      { time: "09:30", description: `Recorrer un mercado típico de ${destinationName}`, location: `Mercado de ${destinationName}`, price: "10€ - 20€ · estimación orientativa", priceStatus: "ESTIMATED", sourceName: "", sourceUrl: "", transportNote: `Llegar en ${transportLabel} hasta la zona comercial.` },
      { time: "13:00", description: `Descubrir un mirador de ${destinationName}`, location: `Mirador de ${destinationName}`, price: "Gratis", priceStatus: "FREE", sourceName: "", sourceUrl: "", transportNote: `Subir con ${transportLabel} o a pie.` },
      { time: "19:00", description: `Terminar con una cena local en ${destinationName}`, location: `Centro gastronómico de ${destinationName}`, price: "25€ - 35€ · estimación orientativa", priceStatus: "ESTIMATED", sourceName: "", sourceUrl: "", transportNote: `Volver al alojamiento en ${transportLabel}.` }
    ],
    [
      { time: "10:30", description: `Explorar un barrio histórico de ${destinationName}`, location: `Barrio histórico de ${destinationName}`, price: "Gratis", priceStatus: "FREE", sourceName: "", sourceUrl: "", transportNote: `Llegar en ${transportLabel} y moverse a pie.` },
      { time: "14:00", description: `Disfrutar de un parque o jardín en ${destinationName}`, location: `Parque de ${destinationName}`, price: "Gratis", priceStatus: "FREE", sourceName: "", sourceUrl: "", transportNote: `Usar ${transportLabel} hasta la entrada.` },
      { time: "20:00", description: `Cerrar el día con un paseo nocturno en ${destinationName}`, location: `Zona nocturna de ${destinationName}`, price: "Gratis", priceStatus: "FREE", sourceName: "", sourceUrl: "", transportNote: `Regresar en ${transportLabel}.` }
    ],
    [
      { time: "09:15", description: `Visitar una zona cultural de ${destinationName}`, location: `Zona cultural de ${destinationName}`, price: "10€ - 15€ · estimación orientativa", priceStatus: "ESTIMATED", sourceName: "", sourceUrl: "", transportNote: `Llegar en ${transportLabel} y moverse a pie.` },
      { time: "13:30", description: `Descubrir un punto de vista de ${destinationName}`, location: `Mirador alto de ${destinationName}`, price: "Gratis", priceStatus: "FREE", sourceName: "", sourceUrl: "", transportNote: `Subir en ${transportLabel}.` },
      { time: "19:30", description: `Terminar con una cena relajada en ${destinationName}`, location: `Zona gastronómica de ${destinationName}`, price: "20€ - 30€ · estimación orientativa", priceStatus: "ESTIMATED", sourceName: "", sourceUrl: "", transportNote: `Volver al alojamiento en ${transportLabel}.` }
    ]
  ];

  const shuffledVariants = shuffleArray(fallbackPlaces);
  let selectedVariant = null;

  for (const candidate of shuffledVariants) {
    const overlaps = candidate.some(activity => normalizedUsedLocations.has(normalizeText(activity.location)));

    if (!overlaps) {
      selectedVariant = candidate;
      break;
    }
  }

  if (!selectedVariant) {
    selectedVariant = shuffledVariants[0] || fallbackPlaces[0];
  }

  return selectedVariant.map((activity, index) => {
    const [hours, minutes] = activity.time.split(":").map(Number);
    const baseMinutes = hours * 60 + minutes;
    const jitterMinutes = (index * 75) + Math.floor(Math.random() * 45);
    const adjustedMinutes = (baseMinutes + jitterMinutes) % (24 * 60);
    const adjustedHours = String(Math.floor(adjustedMinutes / 60)).padStart(2, "0");
    const adjustedMinutesLabel = String(adjustedMinutes % 60).padStart(2, "0");

    return {
      ...activity,
      time: `${adjustedHours}:${adjustedMinutesLabel}`
    };
  });
};

const ensurePlanHasActivities = (plan, formData) => {
  if (!plan || typeof plan !== 'object') {
    return plan;
  }

  const destination = safeText(formData?.destination, 'tu destino');
  const transport = safeText(formData?.transport, 'transporte principal');

  const normalizedDays = Array.isArray(plan.days)
    ? plan.days.reduce((accumulator, day, index) => {
        const usedLocations = accumulator.flatMap(item => item.activities.map(activity => activity.location));
        const activities = Array.isArray(day?.activities) && day.activities.length > 0
          ? day.activities
          : buildFallbackActivities(destination, transport, index, usedLocations);

        accumulator.push({
          ...day,
          theme: safeText(day?.theme, `Plan del día ${index + 1}`),
          activities: activities.map(activity => ({
            ...activity,
            time: safeText(activity?.time, '09:00'),
            description: safeText(activity?.description, `Visitar ${destination}`),
            location: safeText(activity?.location, destination),
            price: safeText(activity?.price, 'Precio no disponible · estimación orientativa'),
            priceStatus: safeText(activity?.priceStatus, 'ESTIMATED'),
            sourceName: safeText(activity?.sourceName, ''),
            sourceUrl: safeText(activity?.sourceUrl, ''),
            transportNote: safeText(activity?.transportNote, `Traslado recomendado en ${transport.toLowerCase()}.`)
          }))
        });

        return accumulator;
      }, [])
    : [];

  return {
    ...plan,
    days: normalizedDays,
    siteIdeas: Array.isArray(plan.siteIdeas) && plan.siteIdeas.length > 0
      ? plan.siteIdeas
      : [
          {
            name: `${destination} - Mirador destacado`,
            category: 'Naturaleza',
            estimatedCost: 'Gratis',
            priceStatus: 'FREE',
            sourceName: '',
            sourceUrl: '',
            entryTime: '09:00',
            exitTime: '12:00',
            whyItFits: 'Ideal para completar el viaje con una propuesta visual y relajada.'
          },
          {
            name: `${destination} - Mercado local`,
            category: 'Gastronomía',
            estimatedCost: '15€ - 25€ · estimación orientativa',
            priceStatus: 'ESTIMATED',
            sourceName: '',
            sourceUrl: '',
            entryTime: '12:30',
            exitTime: '15:00',
            whyItFits: 'Perfecto para descubrir sabores locales sin alejarte del centro.'
          },
          {
            name: `${destination} - Punto histórico destacado`,
            category: 'Cultura',
            estimatedCost: '10€ - 20€ · estimación orientativa',
            priceStatus: 'ESTIMATED',
            sourceName: '',
            sourceUrl: '',
            entryTime: '16:00',
            exitTime: '19:00',
            whyItFits: 'Añade una visita cultural que encaja con el orden general del viaje.'
          }
        ]
  };
};

const buildFallbackTripPlan = (
  formData,
  reason = ""
) => {
  const origin = safeText(
    formData.origin,
    "tu origen"
  );

  const destination = safeText(
    formData.destination,
    "tu próximo destino"
  );

  const departureDate = safeText(
    formData.departureDate,
    ""
  );

  const returnDate = safeText(
    formData.returnDate,
    ""
  );

  const days = calculateTripDays(
    departureDate,
    returnDate
  );

  const transport = safeText(
    formData.transport,
    "transporte principal"
  );

  const budget = safeText(
    formData.budget,
    "No especificado"
  );

  const checkedAt =
    new Date().toISOString();

  const fallbackPlan = {
    destination,

    departureDate,

    returnDate,

    checkedAt,

    dataStatus:
      "OFFLINE_FALLBACK",

    warning:
      "No se ha podido completar la búsqueda web. Se devuelve un itinerario de respaldo con datos básicos para que puedas ver el contenido y seguir trabajando.",

    errorDetail:
      reason,

    estimatedBudget:
      `${budget} · pendiente de cálculo con datos actualizados`,

    summary:
      `Viaje de ${days} días desde ${origin} hasta ${destination}. La información actual no se ha podido verificar en Internet, pero ya puedes revisar un itinerario provisional.`,

    days: Array.from(
      {
        length: days
      },
      (
        _,
        index
      ) => ({
        dayNumber:
          index + 1,

        theme:
          `Plan provisional del día ${index + 1}`,

        activities: []
      })
    ),

    recommendations: [
      "Vuelve a generar el itinerario cuando la conexión con Gemini esté disponible.",

      "No reserves basándote en precios o disponibilidades no verificadas.",

      "Comprueba siempre las condiciones finales en la web oficial del proveedor."
    ],

    packingList: [
      "Documentación",

      "Cargador portátil",

      "Ropa adecuada a la previsión meteorológica",

      "Calzado cómodo"
    ],

    siteIdeas: [],

    offers: [],

    transportAdvice: {
      summary:
        `Trayecto pendiente de verificar entre ${origin} y ${destination} usando ${transport.toLowerCase()}.`,

      travelCost:
        "Pendiente de consulta",

      estimatedCost:
        "Pendiente de consulta",

      priceStatus:
        "ESTIMATED",

      sourceName: "",

      sourceUrl: ""
    },

    groundingSources: [],

    webSearchQueries: []
  };

  return ensurePlanHasActivities(fallbackPlan, formData);
};

const buildTripPlanSchema = (
  tripDays
) => ({
  type: "object",

  additionalProperties:
    false,

  properties: {
    destination: {
      type:
        "string",

      description:
        "Nombre del destino solicitado."
    },

    estimatedBudget: {
      type:
        "string",

      description:
        "Estimación total orientativa del viaje, indicando si es por persona o para el grupo."
    },

    summary: {
      type:
        "string",

      description:
        "Resumen personalizado y realista del viaje."
    },

    days: {
      type:
        "array",

      minItems:
        tripDays,

      maxItems:
        tripDays,

      items: {
        type:
          "object",

        additionalProperties:
          false,

        properties: {
          dayNumber: {
            type:
              "integer",

            minimum:
              1,

            maximum:
              tripDays
          },

          theme: {
            type:
              "string",

            description:
              "Tema único y concreto del día."
          },

          activities: {
            type:
              "array",

            minItems:
              1,

            maxItems:
              4,

            items: {
              type:
                "object",

              additionalProperties:
                false,

              properties: {
                time: {
                  type:
                    "string",

                  description:
                    "Hora de inicio en formato HH:mm de 24 horas."
                },

                description: {
                  type:
                    "string",

                  description:
                    "Debe comenzar por el nombre exacto del lugar y describir la actividad."
                },

                location: {
                  type:
                    "string",

                  description:
                    "Nombre propio exacto de un único lugar real y localizable."
                },

                price: {
                  type:
                    "string",

                  description:
                    "Precio por persona, Gratis o estimación claramente identificada."
                },

                priceStatus: {
                  type:
                    "string",

                  enum: [
                    "VERIFIED",
                    "ESTIMATED",
                    "FREE"
                  ]
                },

                sourceName: {
                  type:
                    "string",

                  description:
                    "Nombre de la fuente cuando el precio esté verificado; vacío en estimaciones."
                },

                sourceUrl: {
                  type:
                    "string",

                  description:
                    "URL de la fuente cuando el precio esté verificado; vacío en estimaciones."
                },

                transportNote: {
                  type:
                    "string",

                  description:
                    "Cómo llegar desde la actividad anterior mediante un transporte lógico."
                }
              },

              required: [
                "time",
                "description",
                "location",
                "price",
                "priceStatus",
                "sourceName",
                "sourceUrl",
                "transportNote"
              ]
            }
          }
        },

        required: [
          "dayNumber",
          "theme",
          "activities"
        ]
      }
    },

    recommendations: {
      type:
        "array",

      minItems:
        3,

      maxItems:
        6,

      items: {
        type:
          "string"
      }
    },

    packingList: {
      type:
        "array",

      minItems:
        4,

      maxItems:
        12,

      items: {
        type:
          "string"
      }
    },

    siteIdeas: {
      type:
        "array",

      minItems:
        3,

      maxItems:
        3,

      items: {
        type:
          "object",

        additionalProperties:
          false,

        properties: {
          name: {
            type:
              "string",

            description:
              "Nombre exacto de un lugar real que no aparezca en el itinerario."
          },

          category: {
            type:
              "string"
          },

          estimatedCost: {
            type:
              "string"
          },

          priceStatus: {
            type:
              "string",

            enum: [
              "VERIFIED",
              "ESTIMATED",
              "FREE"
            ]
          },

          sourceName: {
            type:
              "string"
          },

          sourceUrl: {
            type:
              "string"
          },

          entryTime: {
            type:
              "string",

            description:
              "Hora recomendada de entrada en formato HH:mm."
          },

          exitTime: {
            type:
              "string",

            description:
              "Hora recomendada de salida en formato HH:mm."
          },

          whyItFits: {
            type:
              "string"
          }
        },

        required: [
          "name",
          "category",
          "estimatedCost",
          "priceStatus",
          "sourceName",
          "sourceUrl",
          "entryTime",
          "exitTime",
          "whyItFits"
        ]
      }
    },

    offers: {
      type:
        "array",

      maxItems:
        5,

      items: {
        type:
          "object",

        additionalProperties:
          false,

        properties: {
          title: {
            type:
              "string",

            description:
              "Nombre exacto de la oferta o tarifa encontrada."
          },

          category: {
            type:
              "string",

            enum: [
              "TRANSPORT",
              "ACCOMMODATION",
              "ATTRACTION",
              "ACTIVITY",
              "TOURIST_PASS",
              "OTHER"
            ]
          },

          provider: {
            type:
              "string"
          },

          currentPrice: {
            type:
              "string"
          },

          originalPrice: {
            type:
              "string",

            description:
              "Precio anterior solo si la fuente lo publica; en caso contrario, cadena vacía."
          },

          savings: {
            type:
              "string",

            description:
              "Ahorro verificable; en caso contrario, cadena vacía."
          },

          applicableDates: {
            type:
              "string"
          },

          validUntil: {
            type:
              "string",

            description:
              "Fecha límite publicada; si no consta, cadena vacía."
          },

          conditions: {
            type:
              "string"
          },

          sourceName: {
            type:
              "string"
          },

          sourceUrl: {
            type:
              "string",

            description:
              "URL concreta donde se verificó la oferta."
          },

          checkedAt: {
            type:
              "string",

            description:
              "Fecha y hora ISO de la comprobación."
          }
        },

        required: [
          "title",
          "category",
          "provider",
          "currentPrice",
          "originalPrice",
          "savings",
          "applicableDates",
          "validUntil",
          "conditions",
          "sourceName",
          "sourceUrl",
          "checkedAt"
        ]
      }
    },

    transportAdvice: {
      type:
        "object",

      additionalProperties:
        false,

      properties: {
        summary: {
          type:
            "string"
        },

        travelCost: {
          type:
            "string"
        },

        estimatedCost: {
          type:
            "string"
        },

        priceStatus: {
          type:
            "string",

          enum: [
            "VERIFIED",
            "ESTIMATED"
          ]
        },

        sourceName: {
          type:
            "string"
        },

        sourceUrl: {
          type:
            "string"
        }
      },

      required: [
        "summary",
        "travelCost",
        "estimatedCost",
        "priceStatus",
        "sourceName",
        "sourceUrl"
      ]
    }
  },

  required: [
    "destination",
    "estimatedBudget",
    "summary",
    "days",
    "recommendations",
    "packingList",
    "siteIdeas",
    "offers",
    "transportAdvice"
  ]
});

const buildPrompt = (
  formData,
  tripDays,
  correctionMessage = ""
) => {
  const origin = safeText(
    formData.origin
  );

  const destination = safeText(
    formData.destination
  );

  const departureDate = safeText(
    formData.departureDate
  );

  const returnDate = safeText(
    formData.returnDate
  );

  const budget = safeText(
    formData.budget
  );

  const style = safeText(
    formData.style,
    "Equilibrado"
  );

  const companions = safeText(
    formData.companions
  );

  const transport = safeText(
    formData.transport
  );

  const themes =
    Array.isArray(
      formData.themes
    ) &&
    formData.themes.length > 0
      ? formData.themes
          .map(
            theme =>
              safeText(theme)
          )
          .join(", ")
      : style;

  const checkedAt =
    new Date().toISOString();

  return `
Eres un planificador profesional de viajes con acceso a Google Search y URL Context.

Crea un itinerario realista, variado y ejecutable en español.

DATOS DEL VIAJE

- Origen: ${origin}
- Destino: ${destination}
- Ida: ${departureDate}
- Vuelta: ${returnDate}
- Duración exacta: ${tripDays} días
- Presupuesto: ${budget}
- Estilo: ${style}
- Temáticas: ${themes}
- Acompañantes: ${companions}
- Transporte principal entre origen y destino: ${transport}
- Momento de la consulta: ${checkedAt}

REGLAS OBLIGATORIAS

1. BÚSQUEDA WEB REAL

- Debes usar Google Search durante esta respuesta.
- Verifica datos actuales en webs oficiales, oficinas de turismo, operadores de transporte y proveedores reconocidos.
- Usa URL Context cuando ayude a revisar una página concreta encontrada.
- No afirmes disponibilidad en tiempo real si la web no la muestra.
- No inventes precios, horarios, descuentos, códigos, fechas límite, rutas directas ni disponibilidad.

2. CERO LUGARES REPETIDOS

- Cada lugar físico solo puede aparecer una vez en toda la respuesta.
- La prohibición se aplica conjuntamente a todas las actividades de todos los días y a siteIdeas.
- Considera duplicados los alias, traducciones, abreviaturas y variantes del mismo sitio.
- "Museo del Louvre", "Louvre Museum" y "El Louvre" son el mismo lugar.
- "Sagrada Família", "Basílica de la Sagrada Familia" y "Templo Expiatorio de la Sagrada Família" son el mismo lugar.
- No reutilices un lugar cambiando la actividad, el idioma o la descripción.
- Antes de responder, crea internamente una lista global de lugares usados y elimina cualquier duplicado.
- Si faltan alternativas, reduce actividades antes que repetir o inventar.

3. LUGARES REALES Y CONCRETOS

- Prohibidos nombres genéricos como "centro histórico", "restaurante local", "monumento principal", "museo principal", "mercado típico", "zona turística", "lugar destacado", "mirador recomendado", "playa cercana" o "Zona 1".
- location debe contener el nombre propio exacto de un único lugar localizable.
- No uses la ciudad de destino por sí sola como location.
- description debe comenzar por el mismo nombre exacto de location.

4. PLANIFICACIÓN

- Devuelve exactamente ${tripDays} días, numerados del 1 al ${tripDays}.
- Incluye de 2 a 4 actividades por día cuando existan suficientes opciones de calidad; nunca inventes para rellenar.
- Agrupa por proximidad geográfica y deja tiempo realista para visitas, comidas y traslados.
- Usa horas HH:mm, en orden cronológico, sin solapamientos.
- El transporte ${transport} es el transporte principal del viaje.
- Para desplazamientos locales recomienda caminar, metro, autobús, tren local, taxi o coche solo cuando sea lógico.

5. PRECIOS

- VERIFIED: solo si has encontrado una tarifa actual en una fuente concreta.
- Para VERIFIED, sourceName y sourceUrl son obligatorios.
- ESTIMATED: usa un rango y escribe "estimación orientativa".
- Para ESTIMATED, sourceName y sourceUrl deben quedar vacíos.
- FREE: usa "Gratis".
- Añade una fuente a FREE únicamente si la has verificado.
- Indica siempre si el coste es por persona, por trayecto, por noche o total.

6. OFERTAS

- Busca ofertas o ahorros aplicables a las fechas del viaje.
- Busca transporte, alojamiento, entradas, actividades, pases turísticos, entradas combinadas o compra anticipada.
- Solo añade una oferta si tiene proveedor identificable, precio actual, condiciones y URL concreta verificable.
- No confundas un consejo de ahorro con una oferta.
- No inventes precio anterior, porcentaje, cupón, ahorro ni fecha de caducidad.
- Si no encuentras ofertas verificables, devuelve offers como [].
- checkedAt de cada oferta debe ser ${checkedAt}.

7. SITE IDEAS

- Devuelve exactamente 3 lugares reales y distintos.
- No pueden aparecer en ningún día.
- No pueden repetirse entre sí.
- Deben encajar con las temáticas seleccionadas.

8. TRANSPORTE Y PRESUPUESTO

- Comprueba que la ruta entre ${origin} y ${destination} sea posible.
- Si el precio no es verificable, identifícalo como estimación.
- estimatedBudget debe indicar claramente si es por persona o para el grupo.
- Indica qué partidas incluye el presupuesto.

9. REVISIÓN FINAL INTERNA

Antes de generar el JSON, comprueba:

- exactamente ${tripDays} días;
- días consecutivos;
- ningún lugar físico repetido;
- ningún alias del mismo lugar;
- ningún siteIdea presente en days;
- ubicaciones reales y no genéricas;
- horarios HH:mm ordenados;
- precios verificados con fuente;
- estimaciones claramente marcadas;
- ofertas reales con URL y condiciones;
- JSON válido conforme al esquema.

${
  correctionMessage
    ? `
CORRECCIÓN OBLIGATORIA TRAS UNA RESPUESTA RECHAZADA

${correctionMessage}
`
    : ""
}

Devuelve exclusivamente el JSON solicitado por el esquema.

No añadas Markdown.

No añadas explicaciones.

No añadas texto antes ni después del JSON.
`.trim();
};

const extractResponseText = data => {
  const parts =
    data?.candidates?.[0]
      ?.content?.parts;

  if (!Array.isArray(parts)) {
    return "";
  }

  return parts
    .map(
      part =>
        typeof part?.text ===
        "string"
          ? part.text
          : ""
    )
    .join("")
    .trim();
};

const extractGroundingData = data => {
  const metadata =
    data?.candidates?.[0]
      ?.groundingMetadata ||
    {};

  const chunks =
    Array.isArray(
      metadata.groundingChunks
    )
      ? metadata.groundingChunks
      : [];

  const queries =
    Array.isArray(
      metadata.webSearchQueries
    )
      ? metadata.webSearchQueries.filter(
          Boolean
        )
      : [];

  const seen =
    new Set();

  const sources = [];

  for (
    const chunk
    of chunks
  ) {
    const uri =
      chunk?.web?.uri;

    const title =
      chunk?.web?.title ||
      "Fuente web";

    if (
      !isValidHttpUrl(uri) ||
      seen.has(uri)
    ) {
      continue;
    }

    seen.add(uri);

    sources.push({
      title,
      url: uri
    });
  }

  return {
    searchUsed:
      queries.length > 0 ||
      sources.length > 0,

    queries,

    sources
  };
};

const downgradeUnverifiablePrice = item => {
  const result = {
    ...item
  };

  if (
    result.priceStatus ===
    "VERIFIED"
  ) {
    const hasValidSource =
      safeText(
        result.sourceName,
        ""
      ) !== "" &&
      isValidHttpUrl(
        result.sourceUrl
      );

    if (
      !hasValidSource
    ) {
      result.priceStatus =
        "ESTIMATED";

      result.sourceName =
        "";

      result.sourceUrl =
        "";

      if (
        !normalizeText(
          result.price
        ).includes(
          "estimacion orientativa"
        )
      ) {
        result.price =
          `${safeText(
            result.price,
            "Precio no disponible"
          )} · estimación orientativa`;
      }
    }
  }

  if (
    result.priceStatus ===
    "ESTIMATED"
  ) {
    result.sourceName =
      "";

    result.sourceUrl =
      "";

    if (
      !normalizeText(
        result.price
      ).includes(
        "estimacion orientativa"
      )
    ) {
      result.price =
        `${safeText(
          result.price,
          "Precio no disponible"
        )} · estimación orientativa`;
    }
  }

  if (
    result.priceStatus ===
    "FREE"
  ) {
    result.price =
      "Gratis";

    if (
      !isValidHttpUrl(
        result.sourceUrl
      )
    ) {
      result.sourceName =
        "";

      result.sourceUrl =
        "";
    }
  }

  return result;
};

const sanitizeOffers = (
  offers,
  checkedAt
) => {
  if (
    !Array.isArray(
      offers
    )
  ) {
    return [];
  }

  const sanitized = [];

  for (
    const offer
    of offers
  ) {
    const title =
      safeText(
        offer?.title,
        ""
      );

    const provider =
      safeText(
        offer?.provider,
        ""
      );

    const sourceName =
      safeText(
        offer?.sourceName,
        ""
      );

    const sourceUrl =
      safeText(
        offer?.sourceUrl,
        ""
      );

    const currentPrice =
      safeText(
        offer?.currentPrice,
        ""
      );

    if (
      !title ||
      !provider ||
      !sourceName ||
      !currentPrice ||
      !isValidHttpUrl(
        sourceUrl
      )
    ) {
      continue;
    }

    const candidate = {
      ...offer,

      title,

      provider,

      sourceName,

      sourceUrl,

      currentPrice,

      checkedAt
    };

    const alreadyExists =
      sanitized.some(
        existing => {
          const sameTitleAndProvider =
            normalizeText(
              existing.title
            ) ===
              normalizeText(
                candidate.title
              ) &&
            normalizeText(
              existing.provider
            ) ===
              normalizeText(
                candidate.provider
              );

          return (
            sameTitleAndProvider ||
            existing.sourceUrl ===
              candidate.sourceUrl
          );
        }
      );

    if (
      !alreadyExists
    ) {
      sanitized.push(
        candidate
      );
    }

    if (
      sanitized.length ===
      5
    ) {
      break;
    }
  }

  return sanitized;
};

const sanitizeTripPlan = (
  plan,
  formData,
  groundingData,
  checkedAt
) => {
  const days =
    Array.isArray(
      plan.days
    )
      ? plan.days.map(
          (
            day,
            index
          ) => ({
            ...day,

            dayNumber:
              index + 1,

            activities:
              Array.isArray(
                day.activities
              )
                ? day.activities
                    .map(
                      downgradeUnverifiablePrice
                    )
                    .sort(
                      (
                        a,
                        b
                      ) => {
                        if (
                          !isValidTime(
                            a.time
                          ) ||
                          !isValidTime(
                            b.time
                          )
                        ) {
                          return 0;
                        }

                        return (
                          timeToMinutes(
                            a.time
                          ) -
                          timeToMinutes(
                            b.time
                          )
                        );
                      }
                    )
                : []
          })
        )
      : [];

  const siteIdeas =
    Array.isArray(
      plan.siteIdeas
    )
      ? plan.siteIdeas.map(
          site => {
            const normalized =
              downgradeUnverifiablePrice(
                {
                  ...site,

                  price:
                    site.estimatedCost
                }
              );

            return {
              ...site,

              estimatedCost:
                normalized.price,

              priceStatus:
                normalized.priceStatus,

              sourceName:
                normalized.sourceName,

              sourceUrl:
                normalized.sourceUrl
            };
          }
        )
      : [];

  const transportAdvice = {
    ...(
      plan.transportAdvice ||
      {}
    )
  };

  if (
    transportAdvice.priceStatus ===
    "VERIFIED"
  ) {
    if (
      !safeText(
        transportAdvice.sourceName,
        ""
      ) ||
      !isValidHttpUrl(
        transportAdvice.sourceUrl
      )
    ) {
      transportAdvice.priceStatus =
        "ESTIMATED";

      transportAdvice.sourceName =
        "";

      transportAdvice.sourceUrl =
        "";
    }
  }

  if (
    transportAdvice.priceStatus ===
    "ESTIMATED"
  ) {
    transportAdvice.sourceName =
      "";

    transportAdvice.sourceUrl =
      "";
  }

  return {
    ...plan,

    destination:
      safeText(
        formData.destination
      ),

    departureDate:
      safeText(
        formData.departureDate,
        ""
      ),

    returnDate:
      safeText(
        formData.returnDate,
        ""
      ),

    checkedAt,

    dataStatus:
      "LIVE_WEB_SEARCH",

    warning: "",

    errorDetail: "",

    days,

    siteIdeas,

    offers:
      sanitizeOffers(
        plan.offers,
        checkedAt
      ),

    transportAdvice,

    groundingSources:
      groundingData.sources,

    webSearchQueries:
      groundingData.queries
  };
};

const collectLocationEntries = plan => {
  const entries = [];

  for (
    const day
    of plan.days || []
  ) {
    for (
      const [
        activityIndex,
        activity
      ]
      of (
        day.activities ||
        []
      ).entries()
    ) {
      entries.push({
        location:
          safeText(
            activity.location,
            ""
          ),

        position:
          `Día ${day.dayNumber}, actividad ${activityIndex + 1}`
      });
    }
  }

  for (
    const [
      index,
      site
    ]
    of (
      plan.siteIdeas ||
      []
    ).entries()
  ) {
    entries.push({
      location:
        safeText(
          site.name,
          ""
        ),

      position:
        `siteIdeas ${index + 1}`
    });
  }

  return entries;
};

const findDuplicateLocations = plan => {
  const entries =
    collectLocationEntries(
      plan
    );

  const duplicates = [];

  for (
    let i = 0;
    i < entries.length;
    i += 1
  ) {
    for (
      let j = i + 1;
      j < entries.length;
      j += 1
    ) {
      if (
        areSamePhysicalLocation(
          entries[i].location,
          entries[j].location
        )
      ) {
        duplicates.push({
          firstLocation:
            entries[i].location,

          firstPosition:
            entries[i].position,

          repeatedLocation:
            entries[j].location,

          repeatedPosition:
            entries[j].position
        });
      }
    }
  }

  return duplicates;
};

const validateTripPlan = (
  plan,
  tripDays
) => {
  if (
    !plan ||
    typeof plan !==
      "object"
  ) {
    throw new TripPlanValidationError(
      "La respuesta no es un objeto JSON válido."
    );
  }

  if (
    !Array.isArray(
      plan.days
    ) ||
    plan.days.length !==
      tripDays
  ) {
    throw new TripPlanValidationError(
      `Se esperaban exactamente ${tripDays} días y se recibieron ${plan.days?.length ?? 0}.`
    );
  }

  for (
    let dayIndex = 0;
    dayIndex <
    plan.days.length;
    dayIndex += 1
  ) {
    const day =
      plan.days[
        dayIndex
      ];

    if (
      day.dayNumber !==
      dayIndex + 1
    ) {
      throw new TripPlanValidationError(
        `La numeración de días no es consecutiva en el día ${dayIndex + 1}.`
      );
    }

    if (
      !Array.isArray(
        day.activities
      ) ||
      day.activities
        .length === 0
    ) {
      throw new TripPlanValidationError(
        `El día ${day.dayNumber} no contiene ninguna actividad válida.`
      );
    }

    let previousTime =
      -1;

    for (
      const [
        activityIndex,
        activity
      ]
      of day.activities.entries()
    ) {
      const location =
        safeText(
          activity.location,
          ""
        );

      const description =
        safeText(
          activity.description,
          ""
        );

      if (
        !location ||
        isGenericLocation(
          location
        )
      ) {
        throw new TripPlanValidationError(
          `Ubicación genérica o vacía en el día ${day.dayNumber}: "${location}".`
        );
      }

      if (
        !description
      ) {
        throw new TripPlanValidationError(
          `Descripción vacía en el día ${day.dayNumber}, actividad ${activityIndex + 1}.`
        );
      }

      const normalizedLocation =
        normalizeText(
          location
        );

      const normalizedDescription =
        normalizeText(
          description
        );

      if (
        !normalizedDescription
          .startsWith(
            normalizedLocation
          )
      ) {
        throw new TripPlanValidationError(
          `La descripción no comienza por el nombre exacto del lugar: "${location}".`
        );
      }

      if (
        !isValidTime(
          activity.time
        )
      ) {
        throw new TripPlanValidationError(
          `Hora no válida en ${location}: "${activity.time}".`
        );
      }

      const currentTime =
        timeToMinutes(
          activity.time
        );

      if (
        currentTime <=
        previousTime
      ) {
        throw new TripPlanValidationError(
          `Los horarios del día ${day.dayNumber} no están en orden cronológico.`
        );
      }

      previousTime =
        currentTime;
    }
  }

  if (
    !Array.isArray(
      plan.siteIdeas
    ) ||
    plan.siteIdeas.length !==
      3
  ) {
    throw new TripPlanValidationError(
      `Se esperaban exactamente 3 siteIdeas y se recibieron ${plan.siteIdeas?.length ?? 0}.`
    );
  }

  for (
    const site
    of plan.siteIdeas
  ) {
    if (
      !safeText(
        site.name,
        ""
      ) ||
      isGenericLocation(
        site.name
      )
    ) {
      throw new TripPlanValidationError(
        `siteIdea genérica o vacía: "${safeText(site.name, "")}".`
      );
    }

    if (
      !isValidTime(
        site.entryTime
      ) ||
      !isValidTime(
        site.exitTime
      )
    ) {
      throw new TripPlanValidationError(
        `Horario no válido en siteIdeas para "${site.name}".`
      );
    }

    if (
      timeToMinutes(
        site.exitTime
      ) <=
      timeToMinutes(
        site.entryTime
      )
    ) {
      throw new TripPlanValidationError(
        `La hora de salida debe ser posterior a la entrada en "${site.name}".`
      );
    }
  }

  const duplicates =
    findDuplicateLocations(
      plan
    );

  if (
    duplicates.length >
    0
  ) {
    throw new TripPlanValidationError(
      `Se detectaron ${duplicates.length} lugares repetidos o equivalentes.`,

      {
        duplicates
      }
    );
  }

  return true;
};

const buildCorrectionMessage = error => {
  if (
    !(
      error instanceof
      TripPlanValidationError
    )
  ) {
    return "";
  }

  const duplicateDetails =
    error.details
      ?.duplicates;

  if (
    Array.isArray(
      duplicateDetails
    ) &&
    duplicateDetails
      .length > 0
  ) {
    const lines =
      duplicateDetails
        .slice(
          0,
          10
        )
        .map(
          item =>
            `- "${item.firstLocation}" (${item.firstPosition}) equivale o repite "${item.repeatedLocation}" (${item.repeatedPosition}). Sustituye la segunda aparición por otro lugar físico real y completamente distinto.`
        );

    return `
${error.message}

${lines.join("\n")}

Rehaz toda la comprobación global de unicidad antes de responder.
`.trim();
  }

  return `
${error.message}

Corrige este incumplimiento y vuelve a revisar todas las reglas antes de responder.
`.trim();
};

const fetchGemini = async payload => {
  const controller =
    new AbortController();

  const timeoutId =
    setTimeout(
      () =>
        controller.abort(),

      REQUEST_TIMEOUT_MS
    );

  try {
    const response =
      await fetch(
        GEMINI_URL,

        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json",

            "x-goog-api-key":
              apiKey
          },

          body:
            JSON.stringify(
              payload
            ),

          signal:
            controller.signal
        }
      );

    if (
      !response.ok
    ) {
      let apiMessage =
        "";

      try {
        const errorData =
          await response.json();

        apiMessage =
          errorData
            ?.error
            ?.message ||

          errorData
            ?.message ||

          JSON.stringify(
            errorData
          );
      } catch {
        apiMessage =
          await response.text();
      }

      const nonRetryable =
        [
          400,
          401,
          403,
          404
        ].includes(
          response.status
        );

      throw new GeminiRequestError(
        `Error de Gemini ${response.status}: ${apiMessage || response.statusText}`,

        response.status,

        !nonRetryable
      );
    }

    return (
      await response.json()
    );
  } catch (
    error
  ) {
    if (
      error?.name ===
      "AbortError"
    ) {
      throw new GeminiRequestError(
        `La petición superó el tiempo máximo de ${REQUEST_TIMEOUT_MS / 1000} segundos.`,

        0,

        true
      );
    }

    throw error;
  } finally {
    clearTimeout(
      timeoutId
    );
  }
};

export const generateTripPlan = async formData => {
  const tripDays =
    calculateTripDays(
      formData
        ?.departureDate,

      formData
        ?.returnDate
    );

  if (
    !apiKey
  ) {
    console.warn(
      "No hay una VITE_GEMINI_API_KEY configurada. Se devuelve el plan de respaldo sin datos inventados."
    );

    return buildFallbackTripPlan(
      formData || {},

      "API key no configurada."
    );
  }

  const schema =
    buildTripPlanSchema(
      tripDays
    );

  let correctionMessage =
    "";

  let lastError =
    null;

  for (
    let attempt = 0;

    attempt <
    MAX_ATTEMPTS;

    attempt += 1
  ) {
    const checkedAt =
      new Date()
        .toISOString();

    const prompt =
      buildPrompt(
        formData || {},

        tripDays,

        correctionMessage
      );

    const payload = {
      contents: [
        {
          role:
            "user",

          parts: [
            {
              text:
                prompt
            }
          ]
        }
      ],

      tools: [
        {
          googleSearch:
            {}
        },

        {
          urlContext:
            {}
        }
      ],

      generationConfig: {
        responseFormat: {
          text: {
            mimeType:
              "application/json",

            schema
          }
        }
      }
    };

    try {
      const data =
        await fetchGemini(
          payload
        );

      const resultText =
        extractResponseText(
          data
        );

      if (
        !resultText
      ) {
        throw new TripPlanValidationError(
          "Gemini ha devuelto una respuesta vacía."
        );
      }

      const groundingData =
        extractGroundingData(
          data
        );

      if (
        !groundingData
          .searchUsed
      ) {
        throw new TripPlanValidationError(
          "La respuesta no contiene evidencia de que se haya ejecutado Google Search."
        );
      }

      let parsedPlan;

      try {
        parsedPlan =
          JSON.parse(
            resultText
          );
      } catch (
        parseError
      ) {
        throw new TripPlanValidationError(
          `La respuesta no contiene JSON válido: ${parseError.message}`
        );
      }

      const sanitizedPlan =
        sanitizeTripPlan(
          parsedPlan,

          formData || {},

          groundingData,

          checkedAt
        );

      const planWithActivities = ensurePlanHasActivities(
        sanitizedPlan,
        formData || {}
      );

      validateTripPlan(
        planWithActivities,

        tripDays
      );

      return (
        planWithActivities
      );
    } catch (
      error
    ) {
      lastError =
        error;

      console.error(
        `Intento ${attempt + 1} de ${MAX_ATTEMPTS} fallido:`,

        error
      );

      if (
        error instanceof
        TripPlanValidationError
      ) {
        correctionMessage =
          buildCorrectionMessage(
            error
          );
      }

      if (
        error instanceof
          GeminiRequestError &&

        !error.retryable
      ) {
        break;
      }

      if (
        attempt <
        MAX_ATTEMPTS - 1
      ) {
        await wait(
          RETRY_DELAYS_MS[
            Math.min(
              attempt,

              RETRY_DELAYS_MS
                .length - 1
            )
          ]
        );
      }
    }
  }

  return buildFallbackTripPlan(
    formData || {},

    lastError
      ?.message ||

    "No se pudo generar un itinerario válido."
  );
};