import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, LogOut, User as UserIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { ThemeToggle } from "./ThemeToggle";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (data) {
      setProfile(data);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const navLinks = [
    { name: "Inicio", path: "/" },
    { name: "Dashboard", path: "/dashboard" },
    { name: "Buscador", path: "/search" },
    { name: "Pagos", path: "/payments" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 w-full bg-[#E9EAED] dark:bg-slate-900 px-6 sm:px-10 py-4 border-b-2 border-[#00357a]/20 dark:border-slate-700 transition-colors">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="relative">
          <div className="h-14 w-14 rounded-full bg-[#E9EAED] dark:bg-slate-800 shadow-[8px_8px_16px_#c7ccd3,-8px_-8px_16px_#ffffff] dark:shadow-[8px_8px_16px_#0f172a,-8px_-8px_16px_#334155] border border-white/60 dark:border-slate-700 grid place-items-center overflow-hidden hover:shadow-[12px_12px_20px_#c7ccd3,-12px_-12px_20px_#ffffff] dark:hover:shadow-[12px_12px_20px_#0f172a,-12px_-12px_20px_#334155] transition-all">
            <img
              src="/proveia/LogoGrande.png"
              alt="ProveIA"
              className="h-10 w-10 object-contain"
            />
          </div>
        </Link>

        {/* Center Menu - Desktop */}
        <div className="hidden md:flex items-center gap-2">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`text-[16px] px-5 py-2 rounded-full font-medium transition-colors ${
                location.pathname === link.path
                  ? "text-[#11386E] dark:text-slate-200 bg-[#11386E]/10 dark:bg-slate-800"
                  : "text-[#11386E] dark:text-slate-300 hover:bg-[#11386E]/10 dark:hover:bg-slate-800"
              }`}
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* Login Button - Desktop */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />
          {user ? (
            <div className="flex items-center gap-3">
              <Link to={`/profile/${user.id}`}>
                <div className="flex items-center gap-3 rounded-[16px] bg-[#E9EAED] dark:bg-slate-800 px-4 py-2 shadow-[8px_8px_16px_#c7ccd3,-8px_-8px_16px_#ffffff] dark:shadow-[8px_8px_16px_#0f172a,-8px_-8px_16px_#334155] hover:shadow-[12px_12px_20px_#c7ccd3,-12px_-12px_20px_#ffffff] dark:hover:shadow-[12px_12px_20px_#0f172a,-12px_-12px_20px_#334155] transition-all cursor-pointer">
                  {profile?.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt={profile.full_name || "Usuario"} 
                      className="h-10 w-10 rounded-full object-cover border-2 border-[#FFDE59]"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-[#E9EAED] dark:bg-slate-700 shadow-[inset_4px_4px_8px_#c7ccd3,inset_-4px_-4px_8px_#ffffff] dark:shadow-[inset_4px_4px_8px_#0f172a,inset_-4px_-4px_8px_#334155] flex items-center justify-center">
                      <UserIcon className="h-5 w-5 text-[#11386E] dark:text-slate-300" />
                    </div>
                  )}
                  <span className="text-[16px] font-medium text-[#11386E] dark:text-slate-200">
                    {profile?.full_name || user.email?.split('@')[0] || "Usuario"}
                  </span>
                </div>
              </Link>
              <button
                onClick={handleLogout}
                className="rounded-[16px] bg-[#0B355E] dark:bg-blue-700 px-6 py-3 text-[16px] font-semibold text-white shadow-[8px_8px_16px_#c7ccd3,-8px_-8px_16px_#ffffff] dark:shadow-[8px_8px_16px_#0f172a,-8px_-8px_16px_#334155] hover:opacity-90 transition-all flex items-center gap-2"
              >
                <LogOut className="h-5 w-5" />
                Cerrar Sesión
              </button>
            </div>
          ) : (
            <Link to="/login">
              <button className="rounded-[16px] bg-[#0B355E] dark:bg-blue-700 px-6 py-3 text-[18px] font-semibold text-white shadow-[8px_8px_16px_#c7ccd3,-8px_-8px_16px_#ffffff] dark:shadow-[8px_8px_16px_#0f172a,-8px_-8px_16px_#334155] ring-2 ring-[#0B355E] dark:ring-blue-700 ring-offset-2 ring-offset-[#E9EAED] dark:ring-offset-slate-900 hover:opacity-90 transition-all">
                Iniciar Sesión
              </button>
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center gap-3">
          <ThemeToggle />
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-full text-[#11386E] dark:text-slate-300 hover:bg-[#11386E]/10 dark:hover:bg-slate-800 transition-colors"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden mt-4 pt-4 border-t border-[#00357a]/20 dark:border-slate-700 animate-slide-in-right">
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`text-[16px] px-5 py-2 rounded-full font-medium transition-colors ${
                  location.pathname === link.path
                    ? "text-[#11386E] dark:text-slate-200 bg-[#11386E]/10 dark:bg-slate-800"
                    : "text-[#11386E] dark:text-slate-300 hover:bg-[#11386E]/10 dark:hover:bg-slate-800"
                }`}
              >
                {link.name}
              </Link>
            ))}
            {user ? (
              <>
                <Link to={`/profile/${user.id}`} onClick={() => setIsOpen(false)} className="mt-4">
                  <div className="flex items-center gap-3 rounded-[16px] bg-[#E9EAED] dark:bg-slate-800 px-4 py-3 shadow-[8px_8px_16px_#c7ccd3,-8px_-8px_16px_#ffffff] dark:shadow-[8px_8px_16px_#0f172a,-8px_-8px_16px_#334155] hover:shadow-[12px_12px_20px_#c7ccd3,-12px_-12px_20px_#ffffff] dark:hover:shadow-[12px_12px_20px_#0f172a,-12px_-12px_20px_#334155] transition-all">
                    {profile?.avatar_url ? (
                      <img 
                        src={profile.avatar_url} 
                        alt={profile.full_name || "Usuario"} 
                        className="h-10 w-10 rounded-full object-cover border-2 border-[#FFDE59]"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-[#E9EAED] dark:bg-slate-700 shadow-[inset_4px_4px_8px_#c7ccd3,inset_-4px_-4px_8px_#ffffff] dark:shadow-[inset_4px_4px_8px_#0f172a,inset_-4px_-4px_8px_#334155] flex items-center justify-center">
                        <UserIcon className="h-5 w-5 text-[#11386E] dark:text-slate-300" />
                      </div>
                    )}
                    <span className="text-[16px] font-medium text-[#11386E] dark:text-slate-200">
                      {profile?.full_name || user.email?.split('@')[0] || "Usuario"}
                    </span>
                  </div>
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                  className="w-full rounded-[16px] bg-[#0B355E] dark:bg-blue-700 px-6 py-3 text-[18px] font-semibold text-white shadow-[8px_8px_16px_#c7ccd3,-8px_-8px_16px_#ffffff] dark:shadow-[8px_8px_16px_#0f172a,-8px_-8px_16px_#334155] hover:opacity-90 transition-all flex items-center justify-center gap-2"
                >
                  <LogOut className="h-5 w-5" />
                  Cerrar Sesión
                </button>
              </>
            ) : (
              <Link to="/login" onClick={() => setIsOpen(false)} className="mt-4">
                <button className="w-full rounded-[16px] bg-[#0B355E] dark:bg-blue-700 px-6 py-3 text-[18px] font-semibold text-white shadow-[8px_8px_16px_#c7ccd3,-8px_-8px_16px_#ffffff] dark:shadow-[8px_8px_16px_#0f172a,-8px_-8px_16px_#334155] hover:opacity-90 transition-all">
                  Iniciar Sesión
                </button>
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
