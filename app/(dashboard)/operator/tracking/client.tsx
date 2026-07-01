"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import dynamic from "next/dynamic";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { useSearchParams } from "next/navigation";

interface DriverWithLocation {
  id: string;
  name: string | null;
  tripId: string;
  trip: {
    routeName: string;
    origin: string;
    destination: string;
    busPlate: string;
    departureTime: string;
    arrivalTime: string;
    tripDate: string;
    status: string;
  } | null;
  location: {
    latitude: number;
    longitude: number;
    heading: number | null;
    speed: number | null;
    updated_at: string;
  } | null;
}

const MapView = dynamic(() => import("./map-view"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-gray-400">
      Loading map...
    </div>
  ),
});

function formatTime(iso: string) {
  if (/^\d{2}:\d{2}/.test(iso)) return iso.slice(0, 5);
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function getRelativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  return `${hrs}h ${mins % 60}m ago`;
}

export function TrackingClient({
  drivers: initialDrivers,
}: {
  drivers: DriverWithLocation[];
}) {
  const [drivers, setDrivers] = useState<DriverWithLocation[]>(initialDrivers);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const tripIdsRef = useRef(
    initialDrivers.filter((d) => d.tripId).map((d) => d.tripId)
  );

  const searchParams = useSearchParams();
  const driverParam = searchParams?.get("selectedDriverId");

  useEffect(() => {
    if (driverParam) {
      setSelectedDriverId(driverParam);
    }
  }, [driverParam]);

  // Poll the trips table every 10s (same source as Flutter driver app writes GPS to)
  useEffect(() => {
    const supabase = createClient();
    const tripIds = tripIdsRef.current;
    if (tripIds.length === 0) return;

    async function refreshFromTrips() {
      const { data: trips } = await supabase
        .from("trips")
        .select("id, latitude, longitude, status, departed_at")
        .in("id", tripIds);

      if (!trips?.length) return;

      setDrivers((prev) =>
        prev.map((d) => {
          if (!d.tripId) return d;
          const t = trips.find((tr) => tr.id === d.tripId);
          if (!t) return d;

          // Update trip status too (e.g. if driver just started)
          const hasGps = t.latitude != null && t.longitude != null;
          return {
            ...d,
            trip: d.trip ? { ...d.trip, status: t.status ?? d.trip.status } : null,
            location:
              hasGps
                ? {
                    latitude: t.latitude as number,
                    longitude: t.longitude as number,
                    heading: d.location?.heading ?? null,
                    speed: d.location?.speed ?? null,
                    updated_at: t.departed_at ?? new Date().toISOString(),
                  }
                : d.location,
          };
        })
      );
    }

    refreshFromTrips();
    const interval = setInterval(refreshFromTrips, 10_000);
    return () => clearInterval(interval);
  }, []);

  const activeDrivers = drivers.filter(
    (d) => d.location && d.trip?.status === "in_progress"
  );

  const selectedDriver = drivers.find((d) => d.id === selectedDriverId) ?? null;

  return (
    <div className="flex h-[calc(100vh-6rem)] gap-4">
      {/* Map */}
      <div className="flex-1 rounded-xl overflow-hidden border border-[#E2E8F0] bg-white shadow-sm">
        <MapView
          drivers={drivers}
          selectedDriverId={selectedDriverId}
          onDriverSelect={setSelectedDriverId}
        />
      </div>

      {/* Sidebar */}
      <div className="w-72 shrink-0 flex flex-col gap-3 overflow-y-auto">
        {/* Stats bar */}
        <div className="flex gap-2">
          <div className="flex-1 rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-center shadow-sm">
            <p className="text-xs text-[#64748B]">Active</p>
            <p className="text-xl font-bold text-green-600">{activeDrivers.length}</p>
          </div>
          <div className="flex-1 rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-center shadow-sm">
            <p className="text-xs text-[#64748B]">Total</p>
            <p className="text-xl font-bold text-[#0F172A]">{drivers.length}</p>
          </div>
        </div>

        <Card className="flex-1">
          <CardHeader className="pb-2 pt-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#0F172A]">Live Trips</h3>
              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                {activeDrivers.length} online
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 pb-3">
            {drivers.length === 0 && (
              <p className="py-6 text-center text-sm text-gray-400">No drivers assigned</p>
            )}
            {drivers.map((d) => {
              const isActive = d.location && d.trip?.status === "in_progress";
              const isSelected = selectedDriverId === d.id;

              return (
                <button
                  key={d.id}
                  onClick={() => setSelectedDriverId(isSelected ? null : d.id)}
                  className={`w-full text-left rounded-lg border p-2.5 text-sm transition-all ${
                    isSelected
                      ? "border-blue-400 bg-blue-50 shadow-sm"
                      : "border-[#E2E8F0] hover:border-blue-200 hover:bg-slate-50"
                  }`}
                >
                  {/* Driver name + status */}
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                        isActive
                          ? "bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]"
                          : "bg-gray-300"
                      }`}
                    />
                    <p className="truncate font-semibold text-[#0F172A]">
                      {d.name ?? "Unknown"}
                    </p>
                    {d.trip && (
                      <span
                        className={`ml-auto shrink-0 text-[10px] px-1.5 py-0.5 rounded font-medium ${
                          d.trip.status === "in_progress"
                            ? "bg-green-100 text-green-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {d.trip.status === "in_progress" ? "Moving" : "Scheduled"}
                      </span>
                    )}
                  </div>

                  {/* Trip info */}
                  {d.trip ? (
                    <div className="ml-4 space-y-0.5 text-[11px] text-[#64748B]">
                      <p className="truncate font-medium text-[#0F172A] text-xs">
                        {d.trip.routeName}
                      </p>
                      <p className="flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-400 shrink-0" />
                        {d.trip.origin}
                      </p>
                      <p className="flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
                        {d.trip.destination}
                      </p>
                      <p>🚌 {d.trip.busPlate} &nbsp;·&nbsp; {formatTime(d.trip.departureTime)} – {formatTime(d.trip.arrivalTime)}</p>
                      {d.location && (
                        <p className="text-[10px] text-gray-400 mt-1">
                          📡 Updated {getRelativeTime(d.location.updated_at)}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="ml-4 text-[11px] text-gray-400">No trip today</p>
                  )}

                  {!d.location && d.trip && (
                    <p className="ml-4 text-[10px] text-amber-600 mt-1">⚠ GPS not started yet</p>
                  )}
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* Selected driver detail */}
        {selectedDriver?.trip && (
          <Card>
            <CardContent className="pt-3 pb-3 text-xs space-y-1.5">
              <p className="font-semibold text-[#0F172A] text-sm">{selectedDriver.name}</p>
              <div className="flex items-center justify-between">
                <span className="text-[#64748B]">Route</span>
                <span className="font-medium text-[#0F172A]">{selectedDriver.trip.routeName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#64748B]">Date</span>
                <span className="font-medium text-[#0F172A]">{selectedDriver.trip.tripDate}</span>
              </div>
              {selectedDriver.location && (
                <div className="mt-1 rounded bg-slate-50 p-2 text-[10px] text-slate-500 font-mono">
                  {selectedDriver.location.latitude.toFixed(5)}, {selectedDriver.location.longitude.toFixed(5)}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
