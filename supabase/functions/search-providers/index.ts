import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema - Aumentado el límite de mensajes
const requestSchema = z.object({
  messages: z.array(z.object({
    role: z.string(),
    content: z.string().max(2000)
  })).min(1).max(50), // Aumentado de 20 a 50 para conversaciones más largas
  userLocation: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    name: z.string().max(200).optional()
  }).nullish(),
  mode: z.enum(['normal', 'thinking']).optional(),
  radius: z.number().min(100).max(50000).optional()
});

interface Message {
  role: string;
  content: string;
}

interface ThinkingStep {
  step: string;
  message: string;
}

interface Provider {
  id: string;
  name: string;
  category: string;
  description: string;
  rating: number;
  location_name: string;
  latitude: number;
  longitude: number;
  contact_phone: string | null;
  contact_email: string | null;
  website: string | null;
  address: string;
  score: number;
  distance: number;
  cve_scian?: string;
  estrato?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse raw body first
    const rawBody = await req.json();
    
    console.log('=== ANÁLISIS INICIAL ===');
    console.log('Body recibido:', JSON.stringify(rawBody, null, 2));
    
    // PRIMERO: Verificar si es pregunta informativa (ANTES de validación completa)
    if (rawBody.messages && Array.isArray(rawBody.messages) && rawBody.messages.length > 0) {
      const lastMessage = rawBody.messages[rawBody.messages.length - 1]?.content || '';
      console.log('Último mensaje:', lastMessage);
      
      const isInfoQuestion = isLocationInfoQuestion(lastMessage);
      console.log('¿Es pregunta informativa?', isInfoQuestion);
      
      if (isInfoQuestion) {
        console.log('✅ Detectado como pregunta informativa - usando Gemini');
        const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
        if (!GEMINI_API_KEY) {
          throw new Error('GEMINI_API_KEY no configurada');
        }
        
        const aiResponse = await callGemini(lastMessage, GEMINI_API_KEY, 'info');
        return new Response(JSON.stringify({
          type: 'info',
          message: aiResponse
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }
    
    console.log('❌ NO es pregunta informativa - procediendo con validación completa');
    
    // SEGUNDO: Validar schema completo solo si NO es pregunta informativa
    const validationResult = requestSchema.safeParse(rawBody);
    
    if (!validationResult.success) {
      console.error('Validation error:', validationResult.error);
      return new Response(JSON.stringify({
        type: 'error',
        message: 'Datos de entrada inválidos. Por favor verifica tu solicitud.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const { messages, userLocation, mode = 'normal', radius } = validationResult.data;
    
    const DENUE_API_KEY = Deno.env.get('DENUE_API_KEY');
    const GEOAPIFY_API_KEY = Deno.env.get('GEOAPIFY_API_KEY');
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

    if (!DENUE_API_KEY || !GEOAPIFY_API_KEY || !GEMINI_API_KEY) {
      throw new Error('API keys no configuradas');
    }

    // Analizar la última consulta del usuario
    const lastUserMessage = messages[messages.length - 1]?.content || '';
    const thinkingSteps: ThinkingStep[] = [];
    
    console.log('=== PROCESANDO BÚSQUEDA ===');
    console.log('Mensaje a procesar:', lastUserMessage);

    // Paso 1: Detectar intención
    thinkingSteps.push({
      step: 'analyzing',
      message: '🤔 Analizando tu solicitud...'
    });

    const searchTerms = extractSearchTerms(lastUserMessage);
    console.log('Términos de búsqueda extraídos:', searchTerms);
    
    // Intentar extraer ubicación del mensaje
    let location = userLocation;
    let locationText: string | null = null;
    
    if (!location) {
      locationText = extractLocation(lastUserMessage);
    }
    
    const needsLocation = !location && !locationText;
    const needsRadius = !radius && !containsRadius(lastUserMessage);

    // Si falta información, hacer preguntas aclaratorias con Gemini
    if (needsLocation) {
      const aiQuestion = await callGemini(lastUserMessage, GEMINI_API_KEY, 'ask_location');
      return new Response(JSON.stringify({
        type: 'question',
        message: aiQuestion,
        needsLocation: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (needsRadius) {
      const aiQuestion = await callGemini(lastUserMessage, GEMINI_API_KEY, 'ask_radius');
      return new Response(JSON.stringify({
        type: 'question',
        message: aiQuestion,
        needsRadius: true,
        options: [
          { label: '2 km', value: 2000 },
          { label: '5 km', value: 5000 }
        ]
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Paso 2: Geocodificar ubicación
    thinkingSteps.push({
      step: 'geocoding',
      message: '🗺️ Obteniendo coordenadas de la ubicación...'
    });

    if (!location && locationText) {
      location = await geocode(locationText, GEOAPIFY_API_KEY);
    }
    
    // Validación final de ubicación
    if (!location) {
      return new Response(JSON.stringify({
        type: 'error',
        message: 'No se pudo determinar la ubicación. Por favor especifica una ciudad.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Paso 3: Buscar en DENUE
    thinkingSteps.push({
      step: 'searching',
      message: `🔍 Buscando ${searchTerms.display} en un radio de ${(radius || 2000) / 1000} km...`
    });

    let providers = await searchDENUE(
      searchTerms.terms,
      location.latitude,
      location.longitude,
      radius || 2000,
      DENUE_API_KEY
    );

    // Paso 4: Enriquecer con Geoapify (solo en modo thinking)
    if (mode === 'thinking' && providers.length > 0) {
      thinkingSteps.push({
        step: 'enriching',
        message: '✨ Enriqueciendo datos con información adicional...'
      });

      providers = await enrichProviders(providers, GEOAPIFY_API_KEY, searchTerms.geoCategories);
    }

    // Paso 5: Calcular scores
    thinkingSteps.push({
      step: 'scoring',
      message: '📊 Calculando puntuaciones de relevancia...'
    });

    providers = providers.map(p => ({
      ...p,
      score: calculateScore(p, location, searchTerms.terms, mode === 'thinking'),
      distance: calculateDistance(location.latitude, location.longitude, p.latitude, p.longitude)
    }));

    // Ordenar por score
    providers.sort((a, b) => b.score - a.score);

    // Limitar resultados si el usuario especifica un número
    const requestedLimit = extractLimit(lastUserMessage);
    const resultsToShow = requestedLimit || Math.min(providers.length, 50);
    
    // Preparar respuesta personalizada con Gemini
    let responseMessage;
    if (providers.length > 0) {
      const context = `Encontré ${providers.length} ${searchTerms.display} cerca de ${location.name}. ${requestedLimit ? `El usuario pidió los ${requestedLimit} mejores.` : ''} Radio de búsqueda: ${(radius || 2000) / 1000} km.`;
      responseMessage = await callGemini(lastUserMessage, GEMINI_API_KEY, 'results', context);
    } else {
      const context = `No se encontraron ${searchTerms.display} en ${location.name} con radio de ${(radius || 2000) / 1000} km.`;
      responseMessage = await callGemini(lastUserMessage, GEMINI_API_KEY, 'no_results', context);
    }

    return new Response(JSON.stringify({
      type: 'results',
      message: responseMessage,
      thinking: thinkingSteps,
      providers: providers.slice(0, resultsToShow),
      location,
      mode
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    // Log detailed error server-side for debugging
    console.error('Error en search-providers:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    
    // Mensaje de error personalizado con Gemini
    try {
      const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
      if (GEMINI_API_KEY) {
        const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
        const aiError = await callGemini('', GEMINI_API_KEY, 'error', errorMsg);
        return new Response(JSON.stringify({
          type: 'error',
          message: aiError
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    } catch (geminiError) {
      console.error('Error llamando a Gemini para mensaje de error:', geminiError);
    }
    
    // Return safe generic message to client (no internal details)
    return new Response(JSON.stringify({
      type: 'error',
      message: 'Ocurrió un error al buscar proveedores. Por favor intenta de nuevo.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Función para llamar a Gemini API
async function callGemini(
  userMessage: string,
  apiKey: string,
  type: 'info' | 'ask_location' | 'ask_radius' | 'results' | 'no_results' | 'error',
  context?: string
): Promise<string> {
  let systemPrompt = '';
  let prompt = '';

  switch (type) {
    case 'info':
      systemPrompt = 'Eres un asistente amigable y profesional de ProveIA, un sistema que ayuda a encontrar proveedores en México. Responde de manera concisa y amable sobre la cobertura del servicio.';
      prompt = `El usuario pregunta: "${userMessage}"\n\nExplica que ProveIA tiene cobertura en todo México, menciona algunas ciudades principales de manera natural y pregunta en qué ciudad específica necesita buscar. Usa emojis relevantes pero con moderación. Máximo 150 palabras.`;
      break;
    
    case 'ask_location':
      systemPrompt = 'Eres un asistente conversacional de ProveIA. Haz preguntas naturales y amigables.';
      prompt = `El usuario busca: "${userMessage}"\n\nNecesitas preguntarle en qué ubicación quiere buscar. Sé breve y natural. Máximo 30 palabras.`;
      break;
    
    case 'ask_radius':
      systemPrompt = 'Eres un asistente conversacional de ProveIA. Haz preguntas naturales y amigables.';
      prompt = `El usuario busca: "${userMessage}"\n\nNecesitas preguntarle a qué distancia quiere buscar. Sé breve y natural. Máximo 30 palabras.`;
      break;
    
    case 'results':
      systemPrompt = 'Eres un asistente de ProveIA que presenta resultados de búsqueda de manera profesional y amigable.';
      prompt = `Contexto: ${context}\n\nPresenté los resultados de búsqueda. Genera un mensaje breve (máximo 50 palabras) que:\n- Confirme qué se encontró\n- Mencione que están ordenados por relevancia\n- Sea profesional pero amigable\n- Use 1-2 emojis relevantes`;
      break;
    
    case 'no_results':
      systemPrompt = 'Eres un asistente empático de ProveIA que ayuda cuando no hay resultados.';
      prompt = `Contexto: ${context}\n\nNo se encontraron resultados. Genera un mensaje breve (máximo 40 palabras) que:\n- Sea empático\n- Sugiera ampliar el radio o intentar otra categoría\n- Mantenga un tono positivo\n- Use 1 emoji relevante`;
      break;
    
    case 'error':
      systemPrompt = 'Eres un asistente empático de ProveIA que maneja errores con profesionalismo.';
      prompt = `Error técnico: ${context}\n\nGenera un mensaje de error amigable (máximo 30 palabras) que:\n- Sea empático\n- Pida al usuario intentar de nuevo\n- No mencione detalles técnicos\n- Use 1 emoji apropiado`;
      break;
  }

  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=' + apiKey, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${systemPrompt}\n\n${prompt}`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 200,
        }
      })
    });

    if (!response.ok) {
      console.error('Gemini API error:', response.status);
      throw new Error('Error en Gemini API');
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    return generatedText.trim() || getFallbackMessage(type);
  } catch (error) {
    console.error('Error llamando a Gemini:', error);
    return getFallbackMessage(type);
  }
}

function getFallbackMessage(type: string): string {
  switch (type) {
    case 'info':
      return '📍 Tengo información de proveedores en todo México. ¿En qué ciudad específica necesitas buscar?';
    case 'ask_location':
      return '📍 ¿En qué ubicación quieres buscar proveedores?';
    case 'ask_radius':
      return '📏 ¿A qué distancia quieres buscar?';
    case 'results':
      return '✅ Aquí están los resultados encontrados, ordenados por relevancia.';
    case 'no_results':
      return '😔 No encontré resultados. Intenta ampliar el radio de búsqueda.';
    case 'error':
      return '❌ Ocurrió un error. Por favor intenta de nuevo.';
    default:
      return 'Procesando tu solicitud...';
  }
}

// Funciones auxiliares
function isLocationInfoQuestion(text: string): boolean {
  const lower = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  console.log('Verificando si es pregunta informativa...');
  
  // Palabras clave que indican pregunta sobre cobertura (NO sobre búsqueda)
  const locationWords = lower.includes('ubicaciones') || lower.includes('ciudades') || 
                        lower.includes('lugares') || lower.includes('estados') ||
                        lower.includes('municipios') || lower.includes('zonas') ||
                        lower.includes('regiones') || lower.includes('areas');
  
  const infoWords = lower.includes('tienes') || lower.includes('tiene') || 
                    lower.includes('hay') || lower.includes('cubres') || 
                    lower.includes('manejas') || lower.includes('disponibles') ||
                    lower.includes('que ubicaciones') || lower.includes('cuales ubicaciones') ||
                    lower.includes('donde tienes') || lower.includes('saber') || 
                    lower.includes('conocer') || lower.includes('ver si') || 
                    lower.includes('lista') || lower.includes('informacion') ||
                    lower.includes('cobertura') || lower.includes('cuantos') ||
                    lower.includes('cuantas');
  
  const hasInfoKeywords = locationWords && infoWords;
  
  // NO es pregunta informativa si menciona buscar algo específico
  const isSearchQuery = 
    /(?:busca|buscar|encuentra|encontrar|dame|necesito|quiero)\s+(?:proveedores?\s+(?:de|en)\s+\w+|gasolineras|ferreterias|farmacias|hoteles|restaurantes|papelerias)/i.test(lower);
  
  console.log('  - Has location words:', locationWords);
  console.log('  - Has info words:', infoWords);
  console.log('  - Has info keywords:', hasInfoKeywords);
  console.log('  - Is search query:', isSearchQuery);
  
  return hasInfoKeywords && !isSearchQuery;
}

function extractSearchTerms(text: string) {
  const lower = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  // Gasolineras
  if (/gasolin/.test(lower)) {
    return {
      terms: ['gasolinera', '468411'],
      display: 'gasolineras',
      geoCategories: 'service.fuel,transport.fuel'
    };
  }
  
  // Ferreterías y tlapalerías
  if (/ferreter|tlapaler/.test(lower)) {
    return {
      terms: ['ferretería', '467111', 'tlapalería'],
      display: 'ferreterías',
      geoCategories: 'commercial.hardware,commercial.tools'
    };
  }
  
  // Papelerías
  if (/papeler/.test(lower)) {
    return {
      terms: ['papelería', '465910'],
      display: 'papelerías',
      geoCategories: 'commercial.stationery,commercial.books'
    };
  }
  
  // Farmacias
  if (/farmaci/.test(lower)) {
    return {
      terms: ['farmacia', '464111'],
      display: 'farmacias',
      geoCategories: 'healthcare.pharmacy'
    };
  }
  
  // Metal / Acero / Herrería
  if (/metal|acero|herrer/.test(lower)) {
    return {
      terms: ['metal', '331', 'acero', 'herrería'],
      display: 'proveedores de metal',
      geoCategories: 'commercial.metal,commercial.wholesale'
    };
  }
  
  // Restaurantes
  if (/restauran|comida|comer/.test(lower)) {
    return {
      terms: ['restaurante', '722'],
      display: 'restaurantes',
      geoCategories: 'catering.restaurant'
    };
  }
  
  // Supermercados
  if (/supermerc|abarrot/.test(lower)) {
    return {
      terms: ['supermercado', '462111', 'abarrotes'],
      display: 'supermercados',
      geoCategories: 'commercial.supermarket,commercial.food'
    };
  }
  
  // Logística - más específico para evitar resultados irrelevantes
  if (/logisti/.test(lower)) {
    return {
      terms: ['logística', 'transporte de carga', 'almacenamiento'],
      display: 'empresas de logística',
      geoCategories: 'service.logistics,transport.truck'
    };
  }
  
  // Paquetería/Mensajería (separado de logística)
  if (/paquet|mensaj|courier/.test(lower)) {
    return {
      terms: ['paquetería', 'mensajería', '492110'],
      display: 'empresas de paquetería',
      geoCategories: 'service.delivery,service.postal'
    };
  }
  
  // Refacciones
  if (/refacci|autoparte|repuesto/.test(lower)) {
    return {
      terms: ['refacciones', '468420', 'autopartes'],
      display: 'refaccionarias',
      geoCategories: 'transport.car_repair,commercial.wholesale'
    };
  }
  
  // Bancos
  if (/banco/.test(lower)) {
    return {
      terms: ['banco', '522'],
      display: 'bancos',
      geoCategories: 'service.financial,service.bank'
    };
  }
  
  // Hoteles
  if (/hotel|hospeda/.test(lower)) {
    return {
      terms: ['hotel', '721'],
      display: 'hoteles',
      geoCategories: 'accommodation.hotel'
    };
  }
  
  // Construcción / Materiales
  if (/construc|material|cemento|arena/.test(lower)) {
    return {
      terms: ['construcción', '467114', 'materiales'],
      display: 'materiales de construcción',
      geoCategories: 'commercial.building_materials'
    };
  }
  
  // Plástico
  if (/plastic/.test(lower)) {
    return {
      terms: ['plástico', '326', 'plasticos'],
      display: 'proveedores de plástico',
      geoCategories: 'commercial.wholesale'
    };
  }
  
  // Textil / Tela - más específico
  if (/textil|tela|tejido|fabric/.test(lower)) {
    return {
      terms: ['telas', 'textiles', 'fabrica de textiles', '314'],
      display: 'proveedores textiles',
      geoCategories: 'commercial.textiles,commercial.fabric'
    };
  }
  
  // Fallback: extraer palabras clave (evitar texto completo)
  const keywords = lower
    .replace(/busca|buscar|encuentra|quiero|necesito|dame|en|de|la|el|los|las|cerca|proveedores?/g, '')
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 3)
    .slice(0, 2); // Solo las primeras 2 palabras relevantes
  
  const searchTerm = keywords.length > 0 ? keywords.join(' ') : 'comercio';
  
  return {
    terms: [searchTerm],
    display: 'proveedores',
    geoCategories: ''
  };
}

function extractLimit(text: string): number | null {
  const limitMatch = text.match(/(?:los\s+)?(\d+)\s+mejores|top\s+(\d+)|primeros?\s+(\d+)/i);
  if (limitMatch) {
    const num = parseInt(limitMatch[1] || limitMatch[2] || limitMatch[3]);
    return num > 0 && num <= 50 ? num : null;
  }
  return null;
}

function containsLocation(text: string): boolean {
  // Patrones para detectar menciones de ubicación
  const locationPatterns = [
    /\ben\s+([a-záéíóúñ]+(?:\s+[a-záéíóúñ]+)?)/i,  // "en Monterrey", "en Ciudad de México"
    /\bde\s+([a-záéíóúñ]+(?:\s+[a-záéíóúñ]+)?)/i,  // "de Guadalajara"
    /\bcerca\s+de\s+([a-záéíóúñ]+(?:\s+[a-záéíóúñ]+)?)/i,  // "cerca de León"
  ];
  
  return locationPatterns.some(pattern => pattern.test(text));
}

function containsRadius(text: string): boolean {
  return /\d+\s*(km|kilómetros|metros|m\b)/i.test(text);
}

function extractLocation(text: string): string | null {
  const lower = text.toLowerCase();
  
  // Lista expandida de ciudades principales de México
  const cityKeywords = [
    'monterrey', 'guadalajara', 'ciudad de méxico', 'cdmx', 'puebla', 'tijuana',
    'león', 'zapopan', 'mérida', 'san luis potosí', 'querétaro', 'toluca',
    'cancún', 'chihuahua', 'saltillo', 'aguascalientes', 'morelia', 'hermosillo',
    'culiacán', 'veracruz', 'mexicali', 'acapulco', 'cuernavaca', 'oaxaca',
    'san pedro', 'guadalupe', 'santa catarina', 'escobedo', 'apodaca',
    'nuevo león', 'jalisco', 'guanajuato', 'yucatán', 'quintana roo'
  ];
  
  // Buscar ciudades conocidas
  for (const city of cityKeywords) {
    if (lower.includes(city)) {
      return city;
    }
  }
  
  // Intentar extraer ubicación usando patrones
  const locationPatterns = [
    /\ben\s+([a-záéíóúñ]+(?:\s+[a-záéíóúñ]+)?)/i,
    /\bde\s+([a-záéíóúñ]+(?:\s+[a-záéíóúñ]+)?)/i,
    /\bcerca\s+de\s+([a-záéíóúñ]+(?:\s+[a-záéíóúñ]+)?)/i,
  ];
  
  for (const pattern of locationPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      // Filtrar palabras comunes que no son ubicaciones
      const extracted = match[1].toLowerCase();
      const stopWords = ['la', 'el', 'los', 'las', 'un', 'una', 'mi', 'tu', 'su'];
      if (!stopWords.includes(extracted)) {
        return match[1];
      }
    }
  }
  
  return null;
}

async function geocode(locationText: string, apiKey: string) {
  const url = new URL('https://api.geoapify.com/v1/geocode/search');
  url.searchParams.set('text', `${locationText}, México`); // Forzar búsqueda en México
  url.searchParams.set('filter', 'countrycode:mx'); // Filtrar solo resultados de México
  url.searchParams.set('apiKey', apiKey);
  
  console.log(`Geocodificando: ${locationText} (filtrado a México)`);
  
  const response = await fetch(url.toString());
  if (!response.ok) {
    console.error('Error en geocodificación:', response.status);
    throw new Error('Error en geocodificación');
  }
  
  const data = await response.json();
  console.log(`Geoapify devolvió ${data.features?.length || 0} resultados`);
  
  const feature = data.features?.[0];
  if (!feature) {
    console.error('No se encontró la ubicación en México');
    throw new Error('Ubicación no encontrada en México. Por favor especifica una ciudad mexicana.');
  }
  
  const [lon, lat] = feature.geometry.coordinates;
  console.log(`Coordenadas obtenidas: lat=${lat}, lon=${lon}`);
  
  return {
    latitude: lat,
    longitude: lon,
    name: feature.properties.formatted
  };
}

async function searchDENUE(
  terms: string[],
  lat: number,
  lon: number,
  radius: number,
  token: string
): Promise<Provider[]> {
  const results: Provider[] = [];
  
  // Validar coordenadas de México antes de buscar
  if (lat < 14 || lat > 33 || lon < -118 || lon > -86) {
    console.error(`Coordenadas fuera de México: lat=${lat}, lon=${lon}`);
    throw new Error('Las coordenadas están fuera de México. Por favor verifica la ubicación.');
  }
  
  for (const term of terms) {
    try {
      const url = `https://www.inegi.org.mx/app/api/denue/v1/consulta/Buscar/${encodeURIComponent(term)}/${lat},${lon}/${radius}/${token}`;
      console.log(`Buscando en DENUE: ${term} en (${lat}, ${lon}) con radio ${radius}m`);
      
      // Añadir timeout y mejor manejo de errores
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 segundos timeout
      
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Accept': 'application/json'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.error(`DENUE HTTP error para ${term}: ${response.status} ${response.statusText}`);
        continue;
      }
      
      const text = await response.text();
      
      // Validar que la respuesta sea JSON válido
      if (!text || text.trim().length === 0) {
        console.error(`DENUE devolvió respuesta vacía para ${term}`);
        continue;
      }
      
      const parsed = parseDENUE(text);
      console.log(`✅ DENUE encontró ${parsed.length} resultados para: ${term}`);
      results.push(...parsed);
      
      if (results.length > 0) break; // Si encontramos resultados, no seguir buscando
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError' || error.name === 'TimeoutError') {
          console.error(`⏱️ Timeout buscando ${term} en DENUE (15s excedido)`);
        } else {
          console.error(`❌ Error buscando término ${term}:`, error.message);
        }
      } else {
        console.error(`❌ Error desconocido buscando ${term}:`, error);
      }
      // Continuar con el siguiente término en lugar de fallar completamente
      continue;
    }
  }
  
  // Si no hay resultados con el radio especificado, intentar con 10km
  if (results.length === 0 && radius < 10000) {
    console.log(`No se encontraron resultados en ${radius}m, ampliando a 10km`);
    return searchDENUE(terms, lat, lon, 10000, token);
  }
  
  return deduplicateProviders(results);
}

function parseDENUE(text: string): Provider[] {
  try {
    const data = JSON.parse(text);
    if (Array.isArray(data)) {
      return data.map((item: any) => ({
        id: item.Id || item.id || String(Math.random()),
        name: item.Nombre || item.nom_estab || 'Sin nombre',
        category: item.Clase_actividad || item.nombre_act || 'Sin categoría',
        description: item.Clase_actividad || item.clase_actividad || '',
        rating: 0,
        location_name: item.Ubicacion || item.localidad || '',
        latitude: parseFloat(item.Latitud || item.latitud || '0'),
        longitude: parseFloat(item.Longitud || item.longitud || '0'),
        contact_phone: item.Telefono || item.telefono || null,
        contact_email: item.Correo_e || item.correoelec || null,
        website: item.Sitio_internet || item.www || null,
        address: formatAddress(item),
        score: 0,
        distance: 0,
        cve_scian: item.Codigo_SCIAN || item.cve_scian || '',
        estrato: item.Estrato || item.per_ocu || ''
      }));
    }
  } catch (e) {
    console.error('Error parsing DENUE JSON:', e);
  }
  
  // Fallback: parse as pipe-delimited
  const lines = text.trim().split('\n').filter(Boolean);
  const providers: Provider[] = [];
  
  for (const line of lines) {
    const parts = line.split('|');
    if (parts.length < 19) continue;
    
    providers.push({
      id: parts[1] || String(Math.random()),
      name: parts[2] || 'Sin nombre',
      category: parts[4] || 'Sin categoría',
      description: parts[4] || '',
      rating: 0,
      location_name: parts[12] || '',
      latitude: parseFloat(parts[18] || '0'),
      longitude: parseFloat(parts[17] || '0'),
      contact_phone: parts[13] || null,
      contact_email: parts[14] || null,
      website: parts[15] || null,
      address: `${parts[6] || ''} ${parts[7] || ''} ${parts[8] || ''}, ${parts[10] || ''} ${parts[11] || ''}`.trim(),
      score: 0,
      distance: 0,
      cve_scian: '',
      estrato: parts[5] || ''
    });
  }
  
  return providers;
}

function formatAddress(item: any): string {
  const parts = [
    item.Tipo_vialidad || item.tipo_vialidad,
    item.Calle || item.nom_vial,
    item.Num_Exterior || item.numero_ext,
    item.Colonia || item.nomb_asent,
    item.CP ? `CP ${item.CP}` : ''
  ].filter(Boolean);
  
  return parts.join(' ');
}

function deduplicateProviders(providers: Provider[]): Provider[] {
  const seen = new Set<string>();
  const unique: Provider[] = [];
  
  for (const provider of providers) {
    const key = `${provider.name}|${provider.latitude}|${provider.longitude}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(provider);
    }
  }
  
  return unique;
}

async function enrichProviders(
  providers: Provider[],
  apiKey: string,
  categories: string
): Promise<Provider[]> {
  if (!categories) return providers;
  
  const enriched: Provider[] = [];
  
  for (const provider of providers) {
    try {
      const placeData = await geoapifyPlaceNear(
        provider.longitude,
        provider.latitude,
        apiKey,
        categories
      );
      
      if (placeData) {
        provider.website = provider.website || placeData.website || null;
        provider.contact_phone = provider.contact_phone || placeData.phone || null;
      }
    } catch (error) {
      console.error('Error enriqueciendo proveedor:', error);
    }
    
    enriched.push(provider);
  }
  
  return enriched;
}

async function geoapifyPlaceNear(
  lon: number,
  lat: number,
  apiKey: string,
  categories: string
) {
  const url = new URL('https://api.geoapify.com/v2/places');
  url.searchParams.set('categories', categories);
  url.searchParams.set('filter', `circle:${lon},${lat},250`);
  url.searchParams.set('limit', '1');
  url.searchParams.set('apiKey', apiKey);
  
  const response = await fetch(url.toString());
  if (!response.ok) return null;
  
  const data = await response.json();
  const feature = data.features?.[0];
  if (!feature) return null;
  
  const props = feature.properties || {};
  return {
    website: props.website || props.datasource?.raw?.website || '',
    phone: props.datasource?.raw?.phone || ''
  };
}

function calculateScore(
  provider: Provider,
  location: { latitude: number; longitude: number },
  searchTerms: string[],
  enriched: boolean
): number {
  let score = 0;
  
  // Proximidad (50 puntos max)
  const distance = calculateDistance(
    location.latitude,
    location.longitude,
    provider.latitude,
    provider.longitude
  );
  const proximityScore = Math.max(0, 50 * (1 - Math.min(distance, 5) / 5));
  score += proximityScore;
  
  // Datos de contacto
  if (provider.contact_phone) score += 10;
  if (provider.website) score += 10;
  if (provider.contact_email) score += 5;
  
  // Match de categoría/descripción
  const desc = (provider.description || '').toLowerCase();
  const cve = (provider.cve_scian || '').toString();
  const hasMatch = searchTerms.some(term => 
    desc.includes(term.toLowerCase()) || cve.includes(term)
  );
  if (hasMatch) score += 15;
  
  // Bonus por enriquecimiento
  if (enriched && (provider.website || provider.contact_phone)) {
    score += 10;
  }
  
  return Math.round(score);
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
