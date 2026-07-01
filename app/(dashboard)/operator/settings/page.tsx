import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Settings, Shield, Bell, KeyRound } from "lucide-react";

export default async function OperatorSettingsPage() {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("name, email, role, operator_id")
    .eq("id", authUser.id)
    .single();

  if (profile?.role !== "operator_admin" || !profile?.operator_id) {
    redirect("/login");
  }

  const { data: operator } = await supabase
    .from("operators")
    .select("*")
    .eq("id", profile.operator_id)
    .single();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#0F172A]">System Settings</h2>
        <p className="text-xxs text-[#64748B] mt-0.5">Manage operator details, default pricing rules, and email alert channels.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Navigation Sidebar inside Settings */}
        <div className="space-y-1">
          {[
            { label: "Operator Profile", icon: Settings, active: true },
            { label: "Notification Channels", icon: Bell, active: false },
            { label: "Security & Credentials", icon: KeyRound, active: false }
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-left transition-colors ${
                  item.active
                    ? "bg-[#2563EB]/8 text-[#2563EB]"
                    : "text-[#64748B] hover:text-[#0F172A] hover:bg-gray-50"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Settings Form Column */}
        <div className="md:col-span-2 space-y-6">
          {/* Operator Profile settings */}
          <Card className="rounded-2xl shadow-xs">
            <CardHeader className="pb-2 border-b border-gray-100">
              <h3 className="text-sm font-bold text-[#0F172A]">Operator Profile</h3>
              <p className="text-xxs text-[#64748B] mt-0.5">Update details representing your transport operator.</p>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Company Name</label>
                  <Input defaultValue={operator?.name ?? "BusExpress Premium Operator"} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Contact Email</label>
                  <Input defaultValue={operator?.contact ?? "contact@operator.com"} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">System Status</label>
                  <div className="pt-1.5">
                    <Badge variant={operator?.status === "active" ? "success" : "neutral"}>
                      {operator?.status ? operator.status.toUpperCase() : "ACTIVE"}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Created At</label>
                  <Input
                    disabled
                    className="bg-gray-50/70"
                    defaultValue={
                      operator?.created_at
                        ? new Date(operator.created_at).toLocaleDateString()
                        : new Date().toLocaleDateString()
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button variant="primary">Save Changes</Button>
              </div>
            </CardContent>
          </Card>

          {/* Operations Defaults settings */}
          <Card className="rounded-2xl shadow-xs">
            <CardHeader className="pb-2 border-b border-gray-100">
              <h3 className="text-sm font-bold text-[#0F172A]">Transit Configurations</h3>
              <p className="text-xxs text-[#64748B] mt-0.5">Establish default parameters for scheduling and bus seating rules.</p>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Default Ticket Currency</label>
                  <Select
                    defaultValue="USD"
                    options={[
                      { value: "USD", label: "USD ($)" },
                      { value: "KHR", label: "KHR (៛)" }
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Default Coach Capacity</label>
                  <Input type="number" defaultValue="45" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">On-Time Threshold (minutes)</label>
                  <Input type="number" defaultValue="15" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Auto-Schedule Revalidation</label>
                  <Select
                    defaultValue="true"
                    options={[
                      { value: "true", label: "Enabled (Daily at Midnight)" },
                      { value: "false", label: "Disabled (Manual Only)" }
                    ]}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button variant="primary">Save Configuration</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
