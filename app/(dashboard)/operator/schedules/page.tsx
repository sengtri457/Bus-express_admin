import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { SchedulesClient } from "./client";

export default async function OperatorSchedules() {
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

  const [routesRes, busesRes, driversRes, conductorsRes, schedulesRes] = await Promise.all([
    supabase
      .from("routes")
      .select("id, origin, destination")
      .eq("operator_id", operatorId)
      .eq("status", "active"),
    supabase
      .from("buses")
      .select("id, plate_number, model")
      .eq("operator_id", operatorId)
      .eq("status", "active"),
    supabase
      .from("users")
      .select("id, name")
      .eq("operator_id", operatorId)
      .eq("role", "driver"),
    supabase
      .from("users")
      .select("id, name")
      .eq("operator_id", operatorId)
      .eq("role", "conductor"),
    supabase
      .from("schedules")
      .select("*, routes(id, origin, destination, name), buses(id, model, plate_number, capacity), users!schedules_driver_id_fkey(id, name), conductor:users!schedules_conductor_id_fkey(id, name)")
      .eq("routes.operator_id", operatorId)
      .order("created_at", { ascending: false }),
  ]);

  if (schedulesRes.error) {
    return (
      <Card>
        <CardContent>
          <p className="text-red-600">
            Failed to load schedules: {schedulesRes.error.message}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <SchedulesClient
      schedules={schedulesRes.data ?? []}
      operatorId={operatorId}
      routes={routesRes.data ?? []}
      buses={busesRes.data ?? []}
      drivers={driversRes.data ?? []}
      conductors={conductorsRes.data ?? []}
    />
  );
}
