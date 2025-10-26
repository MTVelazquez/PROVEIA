import { Send, Sparkles, MapPin, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useRef, useEffect } from "react";
import { TypewriterEffect } from "@/components/TypewriterEffect";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const AIChat = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "¡Hola! Soy tu asistente inteligente. Puedo ayudarte a encontrar proveedores, evaluar oportunidades y responder tus preguntas sobre ProveIA. ¿En qué puedo ayudarte hoy?"
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    // Aquí puedes agregar la lógica de envío cuando sea necesario
  };

  const handleSuggestedQuestion = (question: string, answer: string) => {
    setMessages(prev => [
      ...prev,
      { role: "user", content: question },
      { role: "assistant", content: answer }
    ]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full bg-gradient-to-br from-background via-background to-secondary/20 flex flex-col overflow-hidden rounded-3xl">
      <div className="flex-1 flex flex-col p-8">
        <div className="max-w-4xl w-full mx-auto space-y-6 flex-1 flex flex-col">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-3">
              <img src="/proveia/LogoGrande.png" alt="ProveIA" className="h-16 w-auto" />
            </div>
            <h2 className="text-3xl font-bold">
              Asistente <span className="text-[#ffde59]">Inteligente</span>
            </h2>
            {messages.length === 1 && (
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                <TypewriterEffect 
                  texts={[
                    "Tu aliado en decisiones empresariales...",
                    "Encuentra información al instante...",
                    "Optimiza tu búsqueda de proveedores..."
                  ]}
                />
              </p>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 py-4">
            {messages.map((message, index) => (
              <div key={index} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                {message.role !== "user" && (
                  <div className="w-10 h-10 rounded-full bg-[#00357a] flex items-center justify-center flex-shrink-0 shadow-md">
                    <img src="/proveia/IA.png" alt="IA" className="h-6 w-6" />
                  </div>
                )}
                <div className={`rounded-2xl px-4 py-3 max-w-[70%] ${
                  message.role === "user" 
                    ? "bg-[#ffde59] text-black rounded-tr-none shadow-md" 
                    : "bg-white dark:bg-secondary rounded-tl-none shadow-md"
                }`}>
                  <p className="text-sm whitespace-pre-line">{message.content}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input and Buttons */}
          <div className="space-y-4">
            <div className="relative">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="¿En qué puedo ayudarte hoy?..."
                className="text-lg py-6 pr-16 rounded-full bg-secondary/50 border-none w-full"
              />
              <Button
                onClick={handleSend}
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-[#ffde59] hover:bg-[#ffde59]/90 text-black h-10 w-10"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 justify-center">
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => handleSuggestedQuestion(
                  "¿Cómo funciona ProveIA?",
                  "ProveIA es una plataforma inteligente que te ayuda a encontrar y evaluar proveedores B2B de manera eficiente. Utilizamos IA y datos en tiempo real para ofrecerte:\n\n• 🔍 Búsqueda inteligente de proveedores por ubicación y sector\n• 📊 Sistema de scoring para evaluar la calidad de cada proveedor\n• 🗺️ Visualización en mapas interactivos\n• 💰 Integración con servicios financieros para gestionar pagos\n• 📈 Datos de mercado y análisis de tendencias\n\nTodo diseñado para optimizar tus decisiones empresariales."
                )}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                ¿Cómo funciona?
              </Button>
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => handleSuggestedQuestion(
                  "¿Qué servicios ofrecen?",
                  "En ProveIA ofrecemos una suite completa de servicios B2B:\n\n🔎 Búsqueda Inteligente\n• Encuentra proveedores por ubicación, sector y características específicas\n• Resultados con scoring de calidad\n\n💳 Gestión Financiera\n• Conexión bancaria segura con Plaid\n• Procesamiento de pagos con Stripe\n• Historial de transacciones\n\n📊 Datos de Mercado\n• Información en tiempo real de acciones\n• Tasas de cambio actualizadas\n• Conversor de divisas\n\n🤖 Asistente IA\n• Búsquedas conversacionales\n• Recomendaciones personalizadas\n• Análisis de datos"
                )}
              >
                <Zap className="h-4 w-4 mr-2" />
                Servicios
              </Button>
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => handleSuggestedQuestion(
                  "Ayúdame a encontrar proveedores",
                  "¡Por supuesto! Puedo ayudarte a encontrar proveedores de diferentes maneras:\n\n1️⃣ Ve a nuestro Buscador Inteligente\nUsa el buscador con IA en la sección 'Buscador' del menú principal. Puedes buscar por:\n• Tipo de negocio (ferreterías, gasolineras, etc.)\n• Ubicación específica\n• Radio de búsqueda personalizado\n\n2️⃣ Usa el Dashboard\nExplora proveedores recomendados basados en tu ubicación y preferencias.\n\n3️⃣ Filtra resultados\nAplica filtros por:\n• Score de calidad\n• Proximidad\n• Información de contacto disponible\n\n¿Qué tipo de proveedor estás buscando específicamente?"
                )}
              >
                <MapPin className="h-4 w-4 mr-2" />
                Buscar proveedores
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
