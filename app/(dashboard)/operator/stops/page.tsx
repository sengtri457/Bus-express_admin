import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { StopsClient } from "./client";

export default async function OperatorStops() {
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

  const { data: stops, error } = await supabase
    .from("stops")
    .select("*")
    .order("name");

  if (error) {
    return (
      <Card>
        <CardContent>
          <p className="text-red-600">Failed to load stops: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  const mappedStops = (stops ?? []).map((s: any) => ({
    id: s.id,
    name: s.name,
    lat: s.latitude ?? null,
    lng: s.longitude ?? null,
    created_at: s.created_at ?? null,
  }));

  return <StopsClient stops={mappedStops} />;
}
