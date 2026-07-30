import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://celqfbybspfyecgmnhaz.supabase.co";
const supabaseKey = "sb_publishable_rDKPLmqxYN940KDSNntMRA_i5Olz__O";
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
  console.log("=== INSPECTING ACTIVE TRIPS IN DB ===");
  
  // Fetch active trips directly without filtering by driver
  const { data: activeTrips, error: tripsErr } = await supabase
    .from("trips")
    .select("id, status, trip_date, driver_id, schedule_id")
    .in("status", ["in_progress", "scheduled"]);
    
  if (tripsErr) {
    console.error("Trips fetch error:", tripsErr);
  } else {
    console.log(`Found ${activeTrips?.length} active/scheduled trips in DB.`);
    console.log("Active/Scheduled Trips:", activeTrips);
  }

  // Let's also fetch all columns of a schedule to see if it has driver_id
  const { data: sampleSchedules, error: sErr } = await supabase
    .from("schedules")
    .select("*")
    .limit(1);
    
  if (sErr) {
    console.error("Schedules fetch error:", sErr);
  } else {
    console.log("Sample Schedule Row Keys:", Object.keys(sampleSchedules?.[0] || {}));
    console.log("Sample Schedule Row:", sampleSchedules?.[0]);
  }
}

inspect();
