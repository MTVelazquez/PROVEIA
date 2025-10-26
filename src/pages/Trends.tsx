import { TrendingUp, TrendingDown, Zap } from "lucide-react";
import Footer from "@/components/Footer";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const Trends = () => {
  const trendingCategories = [
    {
      name: "Inteligencia Artificial",
      growth: "+245%",
      trend: "up",
      description: "La demanda de servicios de IA ha crecido exponencialmente en el último trimestre",
    },
    {
      name: "Sostenibilidad",
      growth: "+189%",
      trend: "up",
      description: "Empresas buscan proveedores con certificaciones ambientales",
    },
    {
      name: "Ciberseguridad",
      growth: "+156%",
      trend: "up",
      description: "Aumento en la necesidad de soluciones de seguridad digital",
    },
    {
      name: "Servicios tradicionales",
      growth: "-23%",
      trend: "down",
      description: "Disminución en demanda de servicios no digitalizados",
    },
  ];

  const insights = [
    {
      title: "Tendencia Principal del Mes",
      description: "Los servicios relacionados con IA generativa lideran el crecimiento",
      icon: Zap,
    },
    {
      title: "Sector en Auge",
      description: "Las empresas del sector tecnológico aumentaron su gasto en un 67%",
      icon: TrendingUp,
    },
    {
      title: "Predicción del Trimestre",
      description: "Se espera un crecimiento del 180% en servicios de automatización",
      icon: TrendingUp,
    },
  ];

  return (
    <div className="min-h-screen bg-[#E9EAED] pt-20">
      <div className="container mx-auto px-4 pt-12 pb-12">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-[#11386E]">
              Tendencias del <span className="text-[#00357a]">Mercado</span>
            </h1>
            <p className="text-[#11386E]/70 text-lg">
              Análisis en tiempo real del mercado de proveedores
            </p>
          </div>

          {/* Insights Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {insights.map((insight, index) => {
              const Icon = insight.icon;
              return (
                <Card key={index} className="rounded-[24px] bg-[#E9EAED] shadow-[8px_8px_16px_#c7ccd3,-8px_-8px_16px_#ffffff] border-none">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-full bg-[#E9EAED] shadow-[inset_4px_4px_8px_#c7ccd3,inset_-4px_-4px_8px_#ffffff] flex items-center justify-center mb-3">
                      <Icon className="h-6 w-6 text-[#11386E]" />
                    </div>
                    <CardTitle className="text-lg text-[#11386E]">{insight.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-[#11386E]/70">{insight.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Trending Categories */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-[#11386E]">Categorías en Tendencia</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {trendingCategories.map((category, index) => (
                <Card key={index} className="rounded-[24px] bg-[#E9EAED] shadow-[8px_8px_16px_#c7ccd3,-8px_-8px_16px_#ffffff] border-none">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl text-[#11386E]">{category.name}</CardTitle>
                      <div
                        className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                          category.trend === "up"
                            ? "bg-green-500/10 text-green-500"
                            : "bg-red-500/10 text-red-500"
                        }`}
                      >
                        {category.trend === "up" ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                        <span className="font-bold">{category.growth}</span>
                      </div>
                    </div>
                    <CardDescription className="text-[#11386E]/70">{category.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-2 bg-[#E9EAED] shadow-[inset_2px_2px_4px_#c7ccd3,inset_-2px_-2px_4px_#ffffff] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          category.trend === "up"
                            ? "bg-[#00357a]"
                            : "bg-red-500"
                        }`}
                        style={{
                          width: category.trend === "up" ? "85%" : "20%",
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Market Overview */}
          <Card className="rounded-[24px] bg-[#E9EAED] shadow-[8px_8px_16px_#c7ccd3,-8px_-8px_16px_#ffffff] border-none">
            <CardHeader>
              <CardTitle className="text-2xl text-[#11386E]">Análisis del Mercado</CardTitle>
              <CardDescription className="text-[#11386E]/70">
                Datos actualizados del primer trimestre de 2025
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center p-6 rounded-[16px] bg-[#E9EAED] shadow-[inset_4px_4px_8px_#c7ccd3,inset_-4px_-4px_8px_#ffffff]">
                  <div className="text-4xl font-bold text-[#00357a] mb-2">12.5K</div>
                  <div className="text-sm text-[#11386E]/70">Proveedores activos</div>
                </div>
                <div className="text-center p-6 rounded-[16px] bg-[#E9EAED] shadow-[inset_4px_4px_8px_#c7ccd3,inset_-4px_-4px_8px_#ffffff]">
                  <div className="text-4xl font-bold text-[#00357a] mb-2">45.2K</div>
                  <div className="text-sm text-[#11386E]/70">Proyectos completados</div>
                </div>
                <div className="text-center p-6 rounded-[16px] bg-[#E9EAED] shadow-[inset_4px_4px_8px_#c7ccd3,inset_-4px_-4px_8px_#ffffff]">
                  <div className="text-4xl font-bold text-[#00357a] mb-2">98.5%</div>
                  <div className="text-sm text-[#11386E]/70">Satisfacción promedio</div>
                </div>
                <div className="text-center p-6 rounded-[16px] bg-[#E9EAED] shadow-[inset_4px_4px_8px_#c7ccd3,inset_-4px_-4px_8px_#ffffff]">
                  <div className="text-4xl font-bold text-[#00357a] mb-2">€2.8M</div>
                  <div className="text-sm text-[#11386E]/70">Volumen transaccional</div>
                </div>
              </div>

              <div className="prose max-w-none">
                <h3 className="text-lg font-semibold mb-3 text-[#11386E]">Resumen Ejecutivo</h3>
                <p className="text-[#11386E]/70">
                  El mercado de proveedores digitales continúa su expansión acelerada, con un
                  crecimiento del 167% interanual. Los servicios relacionados con inteligencia
                  artificial y automatización lideran la demanda, mientras que las empresas
                  priorizan cada vez más proveedores con certificaciones de sostenibilidad y
                  ciberseguridad.
                </p>
                <p className="text-[#11386E]/70">
                  Las proyecciones para el segundo trimestre indican una consolidación de estas
                  tendencias, con un enfoque especial en soluciones híbridas que combinan
                  expertise humano con capacidades de IA.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Trends;
