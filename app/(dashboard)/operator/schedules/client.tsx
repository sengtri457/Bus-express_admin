"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  createSchedule,
  updateSchedule,
  toggleScheduleStatus,
  deleteSchedule,
} from "@/app/actions/operator";
import { DAY_LABELS } from "@/lib/utils/constants";
import type { Schedule } from "@/lib/types";

const DAYS = [1, 2, 3, 4, 5, 6, 7];

interface SchedulesClientProps {
  schedules: (Schedule & { conductor?: { id: string; name: string | null } })[];
  operatorId: string;
  routes: { id: string; origin: string; destination: string }[];
  buses: { id: string; plate_number: string; model: string }[];
  drivers: { id: string; name: string | null }[];
  conductors: { id: string; name: string | null }[];
}

function formatTime(time: string) {
  return time?.slice(0, 5) ?? "-";
}

function formatPrice(price: number | null | undefined) {
  return `$${(price ?? 0).toFixed(2)}`;
}

export function SchedulesClient({
  schedules,
  operatorId,
  routes,
  buses,
  drivers,
  conductors,
}: SchedulesClientProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [editingSch, setEditingSch] = useState<SchedulesClientProps["schedules"][number] | null>(null);
  const [addDays, setAddDays] = useState<number[]>([]);
  const [editDays, setEditDays] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  function toggleAddDay(day: number) {
    setAddDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  function toggleEditDay(day: number) {
    setEditDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  function openEdit(s: SchedulesClientProps["schedules"][number]) {
    setEditingSch(s);
    setEditDays(s.days_of_week ? s.days_of_week.split(",").map(Number) : []);
    setError(null);
  }

  function closeEdit() {
    setEditingSch(null);
    setEditDays([]);
    setError(null);
  }

  async function handleAdd(formData: FormData) {
    if (addDays.length === 0) { setError("Select at least one day"); return; }
    formData.append("days_of_week", addDays.sort().join(","));
    setError(null);
    const result = await createSchedule(formData);
    if (result?.error) setError(result.error);
    else { setShowAdd(false); setAddDays([]); }
  }

  async function handleEdit(formData: FormData) {
    if (!editingSch) return;
    if (editDays.length === 0) { setError("Select at least one day"); return; }
    formData.append("id", editingSch.id);
    formData.append("days_of_week", editDays.sort().join(","));
    setError(null);
    const result = await updateSchedule(formData);
    if (result?.error) setError(result.error);
    else closeEdit();
  }

  const conductorOptions = [
    { value: "", label: "None" },
    ...conductors.map((c) => ({ value: c.id, label: c.name ?? "Unknown Conductor" })),
  ];

  function DayChips({ daysOfWeek }: { daysOfWeek: string }) {
    const selected = daysOfWeek.split(",");
    return (
      <div className="flex gap-1">
        {DAYS.map((day) => (
          <span
            key={day}
            className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${
              selected.includes(String(day))
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-400"
            }`}
          >
            {DAY_LABELS[String(day)]?.charAt(0)}
          </span>
        ))}
      </div>
    );
  }

  function DayPicker({
    selected,
    onToggle,
  }: {
    selected: number[];
    onToggle: (day: number) => void;
  }) {
    return (
      <div className="flex gap-1.5">
        {DAYS.map((day) => (
          <button
            key={day}
            type="button"
            onClick={() => onToggle(day)}
            className={`h-8 w-8 rounded-full text-xs font-bold transition-colors ${
              selected.includes(day)
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            {DAY_LABELS[String(day)]?.charAt(0)}
          </button>
        ))}
      </div>
    );
  }

  const filteredSchedules = schedules.filter((s) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;

    const busMatch = s.buses
      ? s.buses.plate_number.toLowerCase().includes(query) ||
        s.buses.model.toLowerCase().includes(query)
      : false;

    const depTime = formatTime(s.departure_time).toLowerCase();
    const arrTime = formatTime(s.arrival_time).toLowerCase();
    const rawDepTime = s.departure_time?.toLowerCase() ?? "";
    const rawArrTime = s.arrival_time?.toLowerCase() ?? "";
    const timeMatch =
      depTime.includes(query) ||
      arrTime.includes(query) ||
      rawDepTime.includes(query) ||
      rawArrTime.includes(query);

    const routeMatch = s.routes
      ? s.routes.origin.toLowerCase().includes(query) ||
        s.routes.destination.toLowerCase().includes(query)
      : false;

    const driverMatch = s.users?.name?.toLowerCase().includes(query) ?? false;

    return busMatch || timeMatch || routeMatch || driverMatch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Schedules</h2>
          <p className="mt-1 text-sm text-gray-500">Manage recurring trip schedules</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="gap-2 rounded-full bg-blue-600 px-5 shadow-sm hover:shadow-md hover:bg-blue-700 transition-all active:scale-95">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Schedule
        </Button>
      </div>

      {schedules.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <svg className="mb-4 h-12 w-12 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900">No schedules</h3>
            <p className="mt-1 text-sm text-gray-500">Add your first schedule to get started.</p>
            <Button className="mt-4" onClick={() => setShowAdd(true)}>Add Schedule</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="relative max-w-md">
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search schedules by bus (car), time, route, or driver..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm shadow-sm transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {filteredSchedules.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <svg className="mb-3 h-10 w-10 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h3 className="text-sm font-semibold text-gray-950">No schedules found</h3>
                <p className="mt-1 text-xs text-gray-500">Try adjusting your search query.</p>
                <Button variant="secondary" className="mt-3 text-xs" onClick={() => setSearchQuery("")}>
                  Clear Search
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {filteredSchedules.map((s) => (
                <div
                  key={s.id}
                  className="rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: main info */}
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="truncate text-sm font-semibold text-gray-900">
                          {s.routes ? `${s.routes.origin} → ${s.routes.destination}` : "-"}
                        </h3>
                        <StatusBadge status={s.status} />
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                        <span className="inline-flex items-center gap-1">
                          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                          {formatTime(s.departure_time)} – {formatTime(s.arrival_time)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
                          {formatPrice(s.price)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                          {s.users?.name ?? "-"}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
                          {s.buses ? `${s.buses.plate_number}` : "-"}
                        </span>
                      </div>

                      <DayChips daysOfWeek={s.days_of_week} />
                    </div>

                    {/* Right: actions */}
                    <div className="flex shrink-0 gap-1.5">
                      <button
                        onClick={() => openEdit(s)}
                        className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                        title="Edit"
                      >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <form action={async () => { await toggleScheduleStatus(s.id, s.status); }}>
                        <button
                          type="submit"
                          className={`rounded-lg p-2 transition-colors ${
                            s.status === "active"
                              ? "text-amber-400 hover:bg-amber-50 hover:text-amber-600"
                              : "text-green-400 hover:bg-green-50 hover:text-green-600"
                          }`}
                          title={s.status === "active" ? "Cancel schedule" : "Activate schedule"}
                        >
                          {s.status === "active" ? (
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                          ) : (
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="20 6 9 17 4 12"/></svg>
                          )}
                        </button>
                      </form>
                      <form action={async () => { await deleteSchedule(s.id); }}>
                        <button
                          type="submit"
                          className="rounded-lg p-2 text-red-300 hover:bg-red-50 hover:text-red-500 transition-colors"
                          title="Delete"
                        >
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Schedule" className="max-w-xl">
        <form action={handleAdd} className="space-y-4">
          <Select label="Route" name="route_id" required placeholder="Select route"
            options={routes.map((r) => ({ value: r.id, label: `${r.origin} → ${r.destination}` }))} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Departure" name="departure_time" type="time" required />
            <Input label="Arrival" name="arrival_time" type="time" required />
          </div>
          <Select label="Bus" name="bus_id" required placeholder="Select bus"
            options={buses.map((b) => ({ value: b.id, label: `${b.plate_number} - ${b.model}` }))} />
          <Select label="Driver" name="driver_id" required placeholder="Select driver"
            options={drivers.map((d) => ({ value: d.id, label: d.name ?? "Unknown Driver" }))} />
          <Select label="Conductor (optional)" name="conductor_id" placeholder="Select conductor"
            options={conductorOptions} />
          <Input label="Price ($)" name="price" type="number" step="0.01" required placeholder="12.00" />
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Days of Week</label>
            <DayPicker selected={addDays} onToggle={toggleAddDay} />
          </div>
          {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => { setShowAdd(false); setAddDays([]); }}>Cancel</Button>
            <Button type="submit">Create</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!editingSch} onClose={closeEdit} title={`Edit - ${editingSch?.routes ? `${editingSch.routes.origin} → ${editingSch.routes.destination}` : ""}`} className="max-w-xl">
        <form action={handleEdit} className="space-y-4">
          <Select label="Route" name="route_id" required
            defaultValue={editingSch?.route_id ?? ""}
            options={routes.map((r) => ({ value: r.id, label: `${r.origin} → ${r.destination}` }))} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Departure" name="departure_time" type="time" required defaultValue={editingSch?.departure_time ?? ""} />
            <Input label="Arrival" name="arrival_time" type="time" required defaultValue={editingSch?.arrival_time ?? ""} />
          </div>
          <Select label="Bus" name="bus_id" required
            defaultValue={editingSch?.bus_id ?? ""}
            options={buses.map((b) => ({ value: b.id, label: `${b.plate_number} - ${b.model}` }))} />
          <Select label="Driver" name="driver_id" required
            defaultValue={editingSch?.driver_id ?? ""}
            options={drivers.map((d) => ({ value: d.id, label: d.name ?? "Unknown Driver" }))} />
          <Select label="Conductor (optional)" name="conductor_id"
            defaultValue={editingSch?.conductor_id ?? ""}
            options={conductorOptions} />
          <Input label="Price ($)" name="price" type="number" step="0.01" required defaultValue={editingSch?.price ?? ""} />
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Days of Week</label>
            <DayPicker selected={editDays} onToggle={toggleEditDay} />
          </div>
          {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={closeEdit}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
