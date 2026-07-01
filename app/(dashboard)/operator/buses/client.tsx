"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/shared/status-badge";
import { createBus, updateBusStatus } from "@/app/actions/operator";
import type { Bus } from "@/lib/types";

interface BusesClientProps {
  buses: Bus[];
  operatorId: string;
}

const STATUS_ACTIONS: Record<string, { label: string; next: string; color: string }[]> = {
  active: [
    { label: "Maintenance", next: "maintenance", color: "text-amber-500 hover:bg-amber-50" },
    { label: "Retire", next: "retired", color: "text-red-400 hover:bg-red-50" },
  ],
  maintenance: [
    { label: "Activate", next: "active", color: "text-green-500 hover:bg-green-50" },
    { label: "Retire", next: "retired", color: "text-red-400 hover:bg-red-50" },
  ],
  retired: [
    { label: "Activate", next: "active", color: "text-green-500 hover:bg-green-50" },
  ],
};

export function BusesClient({ buses, operatorId }: BusesClientProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(formData: FormData) {
    formData.append("operator_id", operatorId);
    setError(null);
    const result = await createBus(formData);
    if (result?.error) setError(result.error);
    else setShowAdd(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Buses</h2>
          <p className="mt-1 text-sm text-gray-500">Manage your fleet</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="gap-2 rounded-full bg-blue-600 px-5 shadow-sm hover:shadow-md hover:bg-blue-700 transition-all active:scale-95">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Bus
        </Button>
      </div>

      {buses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <svg className="mb-4 h-12 w-12 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900">No buses</h3>
            <p className="mt-1 text-sm text-gray-500">Add your first bus to get started.</p>
            <Button className="mt-4" onClick={() => setShowAdd(true)}>Add Bus</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {buses.map((b) => (
            <div
              key={b.id}
              className="rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900">{b.plate_number}</p>
                      <p className="truncate text-xs text-gray-500">{b.model}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pl-11">
                    <span className="text-xs text-gray-500">
                      <span className="font-medium text-gray-700">{b.capacity}</span> seats
                    </span>
                    <StatusBadge status={b.status} />
                  </div>
                </div>
              </div>

              <div className="mt-3 flex gap-1.5 border-t border-gray-100 pt-3 pl-11">
                {(STATUS_ACTIONS[b.status] ?? []).map((action) => (
                  <form key={action.next} action={async () => { await updateBusStatus(b.id, action.next); }}>
                    <button
                      type="submit"
                      className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${action.color}`}
                    >
                      {action.label}
                    </button>
                  </form>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Bus">
        <form action={handleAdd} className="space-y-4">
          <Input label="Plate Number" name="plate_number" required placeholder="PP-1234-AA" />
          <Input label="Model" name="model" required placeholder="Hyundai Universe" />
          <Input label="Capacity (seats)" name="capacity" type="number" required placeholder="40" />
          {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button type="submit">Create</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
