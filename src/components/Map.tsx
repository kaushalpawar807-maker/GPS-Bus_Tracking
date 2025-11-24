import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import { LatLngExpression, Icon } from 'leaflet'; 
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react'; 

const PUNE_CENTER: LatLngExpression = [18.5204, 73.8567];

const defaultIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface MapProps {
  center?: LatLngExpression;
  zoom?: number;
  markers?: Array<{
    position: LatLngExpression;
    label: string;
    type?: 'stop' | 'bus' | 'user';
  }>;
  routes?: Array<{
    positions: LatLngExpression[];
    color?: string;
  }>;
  className?: string;
  onMapClick?: (lat: number, lng: number) => void;
  // Prop to signal a map needs its size invalidated (e.g., when a modal opens)
  shouldInvalidateSize?: boolean; 
  children?: React.ReactNode;
}

// Custom component to handle map centering and click events (Runs inside MapContainer)
function MapUpdater({ center, onMapClick, invalidate }: { center: LatLngExpression, onMapClick?: (lat: number, lng: number) => void, invalidate?: boolean }) {
  const map = useMapEvents({
    click(e) {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    }
  });

  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  
  // CRITICAL FIX: Force map resize when requested (e.g., when modal opens)
  useEffect(() => {
    if (invalidate) {
        // Use setTimeout(0) to ensure invalidation runs *after* the modal has finished rendering and transition.
        setTimeout(() => map.invalidateSize(), 0);
    }
  }, [invalidate, map]);


  return null;
}

export default function Map({
  center = PUNE_CENTER,
  zoom = 13,
  markers = [],
  routes = [],
  className = 'h-96',
  onMapClick,
  shouldInvalidateSize = false,
  children,
}: MapProps) {
  // We use a key change to force MapContainer to re-render when the center changes
  // This helps ensure consistency when switching locations.
  const mapKey = JSON.stringify(center);

  return (
    <MapContainer
      key={mapKey} // Force re-render on center change
      center={center}
      zoom={zoom}
      className={className}
      style={{ borderRadius: '12px' }}
      scrollWheelZoom={onMapClick ? false : 'center'} 
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {/* Pass invalidate flag directly to the updater */}
      <MapUpdater center={center} onMapClick={onMapClick} invalidate={shouldInvalidateSize} />

      {routes.map((route, idx) => (
        <Polyline
          key={idx}
          positions={route.positions}
          color={route.color || '#64748b'}
          weight={4}
          opacity={0.7}
        />
      ))}

      {markers.map((marker, idx) => (
        <Marker
          key={idx}
          position={marker.position}
          icon={defaultIcon}
        >
          <Popup>{marker.label}</Popup>
        </Marker>
      ))}

      {children}
    </MapContainer>
  );
}

export { PUNE_CENTER };