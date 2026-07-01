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

  return (
    <DriverTrackingClient
      driverId={profile.id}
      driverName={profile.name ?? "Driver"}
      activeTrip={trip}
    />
  );
}
