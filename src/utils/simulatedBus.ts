import { LatLngExpression } from 'leaflet';

export interface SimulatedBus {
  id: string;
  busNumber: string;
  position: LatLngExpression;
  routeName: string;
}

// NOTE: All simulated bus data has been removed.
export const SIMULATED_BUSES: SimulatedBus[] = [];

export function getSimulatedBusMarkers() {
  return SIMULATED_BUSES.map(bus => ({
    position: bus.position,
    label: `${bus.busNumber} - ${bus.routeName}`,
    type: 'bus' as const,
  }));
}