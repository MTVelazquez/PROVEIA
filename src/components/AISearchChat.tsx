import { Bot, Send, Sparkles, MapPin, Zap, Brain, DollarSign, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ProviderMap } from "@/components/ProviderMap";
import { Provider } from "@/types/provider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TypewriterEffect } from "@/components/TypewriterEffect";
import { SimplePaymentDialog } from "@/components/SimplePaymentDialog";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant" | "thinking";
  content: string;
  providers?: Provider[];
  needsLocation?: boolean;
  needsRadius?: boolean;
  radiusOptions?: Array<{ label: string; value: number }>;
}

interface ThinkingStep {
  step: string;
  message: string;
}

const AISearchChat = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "¡Hola! Soy tu asistente inteligente de ProveIA. ¿Qué tipo de proveedor estás buscando?"
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [selectedRadius, setSelectedRadius] = useState<number>(2000);
  const [aiMode, setAiMode] = useState<"normal" | "thinking">("normal");
  const [providers, setProviders] = useState<Provider[]>([]);
  const [filteredProviders, setFilteredProviders] = useState<Provider[]>([]);
  const [filters, setFilters] = useState({
    estrato: "all",
    contacto: "all",
    municipio: "all",
    orderBy: "score"
  });
  const [showFilters, setShowFilters] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showInitialScreen, setShowInitialScreen] = useState(true);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Obtener ubicación del usuario
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => console.error("Error obteniendo ubicación:", error)
      );
    }
  }, []);

  useEffect(() => {
    if (providers.length > 0) {
      applyFilters();
    } else {
      setFilteredProviders([]);
    }
  }, [providers, filters]);

  const applyFilters = () => {
    let filtered = [...providers];

    console.log('AISearchChat: Applying filters to', providers.length, 'providers');

    // Filtrar por estrato
    if (filters.estrato && filters.estrato !== "all") {
      filtered = filtered.filter(p => p.estrato === filters.estrato);
    }

    // Filtrar por contacto
    if (filters.contacto === "phone") {
      filtered = filtered.filter(p => p.contact_phone);
    } else if (filters.contacto === "web") {
      filtered = filtered.filter(p => p.website);
    } else if (filters.contacto === "both") {
      filtered = filtered.filter(p => p.contact_phone && p.website);
    }

    // Filtrar por municipio
    if (filters.municipio && filters.municipio !== "all") {
      filtered = filtered.filter(p => 
        p.location_name.toLowerCase().includes(filters.municipio.toLowerCase())
      );
    }

    // Ordenar
    if (filters.orderBy === "score") {
      filtered.sort((a, b) => (b.score || 0) - (a.score || 0));
    } else if (filters.orderBy === "dist") {
      filtered.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    } else if (filters.orderBy === "name") {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    console.log('AISearchChat: After filtering:', filtered.length, 'providers');
    setFilteredProviders(filtered);
  };

  const handleRadiusSelect = async (radius: number) => {
    setSelectedRadius(radius);
    setInput(`Buscar en un radio de ${radius / 1000} km`);
    await handleSend();
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: input
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setShowInitialScreen(false);

    try {
      // Get current session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      
      // Limitar mensajes: mantener primer mensaje + últimos 8 + el nuevo
      const getRelevantMessages = () => {
        const allMessages = [...messages, userMessage];
        if (allMessages.length <= 10) return allMessages;
        
        const firstMessage = allMessages[0]; // Mensaje inicial
        const recentMessages = allMessages.slice(-9); // Últimos 9 mensajes
        
        return [firstMessage, ...recentMessages];
      };
      
      const messagesToSend = getRelevantMessages();
      console.log('AISearchChat: Enviando', messagesToSend.length, 'mensajes (de', messages.length + 1, 'totales)');
      
      const { data, error } = await supabase.functions.invoke('search-providers', {
        body: {
          messages: messagesToSend,
          userLocation,
          mode: aiMode,
          radius: selectedRadius
        }
      });

      if (error) throw error;

      if (data.type === 'question') {
        const questionMessage: Message = {
          role: "assistant",
          content: data.message,
          needsLocation: data.needsLocation,
          needsRadius: data.needsRadius,
          radiusOptions: data.options
        };
        setMessages(prev => [...prev, questionMessage]);
      } else if (data.type === 'info') {
        // Respuestas informativas (como preguntas sobre ubicaciones disponibles)
        setMessages(prev => [...prev, {
          role: "assistant",
          content: data.message
        }]);
      } else if (data.type === 'results') {
        // Mostrar pasos de pensamiento si existen
        if (data.thinking && data.thinking.length > 0) {
          for (const step of data.thinking) {
            setMessages(prev => [...prev, {
              role: "thinking",
              content: step.message
            }]);
            await new Promise(resolve => setTimeout(resolve, 800));
          }
        }

        // Mostrar mensaje de resultado
        setMessages(prev => [...prev, {
          role: "assistant",
          content: data.message,
          providers: data.providers
        }]);

        // Guardar proveedores para filtrado
        setProviders(data.providers || []);
        setShowFilters(data.providers && data.providers.length > 0);
        
        // Guardar búsqueda en el historial si el usuario está autenticado
        if (session?.user) {
          try {
            await supabase.from('search_history').insert({
              user_id: session.user.id,
              search_query: input,
              location_name: data.location_name || null,
              latitude: data.latitude || null,
              longitude: data.longitude || null,
              radius: selectedRadius,
              results_count: data.providers?.length || 0,
            });
          } catch (error) {
            console.error('Error saving search history:', error);
          }
        }
      } else if (data.type === 'error') {
        setMessages(prev => [...prev, {
          role: "assistant",
          content: data.message
        }]);
      }

    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Ocurrió un error al buscar proveedores. Por favor intenta de nuevo."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 70) return "default";
    if (score >= 40) return "secondary";
    return "destructive";
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 70) return "bg-green-500 hover:bg-green-600";
    if (score >= 40) return "bg-yellow-500 hover:bg-yellow-600";
    return "bg-red-500 hover:bg-red-600";
  };

  if (showInitialScreen) {
    return (
      <div className="h-full bg-gradient-to-br from-background via-background to-secondary/20 flex flex-col overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="max-w-4xl w-full space-y-8">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-3 mb-4">
                <img src="/proveia/LogoGrande.png" alt="ProveIA" className="h-20 w-auto" />
              </div>
              <h1 className="text-5xl font-bold text-gray-900 dark:text-white transition-colors">
                Buscador <span className="text-[#ffde59]">Inteligente</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                <TypewriterEffect 
                  texts={[
                    "Encuentra proveedores cerca de ti...",
                    "Busca ferreterías, gasolineras y más...",
                    "Resultados con scoring inteligente..."
                  ]}
                />
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex gap-3 items-center">
                <Select value={aiMode} onValueChange={(value: "normal" | "thinking") => setAiMode(value)}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        <span>Modo Rápido</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="thinking">
                      <div className="flex items-center gap-2">
                        <Brain className="h-4 w-4" />
                        <span>Modo Thinking</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="flex-1 relative">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ej: Busca ferreterías cerca de Monterrey..."
                    className="text-lg py-6 pr-16 rounded-full bg-secondary/50 border-none w-full"
                  />
                  <Button
                    onClick={handleSend}
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-[#ffde59] hover:bg-[#ffde59]/90 text-black h-10 w-10"
                    disabled={isLoading}
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 justify-center">
                <Button
                  variant="outline"
                  className="rounded-full"
                  onClick={() => {
                    setInput("Busca gasolineras cerca de Monterrey");
                    setShowInitialScreen(false);
                  }}
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Gasolineras cercanas
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full"
                  onClick={() => {
                    setInput("Busca ferreterías en Monterrey");
                    setShowInitialScreen(false);
                  }}
                >
                  Ferreterías
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full"
                  onClick={() => {
                    setInput("Busca empresas de logística y transporte en Monterrey");
                    setShowInitialScreen(false);
                  }}
                >
                  Logística
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-background via-background to-secondary/20 flex flex-col relative overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 pb-32 relative z-0">
        <div className="max-w-6xl mx-auto space-y-4">
          {messages.map((message, index) => (
            <div key={index} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            {message.role !== "user" && (
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.role === "thinking" 
                  ? "bg-gradient-to-br from-yellow-500 to-orange-500" 
                  : "bg-[#00357a]"
              } shadow-md`}>
                {message.role === "thinking" ? (
                  <Sparkles className="h-5 w-5 text-white" />
                ) : (
                  <img src="/proveia/IA.png" alt="IA" className="h-6 w-6" />
                )}
              </div>
            )}
            
            <div className={`max-w-[80%] ${message.role === "user" ? "order-first" : ""}`}>
              {message.role === "thinking" ? (
                <div className="bg-secondary/50 rounded-2xl px-4 py-3 border border-yellow-500/30">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-yellow-500 animate-pulse" />
                    <p className="text-sm text-muted-foreground italic">{message.content}</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className={`rounded-2xl px-4 py-3 ${
                    message.role === "user" 
                      ? "bg-primary text-primary-foreground rounded-tr-none" 
                      : "bg-secondary rounded-tl-none"
                  }`}>
                    <p className="text-sm">{message.content}</p>
                  </div>
                  
                  {message.needsRadius && message.radiusOptions && (
                    <div className="mt-3 flex gap-2">
                      {message.radiusOptions.map((option) => (
                        <Button
                          key={option.value}
                          onClick={() => handleRadiusSelect(option.value)}
                          variant="outline"
                          className="rounded-full"
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  )}
                  
                  {message.providers && message.providers.length > 0 && (
                    <div className="mt-4 space-y-4">
                      {showFilters && (
                        <Card className="p-4 space-y-3">
                          <div className="flex items-center gap-2 text-sm font-semibold">
                            <Sparkles className="h-4 w-4" />
                            <span>Filtros</span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <Select value={filters.orderBy} onValueChange={(value) => setFilters({...filters, orderBy: value})}>
                              <SelectTrigger>
                                <SelectValue placeholder="Ordenar" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="score">Por Score</SelectItem>
                                <SelectItem value="dist">Por Proximidad</SelectItem>
                                <SelectItem value="name">Por Nombre</SelectItem>
                              </SelectContent>
                            </Select>
                            
                            <Select value={filters.contacto} onValueChange={(value) => setFilters({...filters, contacto: value})}>
                              <SelectTrigger>
                                <SelectValue placeholder="Contacto" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                <SelectItem value="phone">Con teléfono</SelectItem>
                                <SelectItem value="web">Con web</SelectItem>
                                <SelectItem value="both">Ambos</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Mostrando {filteredProviders.length} de {message.providers.length} resultados
                          </p>
                        </Card>
                      )}
                      
                       {filteredProviders.length > 0 ? (
                        <ProviderMap
                          providers={filteredProviders.slice(0, 100)}
                        />
                      ) : (
                        <div className="w-full h-[400px] rounded-xl overflow-hidden border border-border/40 flex items-center justify-center bg-secondary/20">
                          <p className="text-muted-foreground text-sm">Cargando mapa...</p>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredProviders.slice(0, 18).map((provider) => (
                          <Card key={provider.id} className="p-4 space-y-3 hover:shadow-lg transition-shadow">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-semibold text-sm line-clamp-2">{provider.name}</h3>
                              <Badge className={`${getScoreBadgeColor(provider.score || 0)} text-white flex-shrink-0`}>
                                {provider.score || 0}
                              </Badge>
                            </div>
                            
                            <p className="text-xs text-muted-foreground line-clamp-2">{provider.category}</p>
                            
                            <div className="text-xs space-y-1">
                              <p className="line-clamp-1">{provider.address}</p>
                              <p className="text-muted-foreground">{provider.location_name}</p>
                              {provider.distance && (
                                <p className="text-primary font-medium">
                                  📍 {provider.distance.toFixed(1)} km
                                </p>
                              )}
                            </div>
                            
                            <div className="flex flex-col gap-1 text-xs">
                              {provider.contact_phone && (
                                <a href={`tel:${provider.contact_phone}`} className="text-primary hover:underline">
                                  📞 {provider.contact_phone}
                                </a>
                              )}
                              {provider.website && (
                                <a href={provider.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline line-clamp-1">
                                  🔗 Sitio web
                                </a>
                              )}
                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(provider.name + ' ' + provider.address)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                              >
                                🗺️ Abrir en Google Maps
                              </a>
                            </div>
                            
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="flex-1 gap-2"
                                onClick={async () => {
                                  const { data: { session } } = await supabase.auth.getSession();
                                  if (!session) {
                                    toast.error("Debes iniciar sesión para guardar favoritos");
                                    navigate("/login");
                                    return;
                                  }
                                  
                                  try {
                                    const { error } = await supabase
                                      .from('favorite_providers')
                                      .insert({
                                        user_id: session.user.id,
                                        provider_id: provider.id,
                                        provider_name: provider.name,
                                        provider_category: provider.category,
                                      });
                                    
                                    if (error) {
                                      if (error.code === '23505') {
                                        toast.error("Este proveedor ya está en favoritos");
                                      } else {
                                        throw error;
                                      }
                                    } else {
                                      toast.success("Proveedor agregado a favoritos");
                                    }
                                  } catch (error) {
                                    console.error('Error adding favorite:', error);
                                    toast.error("Error al agregar a favoritos");
                                  }
                                }}
                              >
                                <Star className="h-4 w-4" />
                                Favorito
                              </Button>
                              
                              <Button 
                                size="sm" 
                                className="flex-1 gap-2"
                                onClick={async () => {
                                  const { data: { session } } = await supabase.auth.getSession();
                                  if (!session) {
                                    toast.error("Debes iniciar sesión para realizar pagos");
                                    navigate("/login");
                                    return;
                                  }
                                  setSelectedProvider(provider);
                                  setPaymentDialogOpen(true);
                                }}
                              >
                                <DollarSign className="h-4 w-4" />
                                Pagar
                              </Button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-[#00357a] flex items-center justify-center shadow-md">
              <img src="/proveia/IA.png" alt="IA" className="h-6 w-6 animate-pulse" />
            </div>
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4 shadow-lg z-50">
        <div className="max-w-6xl mx-auto flex gap-3">
          <Select value={aiMode} onValueChange={(value: "normal" | "thinking") => setAiMode(value)}>
            <SelectTrigger className="w-44 flex-shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  <span>Modo Rápido</span>
                </div>
              </SelectItem>
              <SelectItem value="thinking">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  <span>Modo Thinking</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex-1 relative">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escribe tu búsqueda..."
              className="w-full pr-14"
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-[#ffde59] hover:bg-[#ffde59]/90 text-black h-9 w-9"
              disabled={isLoading || !input.trim()}
            >
              {isLoading ? (
                <div className="animate-spin">⌛</div>
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Payment Dialog - NUEVO SISTEMA SIMPLIFICADO */}
      {selectedProvider && (
        <SimplePaymentDialog
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
          providerId={selectedProvider.id}
          providerName={selectedProvider.name}
        />
      )}
    </div>
  );
};

export default AISearchChat;
