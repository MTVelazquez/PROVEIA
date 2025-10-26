import { Provider } from "@/types/provider";

/**
 * Calculate provider score based on proximity, data completeness, and relevance
 * Score range: 0-100
 */
export function calculateProviderScore(
  provider: Provider,
  userLocation?: { latitude: number; longitude: number },
  searchTerms?: string[]
): number {
  let score = 0;

  // 1. Proximity score (up to 50 points)
  if (userLocation && provider.latitude && provider.longitude) {
    const distance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      provider.latitude,
      provider.longitude
    );
    provider.distance = distance;
    
    // Within 2km: 50 points, decreases linearly up to 10km
    const proximityScore = Math.max(0, 50 * (1 - Math.min(distance, 10) / 10));
    score += proximityScore;
  }

  // 2. Contact information (up to 25 points)
  if (provider.contact_phone?.trim()) score += 10;
  if (provider.contact_email?.trim()) score += 5;
  if (provider.hourly_rate && provider.hourly_rate > 0) score += 5;
  if (provider.delivery_time) score += 5;

  // 3. Data completeness (up to 10 points)
  if (provider.certifications && provider.certifications.length > 0) score += 5;
  if (provider.services && provider.services.length > 0) score += 5;

  // 4. Category/keyword match (up to 15 points)
  if (searchTerms && searchTerms.length > 0) {
    const providerText = [
      provider.name,
      provider.category,
      provider.description || '',
      ...(provider.services || [])
    ].join(' ').toLowerCase();

    const matchCount = searchTerms.filter(term => 
      providerText.includes(term.toLowerCase())
    ).length;

    score += Math.min(15, matchCount * 5);
  }

  provider.score = Math.round(Math.min(100, score));
  return provider.score;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Get score badge color
 */
export function getScoreBadgeClass(score: number): string {
  if (score >= 70) return 'bg-green-500 text-white';
  if (score >= 40) return 'bg-yellow-500 text-black';
  return 'bg-red-500 text-white';
}