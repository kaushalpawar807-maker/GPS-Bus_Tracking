import { useEffect, useState } from 'react';
import { hardwareService, CollisionData } from '../services/HardwareService';
import { AlertOctagon, Activity, RotateCw, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

type Alert = {
    id: string; // Unique ID for the alert instance
    type: 'COLLISION' | 'ROLLOVER';
    severity: string;
    timestamp: string;
    force: number;
};

export default function HardwareMonitor() {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [isListening, setIsListening] = useState(false);

    useEffect(() => {
        // Subscribe to global events (Single Device Mode)
        setIsListening(true);

        hardwareService.subscribeToGlobalEvents((data) => {
            if (data) {
                handleIncomingData(data);
            }
        });

        return () => {
            // Cleanup provided by service (implicit for singleton)
        };
    }, []);

    const handleIncomingData = (data: CollisionData) => {
        // Check if this is an alert type
        const isAlert = data.type === 'COLLISION' || data.type === 'ROLLOVER';

        if (isAlert) {
            // Create a unique ID based on timestamp to avoid duplicates if possible, 
            // or just use random if data doesn't have unique ID.
            const alertId = `${data.type}-${data.timestamp}`;

            setAlerts(prev => {
                // Avoid duplicates
                if (prev.find(a => a.id === alertId)) return prev;

                const newAlert: Alert = {
                    id: alertId,
                    type: data.type,
                    severity: data.severity || 'CRITICAL',
                    timestamp: data.timestamp || new Date().toISOString(),
                    force: data.impact_force || data.impact_g_force || 0
                };

                // Trigger Toast
                toast.error(`HARDWARE ALERT: ${data.type} DETECTED!`, {
                    duration: 10000,
                    icon: <AlertOctagon className="w-5 h-5 text-red-500" />
                });

                // Add to list, keep max 5
                return [newAlert, ...prev].slice(0, 5);
            });
        }
    };

    const dismissAlert = (id: string) => {
        setAlerts(prev => prev.filter(a => a.id !== id));
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600 relative">
                        <Activity className="w-5 h-5" />
                        <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full translate-x-1/2 -translate-y-1/2"></span>
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800">Hardware Safety Monitor</h3>
                        <p className="text-xs text-slate-500">
                            {isListening ? 'Global Listener Active' : 'Connecting...'}
                        </p>
                    </div>
                </div>
                {alerts.length === 0 && (
                    <div className="flex items-center gap-1 text-xs text-green-600 font-medium bg-green-50 px-3 py-1 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        System Normal
                    </div>
                )}
            </div>

            {alerts.length > 0 && (
                <div className="space-y-3">
                    {alerts.map((alert) => (
                        <div key={alert.id} className="flex items-center justify-between bg-red-50 border border-red-100 rounded-lg p-3 animate-pulse">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                                    {alert.type === 'ROLLOVER' ? <RotateCw className="w-5 h-5" /> : <AlertOctagon className="w-5 h-5" />}
                                </div>
                                <div>
                                    <h4 className="font-bold text-red-900 text-sm">{alert.type} DETECTED</h4>
                                    <p className="text-xs text-red-700">Severity: {alert.severity} • Force: {alert.force.toFixed(2)}G</p>
                                </div>
                            </div>
                            <button
                                onClick={() => dismissAlert(alert.id)}
                                className="px-3 py-1.5 bg-white text-red-600 text-xs font-bold rounded shadow-sm border border-red-100 hover:bg-red-50"
                            >
                                Acknowledge
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
