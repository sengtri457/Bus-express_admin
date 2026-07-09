import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getDriverPenalties, getDriverPayoutAnalytics } from "@/app/actions/penalties";
import { PenaltiesClient } from "./client";

export const revalidate = 0; // Disable cache so the review updates immediately

export default async function OperatorPenaltiesPage() {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("role, operator_id")
    .eq("id", authUser.id)
    .single();

  if (profile?.role !== "operator_admin" || !profile?.operator_id) {
    redirect("/login");
  }

  const operatorId = profile.operator_id;

  // Fetch penalties, analytics, today's scheduled trips, and active schedules concurrently
  const today = new Date().toISOString().split("T")[0];
  
  const [penalties, analytics, todayTripsRes, schedulesRes] = await Promise.all([
    getDriverPenalties(operatorId),
    getDriverPayoutAnalytics(operatorId),
    supabase
      .from("trips")
      .select(`
        id,
        trip_date,
        status,
        schedules!inner (
          id,
          departure_time,
          driver_id,
          routes!inner (
            name,
            operator_id
          )
        )
      `)
      .eq("trip_date", today)
      .eq("status", "scheduled")
      .eq("schedules.routes.operator_id", operatorId),
    supabase
      .from("schedules")
      .select(`
        id,
        departure_time,
        driver_id,
        routes!inner (
          name,
          operator_id
        )
      `)
      .eq("routes.operator_id", operatorId)
  ]);

  if (todayTripsRes.error) {
    console.error("Error fetching today scheduled trips:", todayTripsRes.error.message, "| Details:", todayTripsRes.error.details);
  }

  if (schedulesRes.error) {
    console.error("Error fetching schedules:", schedulesRes.error.message, "| Details:", schedulesRes.error.details);
  }

  // Map today's scheduled trips to attach driver names from analytics list in memory
  const todayScheduledTrips = (todayTripsRes.data ?? []).map((t: any) => {
    const sched = Array.isArray(t.schedules) ? t.schedules[0] : t.schedules;
    const driverId = sched?.driver_id;
    const driverName = analytics.find((a: any) => a.driver_id === driverId)?.driver_name ?? "Unassigned Driver";
    return {
      ...t,
      driverName
    };
  });

  // Map active schedules to attach driver names and clean structure
  const formattedSchedules = (schedulesRes.data ?? []).map((s: any) => {
    const driverName = analytics.find((a: any) => a.driver_id === s.driver_id)?.driver_name ?? "Unassigned Driver";
    const rName = s.routes ? (Array.isArray(s.routes) ? s.routes[0]?.name : s.routes?.name) : "Unknown Route";

    return {
      id: s.id,
      departureTime: s.departure_time,
      routeName: rName,
      driverName
    };
  });

  // Clean data structure to make it type-safe for client component
  const formattedPenalties = penalties.map((p: any) => {
    const trip = Array.isArray(p.trips) ? p.trips[0] : p.trips;
    const schedule = trip?.schedules ? (Array.isArray(trip.schedules) ? trip.schedules[0] : trip.schedules) : null;
    const route = schedule?.routes ? (Array.isArray(schedule.routes) ? schedule.routes[0] : schedule.routes) : null;
    const driver = Array.isArray(p.users) ? p.users[0] : p.users;

    return {
      id: p.id,
      driver_id: p.driver_id,
      trip_id: p.trip_id,
      delay_minutes: p.delay_minutes,
      recommended_fine: p.recommended_fine,
      approved_fine: p.approved_fine,
      status: p.status,
      driver_explanation: p.driver_explanation,
      operator_notes: p.operator_notes,
      created_at: p.created_at,
      reviewed_at: p.reviewed_at,
      reviewed_by: p.reviewed_by,
      driverName: driver?.name ?? "Unknown Driver",
      driverEmail: driver?.email ?? "",
      tripDate: trip?.trip_date ?? "",
      departureTime: schedule?.departure_time ?? "",
      routeName: route?.name ?? "Unknown Route",
      driverPayoutRate: schedule?.driver_payout_rate ?? 15.00
    };
  });

  return (
    <PenaltiesClient 
      initialPenalties={formattedPenalties} 
      analytics={analytics} 
      todayScheduledTrips={todayScheduledTrips}
      schedules={formattedSchedules}
    />
  );
}
