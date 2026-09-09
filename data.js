

const CATEGORIES = [
  { id: "cafe",        label: "Comer o tomar café", icon: "☕" },
  { id: "restaurante", label: "Buscar restaurantes", icon: "🍽️" },
  { id: "naturaleza",  label: "Explorar naturaleza", icon: "🌿" },
  { id: "actividad",   label: "Buscar actividades",  icon: "🎯" },
  { id: "turistico",   label: "Lugares para visitar", icon: "📸" },
  { id: "hotel",       label: "Buscar hospedaje",     icon: "🏨" },
  { id: "evento",      label: "Eventos",              icon: "🎉" },
  { id: "comercio",    label: "Comercios y artesanías", icon: "🛍️" },
];

const TAGS = [
  { id: "familiar",    label: "Familiar" },
  { id: "romantico",   label: "Romántico" },
  { id: "amigos",      label: "Para amigos" },
  { id: "petfriendly", label: "Pet friendly" },
  { id: "airelibre",   label: "Al aire libre" },
  { id: "tranquilo",   label: "Tranquilo" },
  { id: "fotogenico",  label: "Fotogénico" },
];

const CHINACOTA = { lat: 7.6069, lng: -72.6027 };

function jitter(base, km) {
  const d = km / 111; // grados aproximados por km
  return {
    lat: base.lat + (Math.random() - 0.5) * d * 2,
    lng: base.lng + (Math.random() - 0.5) * d * 2,
  };
}

