import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { BusesClient } from "./client";

export default async function OperatorBuses() {
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

  const { data: buses, error } = await supabase
    .from("buses")
    .select("*")
    .eq("operator_id", profile.operator_id)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <Card>
        <CardContent>
          <p className="text-red-600">Failed to load buses: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return <BusesClient buses={buses ?? []} operatorId={profile.operator_id} />;
}
