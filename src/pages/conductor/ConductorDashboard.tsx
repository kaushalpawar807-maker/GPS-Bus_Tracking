import { useEffect, useState } from 'react';
import { supabase, Ticket, Bus, Route } from '../../lib/supabase';
import {
  Users,
  DollarSign,
  CheckCircle,
  QrCode,
  Bus as BusIcon,
  Navigation,
  Minus,
  Plus,
  AlertCircle,
  X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import { Html5Qrcode } from 'html5-qrcode';

export default function ConductorDashboard() {
  const { profile } = useAuth();
  const [assignedBus, setAssignedBus] = useState<Bus | null>(null);
  const [assignedRoute, setAssignedRoute] = useState<Route | null>(null);
  const [passengerCount, setPassengerCount] = useState(0);
  const [cashCollected, setCashCollected] = useState('');
  const [verifiedTicketsCount, setVerifiedTicketsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [scannerInstance, setScannerInstance] = useState<Html5Qrcode | null>(null);

  useEffect(() => {
    loadConductorData();
  }, [profile?.id]);

  useEffect(() => {
    if (isScanning) {
      // Delay slightly to ensure the #reader div is rendered in the DOM
      const timer = setTimeout(() => {
        startScanner();
      }, 300);
      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    } else {
      stopScanner();
    }
  }, [isScanning]);

  const startScanner = async () => {
    try {
      const html5QrCode = new Html5Qrcode("reader");
      setScannerInstance(html5QrCode);

      const config = { fps: 10, qrbox: { width: 250, height: 250 } };

      // Use the back camera by default on mobile devices
      await html5QrCode.start(
        { facingMode: "environment" },
        config,
        onScanSuccess
      );
    } catch (err) {
      console.error("Unable to start scanner:", err);
      toast.error("Camera Access Failed", {
        description: "Please ensure you have granted camera permissions and are using HTTPS."
      });
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerInstance && scannerInstance.isScanning) {
      try {
        await scannerInstance.stop();
        setScannerInstance(null);
      } catch (err) {
        console.error("Failed to stop scanner", err);
      }
    }
  };

  const loadConductorData = async () => {
    if (!profile?.id) return;
    setLoading(true);
    try {
      const { data: busData, error: busError } = await supabase
        .from('buses')
        .select('*, routes(*)')
        .eq('conductor_id', profile.id)
        .maybeSingle();

      if (busError) throw busError;

      if (busData) {
        setAssignedBus(busData);
        setAssignedRoute(busData.routes);

        const today = new Date().toISOString().split('T')[0];
        const { count } = await supabase
          .from('tickets')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'used')
          .gte('created_at', today);

        setVerifiedTicketsCount(count || 0);
      }
    } catch (e) {
      console.error('Error loading conductor data:', e);
      toast.error('Failed to load assigned route.');
    } finally {
      setLoading(false);
    }
  };

  const onScanSuccess = async (decodedText: string) => {
    // Vibrate device if supported
    if (window.navigator.vibrate) window.navigator.vibrate(100);

    setIsScanning(false);
    toast.loading('Verifying Ticket...', { id: 'scan-verify' });

    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*, routes(*)')
        .eq('id', decodedText)
        .eq('status', 'booked')
        .single();

      if (error || !data) {
        toast.error('Invalid or Expired Ticket', { id: 'scan-verify' });
        return;
      }

      const { error: updateError } = await supabase
        .from('tickets')
        .update({ status: 'used' })
        .eq('id', data.id);

      if (updateError) throw updateError;

      setVerifiedTicketsCount(prev => prev + 1);
      toast.success('Ticket Verified Successfully!', {
        id: 'scan-verify',
        description: `Route: ${data.routes?.name || 'Assigned'}`
      });

      setPassengerCount(prev => prev + 1);
    } catch (e) {
      console.error(e);
      toast.error('Verification System Error', { id: 'scan-verify' });
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignedBus) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('conductor_reports')
        .insert([{
          conductor_id: profile?.id,
          bus_id: assignedBus.id,
          passenger_count: passengerCount,
          cash_collected: parseFloat(cashCollected || '0'),
          report_date: new Date().toISOString()
        }]);

      if (error) throw error;

      toast.success('Daily Report Submitted!');
      setCashCollected('');
    } catch (e) {
      console.error(e);
      toast.error('Failed to submit report.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !assignedBus) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Conductor Panel</h1>
          <p className="text-slate-500 text-sm">Welcome back, {profile?.full_name || 'Conductor'}.</p>
        </div>
        {assignedBus && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100 text-xs font-bold">
            <BusIcon className="w-3.5 h-3.5" /> {assignedBus.bus_number}
          </div>
        )}
      </div>

      {!assignedBus ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 border border-slate-100 text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">No Bus Assigned</h2>
          <p className="text-slate-500 max-w-sm mx-auto">Please wait for an administrator to assign you to a vehicle for today's shift.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setIsScanning(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white p-6 rounded-2xl shadow-lg shadow-indigo-100 flex flex-col items-center gap-3 transition-all transform active:scale-95 group"
              >
                <div className="p-3 bg-white/10 rounded-xl group-hover:scale-110 transition">
                  <QrCode className="w-8 h-8" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-lg">Scan E-Ticket</p>
                  <p className="text-indigo-100 text-xs text-center">Verify passenger QR codes</p>
                </div>
              </button>

              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center gap-3">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setPassengerCount(prev => Math.max(0, prev - 1))}
                    className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100 text-slate-600 transition"
                  >
                    <Minus className="w-6 h-6" />
                  </button>
                  <div className="text-center min-w-[80px]">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Boarding</p>
                    <p className="text-4xl font-black text-slate-800">{passengerCount}</p>
                  </div>
                  <button
                    onClick={() => setPassengerCount(prev => prev + 1)}
                    className="p-3 bg-indigo-50 rounded-xl hover:bg-indigo-100 text-indigo-600 transition"
                  >
                    <Plus className="w-6 h-6" />
                  </button>
                </div>
                <p className="text-xs text-slate-500">Live Occupancy Monitor</p>
              </div>
            </div>

            {isScanning && (
              <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[9999] flex flex-col items-center justify-center p-6">
                <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl relative">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <QrCode className="w-5 h-5 text-indigo-600" />
                      <h3 className="font-bold text-slate-800">Scanner Ready</h3>
                    </div>
                    <button
                      onClick={() => setIsScanning(false)}
                      className="text-slate-400 hover:text-slate-600 p-1 bg-slate-100 rounded-full"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Scanner Viewport */}
                  <div className="relative aspect-square bg-slate-900 flex items-center justify-center">
                    <div id="reader" className="w-full h-full overflow-hidden"></div>

                    {/* Scanner Overlay UI */}
                    <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none">
                      <div className="w-full h-full border-2 border-indigo-400/50 rounded-lg relative ring-1 ring-indigo-400 ring-offset-4 ring-offset-transparent shadow-[0_0_50px_rgba(99,102,241,0.2)]">
                        {/* Shimmering Scan Line */}
                        <div className="absolute top-0 left-0 w-full h-0.5 bg-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.8)] animate-bounce mt-[50%] opacity-70"></div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-slate-50">
                    <div className="flex items-center gap-3 mb-2">
                      <AlertCircle className="w-5 h-5 text-indigo-600" />
                      <p className="font-bold text-sm text-slate-800">Position QR Code Above</p>
                    </div>
                    <p className="text-xs text-slate-500 italic">Scanning will happen automatically. Please hold steady.</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsScanning(false)}
                  className="mt-8 text-white font-bold bg-white/10 px-10 py-4 rounded-full hover:bg-white/20 transition-all border border-white/20 backdrop-blur-sm"
                >
                  Close Scanner
                </button>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                <Navigation className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-slate-800">Shift Report Submission</h3>
              </div>
              <form onSubmit={handleSubmitReport} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Total Passengers (Manual)</label>
                    <input
                      type="number"
                      value={passengerCount}
                      onChange={e => setPassengerCount(parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Cash Collected (₹)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={cashCollected}
                        onChange={e => setCashCollected(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-slate-800 text-white rounded-xl hover:bg-slate-900 transition font-bold shadow-lg shadow-slate-200 disabled:opacity-50"
                >
                  <CheckCircle className="w-5 h-5" />
                  {loading ? 'Submitting...' : 'Submit Final Shift Report'}
                </button>
              </form>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                Today's Stats
              </h3>
              <div className="space-y-3">
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                      <QrCode className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-600">Verified Tickets</span>
                  </div>
                  <span className="text-lg font-black text-emerald-700">{verifiedTicketsCount}</span>
                </div>

                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                      <Users className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-600">Total Shift Flow</span>
                  </div>
                  <span className="text-lg font-black text-indigo-700">{passengerCount}</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-2xl shadow-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-white/10 rounded-lg">
                  <BusIcon className="w-6 h-6 text-indigo-300" />
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Assigned Route</p>
                  <p className="text-sm font-bold text-ellipsis whitespace-nowrap overflow-hidden max-w-[150px]">
                    {assignedRoute?.name || 'Loading...'}
                  </p>
                </div>
              </div>
              <div className="space-y-2 mt-6">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-medium">Bus Number:</span>
                  <span className="font-bold tracking-tight">{assignedBus?.bus_number}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-medium">Shift Started:</span>
                  <span className="font-bold">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
