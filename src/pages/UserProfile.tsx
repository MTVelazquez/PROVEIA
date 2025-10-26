import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Mail, Phone, Edit, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Footer from "@/components/Footer";

const UserProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);

        if (!id) {
          if (user) {
            navigate(`/profile/${user.id}`);
          } else {
            navigate('/login');
          }
          return;
        }

        // Fetch profile
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (error) throw error;
        setProfile(profileData);
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "No se pudo cargar el perfil",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate, toast]);

  const isOwnProfile = currentUser?.id === id;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#E9EAED] pt-20">
        <div className="container mx-auto px-4 pt-12 pb-12 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="text-xl text-[#11386E]">Cargando perfil...</div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#E9EAED] pt-20">
        <div className="container mx-auto px-4 pt-12 pb-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[#11386E] mb-4">Perfil no encontrado</h1>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E9EAED] pt-20">
      <div className="container mx-auto px-4 pt-12 pb-12">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header Section */}
          <div className="rounded-[24px] bg-[#E9EAED] shadow-[8px_8px_16px_#c7ccd3,-8px_-8px_16px_#ffffff] p-8">
            <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-start">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name || "Usuario"}
                    className="w-48 h-48 rounded-full object-cover border-8 border-[#FFDE59] shadow-[8px_8px_16px_#c7ccd3]"
                  />
                ) : (
                  <div className="w-48 h-48 rounded-full bg-[#E9EAED] shadow-[inset_8px_8px_16px_#c7ccd3,inset_-8px_-8px_16px_#ffffff] border-8 border-[#FFDE59] flex items-center justify-center">
                    <span className="text-6xl font-bold text-[#00357a]">
                      {profile.full_name?.charAt(0) || "U"}
                    </span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 text-center lg:text-left">
                <div className="mb-4">
                  <h1 className="text-4xl md:text-5xl font-bold mb-2">
                    <span className="text-[#00357a]">{profile.full_name?.split(' ')[0] || "Nombre"}</span>
                    <br />
                    <span className="text-[#FFDE59]">{profile.full_name?.split(' ').slice(1).join(' ') || "Apellido"}</span>
                  </h1>
                </div>

                <div className="space-y-2 text-lg text-[#11386E]">
                  {profile.phone && (
                    <div className="flex items-center gap-2 justify-center lg:justify-start">
                      <Phone className="h-5 w-5" />
                      <span>Tel: {profile.phone}</span>
                    </div>
                  )}
                  {currentUser?.email && (
                    <div className="flex items-center gap-2 justify-center lg:justify-start">
                      <Mail className="h-5 w-5" />
                      <span>Correo: {currentUser.email}</span>
                    </div>
                  )}
                </div>

                {isOwnProfile && (
                  <div className="mt-6 flex gap-3 justify-center lg:justify-start">
                    <button
                      onClick={() => navigate(`/profile/${id}/edit`)}
                      className="rounded-[16px] bg-[#0B355E] text-white px-6 py-3 text-[16px] font-semibold shadow-[8px_8px_16px_#c7ccd3] hover:shadow-[12px_12px_20px_#c7ccd3] transition-all flex items-center gap-2"
                    >
                      <Edit className="h-5 w-5" />
                      Editar Perfil
                    </button>
                  </div>
                )}

                {!isOwnProfile && (
                  <div className="mt-6 flex gap-3 justify-center lg:justify-start">
                    <button className="rounded-[16px] bg-[#0B355E] text-white px-6 py-3 text-[16px] font-semibold shadow-[8px_8px_16px_#c7ccd3] hover:shadow-[12px_12px_20px_#c7ccd3] transition-all flex items-center gap-2">
                      <MessageCircle className="h-5 w-5" />
                      Contactar
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {profile.description && (
            <div className="rounded-[24px] bg-[#FFDE59]/20 p-8">
              <h2 className="text-2xl font-bold text-[#11386E] mb-4">Descripción</h2>
              <p className="text-[#11386E] leading-relaxed">{profile.description}</p>
            </div>
          )}

          {/* Historial Section */}
          <div className="rounded-[24px] bg-white p-8">
            <h2 className="text-3xl font-bold text-[#11386E] mb-6">Historial</h2>
            
            <div className="space-y-4 mb-8">
              <div className="text-[#11386E]">
                <h3 className="text-xl font-semibold mb-2">Proveedores contactados:</h3>
                <p className="text-[#11386E]/70">Aún no has contactado proveedores.</p>
              </div>
              
              <div className="text-[#11386E]">
                <h3 className="text-xl font-semibold mb-2">Proyección de precios:</h3>
                <p className="text-[#11386E]/70">No hay datos disponibles.</p>
              </div>
              
              <div className="text-[#11386E]">
                <h3 className="text-xl font-semibold mb-2">Disponibilidad:</h3>
                <p className="text-[#11386E]/70">No especificada.</p>
              </div>
            </div>

            {/* Placeholder cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-[16px] bg-[#E9EAED] shadow-[8px_8px_16px_#c7ccd3,-8px_-8px_16px_#ffffff] p-6 min-h-[200px] flex items-center justify-center">
                <p className="text-[#11386E]/50 text-center">Sin proyectos recientes</p>
              </div>
              <div className="rounded-[16px] bg-[#E9EAED] shadow-[8px_8px_16px_#c7ccd3,-8px_-8px_16px_#ffffff] p-6 min-h-[200px] flex items-center justify-center">
                <p className="text-[#11386E]/50 text-center">Sin colaboraciones</p>
              </div>
            </div>
          </div>

          {/* Explorar Button */}
          <div className="text-center">
            <button
              onClick={() => navigate('/search')}
              className="rounded-[16px] bg-[#FFDE59] text-[#0B355E] px-12 py-4 text-[20px] font-bold shadow-[8px_8px_16px_#c7ccd3] hover:shadow-[12px_12px_20px_#c7ccd3] transition-all"
            >
              Explorar
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default UserProfile;