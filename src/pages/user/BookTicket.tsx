import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase, Route, RouteStop, Stop } from '../../lib/supabase';
import { ArrowLeft, Ticket, CreditCard, CheckCircle, Loader2 } from 'lucide-react';
import SeatLayout from '../../components/SeatLayout';
import CreditCardForm from '../../components/CreditCardForm';

export default function BookTicket() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [routeStops, setRouteStops] = useState<(RouteStop & { stops: Stop })[]>([]);
  const [boardingStopId, setBoardingStopId] = useState('');
  const [destinationStopId, setDestinationStopId] = useState('');
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [paymentStep, setPaymentStep] = useState<'selection' | 'processing' | 'success'>('selection');
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

  const handleSubmit = async () => {
    setLoading(true);
    setPaymentStep('processing');

    // Simulate Payment Processing delay
    await new Promise(resolve => setTimeout(resolve, 3000));

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error('Not authenticated');

      // Create a ticket for each selected seat
      const ticketsToInsert = selectedSeats.map(_seat => ({
        user_id: user.id,
        route_id: selectedRouteId,
        boarding_stop_id: boardingStopId,
        destination_stop_id: destinationStopId,
        status: 'booked' as const
      }));

      const { error } = await supabase
        .from('tickets')
        .insert(ticketsToInsert);

      if (error) throw error;

      setPaymentStep('success');
      setTimeout(() => navigate('/user/tickets'), 2000); // Redirect after success
    } catch (error) {
      console.error('Error booking ticket:', error);
      alert('Failed to book ticket. Please try again.');
      setPaymentStep('selection');
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

        {paymentStep === 'processing' && (
          <div className="bg-white rounded-xl shadow-sm p-12 border border-slate-100 flex flex-col items-center justify-center min-h-[400px] animate-in fade-in zoom-in duration-300">
            <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mb-6" />
            <h2 className="text-2xl font-semibold text-slate-800">Processing Secure Payment...</h2>
            <p className="text-slate-500 mt-2">Connecting to Banking Gateway...</p>
          </div>
        )}

        {paymentStep === 'success' && (
          <div className="bg-white rounded-xl shadow-sm p-12 border border-slate-100 flex flex-col items-center justify-center min-h-[400px] animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-semibold text-slate-800">Booking Confirmed!</h2>
            <p className="text-slate-500 mt-2">Your tickets have been sent to your account.</p>
          </div>
        )}

        {paymentStep === 'selection' && (
          <div className="bg-white rounded-xl shadow-sm p-8 border border-slate-100">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-slate-100 p-4 rounded-xl">
                <Ticket className="w-8 h-8 text-slate-700" />
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Select Route</label>
                <select
                  value={selectedRouteId}
                  onChange={(e) => setSelectedRouteId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white font-medium text-slate-700"
                >
                  <option value="">Choose a route</option>
                  {routes.map(route => (
                    <option key={route.id} value={route.id}>{route.name}</option>
                  ))}
                </select>
              </div>

              {selectedRouteId && routeStops.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Boarding Stop</label>
                    <select
                      value={boardingStopId}
                      onChange={(e) => setBoardingStopId(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white"
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
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white"
                    >
                      <option value="">Select destination stop</option>
                      {routeStops.map(rs => (
                        <option key={rs.id} value={rs.stop_id}>
                          {rs.stop_order}. {rs.stops.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {selectedRouteId && boardingStopId && destinationStopId && (
                <div className="border-t border-slate-100 pt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h3 className="text-lg font-medium text-slate-800 mb-6 text-center">Select Your Seats</h3>
                  <SeatLayout
                    selectedSeats={selectedSeats}
                    onSeatSelect={setSelectedSeats}
                    maxSeats={40}
                  />

                  {selectedSeats.length > 0 && (
                    <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <CreditCardForm />

                      <div className="mt-6 flex flex-col md:flex-row items-center justify-between bg-indigo-50 p-6 rounded-xl border border-indigo-100">
                        <div>
                          <div className="text-sm text-indigo-600 font-medium">Total Fare</div>
                          <div className="text-3xl font-bold text-indigo-900">
                            ₹{(selectedSeats.length * 250) || 0}
                          </div>
                          <div className="text-xs text-indigo-400">{selectedSeats.length} seats × ₹250</div>
                        </div>

                        <button
                          onClick={handleSubmit}
                          disabled={loading || selectedSeats.length === 0}
                          className="mt-4 md:mt-0 px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2 shadow-lg hover:shadow-indigo-200"
                        >
                          <CreditCard className="w-4 h-4" />
                          {loading ? 'Processing...' : 'Pay & Book'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
