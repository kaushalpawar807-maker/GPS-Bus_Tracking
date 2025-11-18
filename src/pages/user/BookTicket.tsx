import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase, Route, RouteStop, Stop } from '../../lib/supabase';
import { ArrowLeft, Ticket } from 'lucide-react';

export default function BookTicket() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [routeStops, setRouteStops] = useState<(RouteStop & { stops: Stop })[]>([]);
  const [boardingStopId, setBoardingStopId] = useState('');
  const [destinationStopId, setDestinationStopId] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    loadRoutes();
    if (location.state?.routeId) {
      setSelectedRouteId(location.state.routeId);
    }
  }, []);

  useEffect(() => {
    if (selectedRouteId) {
      loadRouteStops(selectedRouteId);
    }
  }, [selectedRouteId]);

  const loadRoutes = async () => {
    const { data } = await supabase
      .from('routes')
      .select('*')
      .eq('is_active', true)
      .order('name');

    setRoutes(data || []);
  };

  const loadRouteStops = async (routeId: string) => {
    const { data } = await supabase
      .from('route_stops')
      .select('*, stops(*)')
      .eq('route_id', routeId)
      .order('stop_order');

    setRouteStops(data || []);
    setBoardingStopId('');
    setDestinationStopId('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('tickets')
        .insert([{
          user_id: user.id,
          route_id: selectedRouteId,
          boarding_stop_id: boardingStopId,
          destination_stop_id: destinationStopId,
        }]);

      if (error) throw error;

      navigate('/user/tickets');
    } catch (error) {
      console.error('Error booking ticket:', error);
      alert('Failed to book ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center mb-8">
          <Link to="/user" className="mr-4">
            <ArrowLeft className="w-6 h-6 text-slate-600 hover:text-slate-800" />
          </Link>
          <div>
            <h1 className="text-3xl font-semibold text-slate-800">Book Ticket</h1>
            <p className="text-slate-500 mt-1">Book your bus journey</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-8 border border-slate-100">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-slate-100 p-4 rounded-xl">
              <Ticket className="w-8 h-8 text-slate-700" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Select Route</label>
              <select
                value={selectedRouteId}
                onChange={(e) => setSelectedRouteId(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent outline-none bg-white"
              >
                <option value="">Choose a route</option>
                {routes.map(route => (
                  <option key={route.id} value={route.id}>{route.name}</option>
                ))}
              </select>
            </div>

            {selectedRouteId && routeStops.length > 0 && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Boarding Stop</label>
                  <select
                    value={boardingStopId}
                    onChange={(e) => setBoardingStopId(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent outline-none bg-white"
                  >
                    <option value="">Select boarding stop</option>
                    {routeStops.map(rs => (
                      <option key={rs.id} value={rs.stop_id}>
                        {rs.stop_order}. {rs.stops.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Destination Stop</label>
                  <select
                    value={destinationStopId}
                    onChange={(e) => setDestinationStopId(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent outline-none bg-white"
                  >
                    <option value="">Select destination stop</option>
                    {routeStops.map(rs => (
                      <option key={rs.id} value={rs.stop_id}>
                        {rs.stop_order}. {rs.stops.name}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading || !selectedRouteId || !boardingStopId || !destinationStopId}
              className="w-full bg-slate-800 text-white py-3 rounded-lg hover:bg-slate-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Booking...' : 'Book Ticket'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
