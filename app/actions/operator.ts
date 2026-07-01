"use server";

import { createClient as createDirectClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/actions";
import { revalidatePath } from "next/cache";

export async function createRoute(formData: FormData) {
  const supabase = await createClient();
  const operatorId = formData.get("operator_id") as string;
  const name = formData.get("name") as string;
  const origin = formData.get("origin") as string;
  const destination = formData.get("destination") as string;

  const { data: route, error } = await supabase
    .from("routes")
    .insert({
      operator_id: operatorId,
      name,
      origin,
      destination,
      distance_km: Number(formData.get("distance_km")),
      duration_min: Number(formData.get("duration_min")),
      status: "active",
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  const { data: passengers } = await supabase
    .from("users")
    .select("id")
    .eq("role", "passenger");

  if (passengers && passengers.length > 0) {
    await supabase.from("notifications").insert(
      passengers.map((p) => ({
        user_id: p.id,
        title: `New Route: ${name}`,
        body: `Route from ${origin} to ${destination} is now available.`,
        type: "new_route",
        reference_type: "route",
        reference_id: route.id,
      }))
    );
  }

  revalidatePath("/operator/routes");
}

export async function updateRouteStatus(id: string, status: string) {
  const supabase = await createClient();
  const newStatus = status === "active" ? "inactive" : "active";

  const { error } = await supabase
    .from("routes")
    .update({ status: newStatus })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/operator/routes");
}

export async function deleteRoute(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("routes").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/operator/routes");
}

export async function updateRoute(formData: FormData) {
  const supabase = await createClient();
  const id = formData.get("id") as string;

  const { error } = await supabase
    .from("routes")
    .update({
      name: formData.get("name") as string,
      origin: formData.get("origin") as string,
      destination: formData.get("destination") as string,
      distance_km: Number(formData.get("distance_km")) || null,
      duration_min: Number(formData.get("duration_min")) || null,
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/operator/routes");
}

export async function createBus(formData: FormData) {
  const supabase = await createClient();
  const operatorId = formData.get("operator_id") as string;

  const { error } = await supabase.from("buses").insert({
    operator_id: operatorId,
    plate_number: formData.get("plate_number") as string,
    model: formData.get("model") as string,
    capacity: Number(formData.get("capacity")),
    status: "active",
  });

  if (error) return { error: error.message };
  revalidatePath("/operator/buses");
}

export async function updateBusStatus(id: string, status: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("buses")
    .update({ status })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/operator/buses");
}

export async function createSchedule(formData: FormData) {
  const supabase = await createClient();
  const routeId = formData.get("route_id") as string;
  const departureTime = formData.get("departure_time") as string;

  const { data: schedule, error } = await supabase
    .from("schedules")
    .insert({
      route_id: routeId,
      bus_id: formData.get("bus_id") as string,
      driver_id: formData.get("driver_id") as string,
      conductor_id: formData.get("conductor_id") || null,
      departure_time: departureTime,
      arrival_time: formData.get("arrival_time") as string,
      days_of_week: formData.get("days_of_week") as string,
      price: Number(formData.get("price")),
      status: "active",
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  const { data: route } = await supabase
    .from("routes")
    .select("name, origin, destination")
    .eq("id", routeId)
    .single();

  if (route) {
    const { data: passengers } = await supabase
      .from("users")
      .select("id")
      .eq("role", "passenger");

    if (passengers && passengers.length > 0) {
      await supabase.from("notifications").insert(
        passengers.map((p) => ({
          user_id: p.id,
          title: `New Schedule: ${route.name}`,
          body: `${route.origin} → ${route.destination} departs at ${departureTime}.`,
          type: "new_schedule",
          reference_type: "schedule",
          reference_id: schedule.id,
        }))
      );
    }
  }

  revalidatePath("/operator/schedules");
}

export async function updateSchedule(formData: FormData) {
  const supabase = await createClient();
  const id = formData.get("id") as string;

  const { error } = await supabase
    .from("schedules")
    .update({
      route_id: formData.get("route_id") as string,
      bus_id: formData.get("bus_id") as string,
      driver_id: formData.get("driver_id") as string,
      conductor_id: formData.get("conductor_id") || null,
      departure_time: formData.get("departure_time") as string,
      arrival_time: formData.get("arrival_time") as string,
      days_of_week: formData.get("days_of_week") as string,
      price: Number(formData.get("price")),
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/operator/schedules");
}

export async function toggleScheduleStatus(id: string, status: string) {
  const supabase = await createClient();
  const newStatus = status === "active" ? "cancelled" : "active";

  const { error } = await supabase
    .from("schedules")
    .update({ status: newStatus })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/operator/schedules");
}

export async function deleteSchedule(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("schedules").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/operator/schedules");
}

export async function createStaff(formData: FormData) {
  const operatorId = formData.get("operator_id") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as string;
  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;

  // Sessionless client: no cookies, no session persistence
  const client = createDirectClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: authData, error: signUpError } = await client.auth.signUp({
    email,
    password,
    options: { data: { name, phone } },
  });

  if (signUpError) return { error: signUpError.message };
  if (!authData.user) return { error: "Failed to create user" };

  // client is now authenticated as the new user — satisfies RLS users_update_own
  const { error: updateError } = await client
    .from("users")
    .update({ role, operator_id: operatorId, status: "active" })
    .eq("id", authData.user.id);

  if (updateError) return { error: updateError.message };
  revalidatePath("/operator/staff");
}

export async function toggleStaffStatus(id: string, status: string) {
  const supabase = await createClient();
  const newStatus = status === "active" ? "suspended" : "active";

  const { error } = await supabase
    .from("users")
    .update({ status: newStatus })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/operator/staff");
}
