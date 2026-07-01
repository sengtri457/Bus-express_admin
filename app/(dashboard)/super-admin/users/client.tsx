"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import {
  createUser,
  updateUserRole,
  toggleUserStatus,
} from "@/app/actions/super-admin";
import type { User, Role } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: "passenger", label: "Passenger" },
  { value: "driver", label: "Driver" },
  { value: "conductor", label: "Conductor" },
  { value: "operator_admin", label: "Operator Admin" },
  { value: "super_admin", label: "Super Admin" },
];

const ROLE_BADGE: Record<string, "info" | "success" | "warning" | "danger" | "neutral"> = {
  super_admin: "danger",
  operator_admin: "info",
  driver: "success",
  conductor: "warning",
  passenger: "neutral",
};

interface OperatorOption {
  id: string;
  name: string;
}

interface UsersClientProps {
  users: User[];
  operators: OperatorOption[];
}

export function UsersClient({ users, operators }: UsersClientProps) {
  const router = useRouter();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>("passenger");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const PER_PAGE = 12;
  const [error, setError] = useState<string | null>(null);

  const activeCount = users.filter((u) => u.status === "active").length;
  const suspendedCount = users.filter((u) => u.status === "suspended").length;

  const filtered = search
    ? users.filter(
        (u) =>
          u.name?.toLowerCase().includes(search.toLowerCase()) ||
          u.email?.toLowerCase().includes(search.toLowerCase()),
      )
    : users;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  async function handleRoleChange(formData: FormData) {
    if (!selectedUser) return;
    setError(null);
    const role = formData.get("role") as string;
    const result = await updateUserRole(selectedUser.id, role);
    if (result?.error) setError(result.error);
    else {
      setShowRoleModal(false);
      router.refresh();
    }
  }

  const operatorOptions = operators.map((o) => ({
    value: o.id,
    label: o.name,
  }));

  const needsOperator = ["driver", "conductor", "operator_admin"].includes(selectedRole);

  async function handleAdd(formData: FormData) {
    setError(null);
    const result = await createUser(formData);
    if (result?.error) setError(result.error);
    else {
      setShowAddModal(false);
      setSelectedRole("passenger");
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Users</h2>
            <p className="text-sm text-gray-500">Manage all users across the system</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md active:scale-[0.97]"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add User
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Total Users</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{users.length}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Active</p>
          <p className="mt-1 text-2xl font-semibold text-green-600">{activeCount}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Suspended</p>
          <p className="mt-1 text-2xl font-semibold text-red-500">{suspendedCount}</p>
        </div>
      </div>

      <div className="relative">
        <svg
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="block w-full max-w-xs rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <svg className="mb-4 h-12 w-12 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900">No users found</h3>
            <p className="mt-1 text-sm text-gray-500">{search ? "Try a different search term." : "No users registered yet."}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {paginated.map((user) => (
            <div
              key={user.id}
              className="rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-sm font-semibold text-white shadow-sm">
                    {user.name?.charAt(0).toUpperCase() ?? "U"}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">{user.name}</p>
                    <p className="truncate text-xs text-gray-500">{user.email}</p>
                    {user.phone && <p className="truncate text-xs text-gray-400">{user.phone}</p>}
                    <div className="mt-1.5 flex items-center gap-2">
                      <Badge variant={ROLE_BADGE[user.role] ?? "neutral"}>
                        {user.role.replace("_", " ")}
                      </Badge>
                      <span className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium capitalize",
                        user.status === "active" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                      )}>
                        <span className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          user.status === "active" ? "bg-green-500" : "bg-red-400"
                        )} />
                        {user.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex justify-end gap-1.5 border-t border-gray-100 pt-3">
                <button
                  onClick={() => {
                    setSelectedUser(user);
                    setShowRoleModal(true);
                  }}
                  className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Role
                </button>
                <form
                  action={async () => { await toggleUserStatus(user.id, user.status); router.refresh(); }}
                >
                  <button
                    type="submit"
                    className={cn(
                      "inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                      user.status === "active"
                        ? "text-red-600 hover:bg-red-50"
                        : "text-green-600 hover:bg-green-50"
                    )}
                  >
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      {user.status === "active" ? (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      )}
                    </svg>
                    {user.status === "active" ? "Suspend" : "Activate"}
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3">
          <p className="text-sm text-gray-500">
            Page {safePage} of {totalPages}
            <span className="ml-1 text-gray-400">({filtered.length} total)</span>
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
              .map((p, idx, arr) => (
                <span key={p} className="flex items-center">
                  {idx > 0 && arr[idx - 1] !== p - 1 && (
                    <span className="px-1 text-sm text-gray-400">...</span>
                  )}
                  <button
                    onClick={() => setPage(p)}
                    className={cn(
                      "inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-colors",
                      p === safePage
                        ? "bg-blue-600 text-white"
                        : "text-gray-600 hover:bg-gray-100",
                    )}
                  >
                    {p}
                  </button>
                </span>
              ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <Modal
        open={showAddModal}
        onClose={() => { setShowAddModal(false); setSelectedRole("passenger"); }}
        title="Add User"
      >
        <form action={handleAdd} className="space-y-4">
          <Input label="Name" name="name" required placeholder="Full name" />
          <Input label="Email" name="email" type="email" required placeholder="user@example.com" />
          <Input label="Password" name="password" type="password" required minLength={6} />
          <Input label="Phone" name="phone" placeholder="+85512345678" />
          <Select
            label="Role"
            name="role"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            options={ROLE_OPTIONS}
          />
          {needsOperator && operatorOptions.length > 0 && (
            <Select
              label="Operator"
              name="operator_id"
              options={operatorOptions}
            />
          )}
          {needsOperator && operatorOptions.length === 0 && (
            <p className="text-sm text-red-600">No active operators available. Create an operator first.</p>
          )}
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => { setShowAddModal(false); setSelectedRole("passenger"); }}>
              Cancel
            </Button>
            <Button type="submit">Create</Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        title={`Change Role - ${selectedUser?.name ?? ""}`}
      >
        <form action={handleRoleChange} className="space-y-4">
          <div className="space-y-2">
            {ROLE_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50 has-checked:border-blue-500 has-checked:bg-blue-50"
              >
                <input
                  type="radio"
                  name="role"
                  value={opt.value}
                  defaultChecked={selectedUser?.role === opt.value}
                  className="h-4 w-4 text-blue-600"
                />
                <span className="text-sm font-medium text-gray-900">
                  {opt.label}
                </span>
              </label>
            ))}
          </div>
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowRoleModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Update</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
