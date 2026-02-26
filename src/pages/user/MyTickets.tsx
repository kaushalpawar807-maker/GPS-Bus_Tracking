import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, Ticket } from '../../lib/supabase';
import { ArrowLeft, Ticket as TicketIcon, Download } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { TicketDocument } from '../../components/TicketDocument';
import QRCode from 'qrcode';

export default function MyTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    const { data } = await supabase
      .from('tickets')
      .select(`
        *,
        routes(name),
        boarding_stops:stops!tickets_boarding_stop_id_fkey(name),
        destination_stops:stops!tickets_destination_stop_id_fkey(name)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    setTickets(data || []);

    // Generate QR codes for all tickets
    if (data) {
      const qrMap: Record<string, string> = {};
      await Promise.all(data.map(async (t) => {
        qrMap[t.id] = await QRCode.toDataURL(t.id);
      }));
      setQrCodes(qrMap);
    }

    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'booked':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'used':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'cancelled':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center mb-8">
          <Link to="/user" className="mr-4">
            <ArrowLeft className="w-6 h-6 text-slate-600 hover:text-slate-800" />
          </Link>
          <div>
            <h1 className="text-3xl font-semibold text-slate-800">My Tickets</h1>
            <p className="text-slate-500 mt-1">View your booked tickets</p>
          </div>
        </div>

        {tickets.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 border border-slate-100 text-center">
            <TicketIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 mb-4">You haven't booked any tickets yet</p>
            <Link
              to="/user/book"
              className="inline-block px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition"
            >
              Book Your First Ticket
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map(ticket => (
              <div key={ticket.id} className="bg-white rounded-xl shadow-sm p-6 border border-slate-100 flex flex-col md:flex-row gap-6">

                {/* Visual Left Strip (Ticket Stiff) */}
                <div className="hidden md:flex flex-col items-center justify-center p-4 bg-slate-50 border-r border-slate-200 border-dashed w-32 relative">
                  <div className="absolute -top-3 -right-3 w-6 h-6 bg-slate-50 rounded-full border border-slate-200"></div>
                  <div className="absolute -bottom-3 -right-3 w-6 h-6 bg-slate-50 rounded-full border border-slate-200"></div>
                  <TicketIcon className="w-8 h-8 text-slate-300 mb-2" />
                  <span className="text-xs font-mono text-slate-400 rotate-90 mt-4 tracking-widest">
                    {ticket.id.slice(0, 8).toUpperCase()}
                  </span>
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">{ticket.routes?.name}</h3>
                      <p className="text-sm text-slate-500">
                        Booked on {new Date(ticket.booking_date).toLocaleString()}
                      </p>
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full border font-bold uppercase tracking-wider ${getStatusColor(ticket.status)}`}>
                      {ticket.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1 font-semibold">From</div>
                      <div className="font-bold text-slate-800 text-lg">
                        {ticket.boarding_stops?.name || 'N/A'}
                      </div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1 font-semibold">To</div>
                      <div className="font-bold text-slate-800 text-lg">
                        {ticket.destination_stops?.name || 'N/A'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* PDF Download Button */}
                    {ticket.status !== 'cancelled' && (
                      <PDFDownloadLink
                        document={
                          <TicketDocument
                            ticket={{
                              passengerName: "Kaushal Pawar",
                              source: ticket.boarding_stops?.name || '',
                              destination: ticket.destination_stops?.name || '',
                              date: new Date(ticket.booking_date).toLocaleDateString(),
                              time: new Date(ticket.booking_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                              busNumber: "MH-12-SF-4501",
                              price: 15.00,
                              ticketId: ticket.id,
                              qrDataUrl: qrCodes[ticket.id]
                            }}
                          />
                        }
                        fileName={`Ticket-${ticket.id.slice(0, 8)}.pdf`}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium text-sm shadow-md hover:shadow-lg"
                      >
                        {({ loading }) =>
                          loading ? (
                            <>Loading Document...</>
                          ) : (
                            <>
                              <Download className="w-4 h-4" />
                              Download E-Ticket
                            </>
                          )
                        }
                      </PDFDownloadLink>
                    )}

                    {/* Cancel Button (Mock Logic) */}
                    {ticket.status === 'booked' && (
                      <button className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition text-sm font-medium">
                        Cancel Booking
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
