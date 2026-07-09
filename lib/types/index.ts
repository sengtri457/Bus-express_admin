export type Role = "passenger" | "driver" | "conductor" | "operator_admin" | "super_admin";
export type UserStatus = "active" | "inactive" | "suspended";
export type BusStatus = "active" | "maintenance" | "retired";
export type RouteStatus = "active" | "inactive";
export type ScheduleStatus = "active" | "cancelled";
export type OperatorStatus = "active" | "inactive";

export interface User {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: Role;
  status: UserStatus;
  operator_id: string | null;
  age: number | null;
  nationality: string | null;
  created_at: string | null;
}

export interface Operator {
  id: string;
  name: string;
  contact: string | null;
  status: OperatorStatus;
  logo_url: string | null;
  created_at: string | null;
  bus_count?: number;
  route_count?: number;
  staff_count?: number;
}

export interface Bus {
  id: string;
  operator_id: string;
  plate_number: string;
  model: string;
  capacity: number;
  status: BusStatus;
  created_at: string | null;
}

export interface Route {
  id: string;
  operator_id: string;
  name: string;
  origin: string;
  destination: string;
  distance_km: number | null;
  duration_min: number | null;
  status: RouteStatus;
  created_at: string | null;
}

export interface Promotion {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_purchase: number | null;
  max_usage: number | null;
  max_per_user: number | null;
  used_count: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string | null;
}

export interface Schedule {
  id: string;
  route_id: string;
  bus_id: string;
  driver_id: string;
  conductor_id: string | null;
  departure_time: string;
  arrival_time: string;
  days_of_week: string;
  price: number;
  driver_payout_rate?: number;
  status: ScheduleStatus;
  created_at: string | null;
  routes?: Pick<Route, "id" | "origin" | "destination" | "name">;
  buses?: Pick<Bus, "id" | "model" | "plate_number" | "capacity">;
  users?: Pick<User, "id" | "name">;
}

export type PenaltyStatus = "pending" | "approved" | "waived" | "appealed";

export interface DriverPenalty {
  id: string;
  driver_id: string;
  trip_id: string;
  delay_minutes: number;
  recommended_fine: number;
  approved_fine: number;
  status: PenaltyStatus;
  driver_explanation: string | null;
  operator_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  trips?: {
    id: string;
    trip_date: string;
    schedules?: {
      id: string;
      departure_time: string;
      routes?: {
        name: string;
      };
    };
  };
  users?: {
    id: string;
    name: string;
  };
}

