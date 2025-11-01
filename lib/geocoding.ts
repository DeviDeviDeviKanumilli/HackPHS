// Utility function to get coordinates from zip code
// For production, use a geocoding service like Google Maps Geocoding API
// For development, using a simple approximation

export async function getCoordinatesFromZip(zipCode: string): Promise<{ lat: number; lng: number } | null> {
  // This is a placeholder - in production, use Google Maps Geocoding API
  // For now, returning a default location for US zip codes
  try {
    // If you have Google Maps API key, use this:
    if (process.env.GOOGLE_MAPS_API_KEY) {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${zipCode}&key=${process.env.GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        return { lat: location.lat, lng: location.lng };
      }
    }
    
    // Fallback: Generate approximate coordinates based on zip
    // This is a very rough approximation - not accurate!
    const zipNum = parseInt(zipCode.replace(/[^0-9]/g, ''));
    if (!isNaN(zipNum) && zipNum > 0) {
      // Rough approximation for US coordinates
      const lat = 39.8283 + (zipNum % 1000) / 1000 - 5; // Between 34-44
      const lng = -98.5795 + (zipNum % 10000) / 1000 - 50; // Between -148 to -48
      return { lat, lng };
    }
    
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth radius in miles
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

