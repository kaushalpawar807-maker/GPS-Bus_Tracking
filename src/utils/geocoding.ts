// Interface for the simplified location data returned by search
export interface GeocodedLocation {
    name: string;
    address: string;
    lat: number;
    lng: number;
  }
  
  /**
   * Performs geocoding using the Nominatim OpenStreetMap API.
   * This is a client-side implementation for development/testing purposes.
   * For production, consider using a dedicated geocoding service or a serverless function.
   * @param query The place name or address to search for.
   * @returns A promise resolving to an array of found locations.
   */
  export async function geocodeSearch(query: string): Promise<GeocodedLocation[]> {
    if (!query) return [];
  
    // Construct the Nominatim API URL (OpenStreetMap's geocoding service)
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1&countrycodes=in`;
  
    try {
      const response = await fetch(url, {
        headers: {
          // Essential header for Nominatim usage policy
          'User-Agent': 'Community-Bus-Tracking-System-App/1.0',
        },
      });
  
      if (!response.ok) {
        throw new Error(`Geocoding API request failed with status: ${response.status}`);
      }
  
      const data = await response.json();
  
      return data.map((item: any) => ({
        name: item.name || item.display_name,
        address: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
      }));
  
    } catch (error) {
      console.error('Geocoding error:', error);
      // In case of failure, return an empty array
      return [];
    }
  }