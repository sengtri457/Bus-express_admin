import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { UsersClient } from "./client";

export default async function SuperAdminUsers() {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", authUser.id)
    .single();
  if (profile?.role !== "super_admin") redirect("/login");

  const [usersRes, operatorsRes] = await Promise.all([
    supabase.from("users").select("*").order("created_at", { ascending: false }),
    supabase.from("operators").select("id, name").eq("status", "active").order("name"),
  ]);

  if (usersRes.error) {
    return (
      <Card>
        <CardContent>
          <p className="text-red-600">Failed to load users: {usersRes.error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return <UsersClient users={usersRes.data ?? []} operators={operatorsRes.data ?? []} />;
}
