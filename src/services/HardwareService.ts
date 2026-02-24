import { database } from '../lib/firebase';
import { ref, onValue, off, limitToLast, query } from 'firebase/database';

export type CollisionData = {
    // Basic Fields based on User Request
    type: 'COLLISION' | 'ROLLOVER';
    timestamp: string;
    severity?: string;

    // Impact Data
    impact_force?: number;
    impact_g_force?: number;

    // Gyro
    gyro_x?: number;
    gyro_y?: number;
    gyro_z?: number;

    // Accel
    accel_x?: number;
    accel_y?: number;
    accel_z?: number;

    // Raw fields observed in payload (optional)
    collision_33161?: boolean; // Example of device specific flag
    rollover_123212?: boolean;
    [key: string]: any; // Allow flexible keys
};

import { supabase } from '../lib/supabase';
import { maintenanceService } from './MaintenanceService';

class HardwareService {
    private activeListeners: Record<string, any> = {};

    /**
     * Subscribe to GLOBAL events using a Root Query.
     */
    subscribeToGlobalEvents(callback: (data: CollisionData | null) => void) {
        console.log('[DEBUG] HardwareService: Subscribing to ROOT...');

        const rootRef = ref(database, '/crash_alerts');
        const latestQuery = query(rootRef, limitToLast(1));

        const listener = onValue(latestQuery, (snapshot) => {
            if (snapshot.exists()) {
                const val = snapshot.val();
                const keys = Object.keys(val);
                if (keys.length > 0) {
                    const latestKey = keys[keys.length - 1];
                    const data = val[latestKey] as CollisionData;

                    // Process for Maintenance ML
                    this.processMaintenanceData(data);

                    callback(data);
                }
            }
        });

        this.activeListeners['global'] = { ref: rootRef, listener };
    }

    private async processMaintenanceData(data: CollisionData) {
        // Logic to link alert to a bus. 
        // In a real system, device_id would be in the payload.
        // For now, we'll find a bus that matches this device_id or use a default if it's a demo.
        try {
            const { data: bus } = await supabase
                .from('buses')
                .select('id')
                .not('device_id', 'is', null)
                .limit(1)
                .single();

            if (!bus) return;

            // Derived Metrics Logic
            const isOverspeed = (data.impact_force || 0) > 20; // Simulated logic
            const isHarshShift = data.type === 'COLLISION' && (data.impact_force || 0) > 15;
            const vibration = Math.abs((data.accel_x || 0) + (data.accel_y || 0) + (data.accel_z || 0)) / 30;

            // Update Supabase maintenance_metrics incrementaly
            // Note: In production, you'd use a windowing function or Postgres increment
            const { data: current } = await supabase
                .from('maintenance_metrics')
                .select('*')
                .eq('bus_id', bus.id)
                .single();

            const update = {
                bus_id: bus.id,
                vibration_index: vibration, // Most recent vibration
                overspeed_count: (current?.overspeed_count || 0) + (isOverspeed ? 1 : 0),
                harsh_brake_count: (current?.harsh_brake_count || 0) + (isHarshShift ? 1 : 0),
                updated_at: new Date().toISOString()
            };

            await supabase.from('maintenance_metrics').upsert(update, { onConflict: 'bus_id' });

            // Re-predict
            await maintenanceService.updateMetricsAndPredict(bus.id, {});

            console.log(`[ML] Maintenance metrics updated for bus ${bus.id}`);
        } catch (e) {
            console.error('[ML] Error processing hardware data:', e);
        }
    }

    unsubscribeGlobal() {
        if (this.activeListeners['global']) {
            off(this.activeListeners['global'].ref);
            delete this.activeListeners['global'];
        }
    }

    // Legacy methods kept for compatibility but deprecated
    subscribeToDevice(deviceId: string, callback: (data: CollisionData | null) => void) {
        // No-op or redirect to global if needed
        console.warn('subscribeToDevice is deprecated in favor of Global Listener', deviceId, callback);
    }

    unsubscribeFromDevice(deviceId: string) {
        // No-op
        console.warn('unsubscribeFromDevice is deprecated', deviceId);
    }

    /**
     * Listen to ALL devices (Advanced - for Admin Dashboard Global Monitor)
     */
    subscribeToAllActiveDevices(deviceIds: string[], callback: (deviceId: string, data: CollisionData) => void) {
        // Deprecated in favor of global root listener
        console.warn('subscribeToAllActiveDevices is deprecated', deviceIds, callback);
    }
}

export const hardwareService = new HardwareService();
