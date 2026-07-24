import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { fetchOperatorReport } from "@/lib/services/operator-report";
import {
  createReportPeriod,
  getSearchParam,
} from "@/lib/services/report-period";
import { OperatorReportsClient } from "./client";

interface OperatorReportsPageProps {
  searchParams: Promise<{
    from?: string | string[];
    to?: string | string[];
  }>;
}

export default async function OperatorReports({
  searchParams,
}: OperatorReportsPageProps) {
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

  const query = await searchParams;
  const period = createReportPeriod(
    getSearchParam(query.from),
    getSearchParam(query.to)
  );
  const reportData = await fetchOperatorReport(
    supabase,
    profile.operator_id,
    period
  );

  return (
    <OperatorReportsClient
      operatorName={reportData.operatorName}
      logoUrl={reportData.logoUrl}
      totalBuses={reportData.totalBuses}
      activeBuses={reportData.activeBuses}
      totalRoutes={reportData.totalRoutes}
      activeRoutes={reportData.activeRoutes}
      activeSchedules={reportData.activeSchedules}
      totalStaff={reportData.totalStaff}
      activeStaff={reportData.activeStaff}
      tripScheduled={reportData.tripScheduled}
      tripInProgress={reportData.tripInProgress}
      tripCompleted={reportData.tripCompleted}
      todayBookings={reportData.todayBookings}
      drivers={reportData.drivers}
      conductors={reportData.conductors}
      busChartData={reportData.busChartData}
      tripChartData={reportData.tripChartData}
      staffChartData={reportData.staffChartData}
      tripTrend={reportData.tripTrend}
      bookingTrend={reportData.bookingTrend}
      period={reportData.period}
      periodTrips={reportData.periodTrips}
      completedTrips={reportData.completedTrips}
      cancelledTrips={reportData.cancelledTrips}
      totalBookings={reportData.totalBookings}
      paidBookings={reportData.paidBookings}
      confirmedBookings={reportData.confirmedBookings}
      cancelledBookings={reportData.cancelledBookings}
      bookingSuccessRate={reportData.bookingSuccessRate}
      cancellationRate={reportData.cancellationRate}
      averageTicketValue={reportData.averageTicketValue}
      revenuePerCompletedTrip={reportData.revenuePerCompletedTrip}
      totalRevenue={reportData.totalRevenue}
      cashRevenue={reportData.cashRevenue}
      bakongRevenue={reportData.bakongRevenue}
      revenueByMethod={reportData.revenueByMethod}
      revenueTrend={reportData.revenueTrend}
    />
  );
}
