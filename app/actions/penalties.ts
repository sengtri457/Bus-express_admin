"use server";

import { createClient } from "@/lib/supabase/actions";
import { revalidatePath } from "next/cache";

export async function createPendingPenalty(tripId: string, delayMinutes: number): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();

  // Get driver and schedule info
  const { data: trip, error: tripError } = await supabase
    .from("trips")
    .select(`
      id,
      schedules (
        driver_id,
        driver_payout_rate
      )
    `)
    .eq("id", tripId)
    .single();

  if (tripError || !trip) {
    return { error: tripError?.message ?? "Trip not found" };
  }

  const schedule = Array.isArray(trip.schedules) ? trip.schedules[0] : trip.schedules;
  const driverId = schedule?.driver_id;
  const payoutRate = schedule?.driver_payout_rate ?? 15.00; // Default fallback payout rate

  if (!driverId) {
    return { error: "Driver not found for this schedule" };
  }

  // Calculate recommended fine (e.g. 20% of payout rate for 5-15 mins late, 50% for >=15 mins late)
  let recommendedFine = 0.00;
  if (delayMinutes >= 5 && delayMinutes < 15) {
    recommendedFine = Number((payoutRate * 0.20).toFixed(2));
  } else if (delayMinutes >= 15) {
    recommendedFine = Number((payoutRate * 0.50).toFixed(2));
  }

  if (recommendedFine <= 0) {
    return { error: "Delay does not meet penalty threshold" };
  }

  // Insert penalty incident as "pending"
  const { error: insertError } = await supabase
    .from("driver_penalties")
    .insert({
      driver_id: driverId,
      trip_id: tripId,
      delay_minutes: delayMinutes,
      recommended_fine: recommendedFine,
      status: "pending"
    });

  if (insertError) {
    return { error: insertError.message };
  }

  // Log as incident in main system
  await supabase.from("incidents").insert({
    trip_id: tripId,
    type: "delayed_departure",
    description: `Late trip start of ${delayMinutes} mins detected. Recommended fine: $${recommendedFine.toFixed(2)}.`
  });

  revalidatePath("/operator/penalties");
  return { success: true };
}

export async function createPendingPenaltyForSchedule(scheduleId: string, delayMinutes: number): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  // 1. Check if a trip already exists for today's date
  const { data: trip, error: fetchError } = await supabase
    .from("trips")
    .select("id")
    .eq("schedule_id", scheduleId)
    .eq("trip_date", today)
    .maybeSingle();

  if (fetchError) {
    return { error: fetchError.message };
  }

  let tripId = trip?.id;

  // 2. If no trip instance exists for today, create one dynamically
  if (!tripId) {
    const { data: newTrip, error: createError } = await supabase
      .from("trips")
      .insert({
        schedule_id: scheduleId,
        trip_date: today,
        status: "scheduled"
      })
      .select("id")
      .single();

    if (createError || !newTrip) {
      return { error: createError?.message ?? "Failed to auto-create trip instance for this schedule today" };
    }
    tripId = newTrip.id;
  }

  // 3. Trigger the penalty creation for this trip ID
  return createPendingPenalty(tripId, delayMinutes);
}

export async function submitDriverAppeal(penaltyId: string, explanation: string): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("driver_penalties")
    .update({
      driver_explanation: explanation,
      status: "appealed"
    })
    .eq("id", penaltyId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/operator/penalties");
  return { success: true };
}

export async function reviewPenalty(
  penaltyId: string,
  action: "approved" | "waived",
  fineAmount: number,
  operatorNotes: string
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();

  // Get current admin user
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return { error: "Unauthorized" };
  }

  const { error } = await supabase
    .from("driver_penalties")
    .update({
      status: action,
      approved_fine: action === "approved" ? fineAmount : 0.00,
      operator_notes: operatorNotes,
      reviewed_by: authUser.id,
      reviewed_at: new Date().toISOString()
    })
    .eq("id", penaltyId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/operator/penalties");
  return { success: true };
}

