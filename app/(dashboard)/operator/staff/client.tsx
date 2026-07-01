"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { createStaff, toggleStaffStatus } from "@/app/actions/operator";
import type { User } from "@/lib/types";

interface StaffClientProps {
  staff: User[];
  operatorId: string;
}

const ROLE_ICONS: Record<string, string> = {
  driver: "text-blue-600 bg-blue-50",
  conductor: "text-purple-600 bg-purple-50",
};

export function StaffClient({ staff, operatorId }: StaffClientProps) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(formData: FormData) {
    formData.append("operator_id", operatorId);
    setError(null);
    const result = await createStaff(formData);
    if (result?.error) setError(result.error);
    else { setShowAdd(false); router.refresh(); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Staff</h2>
          <p className="mt-1 text-sm text-gray-500">Manage drivers and conductors</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="gap-2 rounded-full bg-blue-600 px-5 shadow-sm hover:shadow-md hover:bg-blue-700 transition-all active:scale-95">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Staff
        </Button>
      </div>

      {staff.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <svg className="mb-4 h-12 w-12 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
            </svg>
            <h3 className="text-lg font-semibold text-gray-900">No staff</h3>
            <p className="mt-1 text-sm text-gray-500">Add drivers and conductors to manage your operations.</p>
            <Button className="mt-4" onClick={() => setShowAdd(true)}>Add Staff</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {staff.map((u) => (
            <div
              key={u.id}
              className="rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    ROLE_ICONS[u.role] ?? "bg-gray-100 text-gray-500"
                  }`}>
                    {(u.name ?? u.role).charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">{u.name ?? "—"}</p>
                    <p className="truncate text-xs text-gray-500">{u.email ?? u.phone ?? "—"}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant="info" className="text-[10px] uppercase tracking-wider">{u.role}</Badge>
                      <StatusBadge status={u.status} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex justify-end border-t border-gray-100 pt-3">
                <form
                  action={async () => { await toggleStaffStatus(u.id, u.status); router.refresh(); }}
                >
                  <button
                    type="submit"
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      u.status === "active"
                        ? "text-amber-500 hover:bg-amber-50"
                        : "text-green-500 hover:bg-green-50"
                    }`}
                  >
                    {u.status === "active" ? "Suspend" : "Activate"}
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Staff">
        <form action={handleAdd} className="space-y-4">
          <Input label="Full Name" name="name" required placeholder="Staff name" />
          <Input label="Email" name="email" type="email" required placeholder="staff@example.com" />
          <Input label="Phone" name="phone" placeholder="+855 12 345 678" />
          <Input label="Password" name="password" type="password" required placeholder="Set initial password" />
          <Select
            label="Role"
            name="role"
            required
            placeholder="Select role"
            options={[
              { value: "driver", label: "Driver" },
              { value: "conductor", label: "Conductor" },
            ]}
          />
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
