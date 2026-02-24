import pandas as pd
import numpy as np
import random
import os

# Set seed for reproducibility
np.random.seed(42)

def generate_bus_data(num_samples=1000):
    data = []
    
    for _ in range(num_samples):
        # --- Manual Inputs ---
        # km since last service (0 to 10,000)
        km_since_service = np.random.uniform(0, 10000)
        
        # days since last service (0 to 365)
        days_since_service = np.random.randint(0, 366)
        
        # previous breakdown count (0 to 5)
        prev_breakdowns = np.random.choice([0, 1, 2, 3, 4, 5], p=[0.7, 0.15, 0.08, 0.04, 0.02, 0.01])
        
        # avg daily run km (100 to 400)
        avg_daily_km = np.random.uniform(100, 400)
        
        # --- GPS Derived ---
        # daily distance (80% to 120% of avg_daily_km)
        daily_dist = avg_daily_km * np.random.uniform(0.8, 1.2)
        
        # avg speed (20 to 60 km/h)
        avg_speed = np.random.uniform(20, 60)
        
        # overspeed count (0 to 20)
        overspeed = np.random.randint(0, 21)
        
        # --- MPU6050 Derived ---
        # harsh brake count (0 to 15)
        harsh_brakes = np.random.randint(0, 16)
        
        # sudden acceleration count (0 to 15)
        sudden_accel = np.random.randint(0, 16)
        
        # vibration index (0.0 to 1.0)
        vibration = np.random.uniform(0.1, 0.9)
        
        # tilt spike count (0 to 5)
        tilt_spikes = np.random.randint(0, 6)
        
        # acceleration standard deviation (0.1 to 2.0)
        accel_std = np.random.uniform(0.1, 2.0)
        
        # --- TARGET: Days Until Service Prediction ---
        # Baseline service interval: 180 days
        # We start with 180 and subtract based on wear and tear features
        
        target = 180 
        
        # Subtract for km usage (every 1000km reduces life)
        target -= (km_since_service / 1000) * 10
        
        # Subtract for age
        target -= (days_since_service / 30) * 5
        
        # Subtract for breakdown history
        target -= prev_breakdowns * 15
        
        # Subtract for high daily distance
        if daily_dist > 300: target -= 10
        
        # Subtract for overspeeding
        target -= (overspeed / 5) * 8
        
        # Subtract for harsh driving (MPU)
        target -= (harsh_brakes * 2)
        target -= (sudden_accel * 1.5)
        target -= (vibration * 20)
        target -= (tilt_spikes * 5)
        target -= (accel_std * 10)
        
        # Ensure target is within realistic bounds (e.g., 0 to 180)
        target = max(0, min(180, target))
        
        # Add a little noise to make it "ML-friendly"
        target += np.random.normal(0, 5)
        target = max(0, int(target))
        
        data.append({
            'km_since_last_service': round(km_since_service, 2),
            'days_since_last_service': days_since_service,
            'previous_breakdown_count': prev_breakdowns,
            'avg_daily_run_km': round(avg_daily_km, 2),
            'daily_distance': round(daily_dist, 2),
            'average_speed': round(avg_speed, 2),
            'overspeed_count': overspeed,
            'harsh_brake_count': harsh_brakes,
            'sudden_acceleration_count': sudden_accel,
            'vibration_index': round(vibration, 3),
            'tilt_spike_count': tilt_spikes,
            'acceleration_std': round(accel_std, 3),
            'days_until_service': target
        })
        
    return pd.DataFrame(data)

if __name__ == "__main__":
    print("Generating synthetic bus maintenance dataset...")
    df = generate_bus_data(1500)
    
    # Save to CSV
    output_path = "maintenance_training_data.csv"
    df.to_csv(output_path, index=False)
    
    print(f"Success! Generated {len(df)} samples.")
    print(f"Saved to: {os.path.abspath(output_path)}")
    print("\nSample Data:")
    print(df.head())
