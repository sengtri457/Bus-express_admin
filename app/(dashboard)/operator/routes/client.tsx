"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  createRoute,
  updateRoute,
  updateRouteStatus,
  deleteRoute,
} from "@/app/actions/operator";
import type { Route } from "@/lib/types";

interface RoutesClientProps {
  routes: Route[];
  operatorId: string;
}

function formatDuration(min: number | null) {
  if (!min) return null;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function RoutesClient({ routes, operatorId }: RoutesClientProps) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Route | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(formData: FormData) {
    formData.append("operator_id", operatorId);
    setError(null);
    const result = await createRoute(formData);
    if (result?.error) setError(result.error);
    else { setShowAdd(false); router.refresh(); }
  }

  async function handleEdit(formData: FormData) {
    if (!editing) return;
    formData.append("id", editing.id);
    setError(null);
    const result = await updateRoute(formData);
    if (result?.error) setError(result.error);
    else { setEditing(null); router.refresh(); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Routes</h2>
          <p className="mt-1 text-sm text-gray-500">Manage your bus routes</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="gap-2 rounded-full bg-blue-600 px-5 shadow-sm hover:shadow-md hover:bg-blue-700 transition-all active:scale-95">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Route
        </Button>
      </div>

      {routes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <svg className="mb-4 h-12 w-12 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900">No routes</h3>
            <p className="mt-1 text-sm text-gray-500">Add your first route to get started.</p>
            <Button className="mt-4" onClick={() => setShowAdd(true)}>Add Route</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {routes.map((r) => (
            <div
              key={r.id}
              className="rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900">{r.name}</p>
                      <p className="truncate text-xs text-gray-500">{r.origin} → {r.destination}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pl-11 text-xs text-gray-500">
                    {r.distance_km && (
                      <span className="inline-flex items-center gap-1">
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <polyline points="1 6 9 6 9 14" /><polyline points="23 18 15 18 15 10" /><line x1="9" y1="14" x2="15" y2="10"/>
                        </svg>
                        {r.distance_km} km
                      </span>
                    )}
                    {formatDuration(r.duration_min) && (
                      <span className="inline-flex items-center gap-1">
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                        </svg>
                        {formatDuration(r.duration_min)}
                      </span>
                    )}
                    <StatusBadge status={r.status} />
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-end gap-1.5 border-t border-gray-100 pt-3">
                <button
                  onClick={() => { setEditing(r); setError(null); }}
                  className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                  title="Edit"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                <form action={async () => { await updateRouteStatus(r.id, r.status); router.refresh(); }}>
                  <button
                    type="submit"
                    className={`rounded-lg p-2 transition-colors ${
                      r.status === "active"
                        ? "text-amber-400 hover:bg-amber-50 hover:text-amber-600"
                        : "text-green-400 hover:bg-green-50 hover:text-green-600"
                    }`}
                    title={r.status === "active" ? "Deactivate" : "Activate"}
                  >
                    {r.status === "active" ? (
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/>
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </button>
                </form>
                <form action={async () => { await deleteRoute(r.id); router.refresh(); }}>
                  <button
                    type="submit"
                    className="rounded-lg p-2 text-red-300 hover:bg-red-50 hover:text-red-500 transition-colors"
                    title="Delete"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                    </svg>
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Route">
        <form action={handleAdd} className="space-y-4">
          <Input label="Route Name" name="name" required placeholder="e.g. Phnom Penh → Siem Reap" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Origin" name="origin" required placeholder="Phnom Penh" />
            <Input label="Destination" name="destination" required placeholder="Siem Reap" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Distance (km)" name="distance_km" type="number" placeholder="314" />
            <Input label="Duration (min)" name="duration_min" type="number" placeholder="360" />
          </div>
          {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button type="submit">Create</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={`Edit - ${editing?.name ?? ""}`}>
        <form action={handleEdit} className="space-y-4">
          <Input label="Route Name" name="name" required defaultValue={editing?.name ?? ""} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Origin" name="origin" required defaultValue={editing?.origin ?? ""} />
            <Input label="Destination" name="destination" required defaultValue={editing?.destination ?? ""} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Distance (km)" name="distance_km" type="number" defaultValue={editing?.distance_km ? String(editing.distance_km) : ""} />
            <Input label="Duration (min)" name="duration_min" type="number" defaultValue={editing?.duration_min ? String(editing.duration_min) : ""} />
          </div>
          {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
