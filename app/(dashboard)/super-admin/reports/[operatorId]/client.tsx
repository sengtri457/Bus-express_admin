"use client";

import { OperatorReportsClient } from "@/components/reports/operator-report-client";
import type { OperatorReportData } from "@/lib/services/operator-report";

interface PerOperatorReportClientProps {
  reportData: OperatorReportData;
}

export function PerOperatorReportClient({ reportData }: PerOperatorReportClientProps) {
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
      backHref={`/super-admin/reports/operators?from=${reportData.period.startDate}&to=${reportData.period.endDate}`}
      exportType="csv"
    />
  );
}
