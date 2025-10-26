import { useState, useEffect } from "react";
import { Building2, User, Users, Search, Clock, MapPin, Trash2, Star, History } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SearchHistory {
  id: string;
  search_query: string;
  location_name: string | null;
  results_count: number;
  created_at: string;
  radius: number | null;
}

interface FavoriteProvider {
  id: string;
  provider_id: string;
  provider_name: string;
  provider_category: string | null;
  created_at: string;
}

const Dashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<"provider" | "client" | "both" | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [favoriteProviders, setFavoriteProviders] = useState<FavoriteProvider[]>([]);
  const [user, setUser] = useState<any>(null);

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/login');
          return;
        }
        
        setUser(user);

        // Load user role
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();

        if (roleData) {
          setSelectedRole(roleData.role as "provider" | "client" | "both");
        }

        // Load search history (últimas 10 búsquedas)
        const { data: historyData } = await supabase
          .from('search_history')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (historyData) {
          setSearchHistory(historyData);
        }

        // Load favorite providers
        const { data: favoritesData } = await supabase
          .from('favorite_providers')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (favoritesData) {
          setFavoriteProviders(favoritesData);
        }

      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [navigate]);

  const handleRoleSelection = async (role: "provider" | "client" | "both") => {
    try {
      if (!user) return;

      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: user.id, role });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Ya tienes un rol asignado",
            description: "No puedes cambiar tu rol una vez seleccionado",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: "No se pudo guardar el rol",
            variant: "destructive",
          });
        }
        return;
      }

      setSelectedRole(role);
      toast({
        title: "¡Rol guardado!",
        description: `Tu rol ha sido guardado exitosamente.`,
      });
    } catch (error) {
      console.error('Error saving role:', error);
    }
  };

  const handleDeleteSearch = async (searchId: string) => {
    try {
      const { error } = await supabase
        .from('search_history')
        .delete()
        .eq('id', searchId);

      if (error) throw error;

      setSearchHistory(prev => prev.filter(s => s.id !== searchId));
      toast({
        title: "Búsqueda eliminada",
        description: "La búsqueda ha sido eliminada del historial",
      });
    } catch (error) {
      console.error('Error deleting search:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la búsqueda",
        variant: "destructive",
      });
    }
  };

  const handleDeleteFavorite = async (favoriteId: string) => {
    try {
      const { error } = await supabase
        .from('favorite_providers')
        .delete()
        .eq('id', favoriteId);

      if (error) throw error;

      setFavoriteProviders(prev => prev.filter(f => f.id !== favoriteId));
      toast({
        title: "Favorito eliminado",
        description: "El proveedor ha sido eliminado de favoritos",
      });
    } catch (error) {
      console.error('Error deleting favorite:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el favorito",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-MX', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pt-20">
        <div className="container mx-auto px-4 pt-12 pb-12 flex items-center justify-center">
          <div className="text-xl">Cargando...</div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="container mx-auto px-4 pt-12 pb-12">
        {!selectedRole ? (
          <div className="max-w-4xl mx-auto animate-fade-in">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold mb-4">
                Bienvenido a tu <span className="text-primary">Dashboard</span>
              </h1>
              <p className="text-muted-foreground text-lg">
                Selecciona tu rol para personalizar tu experiencia
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card 
                className="cursor-pointer hover:shadow-lg transition-all"
                onClick={() => handleRoleSelection("provider")}
              >
                <CardHeader className="text-center space-y-4">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <Building2 className="h-10 w-10 text-primary" />
                  </div>
                  <CardTitle>Proveedor</CardTitle>
                  <CardDescription>
                    Ofrece tus servicios y encuentra nuevos clientes
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-lg transition-all"
                onClick={() => handleRoleSelection("client")}
              >
                <CardHeader className="text-center space-y-4">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <User className="h-10 w-10 text-primary" />
                  </div>
                  <CardTitle>Cliente</CardTitle>
                  <CardDescription>
                    Busca y contrata a los mejores proveedores
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-lg transition-all"
                onClick={() => handleRoleSelection("both")}
              >
                <CardHeader className="text-center space-y-4">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <Users className="h-10 w-10 text-primary" />
                  </div>
                  <CardTitle>Ambos</CardTitle>
                  <CardDescription>
                    Accede a todas las funcionalidades
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2">
                  ¡Hola, <span className="text-primary">{user?.email?.split('@')[0]}!</span>
                </h1>
                <p className="text-muted-foreground">
                  Rol: {selectedRole === "provider" ? "Proveedor" : selectedRole === "client" ? "Cliente" : "Ambos"}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => navigate('/search')}
              >
                <Search className="h-4 w-4 mr-2" />
                Nueva Búsqueda
              </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Búsquedas Totales
                  </CardTitle>
                  <History className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{searchHistory.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Proveedores Favoritos
                  </CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{favoriteProviders.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Última Actividad
                  </CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">
                    {searchHistory.length > 0 ? formatDate(searchHistory[0].created_at) : 'Sin actividad'}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Search History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Historial de Búsquedas
                </CardTitle>
                <CardDescription>
                  Tus búsquedas más recientes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {searchHistory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No tienes búsquedas aún</p>
                    <Button 
                      className="mt-4" 
                      onClick={() => navigate('/search')}
                    >
                      Hacer primera búsqueda
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {searchHistory.map((search) => (
                      <div
                        key={search.id}
                        className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Search className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{search.search_query}</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {search.location_name && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {search.location_name}
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDate(search.created_at)}
                            </div>
                            <Badge variant="secondary">
                              {search.results_count} resultados
                            </Badge>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteSearch(search.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Favorite Providers */}
            {favoriteProviders.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Proveedores Favoritos
                  </CardTitle>
                  <CardDescription>
                    Proveedores que has marcado como favoritos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {favoriteProviders.map((favorite) => (
                      <div
                        key={favorite.id}
                        className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div>
                          <p className="font-medium">{favorite.provider_name}</p>
                          {favorite.provider_category && (
                            <Badge variant="outline" className="mt-1">
                              {favorite.provider_category}
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteFavorite(favorite.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Dashboard;
