import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole = 'user' | 'admin' | 'driver' | 'conductor';

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  full_name: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface Route {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Stop {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface RouteStop {
  id: string;
  route_id: string;
  stop_id: string;
  stop_order: number;
  created_at: string;
  stops?: Stop;
}

export interface Bus {
  id: string;
  bus_number: string;
  capacity: number;
  route_id: string | null;
  status: 'active' | 'inactive' | 'maintenance';
  created_by: string | null;
  created_at: string;
  updated_at: string;
  routes?: Route;
}

export interface Ticket {
  id: string;
  user_id: string;
  route_id: string;
  boarding_stop_id: string;
  destination_stop_id: string;
  booking_date: string;
  status: 'booked' | 'used' | 'cancelled';
  created_at: string;
  routes?: Route;
  boarding_stops?: Stop;
  destination_stops?: Stop;
}

export interface ConductorReport {
  id: string;
  conductor_id: string;
  bus_id: string;
  passenger_count: number;
  cash_collected: number;
  report_date: string;
  created_at: string;
}
