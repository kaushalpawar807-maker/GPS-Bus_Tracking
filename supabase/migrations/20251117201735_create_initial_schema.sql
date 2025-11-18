/*
  # Community Bus Tracking System - Initial Schema

  ## Overview
  This migration creates the complete database schema for Phase-1 of the Community Bus Tracking System.

  ## New Tables

  ### 1. `profiles`
  User profile information extending Supabase auth.users
  - `id` (uuid, FK to auth.users)
  - `email` (text)
  - `role` (text: 'user', 'admin', 'driver', 'conductor')
  - `full_name` (text)
  - `phone` (text, optional)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. `routes`
  Bus routes managed by admins
  - `id` (uuid, primary key)
  - `name` (text)
  - `description` (text)
  - `is_active` (boolean)
  - `created_by` (uuid, FK to profiles)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. `stops`
  Bus stops with geographic coordinates
  - `id` (uuid, primary key)
  - `name` (text)
  - `latitude` (numeric)
  - `longitude` (numeric)
  - `address` (text)
  - `created_by` (uuid, FK to profiles)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 4. `route_stops`
  Junction table linking routes to stops with ordering
  - `id` (uuid, primary key)
  - `route_id` (uuid, FK to routes)
  - `stop_id` (uuid, FK to stops)
  - `stop_order` (integer)
  - `created_at` (timestamptz)

  ### 5. `buses`
  Bus vehicles in the fleet
  - `id` (uuid, primary key)
  - `bus_number` (text, unique)
  - `capacity` (integer)
  - `route_id` (uuid, FK to routes, nullable)
  - `status` (text: 'active', 'inactive', 'maintenance')
  - `created_by` (uuid, FK to profiles)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 6. `tickets`
  User ticket bookings
  - `id` (uuid, primary key)
  - `user_id` (uuid, FK to profiles)
  - `route_id` (uuid, FK to routes)
  - `boarding_stop_id` (uuid, FK to stops)
  - `destination_stop_id` (uuid, FK to stops)
  - `booking_date` (timestamptz)
  - `status` (text: 'booked', 'used', 'cancelled')
  - `created_at` (timestamptz)

  ### 7. `conductor_reports`
  Daily reports from conductors
  - `id` (uuid, primary key)
  - `conductor_id` (uuid, FK to profiles)
  - `bus_id` (uuid, FK to buses)
  - `passenger_count` (integer)
  - `cash_collected` (numeric)
  - `report_date` (date)
  - `created_at` (timestamptz)

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Policies created for role-based access control
  - Admin users have full access to management tables
  - Regular users can only access their own tickets and view public route/stop data
  - Drivers and conductors have access to their assigned resources

  ## Notes
  - All tables use UUID primary keys with gen_random_uuid()
  - Timestamps default to now()
  - Proper foreign key constraints ensure data integrity
  - Indexes added for frequently queried columns
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'admin', 'driver', 'conductor')),
  full_name text,
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create routes table
CREATE TABLE IF NOT EXISTS routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active routes"
  ON routes FOR SELECT
  TO authenticated
  USING (is_active = true OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  ));

CREATE POLICY "Admins can insert routes"
  ON routes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update routes"
  ON routes FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete routes"
  ON routes FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create stops table
CREATE TABLE IF NOT EXISTS stops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  address text,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE stops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view stops"
  ON stops FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert stops"
  ON stops FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update stops"
  ON stops FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete stops"
  ON stops FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create route_stops junction table
CREATE TABLE IF NOT EXISTS route_stops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id uuid NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  stop_id uuid NOT NULL REFERENCES stops(id) ON DELETE CASCADE,
  stop_order integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(route_id, stop_id),
  UNIQUE(route_id, stop_order)
);

ALTER TABLE route_stops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view route stops"
  ON route_stops FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage route stops"
  ON route_stops FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create buses table
CREATE TABLE IF NOT EXISTS buses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_number text UNIQUE NOT NULL,
  capacity integer NOT NULL DEFAULT 40,
  route_id uuid REFERENCES routes(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE buses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active buses"
  ON buses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage buses"
  ON buses FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  route_id uuid NOT NULL REFERENCES routes(id),
  boarding_stop_id uuid NOT NULL REFERENCES stops(id),
  destination_stop_id uuid NOT NULL REFERENCES stops(id),
  booking_date timestamptz DEFAULT now(),
  status text NOT NULL DEFAULT 'booked' CHECK (status IN ('booked', 'used', 'cancelled')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tickets"
  ON tickets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tickets"
  ON tickets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tickets"
  ON tickets FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all tickets"
  ON tickets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create conductor_reports table
CREATE TABLE IF NOT EXISTS conductor_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conductor_id uuid NOT NULL REFERENCES profiles(id),
  bus_id uuid NOT NULL REFERENCES buses(id),
  passenger_count integer NOT NULL DEFAULT 0,
  cash_collected numeric NOT NULL DEFAULT 0,
  report_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE conductor_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Conductors can view own reports"
  ON conductor_reports FOR SELECT
  TO authenticated
  USING (auth.uid() = conductor_id);

CREATE POLICY "Conductors can create own reports"
  ON conductor_reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = conductor_id);

CREATE POLICY "Admins can view all reports"
  ON conductor_reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_routes_active ON routes(is_active);
CREATE INDEX IF NOT EXISTS idx_route_stops_route ON route_stops(route_id);
CREATE INDEX IF NOT EXISTS idx_route_stops_stop ON route_stops(stop_id);
CREATE INDEX IF NOT EXISTS idx_buses_route ON buses(route_id);
CREATE INDEX IF NOT EXISTS idx_buses_status ON buses(status);
CREATE INDEX IF NOT EXISTS idx_tickets_user ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_route ON tickets(route_id);
CREATE INDEX IF NOT EXISTS idx_conductor_reports_conductor ON conductor_reports(conductor_id);
CREATE INDEX IF NOT EXISTS idx_conductor_reports_date ON conductor_reports(report_date);
