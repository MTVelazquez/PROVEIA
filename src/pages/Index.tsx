import { Link } from "react-router-dom";
import { Search, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import Footer from "@/components/Footer";
import AIChat from "@/components/AIChat";

const Index = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section with Neumorphic Style */}
      <section className="min-h-screen w-full bg-[#E9EAED] dark:bg-slate-900 flex flex-col pt-20 transition-colors">
          {/* Hero Content */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center px-6 sm:px-10 pt-6">
            {/* Left: Title + Slogan + Buttons */}
            <div className="flex flex-col items-start gap-6">
              {/* Title */}
              <h1 className="text-5xl md:text-7xl font-rubik font-bold text-[#00357a] dark:text-slate-100 leading-tight transition-colors">
                Optimiza tu Cadena de Suministro con{" "}
                <span className="text-[#00357a] dark:text-slate-100">
                  Prove<span className="text-[#ffde59] font-bold italic">IA</span>
                </span>
              </h1>

              {/* Slogan */}
              <p className="text-lg md:text-xl text-[#00357a]/70 dark:text-slate-300 max-w-xl transition-colors">
                Utiliza el poder de la Inteligencia Artificial para predecir la demanda, optimizar rutas y gestionar tu inventario de forma más inteligente.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4 mt-2">
                <Link to="/search">
                  <button className="text-[20px] px-8 py-3 rounded-[16px] bg-[#00357a] dark:bg-blue-700 text-white shadow-[8px_8px_16px_#c7ccd3,-8px_-8px_16px_#ffffff] dark:shadow-[8px_8px_16px_#0f172a,-8px_-8px_16px_#334155] hover:shadow-[12px_12px_20px_#c7ccd3,-12px_-12px_20px_#ffffff] dark:hover:shadow-[12px_12px_20px_#0f172a,-12px_-12px_20px_#334155] transition-all font-rubik font-semibold">
                    Empieza Aquí
                  </button>
                </Link>
                <Link to="/dashboard">
                  <button className="text-[20px] px-8 py-3 rounded-[16px] bg-[#E9EAED] dark:bg-slate-800 text-[#00357a] dark:text-slate-200 shadow-[8px_8px_16px_#c7ccd3,-8px_-8px_16px_#ffffff] dark:shadow-[8px_8px_16px_#0f172a,-8px_-8px_16px_#334155] border-2 border-[#00357a] dark:border-slate-600 hover:shadow-[12px_12px_20px_#c7ccd3,-12px_-12px_20px_#ffffff] dark:hover:shadow-[12px_12px_20px_#0f172a,-12px_-12px_20px_#334155] transition-all font-rubik font-medium">
                    Ver DEMO
                  </button>
                </Link>
              </div>
            </div>

            {/* Right: Illustration */}
            <div className="w-full flex items-center justify-center">
              <img
                src="/proveia/LogoGrande.png"
                alt="ProveIA Ilustración"
                className="w-full max-w-[620px] h-auto drop-shadow-sm"
              />
            </div>
          </div>
      </section>

      {/* AI Chat Section */}
      <section className="py-20 bg-[#E9EAED] dark:bg-slate-900 transition-colors">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-[#11386E] dark:text-slate-100 transition-colors">
              Asistente <span className="text-[#FFDE59]">Inteligente</span>
            </h2>
            <p className="text-[#11386E]/70 dark:text-slate-300 text-lg transition-colors">
              Chatea con nuestra IA para encontrar exactamente lo que necesitas
            </p>
          </div>
          <div className="max-w-4xl mx-auto rounded-[24px] bg-[#E9EAED] dark:bg-slate-800 shadow-[8px_8px_16px_#c7ccd3,-8px_-8px_16px_#ffffff] dark:shadow-[8px_8px_16px_#0f172a,-8px_-8px_16px_#334155] p-8 transition-all">
            <AIChat />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white dark:bg-slate-950 transition-colors">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="rounded-[24px] bg-[#E9EAED] dark:bg-slate-800 shadow-[8px_8px_16px_#c7ccd3,-8px_-8px_16px_#ffffff] dark:shadow-[8px_8px_16px_#0f172a,-8px_-8px_16px_#334155] p-8 text-center space-y-4 hover:shadow-[12px_12px_20px_#c7ccd3,-12px_-12px_20px_#ffffff] dark:hover:shadow-[12px_12px_20px_#0f172a,-12px_-12px_20px_#334155] transition-all">
              <div className="w-16 h-16 rounded-full bg-[#E9EAED] dark:bg-slate-700 shadow-[inset_4px_4px_8px_#c7ccd3,inset_-4px_-4px_8px_#ffffff] dark:shadow-[inset_4px_4px_8px_#0f172a,inset_-4px_-4px_8px_#334155] flex items-center justify-center mx-auto">
                <Search className="h-8 w-8 text-[#11386E] dark:text-slate-300" />
              </div>
              <h3 className="text-xl font-semibold text-[#11386E] dark:text-slate-100">Búsqueda Inteligente</h3>
              <p className="text-[#11386E]/70 dark:text-slate-300">
                Encuentra proveedores con IA avanzada que entiende tus necesidades específicas
              </p>
            </div>

            <div className="rounded-[24px] bg-[#E9EAED] dark:bg-slate-800 shadow-[8px_8px_16px_#c7ccd3,-8px_-8px_16px_#ffffff] dark:shadow-[8px_8px_16px_#0f172a,-8px_-8px_16px_#334155] p-8 text-center space-y-4 hover:shadow-[12px_12px_20px_#c7ccd3,-12px_-12px_20px_#ffffff] dark:hover:shadow-[12px_12px_20px_#0f172a,-12px_-12px_20px_#334155] transition-all">
              <div className="w-16 h-16 rounded-full bg-[#E9EAED] dark:bg-slate-700 shadow-[inset_4px_4px_8px_#c7ccd3,inset_-4px_-4px_8px_#ffffff] dark:shadow-[inset_4px_4px_8px_#0f172a,inset_-4px_-4px_8px_#334155] flex items-center justify-center mx-auto">
                <TrendingUp className="h-8 w-8 text-[#11386E] dark:text-slate-300" />
              </div>
              <h3 className="text-xl font-semibold text-[#11386E] dark:text-slate-100">Análisis de Tendencias</h3>
              <p className="text-[#11386E]/70 dark:text-slate-300">
                Descubre oportunidades emergentes y mantente al día con el mercado
              </p>
            </div>

            <div className="rounded-[24px] bg-[#E9EAED] dark:bg-slate-800 shadow-[8px_8px_16px_#c7ccd3,-8px_-8px_16px_#ffffff] dark:shadow-[8px_8px_16px_#0f172a,-8px_-8px_16px_#334155] p-8 text-center space-y-4 hover:shadow-[12px_12px_20px_#c7ccd3,-12px_-12px_20px_#ffffff] dark:hover:shadow-[12px_12px_20px_#0f172a,-12px_-12px_20px_#334155] transition-all">
              <div className="w-16 h-16 rounded-full bg-[#E9EAED] dark:bg-slate-700 shadow-[inset_4px_4px_8px_#c7ccd3,inset_-4px_-4px_8px_#ffffff] dark:shadow-[inset_4px_4px_8px_#0f172a,inset_-4px_-4px_8px_#334155] flex items-center justify-center mx-auto">
                <Users className="h-8 w-8 text-[#11386E] dark:text-slate-300" />
              </div>
              <h3 className="text-xl font-semibold text-[#11386E] dark:text-slate-100">Matching Perfecto</h3>
              <p className="text-[#11386E]/70 dark:text-slate-300">
                Conecta con proveedores que realmente se ajustan a tus requerimientos
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#0B355E] dark:bg-blue-950 transition-colors">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            ¿Listo para transformar tu negocio?
          </h2>
          <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
            Únete a miles de empresas que ya están usando ProveIA para encontrar
            los mejores proveedores con inteligencia artificial
          </p>
          <Link to="/register">
            <button className="text-[22px] px-8 py-3 rounded-[16px] bg-[#FFDE59] text-[#0B355E] dark:text-slate-900 shadow-[8px_8px_16px_rgba(0,0,0,0.3)] border-2 border-[#FFDE59] hover:shadow-[12px_12px_20px_rgba(0,0,0,0.4)] transition-all font-semibold">
              Comenzar ahora
            </button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
