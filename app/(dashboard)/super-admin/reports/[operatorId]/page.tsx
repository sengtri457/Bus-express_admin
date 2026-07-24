import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { fetchOperatorReport } from "@/lib/services/operator-report";
import {
  createReportPeriod,
  getSearchParam,
} from "@/lib/services/report-period";
import { PerOperatorReportClient } from "./client";

interface PageProps {
  params: Promise<{ operatorId: string }>;
  searchParams: Promise<{
    from?: string | string[];
    to?: string | string[];
  }>;
}

export default async function PerOperatorReportPage({
  params,
  searchParams,
}: PageProps) {
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

  const query = await searchParams;
  const period = createReportPeriod(
    getSearchParam(query.from),
    getSearchParam(query.to)
  );
  const reportData = await fetchOperatorReport(supabase, operatorId, period);

  return (
    <PerOperatorReportClient reportData={reportData} />
  );
}
