import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import LiveBusMap from '../../components/LiveBusMap';

export default function LiveTrack() {
    const { busId = 'bus1' } = useParams();

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                <div className="flex items-center mb-6">
                    <Link to="/user" className="mr-4 p-2 hover:bg-slate-200 rounded-full transition">
                        <ArrowLeft className="w-6 h-6 text-slate-600" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Live Tracking</h1>
                        <p className="text-slate-500">Real-time location and status of Bus {busId}</p>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-1 overflow-hidden">
                    <LiveBusMap busId={busId} />
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                        <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">Status</h3>
                        <p className="text-lg font-semibold text-green-600 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            Live & Active
                        </p>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                        <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">Next Stop</h3>
                        <p className="text-lg font-semibold text-slate-800">Central Station (ETA 5m)</p>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                        <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">Driver</h3>
                        <p className="text-lg font-semibold text-slate-800">Ramesh Kumar</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
