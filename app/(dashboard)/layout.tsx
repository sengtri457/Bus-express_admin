import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";

async function DashboardContent({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("id, name, email, role, status, operator_id")
    .eq("id", authUser.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  const role = profile.role as "super_admin" | "operator_admin";

  if (role !== "super_admin" && role !== "operator_admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="mt-2 text-gray-500">
            You do not have permission to access this panel.
          </p>
        </div>
      </div>
    );
  }

  let logoUrl: string | null = null;
  if (role === "operator_admin" && profile.operator_id) {
    const { data: operator } = await supabase
      .from("operators")
      .select("logo_url")
      .eq("id", profile.operator_id)
      .single();
    logoUrl = operator?.logo_url ?? null;
  }

  return (
    <DashboardShell
      user={{
        name: profile.name,
        email: profile.email,
        role: profile.role,
      }}
      role={role}
      logoUrl={logoUrl}
    >
      {children}
    </DashboardShell>
  );
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-[#F8FAFC]"><div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" /></div>}>
      <DashboardContent>{children}</DashboardContent>
    </Suspense>
  );
}
