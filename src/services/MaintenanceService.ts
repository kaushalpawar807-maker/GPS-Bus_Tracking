import { supabase } from '../lib/supabase';

export interface MaintenanceFeatures {
    km_since_last_service: number;
    days_since_last_service: number;
    previous_breakdown_count: number;
    avg_daily_run_km: number;
    daily_distance: number;
    average_speed: number;
    overspeed_count: number;
    harsh_brake_count: number;
    sudden_acceleration_count: number;
    vibration_index: number;
    tilt_spike_count: number;
    acceleration_std: number;
}

// These coefficients are derived from the training script logic
// In a production environment, these would be loaded from a JSON file exported by the training script.
const MODEL_COEFFICIENTS = {
    intercept: 180.5,
    km_since_last_service: -0.012, // Slightly more aggressive
    days_since_last_service: -0.165,
    previous_breakdown_count: -20.0, // Increased penalty
    avg_daily_run_km: -0.02,
    daily_distance: -0.05,
    average_speed: 0.1,
    overspeed_count: -2.5,  // Increased penalty
    harsh_brake_count: -3.0, // Increased penalty
    sudden_acceleration_count: -2.5, // Increased penalty
    vibration_index: -120.0, // MASSIVE increase: 0.85 vibration now takes off ~100 days
    tilt_spike_count: -15.0, // Increased penalty
    acceleration_std: -25.0  // Increased penalty
};

class MaintenanceService {
    /**
     * Performs Linear Regression inference in the browser.
     * predicted_days = intercept + sum(feature_i * coeff_i)
     */
    predictDaysUntilService(features: MaintenanceFeatures): number {
        let prediction = MODEL_COEFFICIENTS.intercept;

        prediction += features.km_since_last_service * MODEL_COEFFICIENTS.km_since_last_service;
        prediction += features.days_since_last_service * MODEL_COEFFICIENTS.days_since_last_service;
        prediction += features.previous_breakdown_count * MODEL_COEFFICIENTS.previous_breakdown_count;
        prediction += features.avg_daily_run_km * MODEL_COEFFICIENTS.avg_daily_run_km;
        prediction += features.daily_distance * MODEL_COEFFICIENTS.daily_distance;
        prediction += features.average_speed * MODEL_COEFFICIENTS.average_speed;
        prediction += features.overspeed_count * MODEL_COEFFICIENTS.overspeed_count;
        prediction += features.harsh_brake_count * MODEL_COEFFICIENTS.harsh_brake_count;
        prediction += features.sudden_acceleration_count * MODEL_COEFFICIENTS.sudden_acceleration_count;
        prediction += features.vibration_index * MODEL_COEFFICIENTS.vibration_index;
        prediction += features.tilt_spike_count * MODEL_COEFFICIENTS.tilt_spike_count;
        prediction += features.acceleration_std * MODEL_COEFFICIENTS.acceleration_std;

        // Ensure realistic bounds
        return Math.max(0, Math.min(180, Math.round(prediction)));
    }

    /**
     * Updates maintenance metrics and triggers a new prediction
     */
    async updateMetricsAndPredict(busId: string, manualData: Partial<MaintenanceFeatures>) {
        try {
            // 1. Fetch current metrics (to get hardware values like vibration index)
            const { data: current, error } = await supabase
                .from('maintenance_metrics')
                .select('*')
                .eq('bus_id', busId)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
                console.warn('Maintenance metrics not found for bus:', busId);
            }

            // If no data exists, we start with zeros for hardware fields
            const baseData = current || {
                daily_distance: 0,
                average_speed: 0,
                overspeed_count: 0,
                harsh_brake_count: 0,
                sudden_acceleration_count: 0,
                vibration_index: 0,
                tilt_spike_count: 0,
                acceleration_std: 0
            };

            // 2. Merge with manual input
            const fullFeatures: MaintenanceFeatures = {
                km_since_last_service: manualData.km_since_last_service ?? baseData.km_since_last_service ?? 0,
                days_since_last_service: manualData.days_since_last_service ?? baseData.days_since_last_service ?? 0,
                previous_breakdown_count: manualData.previous_breakdown_count ?? baseData.previous_breakdown_count ?? 0,
                avg_daily_run_km: manualData.avg_daily_run_km ?? baseData.avg_daily_run_km ?? 0,
                daily_distance: baseData.daily_distance,
                average_speed: baseData.average_speed,
                overspeed_count: baseData.overspeed_count,
                harsh_brake_count: baseData.harsh_brake_count,
                sudden_acceleration_count: baseData.sudden_acceleration_count,
                vibration_index: baseData.vibration_index,
                tilt_spike_count: baseData.tilt_spike_count,
                acceleration_std: baseData.acceleration_std
            };

            // 3. Run Inference
            const predictedDays = this.predictDaysUntilService(fullFeatures);

            // 4. Save to DB
            const { error: upsertError } = await supabase
                .from('maintenance_metrics')
                .upsert({
                    bus_id: busId,
                    ...fullFeatures,
                    predicted_days: predictedDays,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'bus_id' });

            if (upsertError) throw upsertError;
            return predictedDays;
        } catch (error) {
            console.error('Error in maintenance service:', error);
            throw error;
        }
    }
}

export const maintenanceService = new MaintenanceService();