const PLACES = [
  {
    id: "p1", name: "Café La Cordillera", category: "cafe", price: 1,
    tags: ["tranquilo", "fotogenico"], rating: 4.7,
    address: "Calle 5 #4-12, Chinácota",
    hours: "7:00 a. m. – 7:00 p. m.",
    icon: "☕", cost: 12000,
    description: "Café de origen cultivado en las veredas cercanas, con terraza y vista a la cordillera.",
    ...jitter(CHINACOTA, 0.8),
  },
  {
    id: "p2", name: "Panadería Doña Rosa", category: "cafe", price: 1,
    tags: ["familiar"], rating: 4.5,
    address: "Parque principal, Chinácota",
    hours: "6:00 a. m. – 8:00 p. m.",
    icon: "☕", cost: 8000,
    description: "Pan recién horneado y chocolate caliente, punto de encuentro de la mañana.",
    ...jitter(CHINACOTA, 0.5),
  },
  {
    id: "p3", name: "Restaurante El Fogón Santandereano", category: "restaurante", price: 2,
    tags: ["familiar", "amigos"], rating: 4.6,
    address: "Vía principal, Chinácota",
    hours: "11:00 a. m. – 9:00 p. m.",
    icon: "🍽️", cost: 28000,
    description: "Comida típica santandereana: mute, pastel y carne asada al carbón.",
    ...jitter(CHINACOTA, 1.2),
  },
  {
    id: "p4", name: "Sabores del Valle", category: "restaurante", price: 3,
    tags: ["romantico", "tranquilo"], rating: 4.8,
    address: "Km 3 vía Cúcuta",
    hours: "12:00 p. m. – 10:00 p. m.",
    icon: "🍽️", cost: 55000,
    description: "Cocina de autor con productos locales y terraza con vista al valle.",
    ...jitter(CHINACOTA, 2.5),
  },
  {
    id: "p5", name: "Finca Hotel Mirador Andino", category: "hotel", price: 2,
    tags: ["familiar", "airelibre"], rating: 4.6,
    address: "Vereda La Laguna, Chinácota",
    hours: "Check-in 2:00 p. m.",
    icon: "🏨", cost: 120000,
    description: "Cabañas rodeadas de naturaleza con piscina natural y desayuno incluido.",
    ...jitter(CHINACOTA, 3),
  },
  {
    id: "p6", name: "Hostal Camino Real", category: "hotel", price: 1,
    tags: ["amigos", "petfriendly"], rating: 4.3,
    address: "Centro de Chinácota",
    hours: "Recepción 24h",
    icon: "🏨", cost: 60000,
    description: "Hospedaje sencillo y económico, ideal para viajeros y mochileros.",
    ...jitter(CHINACOTA, 0.6),
  },
  {
    id: "p7", name: "Cascada La Escondida", category: "naturaleza", price: 1,
    tags: ["airelibre", "fotogenico", "tranquilo"], rating: 4.9,
    address: "Vereda Chucarima",
    hours: "8:00 a. m. – 4:00 p. m.",
    icon: "🌿", cost: 5000,
    description: "Caminata corta hasta una cascada rodeada de vegetación nativa.",
    ...jitter(CHINACOTA, 4),
  },
  {
    id: "p8", name: "Mirador Alto de la Cruz", category: "naturaleza", price: 0,
    tags: ["fotogenico", "familiar"], rating: 4.7,
    address: "Alto de la Cruz, Chinácota",
    hours: "6:00 a. m. – 6:00 p. m.",
    icon: "🌿", cost: 0,
    description: "Vista panorámica de todo el valle, ideal para el atardecer.",
    ...jitter(CHINACOTA, 1.5),
  },
  {
    id: "p9", name: "Plaza Central de Chinácota", category: "turistico", price: 0,
    tags: ["familiar", "fotogenico"], rating: 4.4,
    address: "Centro histórico",
    hours: "Todo el día",
    icon: "📸", cost: 0,
    description: "Arquitectura colonial, iglesia principal y vida local del pueblo.",
    ...jitter(CHINACOTA, 0.3),
  },
  {
    id: "p10", name: "Casa Museo del Café", category: "turistico", price: 1,
    tags: ["tranquilo", "fotogenico"], rating: 4.5,
    address: "Calle 3, Chinácota",
    hours: "9:00 a. m. – 5:00 p. m.",
    icon: "📸", cost: 6000,
    description: "Historia de la caficultura de la región en una casa restaurada.",
    ...jitter(CHINACOTA, 0.7),
  },
  {
    id: "p11", name: "Cabalgata Ecológica Los Andes", category: "actividad", price: 2,
    tags: ["amigos", "airelibre"], rating: 4.6,
    address: "Vereda El Carmen",
    hours: "9:00 a. m. – 3:00 p. m.",
    icon: "🎯", cost: 35000,
    description: "Recorrido a caballo por senderos rurales con guía local.",
    ...jitter(CHINACOTA, 3.5),
  },
  {
    id: "p12", name: "Parapente Valle de Chinácota", category: "actividad", price: 3,
    tags: ["amigos", "fotogenico"], rating: 4.9,
    address: "Alto de Lanceros",
    hours: "8:00 a. m. – 2:00 p. m.",
    icon: "🎯", cost: 150000,
    description: "Vuelo en parapente biplaza con vista completa del valle.",
    ...jitter(CHINACOTA, 4.5),
  },
  {
    id: "p13", name: "Mercado Artesanal Santandereano", category: "comercio", price: 1,
    tags: ["familiar"], rating: 4.4,
    address: "Calle principal",
    hours: "8:00 a. m. – 6:00 p. m.",
    icon: "🛍️", cost: 20000,
    description: "Artesanías en fique, cerámica y dulces típicos de la región.",
    ...jitter(CHINACOTA, 0.4),
  },
  {
    id: "p14", name: "Tienda de Café Cordillera Andina", category: "comercio", price: 1,
    tags: ["tranquilo"], rating: 4.6,
    address: "Vía a Cúcuta",
    hours: "8:00 a. m. – 6:00 p. m.",
    icon: "🛍️", cost: 15000,
    description: "Café en grano y molido, cultivado y tostado localmente.",
    ...jitter(CHINACOTA, 1.8),
  },
  {
    id: "p15", name: "Festival de la Cosecha Cafetera", category: "evento", price: 0,
    tags: ["familiar", "amigos"], rating: 4.8,
    address: "Parque principal, Chinácota",
    hours: "Fecha: fin de semana, todo el día",
    icon: "🎉", cost: 0,
    description: "Música, gastronomía y muestras culturales por la temporada de cosecha.",
    ...jitter(CHINACOTA, 0.2),
  },
  {
    id: "p16", name: "Noche de Velas y Faroles", category: "evento", price: 0,
    tags: ["romantico", "familiar"], rating: 4.5,
    address: "Centro histórico",
    hours: "6:00 p. m. – 10:00 p. m.",
    icon: "🎉", cost: 0,
    description: "Tradición local donde el pueblo se ilumina con velas y faroles artesanales.",
    ...jitter(CHINACOTA, 0.3),
  },
];

const PRICE_LABEL = { 0: "Gratis", 1: "$", 2: "$$", 3: "$$$" };
