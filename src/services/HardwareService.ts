import { database } from '../lib/firebase';
import { ref, onValue, off } from 'firebase/database';

export type CollisionData = {
    // Core Fields from Hardware
    type: 'COLLISION' | 'ROLLOVER';
    timestamp: number | string;
    
    // Accelerometer (Corrected to match hardware payload)
    ax: number;
    ay: number;
    az: number;
    
    // Gyroscope (Corrected to match hardware payload)
    gx: number;
    gy: number;
    gz: number;

    // Derived/Optional Fields
    severity?: string;
    impact_force?: number;
    impact_g_force?: number;

    // Legacy/Flexible support
    [key: string]: any;
};

import { supabase } from '../lib/supabase';
import { maintenanceService } from './MaintenanceService';

class HardwareService {
    private activeListeners: Record<string, any> = {};

    /**
     * Subscribe to GLOBAL events using a Root Query.
     */
    subscribeToGlobalEvents(callback: (data: CollisionData | null) => void) {
        console.log('[DEBUG] HardwareService: Subscribing to crash_alerts...');

        const rootRef = ref(database, '/crash_alerts');
        
        // Listen to the whole node to catch updates to any child (collision or rollover)
        const listener = onValue(rootRef, (snapshot) => {
            if (snapshot.exists()) {
                const val = snapshot.val();
                
                // If it's the fixed structure { latest_collision: {...}, latest_rollover: {...} }
                // we want to notify for the one that just changed.
                
                if (val.latest_collision) {
                    this.processMaintenanceData(val.latest_collision);
                    callback(val.latest_collision);
                }
                
                if (val.latest_rollover) {
                    this.processMaintenanceData(val.latest_rollover);
                    callback(val.latest_rollover);
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
            const impactForce = data.impact_force || Math.max(Math.abs(data.ax || 0), Math.abs(data.ay || 0), Math.abs(data.az || 0));
            const isOverspeed = impactForce > 20; // Simulated logic
            const isHarshShift = data.type === 'COLLISION' && impactForce > 15;
            const vibration = Math.abs((data.ax || 0) + (data.ay || 0) + (data.az || 0)) / 30;

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
