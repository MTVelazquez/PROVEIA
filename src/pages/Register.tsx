import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState, FormEvent } from "react";
import { z } from "zod";
import { sanitizeAuthError } from "@/lib/authErrors";

const registerSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(100, "El nombre es demasiado largo"),
  email: z.string().email("Email inválido"),
  password: z.string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .regex(/[A-Za-z]/, "Debe contener letras")
    .regex(/[0-9]/, "Debe contener números"),
  confirmPassword: z.string(),
  acceptTerms: z.boolean().refine(val => val === true, "Debes aceptar los términos y condiciones"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

const Register = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    acceptTerms?: string;
  }>({});

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        }
      });
      
      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Error",
        description: sanitizeAuthError(error),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailRegister = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate form
    const result = registerSchema.safeParse({
      name,
      email,
      password,
      confirmPassword,
      acceptTerms,
    });

    if (!result.success) {
      const fieldErrors: any = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            full_name: name,
          },
        },
      });

      if (error) throw error;

      toast({
        title: "¡Registro exitoso!",
        description: "Revisa tu correo para confirmar tu cuenta",
      });
      navigate("/login");
    } catch (error: any) {
      toast({
        title: "Error",
        description: sanitizeAuthError(error),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat relative" style={{ backgroundImage: 'url(/proveia/ProveedoresIMG.png)' }}>
      <div className="absolute inset-0 bg-[#E9EAED]/80 backdrop-blur-sm"></div>
      <div className="w-full max-w-md relative z-10">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-[#11386E]/70 hover:text-[#11386E] mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al inicio
        </Link>

        <div className="rounded-[24px] bg-[#E9EAED] shadow-[8px_8px_16px_#c7ccd3,-8px_-8px_16px_#ffffff] p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-full bg-[#E9EAED] shadow-[inset_4px_4px_8px_#c7ccd3,inset_-4px_-4px_8px_#ffffff] flex items-center justify-center mx-auto mb-4 overflow-hidden">
              <img
                src="/proveia/LogoGrande.png"
                alt="ProveIA"
                className="h-12 w-12 object-contain"
              />
            </div>
            <h1 className="text-3xl font-bold text-[#11386E]">Crear Cuenta</h1>
            <p className="text-[#11386E]/70">
              Únete a ProveIA y transforma tu negocio
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleEmailRegister}>
            <div className="space-y-2">
              <Label htmlFor="name" className="text-[#11386E]">Nombre completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#11386E]/70" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Tu nombre"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 rounded-[16px] bg-[#E9EAED] shadow-[inset_4px_4px_8px_#c7ccd3,inset_-4px_-4px_8px_#ffffff] border-none text-[#11386E]"
                />
              </div>
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#11386E]">Correo electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#11386E]/70" />
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 rounded-[16px] bg-[#E9EAED] shadow-[inset_4px_4px_8px_#c7ccd3,inset_-4px_-4px_8px_#ffffff] border-none text-[#11386E]"
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#11386E]">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#11386E]/70" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 rounded-[16px] bg-[#E9EAED] shadow-[inset_4px_4px_8px_#c7ccd3,inset_-4px_-4px_8px_#ffffff] border-none text-[#11386E]"
                />
              </div>
              {errors.password && (
                <p className="text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-[#11386E]">Confirmar contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#11386E]/70" />
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 rounded-[16px] bg-[#E9EAED] shadow-[inset_4px_4px_8px_#c7ccd3,inset_-4px_-4px_8px_#ffffff] border-none text-[#11386E]"
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  className="rounded mt-1"
                  id="terms"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                />
                <label htmlFor="terms" className="text-sm text-[#11386E]/70">
                  Acepto los{" "}
                  <a href="#" className="text-[#11386E] hover:underline">
                    términos y condiciones
                  </a>{" "}
                  y la{" "}
                  <a href="#" className="text-[#11386E] hover:underline">
                    política de privacidad
                  </a>
                </label>
              </div>
              {errors.acceptTerms && (
                <p className="text-sm text-red-600">{errors.acceptTerms}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full text-[18px] px-8 py-3 rounded-[16px] bg-[#0B355E] text-white shadow-[8px_8px_16px_#c7ccd3] hover:shadow-[12px_12px_20px_#c7ccd3] transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Creando cuenta..." : "Crear Cuenta"}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#11386E]/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-[#E9EAED] text-[#11386E]/70">
                O regístrate con
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              disabled={isLoading}
              className="text-[16px] px-4 py-3 rounded-[16px] bg-[#E9EAED] text-[#11386E] shadow-[8px_8px_16px_#c7ccd3,-8px_-8px_16px_#ffffff] hover:shadow-[12px_12px_20px_#c7ccd3,-12px_-12px_20px_#ffffff] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleGoogleLogin}
            >
              <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </button>
            <button
              className="text-[16px] px-4 py-3 rounded-[16px] bg-[#E9EAED] text-[#11386E] shadow-[8px_8px_16px_#c7ccd3,-8px_-8px_16px_#ffffff] hover:shadow-[12px_12px_20px_#c7ccd3,-12px_-12px_20px_#ffffff] transition-all flex items-center justify-center gap-2"
              onClick={(e) => e.preventDefault()}
            >
              <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
              LinkedIn
            </button>
          </div>

          <p className="text-center text-sm text-[#11386E]/70">
            ¿Ya tienes cuenta?{" "}
            <Link to="/login" className="text-[#11386E] hover:underline font-medium">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
