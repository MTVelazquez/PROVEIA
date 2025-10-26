import { useParams, Link } from "react-router-dom";
import {
  MapPin,
  Star,
  Clock,
  Phone,
  Mail,
  Globe,
  Award,
  CheckCircle,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Footer from "@/components/Footer";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const Profile = () => {
  const { id } = useParams();

  // Mock data (would come from API in real app)
  const provider = {
    id: id,
    name: "TechSolutions Pro",
    category: "Desarrollo de Software",
    rating: 4.9,
    reviews: 156,
    location: "Madrid, España",
    deliveryTime: "2-3 semanas",
    phone: "+34 900 123 456",
    email: "contacto@techsolutions.com",
    website: "www.techsolutions.com",
    certifications: [
      "ISO 9001:2015",
      "AWS Certified Solutions Architect",
      "Google Cloud Partner",
      "Microsoft Azure Expert",
    ],
    description:
      "Somos una empresa líder en desarrollo de software empresarial con más de 10 años de experiencia. Nuestro equipo de expertos está comprometido con la excelencia y la innovación en cada proyecto.",
    services: [
      "Desarrollo Web",
      "Aplicaciones Móviles",
      "Cloud Computing",
      "DevOps",
      "Consultoría IT",
    ],
    portfolio: [
      { title: "E-commerce Platform", client: "Retail Corp", year: "2024" },
      { title: "Banking App", client: "Finance Group", year: "2024" },
      { title: "Healthcare System", client: "MediTech", year: "2023" },
    ],
  };

  return (
    <div className="min-h-screen pt-20">
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Back Button */}
          <Link to="/search" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
            ← Volver a búsqueda
          </Link>

          {/* Header Card */}
          <Card className="card-soft border-none">
            <CardContent className="p-8">
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-shrink-0">
                  <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <span className="text-white font-bold text-5xl">
                      {provider.name.charAt(0)}
                    </span>
                  </div>
                </div>

                <div className="flex-1 space-y-4">
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h1 className="text-3xl font-bold mb-2">{provider.name}</h1>
                        <p className="text-muted-foreground">{provider.category}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        className="rounded-full"
                      >
                        <Heart className="h-5 w-5" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Star className="h-5 w-5 fill-accent text-accent" />
                        <span className="font-bold">{provider.rating}</span>
                        <span className="text-sm text-muted-foreground">
                          ({provider.reviews} reseñas)
                        </span>
                      </div>
                      <Badge variant="secondary" className="rounded-full">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verificado
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{provider.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>Entrega: {provider.deliveryTime}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{provider.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{provider.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <a href={`https://${provider.website}`} className="text-primary hover:underline">
                        {provider.website}
                      </a>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button className="flex-1 rounded-full bg-gradient-to-r from-primary to-accent hover:opacity-90">
                      Match
                    </Button>
                    <Button variant="outline" className="rounded-full">
                      Contactar
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card className="card-soft border-none">
            <CardHeader>
              <CardTitle>Sobre nosotros</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{provider.description}</p>
            </CardContent>
          </Card>

          {/* Services */}
          <Card className="card-soft border-none">
            <CardHeader>
              <CardTitle>Servicios</CardTitle>
              <CardDescription>
                Áreas de especialización y servicios que ofrecemos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {provider.services.map((service) => (
                  <Badge key={service} variant="secondary" className="rounded-full px-4 py-2">
                    {service}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Certifications */}
          <Card className="card-soft border-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-accent" />
                Certificaciones
              </CardTitle>
              <CardDescription>
                Reconocimientos y certificaciones oficiales
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {provider.certifications.map((cert, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50"
                  >
                    <CheckCircle className="h-5 w-5 text-accent flex-shrink-0" />
                    <span className="font-medium">{cert}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Portfolio */}
          <Card className="card-soft border-none">
            <CardHeader>
              <CardTitle>Proyectos Destacados</CardTitle>
              <CardDescription>
                Algunos de nuestros trabajos más recientes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {provider.portfolio.map((project, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 rounded-xl bg-secondary/50"
                  >
                    <div>
                      <h4 className="font-semibold">{project.title}</h4>
                      <p className="text-sm text-muted-foreground">{project.client}</p>
                    </div>
                    <Badge variant="outline" className="rounded-full">
                      {project.year}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Profile;
