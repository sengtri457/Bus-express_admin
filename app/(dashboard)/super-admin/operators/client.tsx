"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable, type Column } from "@/components/shared/data-table";
import {
  createOperator,
  updateOperator,
  toggleOperatorStatus,
} from "@/app/actions/super-admin";
import type { Operator } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return "-";
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

const columns: Column<Operator>[] = [
  {
    key: "name",
    header: "Name",
    render: (op) => (
      <div className="flex items-center gap-3">
        {op.logo_url ? (
          <img
            src={op.logo_url}
            alt={op.name}
            className="h-9 w-9 rounded-full object-cover ring-2 ring-gray-100"
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-sm font-semibold text-white shadow-sm">
            {op.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <p className="font-medium text-gray-900">{op.name}</p>
          <p className="text-xs text-gray-400">ID: {op.id.slice(0, 8)}...</p>
        </div>
      </div>
    ),
  },
  {
    key: "contact",
    header: "Contact",
    render: (op) =>
      op.contact ? (
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4 shrink-0 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            {op.contact.includes("@") ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            )}
          </svg>
          <span className="text-sm text-gray-600">{op.contact}</span>
        </div>
      ) : (
        <span className="text-sm text-gray-400">—</span>
      ),
  },
  {
    key: "status",
    header: "Status",
    render: (op) => <StatusBadge status={op.status} />,
  },
  {
    key: "created_at",
    header: "Created",
    render: (op) => (
      <div className="flex flex-col">
        <span className="text-sm text-gray-600">
          {formatRelativeTime(op.created_at)}
        </span>
        {op.created_at && (
          <span className="text-xs text-gray-400">
            {new Date(op.created_at).toLocaleDateString()}
          </span>
        )}
      </div>
    ),
  },
];

interface OperatorsClientProps {
  operators: Operator[];
}

export function OperatorsClient({ operators }: OperatorsClientProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [editingOp, setEditingOp] = useState<Operator | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoMode, setLogoMode] = useState<"file" | "url">("file");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const addFormRef = useRef<HTMLFormElement>(null);
  const editFormRef = useRef<HTMLFormElement>(null);

  async function handleAdd(formData: FormData) {
    setError(null);
    setSubmitting(true);
    const result = await createOperator(formData);
    setSubmitting(false);
    if (result?.error) setError(result.error);
    else {
      setShowAdd(false);
      setLogoPreview(null);
    }
  }

  async function handleEdit(formData: FormData) {
    if (!editingOp) return;
    formData.append("id", editingOp.id);
    setError(null);
    setSubmitting(true);
    const result = await updateOperator(formData);
    setSubmitting(false);
    if (result?.error) setError(result.error);
    else {
      setEditingOp(null);
      setLogoPreview(null);
    }
  }

  async function handleToggle(op: Operator) {
    setError(null);
    const result = await toggleOperatorStatus(op.id, op.status);
    if (result?.error) setError(result.error);
  }

  function openEdit(op: Operator) {
    setEditingOp(op);
    setLogoPreview(null);
    setLogoMode("file");
    setError(null);
  }

  function closeEdit() {
    setEditingOp(null);
    setLogoPreview(null);
    setError(null);
  }

  function closeAdd() {
    setShowAdd(false);
    setLogoPreview(null);
    setError(null);
  }

  const actionColumn: Column<Operator> = {
    key: "actions",
    header: "Actions",
    render: (op) => (
      <div className="flex items-center gap-2">
        <Link href={`/super-admin/reports/${op.id}`}>
          <Button variant="ghost" size="sm">
            <svg className="h-4 w-4 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
            </svg>
            Report
          </Button>
        </Link>
        <Button variant="ghost" size="sm" onClick={() => openEdit(op)}>
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit
        </Button>
        <form
          action={async () => {
            await handleToggle(op);
          }}
        >
          <Button
            type="submit"
            variant={op.status === "active" ? "outline" : "primary"}
            size="sm"
          >
            {op.status === "active" ? (
              <>
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                Suspend
              </>
            ) : (
              <>
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Activate
              </>
            )}
          </Button>
        </form>
      </div>
    ),
  };

  const activeOps = operators.filter((o) => o.status === "active").length;
  const inactiveOps = operators.filter((o) => o.status === "inactive").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Operators</h2>
            <p className="text-sm text-gray-500">Manage all bus operators across the system</p>
          </div>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md active:scale-[0.97]"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Operator
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Total Operators</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{operators.length}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Active</p>
          <p className="mt-1 text-2xl font-semibold text-green-600">{activeOps}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Inactive</p>
          <p className="mt-1 text-2xl font-semibold text-gray-400">{inactiveOps}</p>
        </div>
      </div>

      <Card className="overflow-hidden border-gray-200">
        <CardContent className="p-0">
          <DataTable
            columns={[...columns, actionColumn]}
            data={operators}
            keyExtractor={(op) => op.id}
            searchKey="name"
            searchPlaceholder="Search operators..."
            emptyTitle="No operators found"
            emptyDescription="Add your first operator to get started."
          />
        </CardContent>
      </Card>

      <Modal open={showAdd} onClose={closeAdd} title="Add Operator">
        <form ref={addFormRef} action={handleAdd} className="space-y-5">
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Basic Information</h4>
            <Input label="Name" name="name" required placeholder="e.g. Greenline Express" />
            <Input label="Contact" name="contact" placeholder="Phone or email address" />
          </div>

          <hr className="border-gray-200" />

          <div>
            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Logo</h4>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setLogoMode("file")}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                  logoMode === "file"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50",
                )}
              >
                Upload file
              </button>
              <button
                type="button"
                onClick={() => setLogoMode("url")}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                  logoMode === "url"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50",
                )}
              >
                Enter URL
              </button>
            </div>

            <div className="mt-3">
              {logoMode === "file" ? (
                <label className={cn(
                  "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6 transition-colors hover:border-blue-400 hover:bg-blue-50/50",
                  logoPreview && "p-3",
                )}>
                  {logoPreview ? (
                    <img src={logoPreview} alt="Preview" className="h-20 w-20 rounded-lg object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-center">
                      <svg className="h-8 w-8 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Click to upload logo</p>
                        <p className="text-xs text-gray-400">PNG, JPG up to 5MB</p>
                      </div>
                    </div>
                  )}
                  <input
                    type="file"
                    name="logo"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setLogoPreview(URL.createObjectURL(file));
                    }}
                  />
                </label>
              ) : (
                <Input
                  type="url"
                  name="logo_url"
                  placeholder="https://example.com/logo.png"
                  onChange={(e) => {
                    if (e.target.value) setLogoPreview(e.target.value);
                  }}
                />
              )}
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 flex items-center gap-2">
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <Button type="button" variant="secondary" onClick={closeAdd}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Create Operator
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!editingOp}
        onClose={closeEdit}
        title={`Edit Operator`}
      >
        <form ref={editFormRef} action={handleEdit} className="space-y-5">
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Basic Information</h4>
            <Input
              label="Name"
              name="name"
              required
              defaultValue={editingOp?.name ?? ""}
            />
            <Input
              label="Contact"
              name="contact"
              defaultValue={editingOp?.contact ?? ""}
            />
            <Select
              label="Status"
              name="status"
              defaultValue={editingOp?.status ?? "active"}
              options={[
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
              ]}
            />
          </div>

          <hr className="border-gray-200" />

          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Logo</h4>
              {editingOp?.logo_url && (
                <button
                  type="button"
                  onClick={() => {
                    setLogoPreview(null);
                    document.getElementById("remove-logo")?.setAttribute("value", "true");
                  }}
                  className="text-xs font-medium text-red-600 hover:text-red-700"
                >
                  Remove logo
                </button>
              )}
            </div>

            <input type="hidden" id="remove-logo" name="remove_logo" value="" />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setLogoMode("file")}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                  logoMode === "file"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50",
                )}
              >
                Upload file
              </button>
              <button
                type="button"
                onClick={() => setLogoMode("url")}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                  logoMode === "url"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50",
                )}
              >
                Enter URL
              </button>
            </div>

            <div className="mt-3">
              {(logoPreview || editingOp?.logo_url) && logoMode === "file" ? (
                <label className={cn(
                  "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-3 transition-colors hover:border-blue-400 hover:bg-blue-50/50",
                )}>
                  <img
                    src={logoPreview ?? editingOp?.logo_url ?? ""}
                    alt="Preview"
                    className="h-20 w-20 rounded-lg object-cover"
                  />
                  <p className="mt-2 text-xs text-gray-400">Click to change</p>
                  <input
                    type="file"
                    name="logo"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setLogoPreview(URL.createObjectURL(file));
                    }}
                  />
                </label>
              ) : (logoPreview || editingOp?.logo_url) && logoMode === "url" ? (
                <div className="space-y-2">
                  {logoPreview && (
                    <img
                      src={logoPreview}
                      alt="Preview"
                      className="h-20 w-20 rounded-lg object-cover"
                    />
                  )}
                  <input
                    type="url"
                    name="logo_url"
                    defaultValue={!logoPreview ? editingOp?.logo_url ?? "" : ""}
                    placeholder="https://example.com/logo.png"
                    onChange={(e) => {
                      if (e.target.value) setLogoPreview(e.target.value);
                    }}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              ) : logoMode === "file" ? (
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6 transition-colors hover:border-blue-400 hover:bg-blue-50/50">
                  <svg className="h-8 w-8 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="mt-2 text-sm font-medium text-gray-600">Click to upload logo</p>
                  <p className="text-xs text-gray-400">PNG, JPG up to 5MB</p>
                  <input
                    type="file"
                    name="logo"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setLogoPreview(URL.createObjectURL(file));
                    }}
                  />
                </label>
              ) : (
                <input
                  type="url"
                  name="logo_url"
                  placeholder="https://example.com/logo.png"
                  onChange={(e) => {
                    if (e.target.value) setLogoPreview(e.target.value);
                  }}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              )}
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 flex items-center gap-2">
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <Button type="button" variant="secondary" onClick={closeEdit}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
