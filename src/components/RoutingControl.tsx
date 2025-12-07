import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-routing-machine';

interface RoutingControlProps {
    waypoints: { lat: number; lng: number }[];
    lineColor?: string;
}

export default function RoutingControl({ waypoints, lineColor = '#6366f1' }: RoutingControlProps) {
    const map = useMap();

    useEffect(() => {
        if (!map) return;
        // Need at least 2 points to route
        if (waypoints.length < 2) return;

        // @ts-ignore - leaflet-routing-machine types
        const routingControl = L.Routing.control({
            waypoints: waypoints.map(pt => L.latLng(pt.lat, pt.lng)),
            routeWhileDragging: false,
            show: false, // Hide the turn-by-turn text box
            addWaypoints: false, // Disable adding points by dragging line
            draggableWaypoints: false, // Disable dragging markers
            fitSelectedRoutes: true, // Fit map to route
            lineOptions: {
                styles: [{ color: lineColor, weight: 4 }],
                extendToWaypoints: false,
                missingRouteTolerance: 10
            },
            // We often draw our own markers, but if this control adds them, we might want to suppress them
            // For now, let's suppress the default markers so we can render custom ones in the parent component
            createMarker: function () { return null; }
        } as any).addTo(map);

        // HACK: Explicitly hide the container because 'show: false' sometimes leaves an empty box or doesn't fully suppress it in some versions
        const container = routingControl.getContainer();
        if (container) {
            container.style.display = 'none';
        }

        return () => {
            try {
                map.removeControl(routingControl);
            } catch (e) {
                console.warn("Routing control cleanup error", e);
            }
        };
    }, [map, waypoints, lineColor]);

    return null;
}
