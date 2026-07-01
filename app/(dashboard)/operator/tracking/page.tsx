import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TrackingClient } from "./client";

interface DriverWithLocation {
  id: string;
  name: string | null;
  tripId: string;
  trip: {
    routeName: string;
    origin: string;
    destination: string;
    busPlate: string;
    departureTime: string;
    arrivalTime: string;
    tripDate: string;
    status: string;
  } | null;
  location: {
    latitude: number;
    longitude: number;
    heading: number | null;
    speed: number | null;
    updated_at: string;
  } | null;
}

export default async function OperatorTrackingPage() {
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

  // Fetch all drivers belonging to this operator
  const { data: operatorDrivers } = await supabase
    .from("users")
    .select("id, name")
    .eq("operator_id", operatorId)
    .eq("role", "driver");

  const driverList = operatorDrivers ?? [];
  const allDriverIds = driverList.map((d) => d.id);

  // ─── KEY FIX ───────────────────────────────────────────────────────────────
  // The Flutter driver app writes GPS to trips.latitude / trips.longitude
  // (NOT to driver_locations). We read active trips with their GPS from trips
  // directly — matching exactly what the passenger live_tracking_screen.dart does.
  // ───────────────────────────────────────────────────────────────────────────

  let tripMap: Record<string, {
    tripId: string;
    routeName: string;
    origin: string;
    destination: string;
    busPlate: string;
    departureTime: string;
    arrivalTime: string;
    tripDate: string;
    status: string;
    latitude: number | null;
    longitude: number | null;
    departed_at: string | null;
  }> = {};

  if (allDriverIds.length > 0) {
    const { data: activeTrips } = await supabase
      .from("trips")
      .select(`
        id, trip_date, status, latitude, longitude, departed_at,
        schedules!inner(
          id, departure_time, arrival_time,
          driver_id,
          routes!inner(name, origin, destination),
          buses!inner(plate_number)
        )
      `)
      .in("status", ["in_progress", "scheduled"])
      .in("schedules.driver_id", allDriverIds);

    for (const t of activeTrips ?? []) {
      const s = Array.isArray(t.schedules) ? t.schedules[0] : t.schedules;
      if (!s?.driver_id) continue;
      const r = s?.routes ? (Array.isArray(s.routes) ? s.routes[0] : s.routes) : null;
      const b = s?.buses ? (Array.isArray(s.buses) ? s.buses[0] : s.buses) : null;
      tripMap[s.driver_id] = {
        tripId: t.id,
        routeName: r?.name ?? "",
        origin: r?.origin ?? "",
        destination: r?.destination ?? "",
        busPlate: b?.plate_number ?? "",
        departureTime: s?.departure_time ?? "",
        arrivalTime: s?.arrival_time ?? "",
        tripDate: t.trip_date ?? "",
        status: t.status ?? "scheduled",
        latitude: t.latitude ?? null,
        longitude: t.longitude ?? null,
        departed_at: t.departed_at ?? null,
      };
    }
  }

  // Build final driver list — GPS location is sourced from trips table
  const driversWithLocation: DriverWithLocation[] = driverList.map((d) => {
    const trip = tripMap[d.id] ?? null;
    const hasGps = trip?.latitude != null && trip?.longitude != null;

    return {
      id: d.id,
      name: d.name,
      tripId: trip?.tripId ?? "",
      trip: trip
        ? {
            routeName: trip.routeName,
            origin: trip.origin,
            destination: trip.destination,
            busPlate: trip.busPlate,
            departureTime: trip.departureTime,
            arrivalTime: trip.arrivalTime,
            tripDate: trip.tripDate,
            status: trip.status,
          }
        : null,
      // Location from trips.latitude/longitude (written by driver GPS)
      location:
        trip && hasGps
          ? {
              latitude: trip.latitude as number,
              longitude: trip.longitude as number,
              heading: null,
              speed: null,
              updated_at: trip.departed_at ?? new Date().toISOString(),
            }
          : null,
    };
  });

  return <TrackingClient drivers={driversWithLocation} />;
}
