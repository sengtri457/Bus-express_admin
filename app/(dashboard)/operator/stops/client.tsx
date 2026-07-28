"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { createStop, updateStop, deleteStop } from "@/app/actions/operator";
import type { Stop } from "@/lib/types";

interface StopsClientProps {
  stops: Stop[];
}

export function StopsClient({ stops }: StopsClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Stop | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = stops.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  async function handleAdd(formData: FormData) {
    setError(null);
    const result = await createStop(formData);
    if (result?.error) setError(result.error);
    else { setShowAdd(false); router.refresh(); }
  }

  async function handleEdit(formData: FormData) {
    if (!editing) return;
    formData.append("id", editing.id);
    setError(null);
    const result = await updateStop(formData);
    if (result?.error) setError(result.error);
    else { setEditing(null); router.refresh(); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Stops</h2>
          <p className="mt-1 text-sm text-gray-500">Manage stop locations used across your routes</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="gap-2 rounded-full bg-blue-600 px-5 shadow-sm hover:shadow-md hover:bg-blue-700 transition-all active:scale-95">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Stop
        </Button>
      </div>

      {stops.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <svg className="mb-4 h-12 w-12 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900">No stops</h3>
            <p className="mt-1 text-sm text-gray-500">Add stops that your routes will pass through.</p>
            <Button className="mt-4" onClick={() => setShowAdd(true)}>Add Stop</Button>
          </CardContent>
        </Card>
      ) : (
        <div>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search stops..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full max-w-xs rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Latitude</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Longitude</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                    <td className="px-4 py-3 text-gray-500">{s.lat ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-500">{s.lng ?? "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => { setEditing(s); setError(null); }}
                        className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                        title="Edit"
                      >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      <form
                        action={async () => {
                          if (confirm("Delete this stop? It will be removed from all routes.")) {
                            await deleteStop(s.id);
                            router.refresh();
                          }
                        }}
                        style={{ display: "inline" }}
                      >
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-gray-400">
                No stops match your search.
              </div>
            )}
          </div>
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Stop">
        <form action={handleAdd} className="space-y-4">
          <Input label="Stop Name" name="name" required placeholder="e.g. Central Market, Olympic Stadium" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Latitude" name="lat" type="number" step="any" placeholder="11.5564" />
            <Input label="Longitude" name="lng" type="number" step="any" placeholder="104.9282" />
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
          <Input label="Stop Name" name="name" required defaultValue={editing?.name ?? ""} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Latitude" name="lat" type="number" step="any" defaultValue={editing?.lat?.toString() ?? ""} />
            <Input label="Longitude" name="lng" type="number" step="any" defaultValue={editing?.lng?.toString() ?? ""} />
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
