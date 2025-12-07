import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase, Stop } from '../../lib/supabase';
import Map, { PUNE_CENTER } from '../../components/Map';
import RoutingControl from '../../components/RoutingControl';
import { getDistanceFromLatLonInKm } from '../../utils/geo';
import { LatLngExpression } from 'leaflet';
import { Search, MapPin, Ticket, Navigation, Wallet, Clock, ArrowRight, Bus } from 'lucide-react';

export default function UserDashboard() {
  const [stops, setStops] = useState<Stop[]>([]);
  const [userLocation, setUserLocation] = useState<LatLngExpression | null>(null);
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState(false);
  const [activeBusCount, setActiveBusCount] = useState<number>(0);

  useEffect(() => {
    loadData();
    getUserLocation();
    fetchBusStats();
  }, []);

  const fetchBusStats = async () => {
    const { count } = await supabase
      .from('buses')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    if (count !== null) setActiveBusCount(count);
  };

  const loadData = async () => {
    const { data: stopsData } = await supabase.from('stops').select('*');
    if (stopsData) setStops(stopsData);
    setLoading(false);
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
          setLocationError(false);
        },
        () => {
          console.warn("Location access denied or failed.");
          setUserLocation(PUNE_CENTER); // Fallback
          setLocationError(true);
        },
        { enableHighAccuracy: true }
      );
    } else {
      setUserLocation(PUNE_CENTER);
      setLocationError(true);
    }
  };

  // Calculate Nearest Stop
  const nearestStopResult = useMemo(() => {
    if (!userLocation || stops.length === 0) return null;
    if (locationError) return null;

    let minDist = Infinity;
    let nearest: Stop | null = null;
    const [uLat, uLng] = userLocation as [number, number];

    stops.forEach(stop => {
      const d = getDistanceFromLatLonInKm(uLat, uLng, stop.latitude, stop.longitude);
      if (d < minDist) {
        minDist = d;
        nearest = stop;
      }
    });

    return { stop: nearest, distance: minDist };
  }, [userLocation, stops, locationError]);


  const mapMarkers = useMemo(() => {
    const markers: any[] = [];
    if (userLocation) {
      markers.push({ position: userLocation, label: 'You', type: 'user' });
    }
    if (nearestStopResult?.stop) {
      markers.push({
        position: [nearestStopResult.stop.latitude, nearestStopResult.stop.longitude] as LatLngExpression,
        label: nearestStopResult.stop.name,
        type: 'stop'
      });
    }
    return markers;
  }, [userLocation, nearestStopResult]);

  // Route path for visual connection
  const routeWaypoints = useMemo(() => {
    if (userLocation && nearestStopResult?.stop) {
      const [lat, lng] = userLocation as [number, number];
      return [
        { lat, lng },
        { lat: nearestStopResult.stop.latitude, lng: nearestStopResult.stop.longitude }
      ];
    }
    return [];
  }, [userLocation, nearestStopResult]);


  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
      {/* SaaS Header / Greeting */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-500 text-xs">Manage your travel and bookings</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col items-end mr-2">
              <span className="text-xs font-semibold text-slate-700">Enterprise Plan</span>
              <span className="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Active</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-md">
              U
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* Top Hero Section: Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: Nearest Stop Widget (2 cols) */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-1 shadow-sm border border-slate-100 flex flex-col relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-cyan-400"></div>

            {/* Header inside card */}
            <div className="p-5 flex justify-between items-start z-10 relative">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="bg-indigo-100 p-1.5 rounded-lg text-indigo-600">
                    <Navigation className="w-4 h-4" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-800">Nearest Stop</h2>
                </div>
                {nearestStopResult ? (
                  <div>
                    <p className="text-slate-500 text-sm">
                      Closest station to your current location is <strong className="text-slate-900">{nearestStopResult.stop?.name}</strong>.
                    </p>
                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-full text-xs font-medium text-slate-700">
                        <Clock className="w-3.5 h-3.5" />
                        ~{Math.round((nearestStopResult.distance / 5) * 60)} min walk
                      </div>
                      <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-full text-xs font-medium text-slate-700">
                        <MapPin className="w-3.5 h-3.5" />
                        {nearestStopResult.distance.toFixed(1)} km away
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm">
                    {locationError ? "Location access disabled. Showing network map." : "Locating nearest stop..."}
                  </p>
                )}
              </div>
              {nearestStopResult && (
                <Link to={`/user/track/${nearestStopResult.stop?.id}`} className="px-4 py-2 bg-slate-900 text-white text-xs font-medium rounded-lg hover:bg-slate-800 transition shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2">
                  View Buses <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>

            {/* Map Area */}
            <div className="h-64 w-full rounded-xl overflow-hidden relative mt-2 border-t border-slate-100">
              <Map
                center={userLocation || PUNE_CENTER}
                zoom={14}
                markers={mapMarkers}
                className="h-full w-full"
              >
                {/* Show walking path */}
                <RoutingControl waypoints={routeWaypoints} lineColor="#6366f1" />
              </Map>
            </div>
          </div>

          {/* Right: Wallet & Status (1 col) */}
          <div className="space-y-6">

            {/* Wallet Card - SaaS Vibe */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
              <div className="flex justify-between items-start mb-6">
                <div className="bg-white/10 backdrop-blur-md p-2 rounded-xl border border-white/10">
                  <Wallet className="w-6 h-6 text-indigo-300" />
                </div>
                <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded text-[10px] font-bold uppercase tracking-wider border border-green-500/20">Verified</span>
              </div>
              <div>
                <p className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-1">Travel Balance</p>
                <h3 className="text-3xl font-bold tracking-tight">₹ 450.00</h3>
              </div>
              <div className="mt-6 flex gap-2">
                <button className="flex-1 py-2 bg-white text-slate-900 rounded-lg text-xs font-bold hover:bg-indigo-50 transition">Add Money</button>
                <button className="flex-1 py-2 bg-white/10 text-white border border-white/10 rounded-lg text-xs font-bold hover:bg-white/20 transition">History</button>
              </div>
            </div>

            {/* Quick Status */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <h3 className="font-bold text-slate-800 text-sm mb-3">Live Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-slate-600">Network Status</span>
                  </div>
                  <span className="font-semibold text-slate-900">Optimal</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    <span className="text-slate-600">Active Buses</span>
                  </div>
                  <span className="font-semibold text-slate-900">{activeBusCount}</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Explore / Actions Grid */}
        <div>
          <h3 className="text-lg font-bold text-slate-800 mb-4">Explore</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <ActionCard
              icon={<Search className="w-5 h-5" />}
              title="Find Route"
              description="Search connections"
              link="/user/routes"
              color="text-indigo-600 bg-indigo-50"
            />
            <ActionCard
              icon={<Bus className="w-5 h-5" />}
              title="Live Tracking"
              description="View bus locations"
              link="/user/track/bus1" // Defaulting to bus1 for demo
              color="text-rose-600 bg-rose-50"
            />
            <ActionCard
              icon={<Ticket className="w-5 h-5" />}
              title="Book Ticket"
              description="Reserve your seat"
              link="/user/book"
              color="text-amber-600 bg-amber-50"
            />
            <ActionCard
              icon={<Ticket className="w-5 h-5" />}
              title="My Bookings"
              description="Download tickets"
              link="/user/tickets"
              color="text-cyan-600 bg-cyan-50"
            />
          </div>
        </div>

      </div>
    </div>
  );
}

function ActionCard({ icon, title, description, link, color }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  link: string;
  color: string;
}) {
  return (
    <Link
      to={link}
      className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all border border-slate-100 flex flex-col gap-3 group"
    >
      <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center transition-transform group-hover:scale-110`}>
        {icon}
      </div>
      <div>
        <h3 className="font-bold text-slate-800">{title}</h3>
        <p className="text-xs text-slate-500 mt-1">{description}</p>
      </div>
    </Link>
  );
}
