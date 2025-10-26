export interface Provider {
  id: string;
  name: string;
  category: string;
  description: string | null;
  rating: number;
  reviews_count?: number;
  location_name: string;
  latitude: number;
  longitude: number;
  delivery_time?: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  certifications?: string[] | null;
  services?: string[] | null;
  hourly_rate?: number | null;
  score?: number;
  distance?: number;
  address?: string;
  website?: string | null;
  cve_scian?: string;
  estrato?: string;
}

export interface SearchFilters {
  category?: string;
  minRating?: number;
  maxDistance?: number;
  certifications?: string[];
}