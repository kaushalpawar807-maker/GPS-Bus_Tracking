import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Plus, MapPin, Save, ArrowRight, Route as RouteIcon, Info, Loader2 } from 'lucide-react';
import { supabase, Stop } from '../../lib/supabase';
import StopManagementModal from '../../components/StopManagementModal';
import { toast } from 'sonner';

// Shared Logic Imports
import RoutingControl from '../../components/RoutingControl';
import { useSmartSuggestions } from '../../hooks/useSmartSuggestions';

// Fix for default Leaflet markers
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const PUNE_CENTER: [number, number] = [18.5204, 73.8567];

export default function RouteStudio() {
    const [allStops, setAllStops] = useState<Stop[]>([]);

    // Modal State
    const [isCreateStopModalOpen, setIsCreateStopModalOpen] = useState(false);
    const [creatingFor, setCreatingFor] = useState<'start' | 'end' | null>(null);

    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Route Definition State
    const [routeName, setRouteName] = useState('');
    const [startStopId, setStartStopId] = useState<string>('');
    const [endStopId, setEndStopId] = useState<string>('');
    const [intermediateStops, setIntermediateStops] = useState<Stop[]>([]);

    useEffect(() => {
        fetchStops();
    }, []);

    async function fetchStops() {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('stops')
                .select('*')
                .order('name');

            if (error) throw error;
            setAllStops(data || []);
        } catch (error) {
            console.error('Error loading stops:', error);
            toast.error('Failed to load stops');
        } finally {
            setLoading(false);
        }
    }

    // Derived stop objects
    const startStop = useMemo(() => allStops.find(s => s.id === startStopId), [allStops, startStopId]);
    const endStop = useMemo(() => allStops.find(s => s.id === endStopId), [allStops, endStopId]);

    // Build Waypoints for Routing Logic (Start -> [Intermediates] -> End)
    const activeWaypoints = useMemo(() => {
        if (!startStop || !endStop) return [];
        return [
            { lat: startStop.latitude, lng: startStop.longitude },
            ...intermediateStops.map(s => ({ lat: s.latitude, lng: s.longitude })),
            { lat: endStop.latitude, lng: endStop.longitude }
        ];
    }, [startStop, endStop, intermediateStops]);


    // --- Smart Suggestions Logic (via Shared Hook) ---
    // This hook uses relaxed geospatial tolerance (2.0 factor) to find stops along the curved route
    const suggestedStops = useSmartSuggestions(allStops, startStop, endStop, intermediateStops);


    const handleAddSuggestion = (stop: Stop) => {
        // Add to intermediate stops
        setIntermediateStops(prev => {
            const newStops = [...prev, stop];
            // Auto-sort intermediate stops by distance from start to keep the route logical
            // Note: Ideally we'd calculate distance along the polyline, but straight-line from start is a decent heuristic for sorting
            if (!startStop) return newStops;

            // Simple sort by approximate distance from start
            return newStops.sort((a, b) => {
                const distA = Math.sqrt(Math.pow(a.latitude - startStop.latitude, 2) + Math.pow(a.longitude - startStop.longitude, 2));
                const distB = Math.sqrt(Math.pow(b.latitude - startStop.latitude, 2) + Math.pow(b.longitude - startStop.longitude, 2));
                return distA - distB;
            });
        });
    };

    const handleSaveRoute = async () => {
        if (!routeName || !startStop || !endStop) {
            toast.error('Please name the route and define start/end points.');
            return;
        }

        setIsSaving(true);
        try {
            // 1. Create Route Header
            const { data: routeData, error: routeError } = await supabase
                .from('routes')
                .insert([{
                    name: routeName,
                    description: `${startStop.name} to ${endStop.name}`,
                    is_active: true
                }])
                .select()
                .single();

            if (routeError) throw routeError;

            // 2. Create Route Stops (Start -> Intermediates -> End)
            const finalStopSequence = [startStop, ...intermediateStops, endStop];
            const routeStopsPayload = finalStopSequence.map((stop, index) => ({
                route_id: routeData.id,
                stop_id: stop.id,
                stop_order: index + 1
            }));

            const { error: stopsError } = await supabase
                .from('route_stops')
                .insert(routeStopsPayload);

            if (stopsError) throw stopsError;

            toast.success(`Route "${routeName}" created successfully!`);

            // Reset Form
            setRouteName('');
            setStartStopId('');
            setEndStopId('');
            setIntermediateStops([]);

        } catch (err: any) {
            console.error('Error saving route:', err);
            toast.error(err.message || 'Failed to save route.');
        } finally {
            setIsSaving(false);
        }
    };

    // Search Functionality
    const [searchQuery, setSearchQuery] = useState('');

    const displayedStops = useMemo(() => {
        // Mode 1: Search - filtering by name
        if (searchQuery.trim().length > 0) {
            const query = searchQuery.toLowerCase();
            return allStops.filter(stop => {
                // Exclude selected
                if (stop.id === startStopId || stop.id === endStopId) return false;
                if (intermediateStops.some(s => s.id === stop.id)) return false;

                return stop.name.toLowerCase().includes(query);
            }).map(s => ({ ...s, distanceFromStart: 0, isSearchResult: true }));
        }

        // Mode 2: Smart Suggestions (Geospatial)
        return suggestedStops;
    }, [searchQuery, allStops, suggestedStops, startStopId, endStopId, intermediateStops]);

    if (loading) {
        return (
            <div className="h-[calc(100vh-64px)] flex items-center justify-center bg-slate-50">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                <span className="ml-2 text-slate-600 font-medium">Loading Route Studio...</span>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col md:flex-row overflow-hidden relative font-sans">
            {/* Sidebar Panel */}
            <div className="w-full md:w-96 bg-white border-r border-slate-200 flex flex-col shadow-xl z-20">
                <div className="p-6 border-b border-indigo-50 bg-indigo-50/30">
                    <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <RouteIcon className="text-indigo-600 w-6 h-6" />
                        Route Studio
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Intelligent route planning & optimization.
                    </p>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-8">
                    {/* 1. Route Definition */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-wide">
                            <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs">1</span>
                            Define Endpoints
                        </div>

                        <div className="space-y-3">
                            <input
                                type="text"
                                placeholder="Route Name (e.g., Metro Express)"
                                value={routeName}
                                onChange={e => setRouteName(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm font-medium"
                            />

                            <div className="relative flex gap-2">
                                <div className="absolute left-3 top-3 w-2 h-2 rounded-full bg-green-500 ring-4 ring-green-100"></div>
                                <select
                                    className="w-full pl-8 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 cursor-pointer"
                                    value={startStopId}
                                    onChange={e => setStartStopId(e.target.value)}
                                >
                                    <option value="">Select Start Point...</option>
                                    {allStops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                                <button
                                    onClick={() => {
                                        setCreatingFor('start');
                                        setIsCreateStopModalOpen(true);
                                    }}
                                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors border border-slate-200"
                                    title="Create New Stop"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex justify-center -my-2 relative z-10 w-full pr-12">
                                <ArrowRight className="w-5 h-5 text-slate-300 rotate-90" />
                            </div>

                            <div className="relative flex gap-2">
                                <div className="absolute left-3 top-3 w-2 h-2 rounded-full bg-red-500 ring-4 ring-red-100"></div>
                                <select
                                    className="w-full pl-8 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 cursor-pointer"
                                    value={endStopId}
                                    onChange={e => setEndStopId(e.target.value)}
                                >
                                    <option value="">Select Destination...</option>
                                    {allStops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                                <button
                                    onClick={() => {
                                        setCreatingFor('end');
                                        setIsCreateStopModalOpen(true);
                                    }}
                                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors border border-slate-200"
                                    title="Create New Stop"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 2. Suggestions / Search */}
                    {startStop && endStop && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-right duration-500">
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2 text-sm font-bold text-indigo-700 uppercase tracking-wide">
                                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs">2</span>
                                    {searchQuery ? 'Search Results' : 'Suggestions'}
                                </div>
                                <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">
                                    {displayedStops.length} Found
                                </span>
                            </div>

                            {/* Search Input */}
                            <input
                                type="text"
                                placeholder="Search all stops..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 mb-2"
                            />

                            <div className="bg-slate-50 rounded-xl p-1 border border-slate-200 space-y-1 max-h-[300px] overflow-y-auto custom-scrollbar">
                                {displayedStops.length === 0 ? (
                                    <div className="p-4 text-center text-slate-400 text-sm italic">
                                        {searchQuery ? 'No stops match your search.' : 'No smart suggestions found mostly along this route.'}
                                    </div>
                                ) : (
                                    displayedStops.map((stop) => (
                                        <div key={stop.id} onClick={() => handleAddSuggestion(stop)} className="group flex items-center justify-between p-3 rounded-lg hover:bg-white hover:shadow-sm border border-transparent hover:border-indigo-100 transition-all cursor-pointer">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:border-indigo-200 transition-colors">
                                                    <MapPin className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-slate-700 text-sm group-hover:text-indigo-700">{stop.name}</div>
                                                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                                                        {(stop as any).isSearchResult
                                                            ? 'Manually Found'
                                                            : `~${(stop as any).distanceFromStart?.toFixed(1) || '?'} km from start`
                                                        }
                                                    </div>
                                                </div>
                                            </div>
                                            <button className="text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Plus className="w-5 h-5 bg-indigo-50 rounded p-0.5" />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* Intermediate Stops List (The "Cart") */}
                    {intermediateStops.length > 0 && (
                        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 text-sm">
                            <h4 className="font-semibold text-slate-700 mb-2 flex items-center gap-2">
                                <Info className="w-4 h-4 text-indigo-500" />
                                Added Waypoints ({intermediateStops.length})
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {intermediateStops.map((s, idx) => (
                                    <span key={idx} className="bg-white border border-slate-200 px-2 py-1 rounded text-xs text-slate-600 shadow-sm flex items-center gap-1">
                                        {idx + 1}. {s.name}
                                    </span>
                                ))}
                            </div>
                            <button
                                onClick={() => setIntermediateStops([])}
                                className="text-xs text-red-500 hover:underline mt-2 w-full text-right"
                            >
                                Clear All
                            </button>
                        </div>
                    )}

                </div>

                <div className="p-4 border-t border-slate-200 bg-white">
                    <button
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={handleSaveRoute}
                        disabled={isSaving || !startStop || !endStop || !routeName}
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {isSaving ? 'Saving Route...' : 'Save Configuration'}
                    </button>
                </div>
            </div>

            {/* Map Canvas */}
            <div className="flex-1 relative bg-slate-100">
                <MapContainer center={PUNE_CENTER} zoom={13} className="h-full w-full z-10">
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    />

                    {/* The Routing Logic */}
                    <RoutingControl waypoints={activeWaypoints} />

                    {/* Render Suggested Stops on Map (Visual Aid only, simplified) */}
                    {suggestedStops.map(stop => (
                        <Marker key={stop.id} position={[stop.latitude, stop.longitude]} opacity={0.6}>
                            <Popup autoPan={false}>
                                <div className="text-center p-1">
                                    <strong className="block text-sm mb-1 text-slate-800">{stop.name}</strong>
                                    <button
                                        onClick={() => handleAddSuggestion(stop)}
                                        className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded transition-colors w-full"
                                    >
                                        Add to Route
                                    </button>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>

                {/* Floating Helper */}
                {!startStopId && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm px-6 py-4 rounded-xl shadow-2xl border border-slate-200 z-[400] text-center max-w-sm">
                        <RouteIcon className="w-10 h-10 text-indigo-400 mx-auto mb-3" />
                        <h3 className="font-bold text-slate-800 text-lg">Start Planning</h3>
                        <p className="text-slate-500 text-sm mt-1">Select a Start Point and Destination from the sidebar to begin drawing your route.</p>
                    </div>
                )}
            </div>

            {/* Create Stop Modal Integration */}
            {isCreateStopModalOpen && (
                <StopManagementModal
                    existingStops={allStops}
                    onClose={() => setIsCreateStopModalOpen(false)}
                    onStopCreated={(newStop) => {
                        setAllStops(prev => {
                            // Add new stop and re-sort alphabetically
                            const updated = [...prev, newStop].sort((a, b) => a.name.localeCompare(b.name));
                            return updated;
                        });

                        // Auto-select the newly created stop
                        if (creatingFor === 'start') {
                            setStartStopId(newStop.id);
                        } else if (creatingFor === 'end') {
                            setEndStopId(newStop.id);
                        }

                        toast.success(`${newStop.name} created and selected!`);
                    }}
                />
            )}
        </div>
    );
}
