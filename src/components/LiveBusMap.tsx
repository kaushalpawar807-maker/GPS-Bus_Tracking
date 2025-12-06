import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { ref, onValue } from 'firebase/database';
import { database } from '../lib/firebase';
import { Icon } from 'leaflet';
import { AlertTriangle, Navigation } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon in React Leaflet
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

// Custom Icons
const busIcon = new Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3448/3448339.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
});

const alertIcon = new Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/564/564619.png', // Red alert icon
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
});

interface BusData {
    latitude: number;
    longitude: number;
    speed: number;
    accident_status: boolean; // From MPU6050
    last_updated: number;
}

function MapUpdater({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        map.flyTo(center, 15);
    }, [center, map]);
    return null;
}

export default function LiveBusMap({ busId = 'bus1' }: { busId?: string }) {
    const [busData, setBusData] = useState<BusData | null>(null);
    const [gpsError, setGpsError] = useState(false);
    const [center, setCenter] = useState<[number, number]>([12.9716, 77.5946]); // Default Bangalore

    useEffect(() => {
        const busRef = ref(database, 'buses/' + busId);

        const unsubscribe = onValue(busRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                // GPS Error Handling (0,0 Logic)
                if (data.latitude === 0 && data.longitude === 0) {
                    setGpsError(true);
                    // Keep previous center, do not update position to 0,0
                } else {
                    setGpsError(false);
                    setBusData(data);
                    setCenter([data.latitude, data.longitude]);
                }
            }
        });

        return () => unsubscribe();
    }, [busId]);

    return (
        <div className="relative w-full h-[600px] rounded-xl overflow-hidden border border-slate-200 shadow-sm">

            {/* Overlay Alerts */}
            <div className="absolute top-4 right-4 z-[1000] space-y-2">
                {gpsError && (
                    <div className="bg-yellow-50 text-yellow-800 px-4 py-3 rounded-lg shadow-md border border-yellow-200 flex items-center gap-2 animate-pulse">
                        <Navigation className="w-5 h-5" />
                        <div>
                            <p className="font-semibold text-sm">GPS Signal Lost</p>
                            <p className="text-xs opacity-90">Showing last known location</p>
                        </div>
                    </div>
                )}

                {busData?.accident_status && (
                    <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg shadow-md border border-red-200 flex items-center gap-2 animate-bounce">
                        <AlertTriangle className="w-5 h-5" />
                        <div>
                            <p className="font-semibold text-sm">Accident Alert!</p>
                            <p className="text-xs opacity-90">Sensor detected impact or topple</p>
                        </div>
                    </div>
                )}
            </div>

            <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />

                {busData && !gpsError && (
                    <Marker
                        position={[busData.latitude, busData.longitude]}
                        icon={busData.accident_status ? alertIcon : busIcon}
                    >
                        <Popup>
                            <div className="p-2">
                                <h3 className="font-bold text-slate-800">Bus {busId}</h3>
                                <p className="text-xs text-slate-500">Speed: {busData.speed} km/h</p>
                                <p className="text-xs text-slate-500">
                                    Last Updated: {new Date(busData.last_updated).toLocaleTimeString()}
                                </p>
                                {busData.accident_status && (
                                    <p className="text-red-600 font-bold mt-1">⚠️ ACCIDENT DETECTED</p>
                                )}
                            </div>
                        </Popup>
                    </Marker>
                )}

                <MapUpdater center={center} />
            </MapContainer>
        </div>
    );
}
