import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { OperatorDashboardClient } from "./client";

export const revalidate = 30;

export default async function OperatorDashboard() {
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

  const [
    operatorRes,
    busesRes,
    routesRes,
    schedulesRes,
    staffRes,
    tripsRes,
    todayTripsRes,
    incidentsRes,
  ] = await Promise.all([
    supabase.from("operators").select("name, logo_url").eq("id", operatorId).single(),
    supabase.from("buses").select("id, status, model, plate_number").eq("operator_id", operatorId),
    supabase.from("routes").select("id, status, name").eq("operator_id", operatorId),
    supabase.from("schedules").select("id, status, routes!inner(operator_id)").eq("routes.operator_id", operatorId),
    supabase.from("users").select("id, name, role, status").eq("operator_id", operatorId).in("role", ["driver", "conductor"]),
    supabase.from("trips").select("id, status").in("status", ["scheduled", "in_progress"]),
    supabase
      .from("trips")
      .select("id, status")
      .eq("trip_date", new Date().toISOString().split("T")[0])
      .in("status", ["scheduled", "in_progress", "completed"]),
    supabase
      .from("incidents")
      .select("id, type, description, created_at, trips!inner(schedules!inner(routes!inner(operator_id)))")
      .eq("trips.schedules.routes.operator_id", operatorId)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  // Flatten the routes -> schedules -> trips -> bookings chain into a single join query
  const { data: bookingData } = await supabase
    .from("bookings")
    .select("id, status, trips!inner(schedule_id, schedules!inner(route_id, routes!inner(operator_id)))")
    .eq("trips.schedules.routes.operator_id", operatorId);
  const bookings = bookingData ?? [];

  if (operatorRes.error) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-red-600 font-semibold">Failed to load operator details: {operatorRes.error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <OperatorDashboardClient
      operator={operatorRes.data}
      buses={busesRes.data ?? []}
      routes={routesRes.data ?? []}
      schedules={schedulesRes.data ?? []}
      staff={staffRes.data ?? []}
      todayTrips={todayTripsRes.data ?? []}
      bookings={bookings}
      recentIncidents={incidentsRes.data ?? []}
      operatorId={operatorId}
    />
  );
}
