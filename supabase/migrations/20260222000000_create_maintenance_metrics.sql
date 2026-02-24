-- Create maintenance_metrics table
CREATE TABLE IF NOT EXISTS maintenance_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id uuid UNIQUE NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
  
  -- Manual Inputs
  km_since_last_service numeric DEFAULT 0,
  days_since_last_service integer DEFAULT 0,
  previous_breakdown_count integer DEFAULT 0,
  avg_daily_run_km numeric DEFAULT 0,
  
  -- GPS Derived
  daily_distance numeric DEFAULT 0,
  average_speed numeric DEFAULT 0,
  overspeed_count integer DEFAULT 0,
  
  -- MPU6050 Derived
  harsh_brake_count integer DEFAULT 0,
  sudden_acceleration_count integer DEFAULT 0,
  vibration_index numeric DEFAULT 0,
  tilt_spike_count integer DEFAULT 0,
  acceleration_std numeric DEFAULT 0,
  
  -- Model Output
  predicted_days integer,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE maintenance_metrics ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view maintenance metrics"
  ON maintenance_metrics FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage maintenance metrics"
  ON maintenance_metrics FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_maintenance_metrics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_update_maintenance_metrics_updated_at
BEFORE UPDATE ON maintenance_metrics
FOR EACH ROW
EXECUTE FUNCTION update_maintenance_metrics_updated_at();

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_maintenance_metrics_bus ON maintenance_metrics(bus_id);
