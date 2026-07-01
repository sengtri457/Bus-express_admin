"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable, type Column } from "@/components/shared/data-table";
import {
  createPromotion,
  updatePromotion,
  togglePromotionStatus,
} from "@/app/actions/super-admin";
import type { Promotion } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

const columns: Column<Promotion>[] = [
  {
    key: "code",
    header: "Code",
    render: (p) => (
      <span className="font-mono font-semibold uppercase tracking-wide">{p.code}</span>
    ),
  },
  {
    key: "discount_type",
    header: "Type",
  },
  {
    key: "discount_value",
    header: "Value",
    render: (p) =>
      p.discount_type === "percentage" ? `${p.discount_value}%` : `$${p.discount_value.toFixed(2)}`,
  },
  {
    key: "min_purchase",
    header: "Min Purchase",
    render: (p) => (p.min_purchase ? `$${p.min_purchase.toFixed(2)}` : "-"),
  },
  {
    key: "used_count",
    header: "Used",
    render: (p) => `${p.used_count}${p.max_usage ? ` / ${p.max_usage}` : ""}`,
  },
  {
    key: "is_active",
    header: "Status",
    render: (p) => (
      <StatusBadge status={p.is_active ? "active" : "inactive"} />
    ),
  },
  {
    key: "expires_at",
    header: "Expires",
    render: (p) =>
      p.expires_at ? new Date(p.expires_at).toLocaleDateString() : "-",
  },
];

interface PromotionsClientProps {
  promotions: Promotion[];
}

export function PromotionsClient({ promotions }: PromotionsClientProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(formData: FormData) {
    setError(null);
    const result = await createPromotion(formData);
    if (result?.error) setError(result.error);
    else setShowAdd(false);
  }

  async function handleEdit(formData: FormData) {
    if (!editing) return;
    formData.append("id", editing.id);
    setError(null);
    const result = await updatePromotion(formData);
    if (result?.error) setError(result.error);
    else setEditing(null);
  }

  function openEdit(p: Promotion) {
    setEditing(p);
    setError(null);
  }

  function closeEdit() {
    setEditing(null);
    setError(null);
  }

  const today = new Date().toISOString().split("T")[0];

  const activePromos = promotions.filter((p) => p.is_active).length;
  const expiredPromos = promotions.filter(
    (p) => p.expires_at && new Date(p.expires_at) < new Date()
  ).length;

  const actionColumn: Column<Promotion> = {
    key: "actions",
    header: "Actions",
    render: (p) => (
      <div className="flex items-center gap-1">
        <button
          onClick={() => openEdit(p)}
          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit
        </button>
        <form
          action={async () => {
            await togglePromotionStatus(p.id, p.is_active);
          }}
        >
          <button
            type="submit"
            className={cn(
              "inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
              p.is_active
                ? "text-red-600 hover:bg-red-50"
                : "text-green-600 hover:bg-green-50"
            )}
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              {p.is_active ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              )}
            </svg>
            {p.is_active ? "Deactivate" : "Activate"}
          </button>
        </form>
      </div>
    ),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Promotions</h2>
            <p className="text-sm text-gray-500">Manage promo codes and discounts</p>
          </div>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md active:scale-[0.97]"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Promotion
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Total Promotions</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{promotions.length}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Active</p>
          <p className="mt-1 text-2xl font-semibold text-green-600">{activePromos}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Expired</p>
          <p className="mt-1 text-2xl font-semibold text-red-400">{expiredPromos}</p>
        </div>
      </div>

      <Card className="overflow-hidden border-gray-200">
        <CardContent className="p-0">
          <DataTable
            columns={[...columns, actionColumn]}
            data={promotions}
            keyExtractor={(p) => p.id}
            searchKey="code"
            searchPlaceholder="Search promotions..."
            emptyTitle="No promotions found"
            emptyDescription="Create your first promo code."
          />
        </CardContent>
      </Card>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Promotion">
        <form action={handleAdd} className="space-y-4">
          <Input label="Code" name="code" required placeholder="SUMMER25" />
          <Select
            label="Discount Type"
            name="discount_type"
            required
            options={[
              { value: "percentage", label: "Percentage (%)" },
              { value: "fixed", label: "Fixed ($)" },
            ]}
          />
          <Input label="Discount Value" name="discount_value" type="number" min="0" step="0.01" required />
          <Input label="Min Purchase ($)" name="min_purchase" type="number" min="0" step="0.01" />
          <Input label="Max Total Uses" name="max_usage" type="number" min="1" />
          <Input label="Max Uses Per User" name="max_per_user" type="number" min="1" />
          <Input label="Expires At" name="expires_at" type="date" min={today} />
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
            <Button type="submit">Create</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!editing} onClose={closeEdit} title={`Edit - ${editing?.code ?? ""}`}>
        <form action={handleEdit} className="space-y-4">
          <Input label="Code" name="code" required defaultValue={editing?.code ?? ""} />
          <Select
            label="Discount Type"
            name="discount_type"
            required
            defaultValue={editing?.discount_type ?? "percentage"}
            options={[
              { value: "percentage", label: "Percentage (%)" },
              { value: "fixed", label: "Fixed ($)" },
            ]}
          />
          <Input label="Discount Value" name="discount_value" type="number" min="0" step="0.01" required defaultValue={String(editing?.discount_value ?? "")} />
          <Input label="Min Purchase ($)" name="min_purchase" type="number" min="0" step="0.01" defaultValue={editing?.min_purchase ? String(editing.min_purchase) : ""} />
          <Input label="Max Total Uses" name="max_usage" type="number" min="1" defaultValue={editing?.max_usage ? String(editing.max_usage) : ""} />
          <Input label="Max Uses Per User" name="max_per_user" type="number" min="1" defaultValue={editing?.max_per_user ? String(editing.max_per_user) : ""} />
          <Input label="Expires At" name="expires_at" type="date" min={today} defaultValue={editing?.expires_at ? editing.expires_at.split("T")[0] : ""} />
          <Select
            label="Active"
            name="is_active"
            defaultValue={editing?.is_active ? "true" : "false"}
            options={[
              { value: "true", label: "Active" },
              { value: "false", label: "Inactive" },
            ]}
          />
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={closeEdit}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
