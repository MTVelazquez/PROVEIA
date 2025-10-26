import { TypewriterEffect } from "./TypewriterEffect";
import { Bot } from "lucide-react";

export const SearchHero = () => {
  const examples = [
    "Quiero un proveedor de ferreterías en Monterrey",
    "Necesito una gasolinera cerca de mí",
    "Busco proveedores de papelería en Ciudad de México",
    "Quiero un proveedor de logística en Guadalajara",
    "Necesito refaccionarias en Nuevo León",
    "Busco tlapalerías en el área metropolitana"
  ];

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-12 bg-gradient-to-b from-[#E9EAED] to-[#E9EAED]/50">
      <div className="max-w-4xl w-full text-center space-y-8">
        {/* Logo/Icon */}
        <div className="w-20 h-20 rounded-full bg-[#E9EAED] shadow-[inset_8px_8px_16px_#c7ccd3,inset_-8px_-8px_16px_#ffffff] flex items-center justify-center mx-auto mb-6 animate-fade-in">
          <Bot className="h-10 w-10 text-[#00357a]" />
        </div>

        {/* Title */}
        <h1 className="text-5xl md:text-6xl font-bold text-[#11386E] animate-fade-in">
          Buscador <span className="text-[#00357a]">Inteligente</span>
        </h1>

        {/* Subtitle with typing animation */}
        <div className="text-xl md:text-2xl h-16 flex items-center justify-center animate-fade-in" style={{animationDelay: '0.2s'}}>
          <TypewriterEffect texts={examples} typingSpeed={80} deletingSpeed={40} pauseDuration={2500} />
        </div>

        {/* Description */}
        <p className="text-[#11386E]/70 text-lg max-w-2xl mx-auto animate-fade-in" style={{animationDelay: '0.4s' as any}}>
          Usa inteligencia artificial para encontrar los mejores proveedores cerca de ti.
          <br />
          Solo describe lo que necesitas y nosotros hacemos el resto.
        </p>
      </div>
    </div>
  );
};