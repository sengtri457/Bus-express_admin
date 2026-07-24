import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { fetchAllOperatorsSummary } from "@/lib/services/operator-report";
import {
  createReportPeriod,
  getSearchParam,
} from "@/lib/services/report-period";
import { OperatorsComparisonClient } from "./client";

interface OperatorsComparisonPageProps {
  searchParams: Promise<{
    from?: string | string[];
    to?: string | string[];
  }>;
}

export default async function OperatorsComparisonPage({
  searchParams,
}: OperatorsComparisonPageProps) {
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

  const query = await searchParams;
  const period = createReportPeriod(
    getSearchParam(query.from),
    getSearchParam(query.to)
  );
  const summaries = await fetchAllOperatorsSummary(supabase, period);

  return (
    <OperatorsComparisonClient summaries={summaries} period={period} />
  );
}
