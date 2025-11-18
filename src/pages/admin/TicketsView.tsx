import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, Ticket } from '../../lib/supabase';
import { ArrowLeft, Ticket as TicketIcon } from 'lucide-react';

export default function TicketsView() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    const { data } = await supabase
      .from('tickets')
      .select(`
        *,
        routes(name),
        boarding_stops:stops!tickets_boarding_stop_id_fkey(name),
        destination_stops:stops!tickets_destination_stop_id_fkey(name)
      `)
      .order('created_at', { ascending: false });

    setTickets(data || []);
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'booked':
        return 'bg-blue-50 text-blue-700';
      case 'used':
        return 'bg-green-50 text-green-700';
      case 'cancelled':
        return 'bg-red-50 text-red-700';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center mb-8">
          <Link to="/admin" className="mr-4">
            <ArrowLeft className="w-6 h-6 text-slate-600 hover:text-slate-800" />
          </Link>
          <div>
            <h1 className="text-3xl font-semibold text-slate-800">Ticket Bookings</h1>
            <p className="text-slate-500 mt-1">View all ticket bookings</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          {tickets.length === 0 ? (
            <div className="p-12 text-center">
              <TicketIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No tickets booked yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">Route</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">Boarding Stop</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">Destination</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">Booking Date</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {tickets.map(ticket => (
                    <tr key={ticket.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm text-slate-800">
                        {ticket.routes?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {ticket.boarding_stops?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {ticket.destination_stops?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {new Date(ticket.booking_date).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2 py-1 rounded ${getStatusColor(ticket.status)}`}>
                          {ticket.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
