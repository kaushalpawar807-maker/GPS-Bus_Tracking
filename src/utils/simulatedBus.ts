import { LatLngExpression } from 'leaflet';

export interface SimulatedBus {
  id: string;
  busNumber: string;
  position: LatLngExpression;
  routeName: string;
}

export const SIMULATED_BUSES: SimulatedBus[] = [
  {
    id: 'sim-bus-1',
    busNumber: 'MH-12-AB-1234',
    position: [18.5204, 73.8567],
    routeName: 'Route 101',
  },
  {
    id: 'sim-bus-2',
    busNumber: 'MH-12-CD-5678',
    position: [18.5314, 73.8446],
    routeName: 'Route 102',
  },
];

export function getSimulatedBusMarkers() {
  return SIMULATED_BUSES.map(bus => ({
    position: bus.position,
    label: `${bus.busNumber} - ${bus.routeName}`,
    type: 'bus' as const,
  }));
}
