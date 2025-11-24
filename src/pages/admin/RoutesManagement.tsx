import { useEffect, useState, useRef } from 'react';
import { supabase, Route, Stop, RouteStop } from '../../lib/supabase';
import Map, { PUNE_CENTER } from '../../components/Map'; 
import StopManagementModal from '../../components/StopManagementModal'; 
import { LatLngExpression } from 'leaflet';
// Removed CheckCircle
import { Plus, Edit, Trash2, MapPin, ArrowLeft, Loader2, GripVertical, X, Globe } from 'lucide-react'; 
import { Link } from 'react-router-dom';

// Type alias for RouteStop with nested Stop data
type RouteStopDetail = (RouteStop & { stops: Stop });

// === HELPER MODAL COMPONENTS DEFINED OUTSIDE MAIN COMPONENT ===

// --- CreateRouteModal ---
interface CreateRouteModalProps {
    onClose: () => void;
    onSuccess: () => void;
    allStops: Stop[];
    // New props for Start/End Stop selection flow
    onStopSelection: (target: 'start' | 'end') => void;
    startStopId: string | undefined;
    endStopId: string | undefined;
}
function CreateRouteModal({ 
    onClose, 
    onSuccess, 
    allStops, 
    onStopSelection,
    startStopId,
    endStopId,
}: CreateRouteModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [modalLoading, setModalLoading] = useState(false); 

  const getStopName = (id: string | undefined) => {
    return allStops.find(s => s.id === id)?.name || 'Select Stop';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startStopId || !endStopId) return alert('Please select both a Start Point and an End Point.');

    setModalLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // 1. Create the new Route
      const { data: newRoute, error: routeError } = await supabase
        .from('routes')
        .insert([{ 
            name, 
            description, 
            created_by: user?.id 
        }])
        .select()
        .single(); 

      if (routeError) throw routeError;

      // 2. Insert Start and End Stops into route_stops (Stop order 1 and 2)
      const routeStopsData = [
          { route_id: newRoute.id, stop_id: startStopId, stop_order: 1 },
          { route_id: newRoute.id, stop_id: endStopId, stop_order: 2 },
      ];

      const { error: stopsError } = await supabase
          .from('route_stops')
          .insert(routeStopsData);

      if (stopsError) throw stopsError;
      
      onSuccess();
    } catch (error) {
      console.error('Error creating route:', error);
      alert('Failed to create route. Check console for details.');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
        <h2 className="text-2xl font-semibold text-slate-800 mb-6">Create New Route</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Route Name */}
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
          
          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent outline-none"
              placeholder="Describe the route"
              rows={2}
            />
          </div>

          {/* Start Point */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Start Point</label>
            <div className="flex gap-2">
              <select
                value={startStopId || ''}
                onChange={() => {}} // Read-only via Globe button for selection
                className={`flex-1 px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent outline-none bg-white ${startStopId ? '' : 'text-slate-500'}`}
                required
              >
                <option value="" disabled>Select Starting Stop</option>
                {allStops.map(stop => (
                  <option key={stop.id} value={stop.id} selected={stop.id === startStopId}>
                    {stop.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => onStopSelection('start')}
                className="p-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition"
                title="Search/Pin Location"
              >
                <Globe className="w-5 h-5" />
              </button>
            </div>
             <p className={`text-sm mt-1 ${startStopId ? 'text-green-600' : 'text-slate-500'}`}>
                Selected: {getStopName(startStopId)}
            </p>
          </div>

          {/* End Point */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">End Point</label>
            <div className="flex gap-2">
              <select
                value={endStopId || ''}
                onChange={() => {}} // Read-only via Globe button for selection
                className={`flex-1 px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent outline-none bg-white ${endStopId ? '' : 'text-slate-500'}`}
                required
              >
                <option value="" disabled>Select Ending Stop</option>
                {allStops.map(stop => (
                  <option key={stop.id} value={stop.id} selected={stop.id === endStopId}>
                    {stop.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => onStopSelection('end')}
                className="p-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition"
                title="Search/Pin Location"
              >
                <Globe className="w-5 h-5" />
              </button>
            </div>
            <p className={`text-sm mt-1 ${endStopId ? 'text-green-600' : 'text-slate-500'}`}>
                Selected: {getStopName(endStopId)}
            </p>
          </div>
          
          {/* Action Buttons */}
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
              disabled={modalLoading || !name || !startStopId || !endStopId}
              className="flex-1 px-4 py-2.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition disabled:opacity-50"
            >
              {modalLoading ? 'Creating...' : 'Create Route'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


// --- RouteStopListModal ---
interface RouteStopListModalProps {
    route: Route;
    allStops: Stop[];
    currentRouteStops: RouteStopDetail[];
    onClose: () => void;
    onAddStop: (stopId: string) => Promise<void>;
    onRemoveStop: (routeStopId: string) => Promise<void>;
    onStopEdit: (stop: Stop) => void;
    onReorder: (routeId: string) => Promise<void>; 
    loading: boolean;
    setParentLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

function RouteStopListModal({ 
    route, 
    allStops, 
    currentRouteStops, 
    onClose, 
    onAddStop, 
    onRemoveStop, 
    onStopEdit,
    onReorder,
    loading,
    setParentLoading,
}: RouteStopListModalProps) {
    const [selectedStopId, setSelectedStopId] = useState('');
    const [isReordering, setIsReordering] = useState(false);
    const [reorderedStops, setReorderedStops] = useState<RouteStopDetail[]>(currentRouteStops);
    
    // Reworking Drag and Drop with useRef to manage state during drag events
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    // Sync local reorderedStops state when currentRouteStops updates (e.g., after initial load or add/remove)
    useEffect(() => {
        setReorderedStops(currentRouteStops);
    }, [currentRouteStops]);
    
    const handleDragStart = (index: number) => {
        dragItem.current = index;
    };

    const handleDragEnter = (index: number) => {
        dragOverItem.current = index;
        
        // Optimistic reordering visual update
        if (dragItem.current !== null && dragOverItem.current !== null && dragItem.current !== dragOverItem.current) {
            const newReorderedStops = [...reorderedStops];
            const [draggedItem] = newReorderedStops.splice(dragItem.current, 1);
            newReorderedStops.splice(dragOverItem.current, 0, draggedItem);
            
            dragItem.current = dragOverItem.current; // Set dragged item to its new position for subsequent drags
            setReorderedStops(newReorderedStops);
        }
    };

    const handleDrop = () => {
        // Drop handler is mainly used to reset the refs
        dragItem.current = null;
        dragOverItem.current = null;
    };
    
    // CRITICAL FIX: Two-Phase Batch Update to bypass unique constraint violation
    const handleSaveReorder = async () => {
        if (!route || loading) return;

        setParentLoading(true);
        
        try {
            // PHASE 1: Shift all orders to a non-conflicting large number (9000 + index)
            // This frees up the 1, 2, 3, etc. spots, bypassing the UNIQUE constraint deadlock.
            const shiftPromises = reorderedStops.map((rs, index) => {
                if (rs.id) {
                    return supabase.from('route_stops')
                        .update({ stop_order: 9000 + index })
                        .eq('id', rs.id);
                }
                return Promise.resolve({ data: null, error: null });
            });
            
            // Execute the shift phase
            const shiftResults = await Promise.all(shiftPromises);
            const shiftFailures = shiftResults.filter(r => r && r.error);
            if (shiftFailures.length > 0) {
                 throw new Error(`PHASE 1 Failed: ${shiftFailures[0].error?.message || 'Unknown shift error'}`);
            }

            // PHASE 2: Finalize orders to the correct sequence (1, 2, 3...)
            const finalizePromises = reorderedStops.map((rs, index) => {
                if (rs.id) { 
                    // Final order is based on the new visual index
                    return supabase.from('route_stops')
                        .update({ stop_order: index + 1 })
                        .eq('id', rs.id);
                }
                return Promise.resolve({ data: null, error: null });
            });

            // Execute the finalize phase
            const finalizeResults = await Promise.all(finalizePromises);
            const finalizeFailures = finalizeResults.filter(r => r && r.error);
            if (finalizeFailures.length > 0) {
                // Critical Logging to catch any lingering RLS issues
                throw new Error(`PHASE 2 Failed (Finalize): ${finalizeFailures[0].error?.message || 'Unknown finalize error'}`);
            }

            // Reload the primary list and exit reordering mode
            await onReorder(route.id); 
            setIsReordering(false);
            
        } catch (error) {
            console.error('Error reordering stops:', error);
            alert(`Failed to save new order. DB Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setParentLoading(false);
        }
    };

    const availableStops = allStops.filter(stop => 
        !currentRouteStops.some(rs => rs.stop_id === stop.id)
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4"> {/* High Z-Index fix */}
            <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <h2 className="text-2xl font-semibold text-slate-800">Manage Stops for: {route.name}</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="space-y-6">
                    
                    {/* Add Stop Section */}
                    <div className="border border-slate-200 p-4 rounded-lg">
                        <h3 className="text-lg font-medium text-slate-800 mb-3">1. Add a Stop to Itinerary</h3>
                        <div className="flex gap-2">
                            <select
                                value={selectedStopId}
                                onChange={(e) => setSelectedStopId(e.target.value)}
                                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent outline-none bg-white"
                            >
                                <option value="">Select an Existing Stop</option>
                                {availableStops.map(stop => (
                                    <option key={stop.id} value={stop.id}>{stop.name}</option>
                                ))}
                            </select>
                            <button
                                type="button"
                                onClick={() => { selectedStopId && onAddStop(selectedStopId); }}
                                disabled={loading || !selectedStopId}
                                className="flex items-center px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 
                                    <Plus className="w-5 h-5 mr-2" />
                                }
                                Add
                            </button>
                        </div>
                        <p className="text-sm text-slate-500 mt-2">
                            If the stop doesn't exist, click the "New Stop" button on the main page.
                        </p>
                    </div>

                    {/* Current Itinerary Section */}
                    <div className="border border-slate-200 p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-slate-800">2. Current Stop Itinerary</h3>
                            {currentRouteStops.length > 1 && (
                                <button
                                    onClick={() => {
                                        setIsReordering(prev => !prev);
                                        // Save changes when exiting the reorder mode
                                        if (isReordering) handleSaveReorder(); 
                                    }}
                                    disabled={loading}
                                    className={`text-sm px-3 py-1 rounded-lg transition ${
                                        isReordering ? 'bg-amber-600 text-white hover:bg-amber-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                    }`}
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : isReordering ? 'Save Changes' : 'Reorder'}
                                </button>
                            )}
                        </div>
                        
                        {isReordering && (
                            <p className="mb-3 text-sm text-amber-800 bg-amber-50 p-2 rounded-lg">
                                Drag and drop the stops to change their order, then click "Save Changes" to persist.
                            </p>
                        )}
                        
                        <div 
                            className="space-y-3"
                            onDrop={handleDrop}
                            onDragOver={(e) => e.preventDefault()} // Must allow drop
                        >
                            {(isReordering ? reorderedStops : currentRouteStops).map((rs, index) => (
                                <div 
                                    key={rs.id} 
                                    className={`flex items-center p-3 border border-slate-200 rounded-lg transition ${
                                        isReordering ? 'cursor-grab bg-white shadow-md' : 'bg-white'
                                    }`}
                                    draggable={isReordering}
                                    onDragStart={() => handleDragStart(index)}
                                    onDragEnter={isReordering ? () => handleDragEnter(index) : undefined}
                                    onDragEnd={handleDrop}
                                >
                                    {isReordering && <GripVertical className="w-5 h-5 text-slate-400 mr-3 cursor-grab" />}
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-slate-700 mr-3 bg-slate-100">
                                        {isReordering ? index + 1 : rs.stop_order}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-medium text-slate-800">{rs.stops.name}</div>
                                        <div className="text-xs text-slate-500">{rs.stops.address}</div>
                                    </div>
                                    
                                    {!isReordering && (
                                        <>
                                            <button 
                                                onClick={() => onStopEdit(rs.stops)}
                                                className="text-slate-500 hover:text-blue-600 p-1 rounded transition"
                                                title="Edit Stop Location/Name"
                                            >
                                                <Edit className="w-5 h-5" />
                                            </button>
                                            <button 
                                                onClick={() => onRemoveStop(rs.id)}
                                                disabled={loading}
                                                className="text-slate-500 hover:text-red-600 p-1 rounded ml-2 transition disabled:opacity-50"
                                                title="Remove from Route"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}


// --- MAIN COMPONENT ---
export default function RoutesManagement() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [stops, setStops] = useState<Stop[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [routeStops, setRouteStops] = useState<RouteStopDetail[]>([]);
  
  // Modals
  const [showCreateRouteModal, setShowCreateRouteModal] = useState(false);
  const [showStopModal, setShowStopModal] = useState(false);
  const [showStopListModal, setShowStopListModal] = useState(false);
  const [stopToEdit, setStopToEdit] = useState<Stop | undefined>(undefined);

  // State for new route creation flow
  const [stopSelectionTarget, setStopSelectionTarget] = useState<'start' | 'end' | null>(null);
  const [startStopId, setStartStopId] = useState<string | undefined>(undefined);
  const [endStopId, setEndStopId] = useState<string | undefined>(undefined);

  const [loading, setLoading] = useState(true);

  // Determine if ANY modal is open to hide the background map
  const isModalOpen = showCreateRouteModal || showStopModal || showStopListModal || !!stopToEdit;

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    if (selectedRoute) {
      loadRouteStops(selectedRoute.id);
    }
  }, [selectedRoute]);

  const loadAllData = async () => {
    setLoading(true);
    // FIX: Load both stops and routes in parallel
    const [routesRes, stopsRes] = await Promise.all([
      supabase.from('routes').select('*').order('created_at', { ascending: false }),
      supabase.from('stops').select('*').order('name', { ascending: true }),
    ]);

    setRoutes(routesRes.data || []);
    setStops(stopsRes.data || []);
    setLoading(false);
  };

  const loadRouteStops = async (routeId: string) => {
    const { data } = await supabase
      .from('route_stops')
      .select('*, stops(*)')
      .eq('route_id', routeId)
      .order('stop_order');

    // Filter out null or invalid stop records
    setRouteStops((data || []).filter((rs): rs is RouteStopDetail => rs.stops !== null)); 
  };

  // --- Stop Creation & Editing Handlers ---
  
  const handleStopCreated = (newStop: Stop) => {
    // 1. Add/Update master list
    setStops(prev => {
        const index = prev.findIndex(s => s.id === newStop.id);
        if (index > -1) {
            // Edit existing
            return prev.map(s => s.id === newStop.id ? newStop : s);
        } else {
            // Add new
            return [...prev, newStop].sort((a, b) => a.name.localeCompare(b.name));
        }
    });

    // 2. Handle Stop Selection for New Route Modal
    if (stopSelectionTarget) {
        if (stopSelectionTarget === 'start') {
            setStartStopId(newStop.id);
        } else {
            setEndStopId(newStop.id);
        }
        
        // Re-open the route creation modal
        setStopSelectionTarget(null);
        setShowStopModal(false);
        setShowCreateRouteModal(true);
        return; 
    }
    
    // 3. If a route is selected, immediately open the list modal to add the new stop
    if (selectedRoute) {
        // If this was an edit, we handle it below. If it was a new creation, open list modal.
        setShowStopModal(false);
        if (!newStop.id) { // Simple check for a brand new creation
            setShowStopListModal(true);
        }
    } else {
        setShowStopModal(false);
    }
  };

  // --- Route-Stop Management Logic (Adding/Removing from Itinerary) ---

  const handleAddStopToRoute = async (stopId: string) => {
    if (!selectedRoute) return;
    setLoading(true);

    try {
      // New stop order is the current max order + 1
      const newStopOrder = routeStops.length > 0 
        ? Math.max(...routeStops.map(rs => rs.stop_order)) + 1
        : 1;

      const { error } = await supabase
        .from('route_stops')
        .insert([{
          route_id: selectedRoute.id,
          stop_id: stopId,
          stop_order: newStopOrder,
        }]);

      if (error) throw error;
      
      // Reload route stops to update the map and list
      await loadRouteStops(selectedRoute.id);
      
    } catch (error) {
      console.error('Error adding stop to route:', error);
      alert('Failed to add stop to route. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveStopFromRoute = async (routeStopId: string) => {
    if (!selectedRoute) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from('route_stops')
        .delete()
        .eq('id', routeStopId);

      if (error) throw error;

      // Reload route stops to update the map and list
      await loadRouteStops(selectedRoute.id);

    } catch (error) {
      console.error('Error removing stop:', error);
      alert('Failed to remove stop. Check console for details.');
    } finally {
      setLoading(false);
    }
  };
  
  // --- New Route Stop Selection Trigger ---
  
  const handleTriggerStopCreation = (target: 'start' | 'end') => {
      // 1. Set the target for the stop creation
      setStopSelectionTarget(target);
      
      // 2. Hide the current modal and show the stop creation modal
      setShowCreateRouteModal(false);
      setShowStopModal(true);
  };
  
  // --- UI Data Generation ---

  const mapMarkers = routeStops.map(rs => ({
    position: [rs.stops.latitude, rs.stops.longitude] as LatLngExpression,
    label: `${rs.stop_order}. ${rs.stops.name}`,
    type: 'stop' as const,
  }));

  const routeLine = routeStops.length > 0 ? [{
    positions: routeStops.map(rs => [rs.stops.latitude, rs.stops.longitude] as LatLngExpression),
    color: '#64748b',
  }] : [];

  const mapCenter = selectedRoute && routeStops.length > 0
    ? [routeStops[0].stops.latitude, routeStops[0].stops.longitude] as LatLngExpression
    : PUNE_CENTER;


  if (loading && routes.length === 0) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin mr-3 text-slate-600" />
      Loading...
    </div>;
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
              <h1 className="text-3xl font-semibold text-slate-800">Routes & Stops Management</h1>
              <p className="text-slate-500 mt-1">Create routes, stops, and define route itineraries.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => { setStopToEdit(undefined); setShowStopModal(true); }}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <MapPin className="w-5 h-5 mr-2" />
              New Stop
            </button>
            <button
              onClick={() => {
                  // Clear previous route start/end points when opening the modal
                  setStartStopId(undefined);
                  setEndStopId(undefined);
                  setShowCreateRouteModal(true);
              }}
              className="flex items-center px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition"
            >
              <Plus className="w-5 h-5 mr-2" />
              New Route
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Column 1: All Routes List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
              <h2 className="text-lg font-medium text-slate-800 mb-4">All Routes ({routes.length})</h2>
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {routes.length === 0 ? (
                  <p className="text-slate-500 text-sm">No routes created yet</p>
                ) : (
                  routes.map(route => (
                    <div 
                      key={route.id} 
                      className={`p-4 rounded-lg border transition cursor-pointer ${
                        selectedRoute?.id === route.id
                          ? 'border-slate-800 bg-slate-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <button
                        className="w-full text-left"
                        onClick={() => setSelectedRoute(route)}
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
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Column 2 & 3: Selected Route Detail / Stop Management */}
          <div className="lg:col-span-2">
            {selectedRoute ? (
              <div className="space-y-6">
                
                {/* Route Map Preview - CRITICAL FIX: Hide when modal is open to prevent bleed */}
                <div className={`bg-white rounded-xl shadow-sm p-6 border border-slate-100 transition duration-300 ${isModalOpen ? 'invisible h-0' : 'visible'}`}>
                  <h2 className="text-xl font-medium text-slate-800 mb-4">
                    {selectedRoute.name} Stops Map
                  </h2>
                  <Map 
                    markers={mapMarkers} 
                    routes={routeLine} 
                    className="h-[350px]" 
                    center={mapCenter}
                  />
                </div>

                {/* Route Stop Management */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-medium text-slate-800">Itinerary Stops ({routeStops.length})</h2>
                    <button
                      onClick={() => setShowStopListModal(true)}
                      className="text-sm px-3 py-1 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition"
                    >
                      Add/Manage Stops
                    </button>
                  </div>
                  
                  {routeStops.length === 0 ? (
                    <p className="text-slate-500 text-sm">Use the "Add/Manage Stops" button to create an itinerary for this route.</p>
                  ) : (
                    <div className="space-y-2">
                      {routeStops.map(rs => (
                        <div key={rs.id} className="flex items-center p-3 border border-slate-200 rounded-lg bg-slate-50">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-slate-700 mr-3">
                            {rs.stop_order}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-slate-800">{rs.stops.name}</div>
                            <div className="text-xs text-slate-500">{rs.stops.address}</div>
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
                <p className="text-slate-500">Select a route to view and manage its stops, or create a new route/stop.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODALS */}
      {showCreateRouteModal && (
        <CreateRouteModal
          onClose={() => setShowCreateRouteModal(false)}
          onSuccess={loadAllData}
          allStops={stops}
          onStopSelection={handleTriggerStopCreation}
          startStopId={startStopId}
          endStopId={endStopId}
        />
      )}
      
      {(showStopModal || stopToEdit) && (
        <StopManagementModal
          onClose={() => { 
              // If we were selecting a start/end stop, revert to the create route modal
              if (stopSelectionTarget) {
                  setShowCreateRouteModal(true);
                  setStopSelectionTarget(null);
              }
              setShowStopModal(false); 
              setStopToEdit(undefined); 
          }}
          onStopCreated={handleStopCreated} 
          initialStop={stopToEdit}
        />
      )}

      {showStopListModal && selectedRoute && (
        <RouteStopListModal
          route={selectedRoute}
          allStops={stops}
          currentRouteStops={routeStops}
          onClose={() => setShowStopListModal(false)}
          onAddStop={handleAddStopToRoute}
          onRemoveStop={handleRemoveStopFromRoute}
          onStopEdit={(stop) => { 
            setStopToEdit(stop);
            setShowStopListModal(false); // Hide the list when editing a stop
          }}
          onReorder={loadRouteStops}
          loading={loading}
          setParentLoading={setLoading}
        />
      )}
    </div>
  );
}