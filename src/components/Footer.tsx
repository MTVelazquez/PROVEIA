import { Link } from "react-router-dom";
import { Facebook, Twitter, Linkedin, Instagram, Mail } from "lucide-react";

const Footer = () => {
  const quickLinks = [
    { name: "Inicio", path: "/" },
    { name: "Dashboard", path: "/dashboard" },
    { name: "Buscador", path: "/search" },
  ];

  const socialLinks = [
    { icon: Facebook, href: "https://www.facebook.com/proveia", label: "Facebook" },
    { icon: Twitter, href: "https://twitter.com/proveIAOfficial", label: "X (Twitter)" },
    { icon: Linkedin, href: "https://www.linkedin.com/company/proveia", label: "LinkedIn" },
    { icon: Instagram, href: "https://www.instagram.com/proveia_official", label: "Instagram" },
    { icon: Mail, href: "mailto:proveiaofficial@gmail.com", label: "Email" },
  ];

  return (
    <footer className="bg-card border-t border-border mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <img 
                src="/proveia/LogoGrande.png" 
                alt="ProveIA Logo" 
                className="h-12 w-auto"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Conecta. Evalúa. Impulsa el futuro de los proveedores con inteligencia artificial.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Enlaces rápidos</h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Síguenos</h3>
            <div className="flex gap-4">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    className="w-10 h-10 rounded-full bg-secondary hover:bg-primary hover:text-white flex items-center justify-center transition-all duration-300 hover:scale-110"
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-8 border-t border-border text-center">
          <p className="text-sm text-muted-foreground">
            © 2025 ProveIA.tech — Diversificando el futuro empresarial.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
