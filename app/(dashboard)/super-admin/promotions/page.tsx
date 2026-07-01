import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { PromotionsClient } from "./client";

export default async function SuperAdminPromotions() {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", authUser.id)
    .single();
  if (profile?.role !== "super_admin") redirect("/login");

  const { data: promotions, error } = await supabase
    .from("promotions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <Card>
        <CardContent>
          <p className="text-red-600">Failed to load promotions: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return <PromotionsClient promotions={promotions ?? []} />;
}
