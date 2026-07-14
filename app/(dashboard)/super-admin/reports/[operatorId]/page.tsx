import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { fetchOperatorReport } from "@/lib/services/operator-report";
import { PerOperatorReportClient } from "./client";

interface PageProps {
  params: Promise<{ operatorId: string }>;
}

export default async function PerOperatorReportPage({ params }: PageProps) {
  const { operatorId } = await params;
  
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

  // Verify operator exists
  const { data: operator, error } = await supabase
    .from("operators")
    .select("id")
    .eq("id", operatorId)
    .single();

  if (error || !operator) {
    notFound();
  }

  const reportData = await fetchOperatorReport(supabase, operatorId);

  return (
    <PerOperatorReportClient reportData={reportData} />
  );
}
