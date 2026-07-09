"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  MessageSquare, 
  DollarSign, 
  Award, 
  TrendingUp, 
  User, 
  Sparkles,
  Search,
  Scale
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { reviewPenalty, createPendingPenaltyForSchedule } from "@/app/actions/penalties";

interface Penalty {
  id: string;
  driver_id: string;
  trip_id: string;
  delay_minutes: number;
  recommended_fine: number;
  approved_fine: number;
  status: "pending" | "approved" | "waived" | "appealed";
  driver_explanation: string | null;
  operator_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  driverName: string;
  driverEmail: string;
  tripDate: string;
  departureTime: string;
  routeName: string;
  driverPayoutRate: number;
}

interface Analytics {
  driver_id: string;
  driver_name: string;
  driver_email: string;
  completed_trips_count: number;
  gross_earnings: number;
  total_fines: number;
  net_earnings: number;
  reliability_score: number;
  total_delay_incidents: number;
  enforced_penalties_count: number;
  waived_penalties_count: number;
}

interface Props {
  initialPenalties: Penalty[];
  analytics: Analytics[];
  todayScheduledTrips?: any[];
  schedules?: any[];
}

export function PenaltiesClient({ initialPenalties, analytics, todayScheduledTrips = [], schedules = [] }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<"queue" | "analytics" | "simulator">("queue");
  
  // Search and filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Modal States
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [selectedPenalty, setSelectedPenalty] = useState<Penalty | null>(null);
  
  // Review Form States
  const [approvedFine, setApprovedFine] = useState<string>("0.00");
  const [operatorNotes, setOperatorNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // Simulator Form States
  const [simScheduleId, setSimScheduleId] = useState("");
  const [simDelay, setSimDelay] = useState("10");
  const [simMessage, setSimMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Open review modal
  const handleOpenReview = (penalty: Penalty) => {
    setSelectedPenalty(penalty);
    setApprovedFine(penalty.recommended_fine.toString());
    setOperatorNotes(penalty.operator_notes || "");
    setFormError(null);
    setIsReviewOpen(true);
  };

  // Submit review action (Approve or Waive)
  const handleReviewSubmit = async (action: "approved" | "waived") => {
    if (!selectedPenalty) return;
    setFormError(null);

    const fineNum = parseFloat(approvedFine);
    if (action === "approved" && (isNaN(fineNum) || fineNum < 0)) {
      setFormError("Please enter a valid fine amount.");
      return;
    }

    startTransition(async () => {
      const result = await reviewPenalty(
        selectedPenalty.id,
        action,
        action === "approved" ? fineNum : 0,
        operatorNotes
      );

      if (result.error) {
        setFormError(result.error);
      } else {
        setIsReviewOpen(false);
        router.refresh();
      }
    });
  };

  // Run delay simulation
  const handleSimulateDelay = async (e: React.FormEvent) => {
    e.preventDefault();
    setSimMessage(null);
    
    if (!simScheduleId) {
      setSimMessage({ type: "error", text: "Please select a schedule to simulate." });
      return;
    }

    const delayNum = parseInt(simDelay, 10);
    if (isNaN(delayNum) || delayNum < 5) {
      setSimMessage({ type: "error", text: "Delay must be at least 5 minutes to trigger penalty." });
      return;
    }

    startTransition(async () => {
      const result = await createPendingPenaltyForSchedule(simScheduleId, delayNum);
      if (result.error) {
        setSimMessage({ type: "error", text: result.error });
      } else {
        setSimMessage({ type: "success", text: `Success! Simulated delay start for this schedule today.` });
        setSimScheduleId("");
        router.refresh();
      }
    });
  };

  // Filter penalties
  const filteredPenalties = initialPenalties.filter(p => {
    const matchesSearch = 
      p.driverName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.routeName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate summary counts
  const totalPendingFines = initialPenalties
    .filter(p => p.status === "pending" || p.status === "appealed")
    .reduce((sum, p) => sum + p.recommended_fine, 0);

  const pendingCount = initialPenalties.filter(p => p.status === "pending" || p.status === "appealed").length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="warning">Pending Review</Badge>;
      case "appealed":
        return <Badge variant="danger">Appealed</Badge>;
      case "approved":
        return <Badge variant="success">Fine Enforced</Badge>;
      case "waived":
        return <Badge variant="neutral">Waived / Excused</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section with styling */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Scale className="h-6 w-6 text-blue-600" />
            Penalties & Driver Payouts
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Enforce scheduled start adherence, manage driver trip-rates, and approve or excuse delay deductions.
          </p>
        </div>

        {/* Action pills */}
        <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 shrink-0">
          <button
            onClick={() => setActiveTab("queue")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "queue" 
                ? "bg-white text-blue-600 shadow-sm" 
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Review Queue ({pendingCount})
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "analytics" 
                ? "bg-white text-blue-600 shadow-sm" 
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Driver Analytics & Earnings
          </button>
          <button
            onClick={() => setActiveTab("simulator")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "simulator" 
                ? "bg-white text-blue-600 shadow-sm" 
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Test Simulator
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100 hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Pending Penalty Fines</span>
              <p className="text-3xl font-extrabold text-amber-950">${totalPendingFines.toFixed(2)}</p>
              <p className="text-[10px] text-amber-600 font-medium">{pendingCount} alerts awaiting review</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 border border-amber-200">
              <Clock className="h-5 w-5 animate-pulse" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100 hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Average Driver Rating</span>
              <p className="text-3xl font-extrabold text-blue-950">
                {(analytics.reduce((acc, a) => acc + a.reliability_score, 0) / (analytics.length || 1)).toFixed(1)}%
              </p>
              <p className="text-[10px] text-blue-600 font-medium">Reliability metric based on delays</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 border border-blue-200">
              <Award className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100 hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Excused Delay Rate</span>
              <p className="text-3xl font-extrabold text-emerald-950">
                {(() => {
                  const totalIncidents = initialPenalties.length;
                  const waived = initialPenalties.filter(p => p.status === "waived").length;
                  return totalIncidents > 0 ? `${((waived / totalIncidents) * 100).toFixed(0)}%` : "100%";
                })()}
              </p>
              <p className="text-[10px] text-emerald-600 font-medium">Waived penalties vs. overall alerts</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 border border-emerald-200">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      {activeTab === "queue" && (
        <Card className="border-slate-200">
          <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Enforcement Approval Queue</h2>
                <p className="text-xs text-slate-500">View and resolve trips flagged with delayed tracking starts.</p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-60">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search driver or route..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 text-xs h-9 py-1 bg-white border-slate-200"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none h-9"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending Review</option>
                  <option value="appealed">Appealed</option>
                  <option value="approved">Approved</option>
                  <option value="waived">Waived</option>
                </select>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {filteredPenalties.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <AlertTriangle className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-medium">No penalty records found</p>
                <p className="text-xs text-slate-400 mt-1">Try adjusted search criteria or simulate a new delay.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                      <th className="p-3">Driver Info</th>
                      <th className="p-3">Route Details</th>
                      <th className="p-3">Delay Duration</th>
                      <th className="p-3">Recommended Fine</th>
                      <th className="p-3">Driver Explanation</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredPenalties.map((penalty) => (
                      <tr key={penalty.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-3">
                          <div className="font-semibold text-slate-900">{penalty.driverName}</div>
                          <div className="text-[10px] text-slate-400">{penalty.driverEmail}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-medium text-slate-800">{penalty.routeName}</div>
                          <div className="text-[10px] text-slate-400">
                            {penalty.tripDate} · Scheduled: {penalty.departureTime}
                          </div>
                        </td>
                        <td className="p-3 font-mono font-medium text-amber-600">
                          {penalty.delay_minutes} minutes
                        </td>
                        <td className="p-3 font-semibold text-slate-900">
                          ${penalty.recommended_fine.toFixed(2)}
                          <span className="text-[10px] text-slate-400 block font-normal">
                            Rate: ${penalty.driverPayoutRate.toFixed(2)}/trip
                          </span>
                        </td>
                        <td className="p-3 max-w-[200px] truncate">
                          {penalty.driver_explanation ? (
                            <span className="flex items-center gap-1.5 text-slate-600" title={penalty.driver_explanation}>
                              <MessageSquare className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              {penalty.driver_explanation}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">No appeal submitted</span>
                          )}
                        </td>
                        <td className="p-3">
                          {getStatusBadge(penalty.status)}
                          {penalty.status === "approved" && (
                            <span className="text-[10px] text-green-700 block font-semibold">
                              Approved: ${penalty.approved_fine.toFixed(2)}
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          {penalty.status === "pending" || penalty.status === "appealed" ? (
                            <Button
                              variant="primary"
                              onClick={() => handleOpenReview(penalty)}
                              className="text-xs h-8 px-3 shrink-0 rounded-lg"
                            >
                              Review & Action
                            </Button>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic font-medium">Reviewed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "analytics" && (
        <Card className="border-slate-200">
          <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-sm font-semibold text-slate-900">Driver Performance & Payout Statement</h2>
            <p className="text-xs text-slate-500">
              Summarized statements showing gross trip earnings, approved fines deductions, and final net earnings.
            </p>
          </CardHeader>
          <CardContent className="p-0">
            {analytics.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <User className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-medium">No drivers registered yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                      <th className="p-3">Driver Name</th>
                      <th className="p-3">Completed Trips</th>
                      <th className="p-3">Gross Earnings</th>
                      <th className="p-3 text-red-600">Approved Fines</th>
                      <th className="p-3 text-blue-600">Net Payout</th>
                      <th className="p-3">Reliability Score</th>
                      <th className="p-3">Delays Logged</th>
                      <th className="p-3">Approved / Waived</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {analytics.map((item) => (
                      <tr key={item.driver_id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-3">
                          <div className="font-semibold text-slate-900">{item.driver_name}</div>
                          <div className="text-[10px] text-slate-400">{item.driver_email}</div>
                        </td>
                        <td className="p-3 font-semibold text-slate-800">{item.completed_trips_count}</td>
                        <td className="p-3 font-medium text-slate-900">${item.gross_earnings.toFixed(2)}</td>
                        <td className="p-3 font-medium text-red-600">${item.total_fines.toFixed(2)}</td>
                        <td className="p-3 font-extrabold text-blue-600">${item.net_earnings.toFixed(2)}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${
                                  item.reliability_score >= 90 
                                    ? "bg-green-500" 
                                    : item.reliability_score >= 80 
                                      ? "bg-yellow-500" 
                                      : "bg-red-500"
                                }`} 
                                style={{ width: `${item.reliability_score}%` }}
                              />
                            </div>
                            <span className="font-semibold text-slate-800">{item.reliability_score}%</span>
                          </div>
                        </td>
                        <td className="p-3 font-mono font-medium text-amber-600">{item.total_delay_incidents}</td>
                        <td className="p-3 text-slate-500">
                          <span className="text-green-600 font-semibold">{item.enforced_penalties_count}</span>
                          {" / "}
                          <span className="text-slate-400">{item.waived_penalties_count}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "simulator" && (
        <div className="max-w-md mx-auto">
          <Card className="border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-yellow-500" />
                Trip Delay Simulator
              </h2>
              <p className="text-xs text-slate-500">
                Simulate a driver delay incident. This tool logs a pending penalty directly to test the operator approval dashboard.
              </p>
            </CardHeader>
            <CardContent className="p-5">
              <form onSubmit={handleSimulateDelay} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Select Scheduled Route / Timing</label>
                  {schedules.length === 0 ? (
                    <div className="text-xs p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
                      No active schedules found. Please create a schedule in the Schedules dashboard first.
                    </div>
                  ) : (
                    <select
                      value={simScheduleId}
                      onChange={(e) => setSimScheduleId(e.target.value)}
                      className="w-full text-xs rounded-lg border border-slate-200 bg-white p-2.5 text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none"
                    >
                      <option value="">-- Choose Schedule to Simulate today's Trip --</option>
                      {schedules.map((s: any) => {
                        return (
                          <option key={s.id} value={s.id}>
                            {s.routeName} ({s.departureTime}) - Driver: {s.driverName}
                          </option>
                        );
                      })}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Delay Duration (Minutes)</label>
                  <select
                    value={simDelay}
                    onChange={(e) => setSimDelay(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-200 bg-white p-2.5 text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none"
                  >
                    <option value="8">8 minutes late (20% fine recommendation)</option>
                    <option value="12">12 minutes late (20% fine recommendation)</option>
                    <option value="20">20 minutes late (50% fine recommendation)</option>
                    <option value="35">35 minutes late (50% fine recommendation)</option>
                  </select>
                </div>

                {simMessage && (
                  <div className={`p-3 text-xs font-medium rounded-lg border ${
                    simMessage.type === "success" 
                      ? "bg-green-50 border-green-200 text-green-800" 
                      : "bg-red-50 border-red-200 text-red-800"
                  }`}>
                    {simMessage.text}
                  </div>
                )}

                <Button
                  variant="primary"
                  type="submit"
                  disabled={isPending || todayScheduledTrips.length === 0}
                  className="w-full justify-center h-10 font-semibold"
                >
                  {isPending ? "Simulating..." : "Trigger Delay Incident"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Review Modal */}
      <Modal
        open={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        title="Review Delay Penalty"
        className="max-w-md"
      >
        {selectedPenalty && (
          <div className="space-y-4 text-xs">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1.5 text-slate-600">
              <div className="flex justify-between">
                <span className="font-medium text-slate-400">Driver</span>
                <span className="font-semibold text-slate-900">{selectedPenalty.driverName}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-slate-400">Route</span>
                <span className="font-semibold text-slate-800">{selectedPenalty.routeName}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-slate-400">Departure Delay</span>
                <span className="font-semibold text-amber-600">{selectedPenalty.delay_minutes} minutes</span>
              </div>
              <div className="flex justify-between border-t border-slate-200/60 pt-1.5 mt-1.5">
                <span className="font-medium text-slate-400">Recommended Fine</span>
                <span className="font-bold text-slate-900">${selectedPenalty.recommended_fine.toFixed(2)}</span>
              </div>
            </div>

            {selectedPenalty.driver_explanation && (
              <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg space-y-1 text-blue-900">
                <p className="font-semibold flex items-center gap-1.5 text-blue-800">
                  <MessageSquare className="h-3.5 w-3.5" />
                  Driver Appeal Explanation
                </p>
                <p className="italic text-blue-950">"{selectedPenalty.driver_explanation}"</p>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Approved Fine Amount ($)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400">$</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max={selectedPenalty.driverPayoutRate.toString()}
                    value={approvedFine}
                    onChange={(e) => setApprovedFine(e.target.value)}
                    className="pl-7 bg-white text-xs h-9"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  You can adjust the fine amount. Payout rate for this trip is ${selectedPenalty.driverPayoutRate.toFixed(2)}.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Operator Notes / Verdict Reason</label>
                <textarea
                  value={operatorNotes}
                  onChange={(e) => setOperatorNotes(e.target.value)}
                  placeholder="Explain why the penalty was waived or enforced..."
                  className="w-full text-xs rounded-lg border border-slate-200 bg-white p-2.5 text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none min-h-[70px] resize-y"
                />
              </div>
            </div>

            {formError && (
              <div className="p-2.5 text-[10px] font-semibold text-red-600 bg-red-50 border border-red-100 rounded-lg">
                {formError}
              </div>
            )}

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
              <Button
                variant="ghost"
                disabled={isPending}
                onClick={() => handleReviewSubmit("waived")}
                className="hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs"
              >
                Dismiss / Waive Penalty
              </Button>
              <Button
                variant="primary"
                disabled={isPending}
                onClick={() => handleReviewSubmit("approved")}
                className="bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs"
              >
                {isPending ? "Processing..." : "Enforce Payout Fine"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
