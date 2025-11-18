import { useEffect, useState } from 'react';
import { supabase, Route, Stop, RouteStop } from '../../lib/supabase';
import Map from '../../components/Map';
import { LatLngExpression } from 'leaflet';
import { Plus, Edit, Trash2, MapPin, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function RoutesManagement() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [routeStops, setRouteStops] = useState<(RouteStop & { stops: Stop })[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRoutes();
  }, []);

  useEffect(() => {
    if (selectedRoute) {
      loadRouteStops(selectedRoute.id);
    }
  }, [selectedRoute]);

  const loadRoutes = async () => {
    const { data } = await supabase
      .from('routes')
      .select('*')
      .order('created_at', { ascending: false });

    setRoutes(data || []);
    setLoading(false);
  };

  const loadRouteStops = async (routeId: string) => {
    const { data } = await supabase
      .from('route_stops')
      .select('*, stops(*)')
      .eq('route_id', routeId)
      .order('stop_order');

    setRouteStops(data || []);
  };

  const mapMarkers = routeStops.map(rs => ({
    position: [rs.stops.latitude, rs.stops.longitude] as LatLngExpression,
    label: `${rs.stop_order}. ${rs.stops.name}`,
    type: 'stop' as const,
  }));

  const routeLine = routeStops.length > 0 ? [{
    positions: routeStops.map(rs => [rs.stops.latitude, rs.stops.longitude] as LatLngExpression),
    color: '#64748b',
  }] : [];

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Link to="/admin" className="mr-4">
              <ArrowLeft className="w-6 h-6 text-slate-600 hover:text-slate-800" />
            </Link>
            <div>
              <h1 className="text-3xl font-semibold text-slate-800">Routes Management</h1>
              <p className="text-slate-500 mt-1">Create and manage bus routes</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Route
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
              <h2 className="text-lg font-medium text-slate-800 mb-4">All Routes</h2>
              <div className="space-y-2">
                {routes.length === 0 ? (
                  <p className="text-slate-500 text-sm">No routes created yet</p>
                ) : (
                  routes.map(route => (
                    <button
                      key={route.id}
                      onClick={() => setSelectedRoute(route)}
                      className={`w-full text-left p-4 rounded-lg border transition ${
                        selectedRoute?.id === route.id
                          ? 'border-slate-800 bg-slate-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-medium text-slate-800">{route.name}</div>
                      <div className="text-sm text-slate-500 mt-1">{route.description}</div>
                      <div className="flex items-center mt-2">
                        <span className={`text-xs px-2 py-1 rounded ${
                          route.is_active
                            ? 'bg-green-50 text-green-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {route.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
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
                  <h2 className="text-lg font-medium text-slate-800 mb-4">Route Preview</h2>
                  <Map markers={mapMarkers} routes={routeLine} className="h-[400px]" />
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
                  <h2 className="text-lg font-medium text-slate-800 mb-4">Stops</h2>
                  {routeStops.length === 0 ? (
                    <p className="text-slate-500 text-sm">No stops added to this route yet</p>
                  ) : (
                    <div className="space-y-2">
                      {routeStops.map(rs => (
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
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-12 border border-slate-100 text-center">
                <p className="text-slate-500">Select a route to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showCreateModal && (
        <CreateRouteModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadRoutes();
          }}
        />
      )}
    </div>
  );
}

function CreateRouteModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('routes')
        .insert([{ name, description, created_by: user?.id }]);

      if (error) throw error;

      onSuccess();
    } catch (error) {
      console.error('Error creating route:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
        <h2 className="text-2xl font-semibold text-slate-800 mb-6">Create New Route</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Route Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent outline-none"
              placeholder="e.g., Route 101"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent outline-none"
              placeholder="Describe the route"
              rows={3}
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Route'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
