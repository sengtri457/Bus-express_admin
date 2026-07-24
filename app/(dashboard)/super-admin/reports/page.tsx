import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  createReportPeriod,
  getSearchParam,
} from "@/lib/services/report-period";
import { fetchSystemReport } from "@/lib/services/system-report";
import { ReportsClient } from "./client";

interface ReportsPageProps {
  searchParams: Promise<{
    from?: string | string[];
    to?: string | string[];
  }>;
}

export default async function SuperAdminReports({
  searchParams,
}: ReportsPageProps) {
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

  const query = await searchParams;
  const period = createReportPeriod(
    getSearchParam(query.from),
    getSearchParam(query.to)
  );
  const reportData = await fetchSystemReport(supabase, period);

  return <ReportsClient reportData={reportData} />;
}
