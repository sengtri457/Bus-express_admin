import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TrackingClient } from "./client";

interface DriverWithLocation {
  id: string;
  name: string | null;
  tripId: string;
  isWebTracking: boolean;
  trip: {
    routeName: string;
    origin: string;
    destination: string;
    busPlate: string;
    departureTime: string;
    arrivalTime: string;
    tripDate: string;
    status: string;
    stops: {
      name: string;
      latitude: number | null;
      longitude: number | null;
      order: number;
    }[];
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

  const tripMap: Record<string, {
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
    stops: {
      name: string;
      latitude: number | null;
      longitude: number | null;
      order: number;
    }[];
  }> = {};

  if (allDriverIds.length > 0) {
    const today = new Intl.DateTimeFormat("fr-CA", {
      timeZone: "Asia/Phnom_Penh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

    const { data: activeTrips } = await supabase
      .from("trips")
      .select(`
        id, trip_date, status, latitude, longitude, departed_at,
        schedules!inner(
          id, departure_time, arrival_time,
          driver_id,
          routes!inner(
            id, name, origin, destination,
            route_stops(
              stop_order,
              stops(name, latitude, longitude)
            )
          ),
          buses!inner(plate_number)
        )
      `)
      .eq("trip_date", today)
      .in("status", ["in_progress", "scheduled"])
      .in("schedules.driver_id", allDriverIds);

    for (const t of activeTrips ?? []) {
      const s = Array.isArray(t.schedules) ? t.schedules[0] : t.schedules;
      if (!s?.driver_id) continue;
      
      const existing = tripMap[s.driver_id];
      // Prioritize in_progress trips over scheduled trips
      if (existing && existing.status === "in_progress" && t.status !== "in_progress") {
        continue;
      }
      
      const r = s?.routes ? (Array.isArray(s.routes) ? s.routes[0] : s.routes) : null;
      const b = s?.buses ? (Array.isArray(s.buses) ? s.buses[0] : s.buses) : null;
      
      const rsList = r?.route_stops ?? [];
      const mappedRouteStops = (Array.isArray(rsList) ? rsList : [rsList])
        .map((rs: any) => {
          const stopObj = rs.stops ? (Array.isArray(rs.stops) ? rs.stops[0] : rs.stops) : null;
          return {
            name: stopObj?.name ?? "",
            latitude: (stopObj?.latitude != null) ? Number(stopObj.latitude) : null,
            longitude: (stopObj?.longitude != null) ? Number(stopObj.longitude) : null,
            order: rs.stop_order ?? 0,
          };
        })
        .sort((a, b) => a.order - b.order);

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
        stops: mappedRouteStops,
      };
    }
  }

  // Also fetch GPS from driver_locations (written by web-based driver tracking)
  const driverLocMap: Record<string, {
    latitude: number;
    longitude: number;
    heading: number | null;
    speed: number | null;
    updated_at: string;
  }> = {};
  if (allDriverIds.length > 0) {
    const { data: locations } = await supabase
      .from("driver_locations")
      .select("driver_id, latitude, longitude, heading, speed, updated_at")
      .in("driver_id", allDriverIds);

    for (const loc of locations ?? []) {
      if (loc.latitude != null && loc.longitude != null) {
        driverLocMap[loc.driver_id] = {
          latitude: loc.latitude,
          longitude: loc.longitude,
          heading: loc.heading,
          speed: loc.speed,
          updated_at: loc.updated_at,
        };
      }
    }
  }

  // Build final driver list — prefer driver_locations GPS (web tracking) over trips.latitude/longitude (Flutter tracking)
  const driversWithLocation: DriverWithLocation[] = driverList.map((d) => {
    const trip = tripMap[d.id] ?? null;
    const dl = driverLocMap[d.id] ?? null;

    const isWebTracking = dl !== null;
    const location = dl ?? (trip?.latitude != null && trip?.longitude != null
      ? {
          latitude: trip.latitude as number,
          longitude: trip.longitude as number,
          heading: null,
          speed: null,
          updated_at: trip.departed_at ?? new Date().toISOString(),
        }
      : null);

    return {
      id: d.id,
      name: d.name,
      tripId: trip?.tripId ?? "",
      isWebTracking,
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
            stops: trip.stops,
          }
        : null,
      location,
    };
  });

  return <TrackingClient drivers={driversWithLocation} />;
}
