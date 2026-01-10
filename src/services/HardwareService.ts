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

class HardwareService {
    private activeListeners: Record<string, any> = {};

    /**
     * Subscribe to GLOBAL events using a Root Query.
     * Listens for the latest added node (limitToLast 1).
     */
    subscribeToGlobalEvents(callback: (data: CollisionData | null) => void) {
        console.log('[DEBUG] HardwareService: Subscribing to ROOT with limitToLast(1)...');

        // Listen to the ROOT of the database
        const rootRef = ref(database, '/');

        // Query the last 1 item added (The latest incident)
        const latestQuery = query(rootRef, limitToLast(1));

        const listener = onValue(latestQuery, (snapshot) => {
            if (snapshot.exists()) {
                const val = snapshot.val();
                console.log('[DEBUG] HardwareService: Root Snapshot:', val);

                // value is an object with one key-value pair, e.g. { "rollover_123": { ... } }
                const keys = Object.keys(val);
                if (keys.length > 0) {
                    // Start sorting to find the actually "newest" if keys aren't chronological?
                    // Firebase keys are often chronological (push IDs) or if bespoke, we rely on limitToLast.
                    // Since we requested limitToLast(1), we just take the last key locally if multiple returned due to rapid updates?
                    // Object.keys order isn't guaranteed in JS, but usually insertion order for non-integers.
                    // Safe bet: take the last key if multiple, or just the one.

                    const latestKey = keys[keys.length - 1];
                    const data = val[latestKey];
                    console.log(`[DEBUG] HardwareService: Latest Event [${latestKey}]:`, data);

                    callback(data as CollisionData);
                }
            } else {
                console.log('[DEBUG] HardwareService: No data at root.');
            }
        });

        // Store listener for cleanup (simplified for global singleton usage)
        this.activeListeners['global'] = { ref: rootRef, listener };
    }

    unsubscribeGlobal() {
        // In a real app we would properly off(ref, listener)
        // For now, this is a singleton service that lives as long as the app
        if (this.activeListeners['global']) {
            off(this.activeListeners['global'].ref);
            delete this.activeListeners['global'];
        }
    }

    // Legacy methods kept for compatibility but deprecated
    subscribeToDevice(deviceId: string, callback: (data: CollisionData | null) => void) {
        // No-op or redirect to global if needed
        console.warn('subscribeToDevice is deprecated in favor of Global Listener');
    }

    unsubscribeFromDevice(deviceId: string) {
        // No-op
    }

    /**
     * Listen to ALL devices (Advanced - for Admin Dashboard Global Monitor)
     */
    subscribeToAllActiveDevices(deviceIds: string[], callback: (deviceId: string, data: CollisionData) => void) {
        // Deprecated in favor of global root listener
    }
}

export const hardwareService = new HardwareService();
