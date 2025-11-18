import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, Route, Stop } from '../../lib/supabase';
import Map, { PUNE_CENTER } from '../../components/Map';
import { LatLngExpression } from 'leaflet';
import { Search, MapPin, Ticket, Navigation } from 'lucide-react';
import { getSimulatedBusMarkers } from '../../utils/simulatedBus';

export default function UserDashboard() {
  const [stops, setStops] = useState<Stop[]>([]);
  const [userLocation, setUserLocation] = useState<LatLngExpression | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    getUserLocation();
  }, []);

  const loadData = async () => {
    const { data: stopsData } = await supabase
      .from('stops')
      .select('*');

    setStops(stopsData || []);
    setLoading(false);
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        () => {
          setUserLocation(PUNE_CENTER);
        }
      );
    } else {
      setUserLocation(PUNE_CENTER);
    }
  };

  const mapMarkers = [
    ...(userLocation ? [{
      position: userLocation,
      label: 'Your Location',
      type: 'user' as const,
    }] : []),
    ...stops.map(stop => ({
      position: [stop.latitude, stop.longitude] as LatLngExpression,
      label: stop.name,
      type: 'stop' as const,
    })),
    ...getSimulatedBusMarkers(),
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-slate-800">Welcome</h1>
          <p className="text-slate-500 mt-1">Find your route and book tickets</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <ActionCard
            icon={<Search className="w-6 h-6" />}
            title="Search Routes"
            description="Find routes to your destination"
            link="/user/routes"
            color="bg-blue-50 text-blue-600"
          />
          <ActionCard
            icon={<Navigation className="w-6 h-6" />}
            title="Nearby Stops"
            description="Find stops near you"
            link="/user/nearby"
            color="bg-green-50 text-green-600"
          />
          <ActionCard
            icon={<Ticket className="w-6 h-6" />}
            title="Book Ticket"
            description="Book your bus ticket"
            link="/user/book"
            color="bg-amber-50 text-amber-600"
          />
          <ActionCard
            icon={<Ticket className="w-6 h-6" />}
            title="My Tickets"
            description="View your bookings"
            link="/user/tickets"
            color="bg-slate-50 text-slate-600"
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
          <h2 className="text-xl font-medium text-slate-800 mb-4">Pune Bus Network</h2>
          <Map
            center={userLocation || PUNE_CENTER}
            markers={mapMarkers}
            className="h-[500px]"
          />
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
      className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition border border-slate-100"
    >
      <div className={`inline-flex p-3 rounded-lg ${color} mb-3`}>
        {icon}
      </div>
      <h3 className="text-lg font-medium text-slate-800 mb-1">{title}</h3>
      <p className="text-slate-500 text-sm">{description}</p>
    </Link>
  );
}
