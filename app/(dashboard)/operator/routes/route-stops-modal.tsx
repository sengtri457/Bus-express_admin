"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { saveRouteStops } from "@/app/actions/operator";
import { createClient } from "@/lib/supabase/client";
import type { Route, Stop } from "@/lib/types";

interface EditableStop {
  stop_id: string;
  stop_name: string;
  stop_order: number;
  arrival_offset: number;
  departure_offset: number;
}

interface RouteStopsModalProps {
  route: Route | null;
  open: boolean;
  onClose: () => void;
}

export function RouteStopsModal({ route, open, onClose }: RouteStopsModalProps) {
  const router = useRouter();
  const [stops, setStops] = useState<EditableStop[]>([]);
  const [availableStops, setAvailableStops] = useState<Stop[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  const fetchData = useCallback(async () => {
    if (!route) return;
    setLoading(true);
    setError(null);

    const supabase = createClient();

    const [routeStopsRes, allStopsRes] = await Promise.all([
      supabase
        .from("route_stops")
        .select("*, stops(*)")
        .eq("route_id", route.id)
        .order("stop_order", { ascending: true }),
      supabase.from("stops").select("*").order("name", { ascending: true }),
    ]);

    if (routeStopsRes.error) {
      setError(routeStopsRes.error.message);
    } else {
      setStops(
        (routeStopsRes.data ?? []).map((rs: any) => ({
          stop_id: rs.stop_id,
          stop_name: rs.stops?.name ?? "Unknown",
          stop_order: rs.stop_order,
          arrival_offset: rs.arrival_offset,
          departure_offset: rs.departure_offset,
        }))
      );
    }

    if (!allStopsRes.error) {
      setAvailableStops(allStopsRes.data ?? []);
    }

    setLoading(false);
  }, [route]);

  useEffect(() => {
    if (open) fetchData();
  }, [open, fetchData]);

  if (!route) return null;

  const usedStopIds = new Set(stops.map((s) => s.stop_id));

  const pickableStops = availableStops.filter((s) => !usedStopIds.has(s.id));

  function addStop(stop: Stop) {
    const maxOrder = stops.reduce((max, s) => Math.max(max, s.stop_order), -1);
    setStops([
      ...stops,
      {
        stop_id: stop.id,
        stop_name: stop.name,
        stop_order: maxOrder + 1,
        arrival_offset: 0,
        departure_offset: 0,
      },
    ]);
    setShowPicker(false);
  }

  function removeStop(stopId: string) {
    setStops(stops.filter((s) => s.stop_id !== stopId));
  }

  function moveStop(stopId: string, direction: "up" | "down") {
    const idx = stops.findIndex((s) => s.stop_id === stopId);
    if (idx === -1) return;
    const newIdx = direction === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= stops.length) return;

    const updated = [...stops];
    const temp = updated[idx];
    updated[idx] = { ...updated[newIdx], stop_order: updated[idx].stop_order };
    updated[newIdx] = { ...temp, stop_order: updated[newIdx].stop_order };
    setStops(updated);
  }

  function updateOffset(stopId: string, field: "arrival_offset" | "departure_offset", value: number) {
    setStops(stops.map((s) => (s.stop_id === stopId ? { ...s, [field]: value } : s)));
  }

  async function handleSave() {
    if (!route) return;
    setSaving(true);
    setError(null);

    const ordered = stops.map((s, i) => ({
      stop_id: s.stop_id,
      stop_order: i,
      arrival_offset: s.arrival_offset,
      departure_offset: s.departure_offset,
    }));

    const formData = new FormData();
    formData.append("route_id", route.id);
    formData.append("stops", JSON.stringify(ordered));

    const result = await saveRouteStops(formData);
    if (result?.error) {
      setError(result.error);
    } else {
      router.refresh();
      onClose();
    }
    setSaving(false);
  }

  return (
    <Modal open={open} onClose={onClose} title={`Stops — ${route.name}`} className="max-w-xl">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <svg className="h-6 w-6 animate-spin text-blue-600" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="ml-3 text-sm text-gray-500">Loading stops...</span>
        </div>
      ) : (
        <div className="space-y-4">
          {stops.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-200 py-8 text-center text-sm text-gray-400">
              No stops assigned yet. Click &quot;Add Stop&quot; below.
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {stops.map((s, i) => (
                <div
                  key={s.stop_id}
                  className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-3"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-600">
                    {i + 1}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{s.stop_name}</p>
                    <div className="mt-1 flex gap-3">
                      <div className="flex items-center gap-1">
                        <label className="text-[10px] font-medium text-gray-400 uppercase">Arr</label>
                        <input
                          type="number"
                          value={s.arrival_offset}
                          onChange={(e) => updateOffset(s.stop_id, "arrival_offset", Number(e.target.value))}
                          className="w-14 rounded border border-gray-200 px-1.5 py-0.5 text-xs text-gray-700 focus:border-blue-500 focus:outline-none"
                          min={0}
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <label className="text-[10px] font-medium text-gray-400 uppercase">Dep</label>
                        <input
                          type="number"
                          value={s.departure_offset}
                          onChange={(e) => updateOffset(s.stop_id, "departure_offset", Number(e.target.value))}
                          className="w-14 rounded border border-gray-200 px-1.5 py-0.5 text-xs text-gray-700 focus:border-blue-500 focus:outline-none"
                          min={0}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-0.5">
                    <button
                      onClick={() => moveStop(s.stop_id, "up")}
                      disabled={i === 0}
                      className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move up"
                    >
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <polyline points="18 15 12 9 6 15" />
                      </svg>
                    </button>
                    <button
                      onClick={() => moveStop(s.stop_id, "down")}
                      disabled={i === stops.length - 1}
                      className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move down"
                    >
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                    <button
                      onClick={() => removeStop(s.stop_id)}
                      className="rounded p-1 text-red-300 hover:bg-red-50 hover:text-red-500"
                      title="Remove"
                    >
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {showPicker ? (
            <div className="rounded-lg border border-gray-200 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase">Add Stop</span>
                <button
                  onClick={() => setShowPicker(false)}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  Cancel
                </button>
              </div>
              {pickableStops.length === 0 ? (
                <p className="py-2 text-center text-xs text-gray-400">All stops are already assigned.</p>
              ) : (
                <div className="max-h-40 space-y-0.5 overflow-y-auto">
                  {pickableStops.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => addStop(s)}
                      className="w-full rounded px-2 py-1.5 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowPicker(true)}
              className="w-full gap-1.5"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Stop
            </Button>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave} loading={saving}>
              Save Stops
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
