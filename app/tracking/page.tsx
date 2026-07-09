import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DriverTrackingClient } from "./client";

export default async function DriverTrackingPage() {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("id, name, role, operator_id")
    .eq("id", authUser.id)
    .single();

  if (!profile || profile.role !== "driver") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <p className="text-center text-gray-500">
          Access denied. Only drivers can access this page.
        </p>
      </div>
    );
  }

  // Find the driver's active trip
  const { data: activeTrip } = await supabase
    .from("trips")
    .select(`
      id, trip_date, status,
      schedules!inner(
        id, departure_time, arrival_time,
        routes!inner(name, origin, destination)
      )
    `)
    .eq("status", "in_progress")
    .eq("schedules.driver_id", profile.id)
    .maybeSingle();

  // Find any pending penalties for the driver to appeal
  const { data: penalties } = await supabase
    .from("driver_penalties")
    .select(`
      id,
      delay_minutes,
      recommended_fine,
      status,
      driver_explanation,
      trips!inner (
        trip_date,
        schedules!inner (
          departure_time,
          routes!inner (
            name
          )
        )
      )
    `)
    .eq("driver_id", profile.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const trip = activeTrip
    ? (() => {
        const s = Array.isArray(activeTrip.schedules) ? activeTrip.schedules[0] : activeTrip.schedules;
        const r = s?.routes ? (Array.isArray(s.routes) ? s.routes[0] : s.routes) : null;
        return {
          id: activeTrip.id,
          routeName: r?.name ?? "",
          origin: r?.origin ?? "",
          destination: r?.destination ?? "",
          departureTime: s?.departure_time ?? "",
          arrivalTime: s?.arrival_time ?? "",
        };
      })()
    : null;

  const formattedPenalties = (penalties ?? []).map((p: any) => {
    const tripData = Array.isArray(p.trips) ? p.trips[0] : p.trips;
    const sched = tripData?.schedules ? (Array.isArray(tripData.schedules) ? tripData.schedules[0] : tripData.schedules) : null;
    const route = sched?.routes ? (Array.isArray(sched.routes) ? sched.routes[0] : sched.routes) : null;

    return {
      id: p.id,
      delay_minutes: p.delay_minutes,
      recommended_fine: p.recommended_fine,
      status: p.status,
      driver_explanation: p.driver_explanation,
      routeName: route?.name ?? "Unknown Route",
      departureTime: sched?.departure_time ?? "",
      tripDate: tripData?.trip_date ?? ""
    };
  });

  return (
    <DriverTrackingClient
      driverId={profile.id}
      driverName={profile.name ?? "Driver"}
      activeTrip={trip}
      pendingPenalties={formattedPenalties}
    />
  );
}
