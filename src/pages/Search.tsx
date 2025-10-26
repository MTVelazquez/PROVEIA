import { useState, useEffect } from "react";
import { Search as SearchIcon, MapPin, Star, Clock, Phone, Bot, Filter, CheckSquare, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Footer from "@/components/Footer";
import AISearchChat from "@/components/AISearchChat";
import { ProviderMap } from "@/components/ProviderMap";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
interface Provider {
  id: string;
  name: string;
  category: string;
  description: string;
  rating: number;
  reviews_count: number;
  location_name: string;
  latitude: number;
  longitude: number;
  delivery_time: string;
  contact_phone: string;
  certifications: string[];
  services: string[];
  hourly_rate: number;
}
const Search = () => {
  const [showAIChat, setShowAIChat] = useState(true);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProviders, setSelectedProviders] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("all");

  // Load providers from database
  useEffect(() => {
    loadProviders();
  }, []);
  const loadProviders = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('providers').select('*').order('rating', {
        ascending: false
      });
      if (error) throw error;
      setProviders(data || []);
    } catch (error) {
      console.error('Error loading providers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate score (0-100) for each provider
  const calculateScore = (provider: Provider, userLocation?: {
    latitude: number;
    longitude: number;
  }) => {
    let score = 0;

    // Proximity score (0-50 points)
    if (userLocation) {
      const distance = calculateDistance(userLocation.latitude, userLocation.longitude, provider.latitude, provider.longitude);
      const proximityScore = Math.max(0, 50 * (1 - Math.min(distance, 5) / 5));
      score += proximityScore;
    }

    // Contact data completeness
    if (provider.contact_phone) score += 10;
    if (provider.description) score += 5;

    // SCIAN category match (simplified)
    score += 15;

    // Additional data
    if (provider.certifications?.length > 0) score += 10;
    return Math.round(score);
  };
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 2 * R * Math.asin(Math.sqrt(a));
  };
  const getScoreBadge = (score: number) => {
    if (score >= 70) return {
      color: "bg-green-500 text-white",
      icon: "⭐"
    };
    if (score >= 40) return {
      color: "bg-yellow-500 text-black",
      icon: "⭐"
    };
    return {
      color: "bg-red-500 text-white",
      icon: "⭐"
    };
  };
  const toggleProvider = (id: string) => {
    const newSelected = new Set(selectedProviders);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedProviders(newSelected);
  };
  const toggleAll = () => {
    if (selectedProviders.size === filteredProviders.length) {
      setSelectedProviders(new Set());
    } else {
      setSelectedProviders(new Set(filteredProviders.map(p => p.id)));
    }
  };

  // Filter providers
  const filteredProviders = providers.filter(p => {
    const matchesSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.category.toLowerCase().includes(searchQuery.toLowerCase()) || p.location_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || p.category.toLowerCase().includes(categoryFilter.toLowerCase());
    const matchesRating = ratingFilter === "all" || p.rating >= Number(ratingFilter);
    return matchesSearch && matchesCategory && matchesRating;
  });
  return <div className="h-screen bg-white dark:bg-slate-950 overflow-hidden pt-[88px] transition-colors">
      {showAIChat ? (/* AI Chat - Fullscreen with toggle button */
    <div className="relative h-full overflow-hidden">
          {/* Toggle button fixed at top */}
          <div className="absolute top-4 right-4 z-50">
            
          </div>
          <AISearchChat />
        </div>) : (/* Traditional view - Results with map and table */
    <>
          <div className="min-h-screen bg-white dark:bg-slate-950 pt-20 transition-colors">
            {/* Hero section */}
            <section className="bg-gradient-to-br from-blue-50 to-white dark:from-slate-900 dark:to-slate-950 border-b border-gray-200 dark:border-slate-700 transition-colors">
              <div className="max-w-7xl mx-auto px-4 py-8">
                <h1 className="text-4xl font-bold text-[#11386E] dark:text-slate-100 mb-2 transition-colors">
                  Buscador <span className="text-[#ffde59]">Inteligente</span>
                </h1>
                <p className="text-gray-600 dark:text-slate-300 mb-6 transition-colors">
                  Sistema con scoring 0–100 (proximidad, datos completos, match SCIAN/categoría)
                </p>

                {/* Search bar */}
                <div className="max-w-2xl mb-4">
                  <div className="relative">
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-slate-500" />
                    <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Escribe aquí..." className="pl-12 h-12 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-slate-100 shadow-sm transition-colors" />
                  </div>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-300">
                    <Filter className="h-4 w-4" />
                    <span className="font-medium">Filtro:</span>
                  </div>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-48 rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200">
                      <SelectValue placeholder="Todas las categorías" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las categorías</SelectItem>
                      <SelectItem value="gasolinera">Gasolineras</SelectItem>
                      <SelectItem value="ferretería">Ferreterías</SelectItem>
                      <SelectItem value="papelería">Papelerías</SelectItem>
                      <SelectItem value="logística">Logística</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={ratingFilter} onValueChange={setRatingFilter}>
                    <SelectTrigger className="w-48 rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200">
                      <SelectValue placeholder="Mayor Valoración" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="4">4+ estrellas</SelectItem>
                      <SelectItem value="4.5">4.5+ estrellas</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select>
                    <SelectTrigger className="w-32 rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200">
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            {/* Results count */}
            <div className="max-w-7xl mx-auto px-4 py-4">
              <p className="text-gray-700 dark:text-slate-300 font-medium transition-colors">{filteredProviders.length} proveedores encontrados:</p>
            </div>

            {/* Map */}
            <div className="max-w-7xl mx-auto px-4 mb-6">
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden shadow-sm transition-colors" style={{
            height: '400px'
          }}>
                <ProviderMap providers={filteredProviders.map(p => ({
              id: p.id,
              name: p.name,
              latitude: p.latitude,
              longitude: p.longitude,
              location_name: p.location_name,
              score: calculateScore(p)
            }))} />
              </div>
            </div>

            {/* Results Cards */}
            <main className="max-w-7xl mx-auto px-4 pb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {filteredProviders.map(provider => {
              const score = calculateScore(provider);
              const badge = getScoreBadge(score);
              return <div key={provider.id} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-4 hover:shadow-md transition-all">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-start gap-2 mb-1">
                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${badge.color}`}>
                              {badge.icon}
                            </span>
                            <strong className="text-base text-gray-900 dark:text-slate-100">{provider.name}</strong>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-slate-400 mb-2">{provider.category}</p>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-700 dark:text-slate-300 mb-3 line-clamp-2">{provider.description}</p>
                      
                      <div className="space-y-2 text-sm mb-4">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-slate-400">
                          <MapPin className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{provider.location_name}</span>
                        </div>
                        {provider.contact_phone && <div className="flex items-center gap-2 text-gray-600 dark:text-slate-400">
                            <Phone className="h-4 w-4 flex-shrink-0" />
                            <span>{provider.contact_phone}</span>
                          </div>}
                        <div className="flex items-center gap-2">
                          <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline text-xs">Visita el sitio</a>
                          <span className="text-gray-300 dark:text-slate-600">|</span>
                          <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline text-xs">Buscar en Google</a>
                          <span className="text-gray-300 dark:text-slate-600">|</span>
                          <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline text-xs">Abrir en Google Maps</a>
                        </div>
                      </div>
                    </div>;
            })}
              </div>

              {/* Show more button */}
              <div className="flex justify-center mb-8">
                <button className="px-6 py-2 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300 font-medium transition-colors">
                  MOSTRAR MÁS
                </button>
              </div>

              {/* Table */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden shadow-sm transition-colors">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 transition-colors">
                      <tr>
                        <th className="px-4 py-3 text-left">
                          <button onClick={toggleAll} className="text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200">
                            {selectedProviders.size === filteredProviders.length ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5" />}
                          </button>
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-700 dark:text-slate-300">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-700 dark:text-slate-300">Nombre</th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-700 dark:text-slate-300">Categoría</th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-700 dark:text-slate-300">Ubicación</th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-700 dark:text-slate-300">Teléfono</th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-700 dark:text-slate-300">Rating</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProviders.map(provider => <tr key={provider.id} className="border-b border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                          <td className="px-4 py-3">
                            <button onClick={() => toggleProvider(provider.id)} className="text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200">
                              {selectedProviders.has(provider.id) ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5" />}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-gray-600 dark:text-slate-400">Online</span>
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-900 dark:text-slate-100">{provider.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-slate-400">{provider.category}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-slate-400">{provider.location_name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-slate-400">{provider.contact_phone || '-'}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-[#ffde59] fill-[#ffde59]" />
                              <span className="text-sm font-medium dark:text-slate-200">{provider.rating}</span>
                            </div>
                          </td>
                        </tr>)}
                    </tbody>
                  </table>
                </div>
              </div>
            </main>
          </div>

          <Footer />
        </>)}
    </div>;
};
export default Search;