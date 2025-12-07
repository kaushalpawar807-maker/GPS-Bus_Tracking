import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, Route, RouteStop, Stop } from '../../lib/supabase';
import Map from '../../components/Map';
import RoutingControl from '../../components/RoutingControl';
import { LatLngExpression } from 'leaflet';
import { ArrowLeft, Search, MapPin } from 'lucide-react';

// Combined type for a Route with its loaded Stops
interface RouteWithStops extends Route {
  route_stops: (RouteStop & { stops: Stop })[];
}

export default function RoutesSearch() {
  const [routes, setRoutes] = useState<RouteWithStops[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<RouteWithStops | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRoutes();
  }, []);

  const loadRoutes = async () => {
    // FIX: Eagerly load route_stops and nested stops data to display itinerary
    const { data } = await supabase
      .from('routes')
      .select(`
        *,
        route_stops(
          stop_order,
          stops(*)
        )
      `)
      .eq('is_active', true)
      .order('name')
      // Ensure route_stops are ordered by stop_order
      .order('stop_order', { referencedTable: 'route_stops', ascending: true });

    // Cast the data correctly
    setRoutes((data as RouteWithStops[]) || []);
    setLoading(false);
  };

  // FIX: When selecting a route, filter the already loaded data instead of re-fetching
  const handleSelectRoute = (route: RouteWithStops) => {
    // Ensure stops are correctly sorted before setting the state
    const sortedRoute = {
      ...route,
      route_stops: (route.route_stops || []).sort((a, b) => a.stop_order - b.stop_order)
    };
    setSelectedRoute(sortedRoute);
  }

  const filteredRoutes = routes.filter(route =>
    route.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    route.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const routeStops = selectedRoute?.route_stops || [];

  const mapMarkers = routeStops.map(rs => ({
    // Use optional chaining as rs.stops might technically be null if RLS failed (though policy should fix)
    position: [rs.stops.latitude, rs.stops.longitude] as LatLngExpression,
    label: `${rs.stop_order}. ${rs.stops.name}`,
    type: 'stop' as const,
  }));



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
            <h1 className="text-3xl font-semibold text-slate-800">Search Routes</h1>
            <p className="text-slate-500 mt-1">Find the best route for your journey</p>
          </div>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by route name or description..."
              className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent outline-none bg-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
              <h2 className="text-lg font-medium text-slate-800 mb-4">Available Routes</h2>
              <div className="space-y-2 max-h-[500px] overflow-y-auto"> {/* Added max height and scroll for responsiveness */}
                {filteredRoutes.length === 0 ? (
                  <p className="text-slate-500 text-sm">No routes found</p>
                ) : (
                  filteredRoutes.map(route => (
                    <button
                      key={route.id}
                      onClick={() => handleSelectRoute(route)}
                      className={`w-full text-left p-4 rounded-lg border transition ${selectedRoute?.id === route.id
                          ? 'border-slate-800 bg-slate-50'
                          : 'border-slate-200 hover:border-slate-300'
                        }`}
                    >
                      <div className="font-medium text-slate-800">{route.name}</div>
                      {route.description && (
                        <div className="text-sm text-slate-500 mt-1">{route.description}</div>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            {selectedRoute ? (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
                  <h2 className="text-lg font-medium text-slate-800 mb-4">{selectedRoute.name}</h2>
                  <Map
                    markers={mapMarkers}
                    // routes={[]} // Remove static routes
                    className="h-[400px]"
                    // Center map on the first stop, or Pune if empty
                    center={routeStops.length > 0
                      ? [routeStops[0].stops.latitude, routeStops[0].stops.longitude]
                      : undefined}
                  >
                    <RoutingControl
                      waypoints={routeStops.map(rs => ({ lat: rs.stops.latitude, lng: rs.stops.longitude }))}
                      lineColor="#6366f1"
                    />
                  </Map>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
                  <h2 className="text-lg font-medium text-slate-800 mb-4">Stops</h2>
                  {routeStops.length === 0 ? (
                    <p className="text-slate-500 text-sm">No stops available for this route itinerary.</p>
                  ) : (
                    <div className="space-y-2">
                      {routeStops.map((rs) => ( // Removed unused variable 'index'
                        <div key={rs.id} className="flex items-center p-3 border border-slate-200 rounded-lg">
                          <div className="bg-slate-100 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-slate-700 mr-3">
                            {rs.stop_order}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-slate-800">{rs.stops.name}</div>
                            <div className="text-sm text-slate-500">{rs.stops.address}</div>
                          </div>
                          <MapPin className="w-5 h-5 text-slate-400" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Link
                  to="/user/book"
                  state={{ routeId: selectedRoute.id }}
                  className="block w-full text-center bg-slate-800 text-white py-3 rounded-lg hover:bg-slate-700 transition font-medium"
                >
                  Book Ticket for This Route
                </Link>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-12 border border-slate-100 text-center">
                <p className="text-slate-500">Select a route to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}