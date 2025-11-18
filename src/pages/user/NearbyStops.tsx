import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, Stop } from '../../lib/supabase';
import Map, { PUNE_CENTER } from '../../components/Map';
import { LatLngExpression } from 'leaflet';
import { ArrowLeft, MapPin, Navigation } from 'lucide-react';

interface StopWithDistance extends Stop {
  distance: number;
}

export default function NearbyStops() {
  const [stops, setStops] = useState<Stop[]>([]);
  const [nearbyStops, setNearbyStops] = useState<StopWithDistance[]>([]);
  const [userLocation, setUserLocation] = useState<LatLngExpression | null>(null);
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState(false);

  useEffect(() => {
    loadStops();
    getUserLocation();
  }, []);

  useEffect(() => {
    if (userLocation && stops.length > 0) {
      calculateNearbyStops();
    }
  }, [userLocation, stops]);

  const loadStops = async () => {
    const { data } = await supabase
      .from('stops')
      .select('*');

    setStops(data || []);
    setLoading(false);
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        () => {
          setLocationError(true);
          setUserLocation(PUNE_CENTER);
        }
      );
    } else {
      setLocationError(true);
      setUserLocation(PUNE_CENTER);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const calculateNearbyStops = () => {
    if (!userLocation) return;

    const stopsWithDistance = stops.map(stop => ({
      ...stop,
      distance: calculateDistance(
        userLocation[0],
        userLocation[1],
        stop.latitude,
        stop.longitude
      )
    })).sort((a, b) => a.distance - b.distance);

    setNearbyStops(stopsWithDistance.slice(0, 10));
  };

  const mapMarkers = [
    ...(userLocation ? [{
      position: userLocation,
      label: 'Your Location',
      type: 'user' as const,
    }] : []),
    ...nearbyStops.map(stop => ({
      position: [stop.latitude, stop.longitude] as LatLngExpression,
      label: stop.name,
      type: 'stop' as const,
    })),
  ];

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center mb-8">
          <Link to="/user" className="mr-4">
            <ArrowLeft className="w-6 h-6 text-slate-600 hover:text-slate-800" />
          </Link>
          <div>
            <h1 className="text-3xl font-semibold text-slate-800">Nearby Stops</h1>
            <p className="text-slate-500 mt-1">Find bus stops near your location</p>
          </div>
        </div>

        {locationError && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-amber-800 text-sm">
              Location access denied. Showing results from Pune city center.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
              <h2 className="text-lg font-medium text-slate-800 mb-4">Map View</h2>
              <Map
                center={userLocation || PUNE_CENTER}
                markers={mapMarkers}
                className="h-[500px]"
              />
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
              <div className="flex items-center mb-4">
                <Navigation className="w-5 h-5 text-slate-700 mr-2" />
                <h2 className="text-lg font-medium text-slate-800">Nearest Stops</h2>
              </div>

              {nearbyStops.length === 0 ? (
                <p className="text-slate-500 text-sm">No stops found nearby</p>
              ) : (
                <div className="space-y-3">
                  {nearbyStops.map(stop => (
                    <div key={stop.id} className="p-4 border border-slate-200 rounded-lg hover:border-slate-300 transition">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-medium text-slate-800">{stop.name}</h3>
                          <p className="text-sm text-slate-500 mt-1">{stop.address}</p>
                        </div>
                        <MapPin className="w-5 h-5 text-slate-400 ml-2" />
                      </div>
                      <div className="text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded inline-block">
                        {stop.distance.toFixed(2)} km away
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
