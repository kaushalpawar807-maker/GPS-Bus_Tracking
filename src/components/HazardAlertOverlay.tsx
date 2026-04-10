import React, { useEffect, useState } from 'react';
import { AlertOctagon, RotateCw, Activity, ShieldAlert, X, Gauge, Zap } from 'lucide-react';
import { CollisionData } from '../services/HardwareService';

interface HazardAlertOverlayProps {
    data: CollisionData | null;
    onClose: () => void;
}

const HazardAlertOverlay: React.FC<HazardAlertOverlayProps> = ({ data, onClose }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (data) {
            setIsVisible(true);
            // Play a subtle alert sound if needed
            try {
                const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                audio.volume = 0.3;
                // audio.play().catch(() => {}); // Autoplay might be blocked
            } catch (e) {}
        } else {
            setIsVisible(false);
        }
    }, [data]);

    if (!data || !isVisible) return null;

    const isRollover = data.type === 'ROLLOVER';
    
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="relative max-w-2xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-rose-500 animate-in zoom-in-95 duration-300">
                {/* Urgent Header */}
                <div className={`p-6 ${isRollover ? 'bg-amber-500' : 'bg-rose-500'} text-white flex items-center justify-between relative overflow-hidden`}>
                    <div className="absolute inset-0 opacity-20 pointer-events-none">
                        <div className="absolute inset-0 animate-pulse bg-white/20"></div>
                    </div>
                    
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
                            {isRollover ? (
                                <RotateCw className="w-10 h-10 animate-spin-slow" />
                            ) : (
                                <AlertOctagon className="w-10 h-10 animate-bounce" />
                            )}
                        </div>
                        <div>
                            <h2 className="text-3xl font-black tracking-tighter uppercase leading-none">
                                {data.type} DETECTED
                            </h2>
                            <p className="text-white/80 font-bold uppercase tracking-widest text-xs mt-1">
                                High Urgency Safety Event
                            </p>
                        </div>
                    </div>

                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-black/10 rounded-full transition-colors relative z-10"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-8 space-y-8">
                    {/* Status Banner */}
                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 italic text-slate-600 font-medium">
                        <ShieldAlert className="w-5 h-5 text-indigo-500" />
                        A safety incident occurred at {new Date().toLocaleTimeString()}. Automated emergency protocols should be verified.
                    </div>

                    {/* Sensor Data Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* G-Force Panel */}
                        <div className="bg-slate-900 text-white p-6 rounded-3xl relative overflow-hidden group">
                           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                               <Gauge className="w-12 h-12" />
                           </div>
                           <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                               <Activity className="w-3 h-3 text-emerald-400" /> Accelerometer (m/s²)
                           </h3>
                           <div className="grid grid-cols-3 gap-2">
                               {[
                                   { label: 'X', val: data.ax },
                                   { label: 'Y', val: data.ay },
                                   { label: 'Z', val: data.az }
                               ].map(axis => (
                                   <div key={axis.label} className="text-center">
                                       <div className="text-2xl font-black font-mono">{axis.val?.toFixed(2)}</div>
                                       <div className="text-[10px] text-slate-500 font-bold">{axis.label}</div>
                                   </div>
                               ))}
                           </div>
                        </div>

                        {/* Gyro Panel */}
                        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 group">
                           <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                               <RotateCw className="w-3 h-3 text-indigo-500" /> Gyroscope (rad/s)
                           </h3>
                           <div className="grid grid-cols-3 gap-2">
                               {[
                                   { label: 'GX', val: data.gx },
                                   { label: 'GY', val: data.gy },
                                   { label: 'GZ', val: data.gz }
                               ].map(axis => (
                                   <div key={axis.label} className="text-center">
                                       <div className="text-2xl font-black text-slate-900 font-mono italic">{axis.val?.toFixed(2)}</div>
                                       <div className="text-[10px] text-slate-400 font-bold">{axis.label}</div>
                                   </div>
                               ))}
                           </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex gap-4">
                        <button 
                            onClick={onClose}
                            className="flex-1 py-5 bg-rose-600 hover:bg-rose-700 text-white font-black uppercase tracking-tighter rounded-2xl transition-all shadow-lg hover:shadow-rose-500/30 flex items-center justify-center gap-3 group"
                        >
                            <Zap className="w-5 h-5 group-hover:animate-pulse" />
                            Acknowledge Hazard
                        </button>
                    </div>
                </div>

                {/* Progress Bar (Decoration) */}
                <div className="h-2 bg-slate-100 w-full overflow-hidden">
                    <div className="h-full bg-rose-500 w-full animate-progress-fast"></div>
                </div>
            </div>
        </div>
    );
};

export default HazardAlertOverlay;
