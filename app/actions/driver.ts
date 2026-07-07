"use server";

import { createClient } from "@/lib/supabase/actions";

export async function startTrip(driverId: string): Promise<{
  trip: { id: string; routeName: string; origin: string; destination: string; departureTime: string; arrivalTime: string } | null;
  error?: string;
}> {
  const supabase = await createClient();

  // Find today's scheduled trip for this driver
  const today = new Date().toISOString().slice(0, 10);
  const { data: trip, error: fetchError } = await supabase
    .from("trips")
    .select(`
      id, trip_date,
      schedules!inner(
        id, departure_time, arrival_time, driver_id,
        routes!inner(name, origin, destination)
      )
    `)
    .eq("status", "scheduled")
    .eq("trip_date", today)
    .eq("schedules.driver_id", driverId)
    .maybeSingle();

  if (fetchError) return { trip: null, error: fetchError.message };
  if (!trip) return { trip: null, error: "No scheduled trip found for today" };

  const s = Array.isArray(trip.schedules) ? trip.schedules[0] : trip.schedules;
  const r = s?.routes ? (Array.isArray(s.routes) ? s.routes[0] : s.routes) : null;

  // Update trip status to in_progress
  const { error: updateError } = await supabase
    .from("trips")
    .update({ status: "in_progress", departed_at: new Date().toISOString() })
    .eq("id", trip.id);

  if (updateError) return { trip: null, error: updateError.message };

  return {
    trip: {
      id: trip.id,
      routeName: r?.name ?? "",
      origin: r?.origin ?? "",
      destination: r?.destination ?? "",
      departureTime: s?.departure_time ?? "",
      arrivalTime: s?.arrival_time ?? "",
    },
  };
}
