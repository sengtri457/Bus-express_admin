import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { fetchAllOperatorsSummary } from "@/lib/services/operator-report";
import { OperatorsComparisonClient } from "./client";

export default async function OperatorsComparisonPage() {
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

  if (profile?.role !== "super_admin") {
    redirect("/login");
  }

  const summaries = await fetchAllOperatorsSummary(supabase);

  return (
    <OperatorsComparisonClient summaries={summaries} />
  );
}
