-- Enable PostGIS extension for location-based queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create providers table with location data
CREATE TABLE public.providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  description text,
  rating numeric(2,1) DEFAULT 0.0,
  reviews_count integer DEFAULT 0,
  location_name text NOT NULL,
  latitude numeric(10,7) NOT NULL,
  longitude numeric(10,7) NOT NULL,
  delivery_time text,
  contact_phone text,
  contact_email text,
  certifications text[],
  services text[],
  hourly_rate numeric(10,2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view providers
CREATE POLICY "Anyone can view providers"
ON public.providers
FOR SELECT
USING (true);

-- Only authenticated users can insert providers (for now)
CREATE POLICY "Authenticated users can insert providers"
ON public.providers
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Only authenticated users can update their own providers
CREATE POLICY "Authenticated users can update providers"
ON public.providers
FOR UPDATE
TO authenticated
USING (true);

-- Create indexes for better query performance
CREATE INDEX idx_providers_category ON public.providers(category);
CREATE INDEX idx_providers_rating ON public.providers(rating DESC);
CREATE INDEX idx_providers_location_coords ON public.providers(latitude, longitude);

-- Create index for text search
CREATE INDEX idx_providers_search ON public.providers USING gin (
  to_tsvector('spanish', name || ' ' || COALESCE(description, '') || ' ' || category)
);

-- Create trigger for updated_at
CREATE TRIGGER update_providers_updated_at
BEFORE UPDATE ON public.providers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data with Madrid area locations
INSERT INTO public.providers (name, category, description, rating, reviews_count, location_name, latitude, longitude, delivery_time, contact_phone, certifications, services, hourly_rate) VALUES
('TechSolutions Pro', 'Desarrollo de Software', 'Especialistas en desarrollo web y móvil con más de 10 años de experiencia', 4.9, 156, 'Madrid Centro', 40.416775, -3.703790, '2-3 semanas', '+34 900 123 456', ARRAY['ISO 9001', 'AWS Certified', 'Google Partner'], ARRAY['Desarrollo Web', 'Apps Móviles', 'Cloud'], 75.00),
('Marketing Digital 360', 'Marketing Digital', 'Agencia líder en estrategias digitales y crecimiento empresarial', 4.8, 203, 'Barcelona', 41.385064, 2.173404, '1-2 semanas', '+34 900 789 012', ARRAY['Google Ads Certified', 'HubSpot Partner', 'Meta Blueprint'], ARRAY['SEO', 'SEM', 'Social Media'], 60.00),
('Cloud Experts Inc', 'Cloud Computing', 'Consultoría especializada en migración y optimización cloud', 4.9, 189, 'Valencia', 39.469907, -0.376288, '3-4 semanas', '+34 900 345 678', ARRAY['AWS Advanced Partner', 'Azure Expert', 'Google Cloud'], ARRAY['Migración Cloud', 'DevOps', 'Seguridad'], 85.00),
('Diseño Creativo Studio', 'Diseño Gráfico', 'Estudio de diseño especializado en branding y diseño web', 4.7, 145, 'Madrid Salamanca', 40.428889, -3.681389, '1 semana', '+34 900 456 789', ARRAY['Adobe Certified', 'Awwwards Winner'], ARRAY['Branding', 'UI/UX', 'Diseño Web'], 55.00),
('Consultores Legal Pro', 'Consultoría Legal', 'Asesoría legal para empresas y startups', 4.8, 178, 'Madrid Chamberí', 40.435278, -3.703056, '2-3 días', '+34 900 567 890', ARRAY['Colegio de Abogados', 'ISO 27001'], ARRAY['Derecho Mercantil', 'Propiedad Intelectual', 'Contratos'], 120.00),
('Arquitectos Innovadores', 'Arquitectura', 'Estudio de arquitectura con enfoque sostenible', 4.9, 167, 'Madrid Retiro', 40.415278, -3.683889, '4-6 semanas', '+34 900 678 901', ARRAY['LEED Certified', 'Passivhaus'], ARRAY['Arquitectura Sostenible', 'Reformas', 'Project Management'], 90.00);