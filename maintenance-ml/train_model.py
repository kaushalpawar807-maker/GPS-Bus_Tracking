import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, r2_score
import joblib
import os

def train_maintenance_model(csv_path):
    print(f"Loading data from {csv_path}...")
    df = pd.read_csv(csv_path)
    
    # Define features (X) and target (y)
    features = [
        'km_since_last_service', 'days_since_last_service', 'previous_breakdown_count',
        'avg_daily_run_km', 'daily_distance', 'average_speed', 'overspeed_count',
        'harsh_brake_count', 'sudden_acceleration_count', 'vibration_index',
        'tilt_spike_count', 'acceleration_std'
    ]
    target = 'days_until_service'
    
    X = df[features]
    y = df[target]
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Initialize and train model
    model = LinearRegression()
    model.fit(X_train, y_train)
    
    # Evaluate
    predictions = model.predict(X_test)
    mae = mean_absolute_error(y_test, predictions)
    r2 = r2_score(y_test, predictions)
    
    print("\nModel Training Complete!")
    print(f"Mean Absolute Error: {mae:.2f} days")
    print(f"R2 Score: {r2:.4f}")
    
    # Output coefficients for TypeScript integration
    print("\n--- Model Coefficients (For TypeScript Integration) ---")
    print("Intercept:", model.intercept_)
    coeffs = dict(zip(features, model.coef_))
    for feature, coeff in coeffs.items():
        print(f"{feature}: {coeff}")
        
    # Save model
    joblib.dump(model, 'maintenance_model.pkl')
    print("\nModel saved to maintenance_model.pkl")
    
    return model.intercept_, coeffs

if __name__ == "__main__":
    data_path = "maintenance_training_data.csv"
    if os.path.exists(data_path):
        train_maintenance_model(data_path)
    else:
        print(f"Error: {data_path} not found. Run generate_dataset.py first.")
