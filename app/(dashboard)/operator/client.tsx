"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  Bus,
  Map,
  Users,
  Compass,
  Plus,
  ArrowRight,
} from "lucide-react";
const OperatorChartsSection = dynamic(
  () => import("@/components/dashboard/operator-charts-section").then((mod) => mod.OperatorChartsSection),
  { ssr: false },
);
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import {
  createRoute,
  createBus,
  createSchedule,
  createStaff
} from "@/app/actions/operator";

interface OperatorDashboardClientProps {
  operator: any;
  buses: any[];
  routes: any[];
  schedules: any[];
  staff: any[];
  todayTrips: any[];
  bookings: any[];
  recentIncidents: any[];
  operatorId: string;
}

export function OperatorDashboardClient({
  operator,
  buses,
  routes,
  schedules,
  staff,
  todayTrips,
  bookings,
  recentIncidents,
  operatorId
}: OperatorDashboardClientProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Modals state
  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
  const [isBusModalOpen, setIsBusModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);

  // Form loading states
  const [submittingRoute, setSubmittingRoute] = useState(false);
  const [submittingBus, setSubmittingBus] = useState(false);
  const [submittingSchedule, setSubmittingSchedule] = useState(false);
  const [submittingStaff, setSubmittingStaff] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Compute stats
  const totalBuses = buses.length;
  const activeBuses = buses.filter((b) => b.status === "active").length;
  const maintenanceBuses = buses.filter((b) => b.status === "maintenance").length;
  const retiredBuses = buses.filter((b) => b.status === "retired").length;

  const totalRoutes = routes.length;
  const activeRoutes = routes.filter((r) => r.status === "active").length;

  const totalStaff = staff.length;
  const activeStaff = staff.filter((s) => s.status === "active").length;
  const drivers = staff.filter((s) => s.role === "driver");
  const conductors = staff.filter((s) => s.role === "conductor");

  const activeTripsCount = todayTrips.filter((t) => t.status === "in_progress").length;
  const totalTripsCount = todayTrips.length;

  const fleetStatusData = [
    { name: "Active", value: activeBuses, color: "#10B981" },
    { name: "Maintenance", value: maintenanceBuses, color: "#F59E0B" },
    { name: "Retired", value: retiredBuses, color: "#EF4444" },
  ].filter((d) => d.value > 0);

  const staffDistributionData = [
    { name: "Drivers", value: drivers.length, color: "#2563EB" },
    { name: "Conductors", value: conductors.length, color: "#8B5CF6" },
  ].filter((d) => d.value > 0);

  const bookingsPending = bookings.filter((b) => b.status === "pending").length;
  const bookingsConfirmed = bookings.filter((b) => b.status === "confirmed").length;
  const bookingsBoarded = bookings.filter((b) => b.status === "boarded").length;
  const bookingsCancelled = bookings.filter((b) => b.status === "cancelled").length;

  const bookingStatusData = [
    { name: "Pending", value: bookingsPending, color: "#F59E0B" },
    { name: "Confirmed", value: bookingsConfirmed, color: "#3B82F6" },
    { name: "Boarded", value: bookingsBoarded, color: "#10B981" },
    { name: "Cancelled", value: bookingsCancelled, color: "#EF4444" },
  ].filter((d) => d.value > 0);

  const totalBookings = bookings.length;

  // Quick Action form submissions
  async function handleCreateRoute(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmittingRoute(true);
    setFormError(null);
    const formData = new FormData(e.currentTarget);
    formData.append("operator_id", operatorId);

    const result = await createRoute(formData);
    setSubmittingRoute(false);
    if (result?.error) {
      setFormError(result.error);
    } else {
      setIsRouteModalOpen(false);
      router.refresh();
    }
  }

  async function handleCreateBus(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmittingBus(true);
    setFormError(null);
    const formData = new FormData(e.currentTarget);
    formData.append("operator_id", operatorId);

    const result = await createBus(formData);
    setSubmittingBus(false);
    if (result?.error) {
      setFormError(result.error);
    } else {
      setIsBusModalOpen(false);
      router.refresh();
    }
  }

  async function handleCreateSchedule(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmittingSchedule(true);
    setFormError(null);
    const formData = new FormData(e.currentTarget);

    const result = await createSchedule(formData);
    setSubmittingSchedule(false);
    if (result?.error) {
      setFormError(result.error);
    } else {
      setIsScheduleModalOpen(false);
      router.refresh();
    }
  }

  async function handleCreateStaff(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmittingStaff(true);
    setFormError(null);
    const formData = new FormData(e.currentTarget);
    formData.append("operator_id", operatorId);

    const result = await createStaff(formData);
    setSubmittingStaff(false);
    if (result?.error) {
      setFormError(result.error);
    } else {
      setIsStaffModalOpen(false);
      router.refresh();
    }
  }



  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "scheduled":
        return <Badge variant="info">Scheduled</Badge>;
      case "in progress":
      case "in_progress":
        return <Badge variant="warning">In Progress</Badge>;
      case "completed":
        return <Badge variant="success">Completed</Badge>;
      case "cancelled":
        return <Badge variant="danger">Cancelled</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  // Get time-aware greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="space-y-6">
      {/* Page Header: Greeting + Quick Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0F172A] leading-tight">
            {greeting}, {operator?.name ?? "Operator"}
          </h1>
          <p className="text-xs text-[#94A3B8] mt-0.5">{today} · BusExpress Operations</p>
        </div>

        {/* Inline stat pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-100 rounded-full px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
            <span className="text-xs font-semibold text-blue-700 whitespace-nowrap">
              {activeBuses} buses active
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 rounded-full px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-xs font-semibold text-emerald-700 whitespace-nowrap">
              {activeTripsCount} trips running
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-gray-100 border border-gray-200 rounded-full px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-gray-400 shrink-0" />
            <span className="text-xs font-semibold text-gray-600 whitespace-nowrap">
              {today}
            </span>
          </div>
        </div>
      </div>

      {/* 4 Premium KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            title: "Active Buses",
            value: `${activeBuses}/${totalBuses}`,
            icon: Bus,
            color: "text-blue-600 bg-blue-50/50"
          },
          {
            title: "Active Routes",
            value: `${activeRoutes}/${totalRoutes}`,
            icon: Map,
            color: "text-emerald-600 bg-emerald-50/50"
          },
          {
            title: "Active Trips",
            value: activeTripsCount,
            icon: Compass,
            color: "text-amber-600 bg-amber-50/50"
          },
          {
            title: "Active Staff",
            value: `${activeStaff}/${totalStaff}`,
            icon: Users,
            color: "text-purple-600 bg-purple-50/50"
          }
        ].map((kpi, idx) => {
          const Icon = kpi.icon;

          return (
            <div
              key={idx}
              className="group rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-gray-300"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-[#94A3B8] truncate">{kpi.title}</p>
                  <p className="text-2xl font-bold tracking-tight text-[#0F172A] mt-1 truncate">{kpi.value}</p>
                </div>
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${kpi.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <OperatorChartsSection
        bookingStatusData={bookingStatusData}
        fleetStatusData={fleetStatusData}
        staffDistributionData={staffDistributionData}
        totalBookings={totalBookings}
        totalBuses={totalBuses}
        totalStaff={totalStaff}
        bookingsPending={bookingsPending}
        bookingsConfirmed={bookingsConfirmed}
        bookingsBoarded={bookingsBoarded}
        bookingsCancelled={bookingsCancelled}
      />

      {/* Quick Actions Card Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-[#0F172A]">Quick Actions</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: "Add Route", desc: "Create a transit route", action: () => setIsRouteModalOpen(true) },
            { title: "Add Bus", desc: "Register a bus to fleet", action: () => setIsBusModalOpen(true) },
            { title: "Create Schedule", desc: "Set departure timing", action: () => setIsScheduleModalOpen(true) },
            { title: "Assign Staff", desc: "Register driver/conductor", action: () => setIsStaffModalOpen(true) }
          ].map((act, idx) => (
            <button
              key={idx}
              onClick={act.action}
              className="flex items-center gap-3 text-left p-4 rounded-xl border border-[#E2E8F0] bg-white hover:border-[#2563EB]/40 hover:bg-blue-50/30 hover:shadow-sm transition-all group"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#EFF6FF] text-[#2563EB] group-hover:bg-[#2563EB] group-hover:text-white transition-colors">
                <Plus className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm text-[#0F172A] group-hover:text-[#2563EB] transition-colors truncate">{act.title}</p>
                <p className="text-xxs text-[#94A3B8] mt-0.5 truncate">{act.desc}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-[#94A3B8] shrink-0 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </button>
          ))}
        </div>
      </div>



      {/* MODALS FOR QUICK ACTIONS */}
      
      {/* Add Route Modal */}
      <Modal open={isRouteModalOpen} onClose={() => setIsRouteModalOpen(false)} title="Add Route">
        <form onSubmit={handleCreateRoute} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Route Name</label>
            <Input name="name" required placeholder="e.g. Phnom Penh - Siem Reap" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Origin</label>
              <Input name="origin" required placeholder="e.g. Phnom Penh" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Destination</label>
              <Input name="destination" required placeholder="e.g. Siem Reap" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Distance (km)</label>
              <Input name="distance_km" type="number" required placeholder="e.g. 314" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Duration (min)</label>
              <Input name="duration_min" type="number" required placeholder="e.g. 360" />
            </div>
          </div>

          {formError && <p className="text-xs font-semibold text-[#EF4444] bg-red-50 p-2.5 rounded-lg">{formError}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" type="button" onClick={() => setIsRouteModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" loading={submittingRoute}>Add Route</Button>
          </div>
        </form>
      </Modal>

      {/* Add Bus Modal */}
      <Modal open={isBusModalOpen} onClose={() => setIsBusModalOpen(false)} title="Add Bus">
        <form onSubmit={handleCreateBus} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Plate Number</label>
            <Input name="plate_number" required placeholder="e.g. PP-3456" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Bus Model</label>
            <Input name="model" required placeholder="e.g. Ford Transit (VIP Van)" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Seating Capacity</label>
            <Input name="capacity" type="number" required placeholder="e.g. 15" />
          </div>

          {formError && <p className="text-xs font-semibold text-[#EF4444] bg-red-50 p-2.5 rounded-lg">{formError}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" type="button" onClick={() => setIsBusModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" loading={submittingBus}>Add Bus</Button>
          </div>
        </form>
      </Modal>

      {/* Create Schedule Modal */}
      <Modal open={isScheduleModalOpen} onClose={() => setIsScheduleModalOpen(false)} title="Create Schedule">
        <form onSubmit={handleCreateSchedule} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Select Route</label>
            <Select
              name="route_id"
              required
              placeholder="Select Route..."
              options={routes.map((r) => ({ value: r.id, label: r.name }))}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Select Bus</label>
            <Select
              name="bus_id"
              required
              placeholder="Select Bus..."
              options={buses.map((b) => ({ value: b.id, label: `${b.plate_number} (${b.model})` }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Driver</label>
              <Select
                name="driver_id"
                required
                placeholder="Select Driver..."
                options={drivers.map((d) => ({ value: d.id, label: d.name }))}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Conductor (Optional)</label>
              <Select
                name="conductor_id"
                placeholder="None"
                options={conductors.map((c) => ({ value: c.id, label: c.name }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Departure Time</label>
              <Input name="departure_time" type="time" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Arrival Time</label>
              <Input name="arrival_time" type="time" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Days of Week</label>
              <Input name="days_of_week" required placeholder="e.g. Mon,Wed,Fri or Daily" defaultValue="Daily" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Price ($)</label>
              <Input name="price" type="number" step="0.01" required placeholder="e.g. 12.00" />
            </div>
          </div>

          {formError && <p className="text-xs font-semibold text-[#EF4444] bg-red-50 p-2.5 rounded-lg">{formError}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" type="button" onClick={() => setIsScheduleModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" loading={submittingSchedule}>Create Schedule</Button>
          </div>
        </form>
      </Modal>

      {/* Assign Staff Modal */}
      <Modal open={isStaffModalOpen} onClose={() => setIsStaffModalOpen(false)} title="Register Staff">
        <form onSubmit={handleCreateStaff} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
            <Input name="name" required placeholder="e.g. John Doe" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
            <Input name="email" type="email" required placeholder="e.g. john@busexpress.com" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number</label>
              <Input name="phone" required placeholder="e.g. 012345678" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
              <Input name="password" type="password" required placeholder="Min 6 chars" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Staff Role</label>
            <Select
              name="role"
              required
              options={[
                { value: "driver", label: "Driver" },
                { value: "conductor", label: "Conductor" }
              ]}
            />
          </div>

          {formError && <p className="text-xs font-semibold text-[#EF4444] bg-red-50 p-2.5 rounded-lg">{formError}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" type="button" onClick={() => setIsStaffModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" loading={submittingStaff}>Register Staff</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
