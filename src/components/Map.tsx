import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
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
}

function MapUpdater({ center }: { center: LatLngExpression }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);

  return null;
}

export default function Map({
  center = PUNE_CENTER,
  zoom = 13,
  markers = [],
  routes = [],
  className = 'h-96'
}: MapProps) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className={className}
      style={{ borderRadius: '12px' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <MapUpdater center={center} />

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
    </MapContainer>
  );
}

export { PUNE_CENTER };
