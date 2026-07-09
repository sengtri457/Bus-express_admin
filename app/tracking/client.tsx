"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { startTrip } from "@/app/actions/driver";
import { submitDriverAppeal } from "@/app/actions/penalties";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

interface ActiveTrip {
  id: string;
  routeName: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
}

interface PendingPenalty {
  id: string;
  delay_minutes: number;
  recommended_fine: number;
  status: string;
  driver_explanation: string | null;
  routeName: string;
  departureTime: string;
  tripDate: string;
}

interface Props {
  driverId: string;
  driverName: string;
  activeTrip: ActiveTrip | null;
  pendingPenalties?: PendingPenalty[];
}

export function DriverTrackingClient({ 
  driverId, 
  driverName, 
  activeTrip: initialTrip,
  pendingPenalties = []
}: Props) {
  const [tracking, setTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Appeal States
  const [penalties, setPenalties] = useState<PendingPenalty[]>(pendingPenalties);
  const [appealingId, setAppealingId] = useState<string | null>(null);
  const [appealText, setAppealText] = useState("");
  const [appealLoading, setAppealLoading] = useState(false);

  const [position, setPosition] = useState<{
    latitude: number;
    longitude: number;
    heading: number | null;
    speed: number | null;
  } | null>(null);

  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [updateCount, setUpdateCount] = useState(0);
  const [currentTrip, setCurrentTrip] = useState<ActiveTrip | null>(initialTrip);

  const watchRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSentRef = useRef<string>("");
  const positionRef = useRef(position);
  const currentTripRef = useRef(currentTrip);

  positionRef.current = position;
  currentTripRef.current = currentTrip;

  const sendLocation = useCallback(async () => {
    const supabase = createClient();
    const pos = positionRef.current;
    const trip = currentTripRef.current;
    if (!pos) return;

    const key = `${pos.latitude.toFixed(6)},${pos.longitude.toFixed(6)}`;
    if (key === lastSentRef.current) return;
    lastSentRef.current = key;

    const payload: Record<string, any> = {
      driver_id: driverId,
      latitude: pos.latitude,
      longitude: pos.longitude,
      heading: pos.heading,
      speed: pos.speed,
      updated_at: new Date().toISOString(),
    };
    if (trip) {
      payload.trip_id = trip.id;
    }

    const { error: err } = await supabase
      .from("driver_locations")
      .upsert(payload, { onConflict: "driver_id" });

    if (!err) {
      setUpdateCount((c) => c + 1);
      setLastUpdate(new Date().toLocaleTimeString());
    }
  }, [driverId]);

  const stopTracking = useCallback(() => {
    if (watchRef.current !== null) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setTracking(false);
    lastSentRef.current = "";
  }, []);

  const startTracking = useCallback(async () => {
    if (tracking) return;
    setError(null);

    // If no active trip yet, start one via the server action
    if (!currentTripRef.current) {
      const result = await startTrip(driverId);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.trip) {
        setCurrentTrip(result.trip);
        currentTripRef.current = result.trip;
      }
    }

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      return;
    }

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const p = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          heading: pos.coords.heading,
          speed: pos.coords.speed,
        };
        setPosition(p);
        positionRef.current = p;
      },
      (err) => {
        setError(`GPS error: ${err.message}`);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    watchRef.current = id;
    setTracking(true);

    intervalRef.current = setInterval(() => {
      sendLocation();
    }, 5000);
  }, [tracking, sendLocation]);

  const handleAppealSubmit = async (penaltyId: string) => {
    if (!appealText.trim()) return;
    setAppealLoading(true);
    setError(null);
    const result = await submitDriverAppeal(penaltyId, appealText);
    setAppealLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      setPenalties((prev) => prev.filter((p) => p.id !== penaltyId));
      setAppealingId(null);
      setAppealText("");
    }
  };

  // Auto-start on mount if active trip exists
  useEffect(() => {
    if (initialTrip) {
      setCurrentTrip(initialTrip);
      startTracking();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Subscribe to trip changes for auto start/stop
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("driver-trip-changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "trips",
          filter: `id=eq.${currentTrip?.id ?? "none"}`,
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          const newStatus = payload.new?.status;
          if (newStatus === "completed" || newStatus === "cancelled") {
            stopTracking();
            setCurrentTrip(null);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentTrip?.id, stopTracking]);

  // Poll for new/changed trips every 15s
  useEffect(() => {
    const supabase = createClient();

    pollRef.current = setInterval(async () => {
      const { data: trips } = await supabase
        .from("trips")
        .select(`
          id,
          schedules!inner(
            departure_time, arrival_time,
            routes!inner(name, origin, destination)
          )
        `)
        .eq("status", "in_progress")
        .eq("schedules.driver_id", driverId);

      const trip = trips?.[0];
      if (trip && !currentTripRef.current) {
        const s = Array.isArray(trip.schedules) ? trip.schedules[0] : trip.schedules;
        const r = s?.routes ? (Array.isArray(s.routes) ? s.routes[0] : s.routes) : null;
        setCurrentTrip({
          id: trip.id,
          routeName: r?.name ?? "",
          origin: r?.origin ?? "",
          destination: r?.destination ?? "",
          departureTime: s?.departure_time ?? "",
          arrivalTime: s?.arrival_time ?? "",
        });
        startTracking();
      } else if (!trip && currentTripRef.current) {
        stopTracking();
        setCurrentTrip(null);
      }
    }, 15000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [driverId, startTracking, stopTracking]);

  return (
    <div className="flex min-h-dvh flex-col items-center bg-gradient-to-b from-blue-50 to-white p-6">
      <div className="w-full max-w-sm space-y-5 text-center">
        <div>
          <h1 className="text-xl font-bold text-[#0F172A]">Live Tracking</h1>
          <p className="text-sm text-[#64748B]">{driverName}</p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {currentTrip ? (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-left text-sm space-y-1">
            <p className="font-semibold text-blue-800">{currentTrip.routeName}</p>
            <p className="text-blue-600">
              {currentTrip.origin} &rarr; {currentTrip.destination}
            </p>
            <p className="text-blue-500 text-xs">
              {currentTrip.departureTime} - {currentTrip.arrivalTime}
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
            Waiting for trip to start...
          </div>
        )}

        {penalties.length > 0 && (
          <div className="space-y-3">
            {penalties.map((penalty) => (
              <div 
                key={penalty.id} 
                className="rounded-2xl border border-red-200 bg-red-50 p-4 text-left text-xs space-y-2.5 animate-in fade-in"
              >
                <div className="flex items-start justify-between gap-1">
                  <div className="space-y-0.5">
                    <p className="font-bold text-red-800">Pending Late Start Fine</p>
                    <p className="text-red-600 font-medium">{penalty.routeName} ({penalty.tripDate})</p>
                    <p className="text-red-500 text-[10px]">
                      Scheduled: {penalty.departureTime} · Delayed by {penalty.delay_minutes} mins
                    </p>
                  </div>
                  <span className="font-extrabold text-red-700 text-sm shrink-0">
                    -${penalty.recommended_fine.toFixed(2)}
                  </span>
                </div>

                {appealingId === penalty.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={appealText}
                      onChange={(e) => setAppealText(e.target.value)}
                      placeholder="Explain the reason for the delay..."
                      rows={2}
                      className="w-full rounded-lg border border-red-300 bg-white p-2 text-xs text-slate-800 shadow-sm focus:border-red-500 focus:outline-none resize-none"
                    />
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => {
                          setAppealingId(null);
                          setAppealText("");
                        }}
                        disabled={appealLoading}
                        className="rounded-lg px-2.5 py-1.5 text-[10px] font-semibold text-red-700 hover:bg-red-100 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleAppealSubmit(penalty.id)}
                        disabled={appealLoading || !appealText.trim()}
                        className="rounded-lg bg-red-600 text-white px-3 py-1.5 text-[10px] font-semibold hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50"
                      >
                        {appealLoading ? "Submitting..." : "Submit Appeal"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setAppealingId(penalty.id);
                      setAppealText("");
                    }}
                    className="w-full rounded-lg bg-white border border-red-200 text-red-700 py-1.5 text-center font-semibold hover:bg-red-100/50 transition-colors shadow-sm"
                  >
                    Appeal Fine / Explain Delay
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
          {position ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#64748B]">Latitude</span>
                <span className="font-mono text-[#0F172A]">
                  {position.latitude.toFixed(6)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Longitude</span>
                <span className="font-mono text-[#0F172A]">
                  {position.longitude.toFixed(6)}
                </span>
              </div>
              {position.speed !== null && (
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Speed</span>
                  <span className="font-mono text-[#0F172A]">
                    {(position.speed * 3.6).toFixed(1)} km/h
                  </span>
                </div>
              )}
              {position.heading !== null && (
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Heading</span>
                  <span className="font-mono text-[#0F172A]">
                    {position.heading.toFixed(0)}&deg;
                  </span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-[#94A3B8]">
              {tracking ? "Waiting for GPS..." : "No active trip"}
            </p>
          )}
        </div>

        {lastUpdate && (
          <div className="space-y-1 text-xs text-[#94A3B8]">
            <p>Last sent: {lastUpdate}</p>
            <p>Updates sent: {updateCount}</p>
          </div>
        )}

        <button
          onClick={tracking ? stopTracking : startTracking}
          className={`w-full rounded-xl py-4 text-base font-semibold text-white transition-all active:scale-95 ${
            tracking
              ? "bg-red-500 hover:bg-red-600"
              : "bg-[#2563EB] hover:bg-[#1D4ED8]"
          }`}
        >
          {tracking ? "Stop Tracking" : "Start Tracking"}
        </button>

        {tracking && (
          <div className="flex items-center justify-center gap-2 text-sm text-green-600">
            <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
            Tracking active
          </div>
        )}
      </div>
    </div>
  );
}