export async function getDriverPenalties(operatorId: string) {
  const supabase = await createClient();

  // Fetch penalties for drivers belonging to this operator
  const { data: penalties, error } = await supabase
    .from("driver_penalties")
    .select(`
      *,
      trips!inner (
        id,
        trip_date,
        schedules!inner (
          id,
          departure_time,
          driver_payout_rate,
          routes!inner (
            name,
            operator_id
          )
        )
      ),
      users!driver_penalties_driver_id_fkey (
        id,
        name,
        email
      )
    `)
    .eq("trips.schedules.routes.operator_id", operatorId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching penalties:", error.message, "| Details:", error.details, "| Hint:", error.hint);
    return [];
  }

  return penalties ?? [];
}

export async function getDriverPayoutAnalytics(operatorId: string) {
  const supabase = await createClient();

  // 1. Fetch drivers for this operator
  const { data: drivers, error: driversError } = await supabase
    .from("users")
    .select("id, name, email")
    .eq("operator_id", operatorId)
    .eq("role", "driver");

  if (driversError || !drivers) {
    console.error("Error fetching drivers:", driversError);
    return [];
  }

  const driverIds = drivers.map(d => d.id);
  if (driverIds.length === 0) return [];

  // 2. Fetch completed trips for these drivers
  const { data: trips, error: tripsError } = await supabase
    .from("trips")
    .select(`
      id,
      status,
      schedules!inner (
        driver_id,
        driver_payout_rate
      )
    `)
    .eq("status", "completed")
    .in("schedules.driver_id", driverIds);

  // 3. Fetch reviewed penalties
  const { data: penalties, error: penaltiesError } = await supabase
    .from("driver_penalties")
    .select("driver_id, approved_fine, recommended_fine, status")
    .in("driver_id", driverIds);

  const tripsList = trips ?? [];
  const penaltiesList = penalties ?? [];

  // 4. Aggregate results
  return drivers.map(driver => {
    const driverTrips = tripsList.filter(t => {
      const s = Array.isArray(t.schedules) ? t.schedules[0] : t.schedules;
      return s?.driver_id === driver.id;
    });

    const driverPenalties = penaltiesList.filter(p => p.driver_id === driver.id);

    const grossEarnings = driverTrips.reduce((acc, t) => {
      const s = Array.isArray(t.schedules) ? t.schedules[0] : t.schedules;
      return acc + (s?.driver_payout_rate ?? 15.00);
    }, 0);

    const totalFines = driverPenalties
      .filter(p => p.status === "approved")
      .reduce((acc, p) => acc + (p.approved_fine ?? 0), 0);

    const netEarnings = grossEarnings - totalFines;

    const totalDelayIncidents = driverPenalties.length;
    const approvedFinesCount = driverPenalties.filter(p => p.status === "approved").length;
    const waivedFinesCount = driverPenalties.filter(p => p.status === "waived").length;

    // Calculate reliability score starting from 100%
    // Deduct 2% for each delay, 10% for critical delay
    const totalTripsCompleted = driverTrips.length;
    let reliabilityScore = 100;
    driverPenalties.forEach(p => {
      if (p.status === "approved" || p.status === "appealed") {
        const deduct = (p.approved_fine > 10 || p.recommended_fine > 10) ? 10 : 2;
        reliabilityScore = Math.max(0, reliabilityScore - deduct);
      }
    });

    return {
      driver_id: driver.id,
      driver_name: driver.name ?? "Unknown Driver",
      driver_email: driver.email ?? "",
      completed_trips_count: totalTripsCompleted,
      gross_earnings: grossEarnings,
      total_fines: totalFines,
      net_earnings: netEarnings,
      reliability_score: reliabilityScore,
      total_delay_incidents: totalDelayIncidents,
      enforced_penalties_count: approvedFinesCount,
      waived_penalties_count: waivedFinesCount
    };
  });
}
