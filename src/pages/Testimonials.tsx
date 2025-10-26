import { Star, Quote } from "lucide-react";
import Footer from "@/components/Footer";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";

const Testimonials = () => {
  const testimonials = [
    {
      id: 1,
      name: "María González",
      role: "CEO, TechStart Solutions",
      avatar: "MG",
      rating: 5,
      text: "ProveIA revolucionó completamente nuestra forma de encontrar proveedores. La IA identifica exactamente lo que necesitamos y nos conecta con los mejores profesionales. Hemos reducido el tiempo de búsqueda en un 80%.",
    },
    {
      id: 2,
      name: "Carlos Martínez",
      role: "Director de Operaciones, InnovaCorp",
      avatar: "CM",
      rating: 5,
      text: "La plataforma es increíblemente intuitiva y los resultados son excepcionales. Encontramos proveedores de alta calidad que se ajustan perfectamente a nuestro presupuesto y necesidades. ¡Altamente recomendado!",
    },
    {
      id: 3,
      name: "Ana Rodríguez",
      role: "Gerente de Proyectos, Digital Dreams",
      avatar: "AR",
      rating: 5,
      text: "Lo mejor de ProveIA es su capacidad para entender contexto. No solo busca palabras clave, sino que comprende realmente lo que necesitas. Los matches son increíblemente precisos.",
    },
    {
      id: 4,
      name: "Javier López",
      role: "Fundador, StartupHub",
      avatar: "JL",
      rating: 5,
      text: "Como startup, necesitábamos encontrar proveedores confiables rápidamente. ProveIA nos ahorró semanas de investigación y nos conectó con profesionales excepcionales. El sistema de matching es brillante.",
    },
    {
      id: 5,
      name: "Laura Sánchez",
      role: "CTO, CloudTech Systems",
      avatar: "LS",
      rating: 5,
      text: "La integración de IA en el proceso de búsqueda es un game-changer. Hemos encontrado proveedores especializados que ni siquiera sabíamos que existían. La calidad del servicio es sobresaliente.",
    },
    {
      id: 6,
      name: "Roberto Fernández",
      role: "Director Comercial, Marketing Plus",
      avatar: "RF",
      rating: 5,
      text: "ProveIA no solo nos ayuda a encontrar proveedores, sino que nos proporciona insights valiosos sobre tendencias del mercado. Es una herramienta indispensable para nuestro negocio.",
    },
  ];

  const stats = [
    { value: "98.5%", label: "Satisfacción de clientes" },
    { value: "12,500+", label: "Empresas activas" },
    { value: "45,000+", label: "Proyectos completados" },
    { value: "4.9/5", label: "Valoración promedio" },
  ];

  return (
    <div className="min-h-screen bg-[#E9EAED] pt-20">
      <div className="container mx-auto px-4 pt-12 pb-12">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-[#11386E]">
              Lo que dicen nuestros <span className="text-[#00357a]">clientes</span>
            </h1>
            <p className="text-[#11386E]/70 text-lg max-w-2xl mx-auto">
              Miles de empresas confían en ProveIA para encontrar los mejores proveedores.
              Descubre sus experiencias y cómo transformamos su forma de trabajar.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="rounded-[24px] bg-[#E9EAED] shadow-[8px_8px_16px_#c7ccd3,-8px_-8px_16px_#ffffff] p-6 text-center space-y-2"
              >
                <div className="text-3xl font-bold text-[#00357a]">{stat.value}</div>
                <div className="text-sm text-[#11386E]/70">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Testimonials Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.id} className="rounded-[24px] bg-[#E9EAED] shadow-[8px_8px_16px_#c7ccd3,-8px_-8px_16px_#ffffff] border-none">
                <CardHeader>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-[#E9EAED] shadow-[inset_4px_4px_8px_#c7ccd3,inset_-4px_-4px_8px_#ffffff] flex items-center justify-center flex-shrink-0">
                        <span className="text-[#00357a] font-bold">
                          {testimonial.avatar}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#11386E]">{testimonial.name}</h3>
                        <CardDescription className="text-[#11386E]/70">{testimonial.role}</CardDescription>
                      </div>
                    </div>
                    <Quote className="h-8 w-8 text-[#FFDE59] opacity-50" />
                  </div>
                  
                  <div className="flex gap-1">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-[#FFDE59] text-[#FFDE59]"
                      />
                    ))}
                  </div>
                </CardHeader>
                
                <CardContent>
                  <p className="text-[#11386E]/70 italic">
                    "{testimonial.text}"
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* CTA Section */}
          <div className="rounded-[24px] bg-[#E9EAED] shadow-[8px_8px_16px_#c7ccd3,-8px_-8px_16px_#ffffff] p-12 text-center space-y-6">
            <h2 className="text-3xl font-bold text-[#11386E]">
              ¿Listo para encontrar tu proveedor perfecto?
            </h2>
            <p className="text-[#11386E]/70 text-lg max-w-2xl mx-auto">
              Únete a miles de empresas que ya están transformando su forma de trabajar
              con ProveIA. Empieza gratis hoy mismo.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/register">
                <button className="rounded-[16px] bg-[#0B355E] text-white px-8 py-3 text-[18px] font-semibold shadow-[8px_8px_16px_#c7ccd3] hover:shadow-[12px_12px_20px_#c7ccd3] transition-all">
                  Comenzar ahora
                </button>
              </a>
              <a href="/dashboard">
                <button className="rounded-[16px] bg-[#E9EAED] text-[#11386E] px-8 py-3 text-[18px] font-medium shadow-[8px_8px_16px_#c7ccd3,-8px_-8px_16px_#ffffff] hover:shadow-[12px_12px_20px_#c7ccd3,-12px_-12px_20px_#ffffff] transition-all">
                  Explorar dashboard
                </button>
              </a>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Testimonials;
