import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { OperatorsClient } from "./client";

export const revalidate = 30;

export default async function SuperAdminOperators() {
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

  const { data: operators, error } = await supabase
    .from("operators")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <Card>
        <CardContent>
          <p className="text-red-600">Failed to load operators: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return <OperatorsClient operators={operators ?? []} />;
}
