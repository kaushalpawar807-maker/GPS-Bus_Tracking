import { useState, useEffect } from 'react';
import { supabase, Stop } from '../lib/supabase';
import Map, { PUNE_CENTER } from './Map';
import { geocodeSearch, GeocodedLocation } from '../utils/geocoding';
import { MapPin, Search, Plus, X, Loader2 } from 'lucide-react';
import { LatLngExpression } from 'leaflet';

// Define the expected LatLng array type for safe indexing
type LatLngArray = [number, number];
const PUNE_CENTER_ARRAY = PUNE_CENTER as LatLngArray;

interface StopManagementModalProps {
  onClose: () => void;
  onStopCreated: (newStop: Stop) => void;
  initialStop?: Stop; // For editing existing stops
  existingStops?: Stop[]; // ADDED: For duplicate checking
}

export default function StopManagementModal({ onClose, onStopCreated, initialStop, existingStops = [] }: StopManagementModalProps) {
  const [stopName, setStopName] = useState(initialStop?.name || '');
  const [address, setAddress] = useState(initialStop?.address || '');
  // Use the safe array for initial coordinates
  const [latitude, setLatitude] = useState(initialStop?.latitude || PUNE_CENTER_ARRAY[0]);
  const [longitude, setLongitude] = useState(initialStop?.longitude || PUNE_CENTER_ARRAY[1]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodedLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState<LatLngExpression>([latitude, longitude]);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Duplicate Detection State
  const [suggestedExistingStop, setSuggestedExistingStop] = useState<Stop | null>(null);

  // CRITICAL FIX: Conditionally render map after a short delay for DOM stability
  const [isMapReady, setIsMapReady] = useState(false);

  useEffect(() => {
    // Check for duplicates when stopName changes (debounce slightly or just direct check)
    if (stopName && !initialStop) { // Only check if creating new
      const exactMatch = existingStops.find(s => s.name.toLowerCase().trim() === stopName.toLowerCase().trim());
      setSuggestedExistingStop(exactMatch || null);
    } else {
      setSuggestedExistingStop(null);
    }
  }, [stopName, existingStops, initialStop]);

  useEffect(() => {
    // Set the map center when editing a stop
    if (initialStop) {
      setMapCenter([initialStop.latitude, initialStop.longitude]);
    }

    // Set a timeout to mark the map container as ready to render
    const timer = setTimeout(() => {
      setIsMapReady(true);
    }, 100); // 100ms delay ensures modal animation/size calculation finishes

    return () => {
      setIsMapReady(false); // Reset on unmount
      clearTimeout(timer);
    }
  }, [initialStop]);


  const handleGeocode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    setLoading(true);
    setSearchResults([]);
    setMessage(null);

    const results = await geocodeSearch(searchQuery);

    if (results.length > 0) {
      setSearchResults(results);
      // Move map center to the first result
      setMapCenter([results[0].lat, results[0].lng]);

      // Auto-check if the SEARCHED name matches an existing stop
      const searchMatch = existingStops.find(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
      if (searchMatch && !initialStop) {
        setSuggestedExistingStop(searchMatch);
        setMessage({ text: `Found ${results.length} locations. Note: A stop named "${searchMatch.name}" already exists.`, type: 'success' });
      } else {
        setMessage({ text: `${results.length} locations found. Select one or click the map to pinpoint.`, type: 'success' });
      }

    } else {
      setMessage({ text: 'No results found for your search.', type: 'error' });
    }
    setLoading(false);
  };

  const handleMapClick = (lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
    setMapCenter([lat, lng]);
    setMessage({ text: 'Location pinned successfully! Coordinates updated.', type: 'success' });
  };

  const handleSelectResult = (result: GeocodedLocation) => {
    setStopName(result.name);
    setAddress(result.address);
    setLatitude(result.lat);
    setLongitude(result.lng);
    setMapCenter([result.lat, result.lng]);
    setSearchResults([]);
    setMessage({ text: `Selected: ${result.name}`, type: 'success' });
  };

  const handleUseExisting = () => {
    if (suggestedExistingStop) {
      onStopCreated(suggestedExistingStop);
      onClose(); // Close modal, treating it as 'created/selected'
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stopName || latitude === null || longitude === null) return;

    setLoading(true);
    setMessage(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const stopData = {
        name: stopName,
        address,
        latitude: parseFloat(latitude.toFixed(6)),
        longitude: parseFloat(longitude.toFixed(6)),
        created_by: user?.id,
      };

      let result;
      if (initialStop) {
        // Update existing stop
        const { data, error } = await supabase
          .from('stops')
          .update(stopData)
          .eq('id', initialStop.id)
          .select()
          .single();
        result = data;
        if (error) throw error;
      } else {
        // Create new stop
        const { data, error } = await supabase
          .from('stops')
          .insert([stopData])
          .select()
          .single();
        result = data;
        if (error) throw error;
      }

      onStopCreated(result);
      onClose();

    } catch (error) {
      console.error('Error saving stop:', error);
      setMessage({ text: 'Failed to save stop. Check console for details.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const currentMarkers = [{
    position: [latitude, longitude] as LatLngExpression,
    label: stopName || 'New Stop Location',
    type: 'stop' as const,
  }];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-slate-800">
              {initialStop ? 'Edit Bus Stop' : 'Create New Bus Stop'}
            </h2>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-800">
              <X className="w-6 h-6" />
            </button>
          </div>

          {message && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
              {message.text}
            </div>
          )}

          {/* ADDED 'overflow-hidden' to the grid container to prevent map bleed */}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">
            <div className="lg:col-span-1 space-y-6">

              {/* Stop Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Stop Name (e.g., Talegaon Dabhade)</label>
                <input
                  type="text"
                  value={stopName}
                  onChange={(e) => setStopName(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent outline-none"
                  placeholder="Enter stop name"
                />

                {/* DUPLICATE WARNING */}
                {suggestedExistingStop && (
                  <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start">
                    <div className="flex-1">
                      <p className="text-sm text-amber-800 font-medium">Stop already exists!</p>
                      <p className="text-xs text-amber-700 mt-1">
                        "{suggestedExistingStop.name}" is already in your list.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleUseExisting}
                      className="text-xs px-3 py-1.5 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition ml-3"
                    >
                      Use Existing
                    </button>
                  </div>
                )}
              </div>

              {/* Location Search/Geocoding */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Search Location</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent outline-none"
                    placeholder="Search by address or place name..."
                  />
                  <button
                    type="button"
                    onClick={handleGeocode}
                    disabled={loading || !searchQuery}
                    className="flex items-center px-4 py-2.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                  </button>
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="mt-3 max-h-40 overflow-y-auto border border-slate-200 rounded-lg bg-white shadow-sm">
                    {searchResults.map((result, index) => (
                      <div
                        key={index}
                        onClick={() => handleSelectResult(result)}
                        className="p-3 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition"
                      >
                        <div className="font-medium text-slate-800">{result.name}</div>
                        <div className="text-xs text-slate-500">{result.address}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Coordinates Display */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Latitude</label>
                  <div className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono text-sm">
                    {latitude.toFixed(6)}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Longitude</label>
                  <div className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono text-sm">
                    {longitude.toFixed(6)}
                  </div>
                </div>
              </div>

              {/* Address (for context) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Address / Description</label>
                <textarea
                  value={address || ''}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent outline-none"
                  placeholder="Street address or local area description"
                  rows={2}
                />
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
                  disabled={loading || !stopName || latitude === null || longitude === null}
                  className="flex-1 flex items-center justify-center px-4 py-2.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : initialStop ? 'Update Stop' :
                    <>
                      <Plus className="w-5 h-5 mr-2" />
                      Create Stop
                    </>
                  }
                </button>
              </div>
            </div>

            {/* Map Column */}
            <div className="lg:col-span-1">
              <div className="bg-slate-50 rounded-xl p-4 h-[550px] flex flex-col">
                <h3 className="text-base font-medium text-slate-700 mb-3 flex items-center">
                  <MapPin className="w-4 h-4 mr-2" />
                  Pin Location on Map (Click to Set)
                </h3>
                {/* Ensure map occupies available space */}
                <div className="flex-1 rounded-xl overflow-hidden min-h-[400px]">
                  {isMapReady ? (
                    <Map
                      center={mapCenter}
                      zoom={14}
                      markers={currentMarkers}
                      onMapClick={handleMapClick} // Pass the click handler
                      className="h-full w-full"
                      // Trigger resize after rendering
                      shouldInvalidateSize={true}
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-slate-500">
                      Loading map...
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Click anywhere on the map to set the precise location for the stop.
                </p>
              </div>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}