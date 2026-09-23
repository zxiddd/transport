"use client";

import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { JobCard, TheftAuditRecord } from "@/types/workshop";
import {
  Download,
  Search,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Printer,
  X,
  AlertCircle,
} from "lucide-react";
import { PrintableJobCard } from "./PrintableJobCard";

const PILOT_BASELINE_JOBS: JobCard[] = [
  {
    id: "job-pilot-01",
    jobCardNumber: "TT-2026-8914",
    companyId: "tala-transport",
    trailerPlate: "7842-JED",
    trailerModel: "Flatbed 40ft",
    driverId: "driver-7842-JED",
    driverName: "Ahmed Al-Ghamdi",
    driverIqama: "2489102934",
    operatorName: "Yard Coordinator",
    items: [
      {
        id: "line-01",
        partName: "Drive Tire 315/80 R22.5",
        category: "Tires",
        axlePosition: "Trailer Axle 1",
        action: "replace",
        quantity: 2,
        unitCostSAR: 950,
        subtotalSAR: 1900,
        isFlagged: false,
      },
      {
        id: "line-02",
        partName: "Front Brake Pads",
        category: "Brakes",
        axlePosition: "Trailer Axle 1",
        action: "replace",
        quantity: 1,
        unitCostSAR: 450,
        subtotalSAR: 450,
        isFlagged: false,
      },
    ],
    subtotalSAR: 2350,
    vatAmountSAR: 352.5,
    grandTotalSAR: 2702.5,
    status: "completed",
    createdAt: {
      toDate: () => new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    } as any,
  },
  {
    id: "job-pilot-02",
    jobCardNumber: "TT-2026-7241",
    companyId: "tala-transport",
    trailerPlate: "3195-JED",
    trailerModel: "Curtain Sider",
    driverId: "driver-3195-JED",
    driverName: "Tariq Mansoor",
    driverIqama: "2341908273",
    operatorName: "Yard Coordinator",
    items: [
      {
        id: "line-03",
        partName: "Air Brake Booster",
        category: "Brakes",
        axlePosition: "Trailer Axle 2",
        action: "replace",
        quantity: 1,
        unitCostSAR: 320,
        subtotalSAR: 320,
        isFlagged: false,
      },
      {
        id: "line-04",
        partName: "Wheel Hub Bearing & Seal",
        category: "Suspension",
        axlePosition: "Trailer Axle 2",
        action: "replace",
        quantity: 2,
        unitCostSAR: 680,
        subtotalSAR: 1360,
        isFlagged: true,
        authorizedByPin: true,
        overrideNote: "Emergency highway bearing failure verified during transit check.",
      },
    ],
    subtotalSAR: 1680,
    vatAmountSAR: 252,
    grandTotalSAR: 1932,
    status: "completed",
    createdAt: {
      toDate: () => new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
    } as any,
  },
];

const PILOT_BASELINE_AUDITS: TheftAuditRecord[] = [
  {
    id: "audit-pilot-01",
    companyId: "tala-transport",
    trailerPlate: "7842-JED",
    driverName: "Ahmed Al-Ghamdi",
    partName: "Drive Tire 315/80 R22.5",
    axlePosition: "Trailer Axle 1",
    daysSinceLastService: 14,
    previousJobId: "TT-2026-8914",
    actionTaken: "BLOCKED",
    managerNote: "Coordinator rejected duplicate claim; tire replaced 14 days ago on Axle 1.",
    timestamp: {
      toDate: () => new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    } as any,
  },
];

interface LedgerViewProps {
  refreshTrigger?: number;
}

export function LedgerView({ refreshTrigger }: LedgerViewProps = {}) {
  const { companyId } = useAuth();
  const targetCid = companyId || "tala-transport";

  const [jobCards, setJobCards] = useState<JobCard[]>([]);
  const [auditLogs, setAuditLogs] = useState<TheftAuditRecord[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filter state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "CLEAN" | "FLAGGED_OVERRIDE" | "BLOCKED_FRAUD"
  >("ALL");
  const [dateFilter, setDateFilter] = useState<"ALL" | "7DAYS" | "30DAYS">("ALL");

  // Selected job card for A4 printing modal
  const [selectedJob, setSelectedJob] = useState<JobCard | null>(null);

  // Fetch Records - Instant 0ms load with background sync
  useEffect(() => {
    // 1. Instant local storage retrieval
    let localJobs: JobCard[] = [];
    let localAudits: TheftAuditRecord[] = [];

    if (typeof window !== "undefined") {
      try {
        const jStr = localStorage.getItem(`tala_jobs_${targetCid}`);
        if (jStr) localJobs = JSON.parse(jStr);
        const aStr = localStorage.getItem(`tala_audits_${targetCid}`);
        if (aStr) localAudits = JSON.parse(aStr);
      } catch {}
    }

    // Merge immediately with baseline
    const mergedJobs = [...localJobs];
    for (const bj of PILOT_BASELINE_JOBS) {
      if (!mergedJobs.some((m) => m.jobCardNumber === bj.jobCardNumber)) {
        mergedJobs.push(bj);
      }
    }
    setJobCards(mergedJobs);

    const mergedAudits = [...localAudits];
    for (const ba of PILOT_BASELINE_AUDITS) {
      if (!mergedAudits.some((m) => m.id === ba.id)) {
        mergedAudits.push(ba);
      }
    }
    setAuditLogs(mergedAudits);

    // 2. Non-blocking parallel background sync with Firestore (never blocks UI)
    if (isFirebaseConfigured && db) {
      Promise.allSettled([
        getDocs(
          query(
            collection(db, "job_cards"),
            where("companyId", "==", targetCid),
            orderBy("createdAt", "desc")
          )
        ),
        getDocs(
          query(
            collection(db, "theft_audit_records"),
            where("companyId", "==", targetCid),
            orderBy("timestamp", "desc")
          )
        ),
      ]).then(([jobsSnapRes, auditSnapRes]) => {
        if (jobsSnapRes.status === "fulfilled" && jobsSnapRes.value?.docs) {
          const cloudJobs = jobsSnapRes.value.docs.map((d: any) => d.data() as JobCard);
          if (cloudJobs.length > 0) {
            setJobCards((prev) => {
              const combined = [...cloudJobs];
              for (const p of prev) {
                if (!combined.some((c) => c.jobCardNumber === p.jobCardNumber)) {
                  combined.push(p);
                }
              }
              return combined;
            });
          }
        }

        if (auditSnapRes.status === "fulfilled" && auditSnapRes.value?.docs) {
          const cloudAudits = auditSnapRes.value.docs.map(
            (d: any) => d.data() as TheftAuditRecord
          );
          if (cloudAudits.length > 0) {
            setAuditLogs((prev) => {
              const combined = [...cloudAudits];
              for (const a of prev) {
                if (!combined.some((c) => c.id === a.id)) {
                  combined.push(a);
                }
              }
              return combined;
            });
          }
        }
      }).catch(() => {});
    }
  }, [targetCid, refreshTrigger]);

  // Combined stats
  const totalSpendSAR = jobCards.reduce((acc, j) => acc + j.grandTotalSAR, 0);
  const totalOverrides = jobCards.filter((j) =>
    j.items.some((i) => i.authorizedByPin)
  ).length;
  const totalBlockedClaims = auditLogs.filter(
    (a) => a.actionTaken === "BLOCKED"
  ).length;
  const blockedSavingsSAR = totalBlockedClaims * 950;

  // Combine and Filter Records
  const filteredJobs = jobCards.filter((job) => {
    const queryLower = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !queryLower ||
      job.jobCardNumber.toLowerCase().includes(queryLower) ||
      job.trailerPlate.toLowerCase().includes(queryLower) ||
      job.driverName.toLowerCase().includes(queryLower) ||
      job.items.some((i) => i.partName.toLowerCase().includes(queryLower));

    if (!matchesSearch) return false;

    const hasOverride = job.items.some((i) => i.authorizedByPin);
    if (statusFilter === "CLEAN" && hasOverride) return false;
    if (statusFilter === "FLAGGED_OVERRIDE" && !hasOverride) return false;
    if (statusFilter === "BLOCKED_FRAUD") return false;

    if (dateFilter !== "ALL") {
      const jobDate = job.createdAt?.toDate
        ? job.createdAt.toDate()
        : new Date();
      const diffDays =
        (new Date().getTime() - jobDate.getTime()) / (1000 * 3600 * 24);
      if (dateFilter === "7DAYS" && diffDays > 7) return false;
      if (dateFilter === "30DAYS" && diffDays > 30) return false;
    }

    return true;
  });

  const filteredBlockedAudits = auditLogs.filter(
    (log) => log.actionTaken === "BLOCKED"
  );

  const handleExportCSV = () => {
    if (filteredJobs.length === 0) {
      setToastMessage("No records match your filter criteria to export.");
      setTimeout(() => setToastMessage(null), 3500);
      return;
    }

    const headers = [
      "Job ID",
      "Date",
      "Trailer Plate",
      "Trailer Model",
      "Driver Name",
      "Driver Iqama",
      "Parts Replaced",
      "Axle Positions",
      "Subtotal (SAR)",
      "VAT (SAR)",
      "Grand Total (SAR)",
      "Anti-Theft Status",
      "Manager Override Justification",
    ];

    const rows = filteredJobs.map((job) => {
      const dateStr = job.createdAt?.toDate
        ? job.createdAt.toDate().toISOString()
        : new Date().toISOString();
      const partsStr = job.items.map((i) => i.partName).join(" | ");
      const axlesStr = job.items.map((i) => i.axlePosition).join(" | ");
      const hasOverride = job.items.some((i) => i.authorizedByPin);
      const overrideNotes = job.items
        .filter((i) => i.overrideNote)
        .map((i) => i.overrideNote)
        .join(" ; ");

      return [
        `"${job.jobCardNumber}"`,
        `"${dateStr}"`,
        `"${job.trailerPlate}"`,
        `"${job.trailerModel}"`,
        `"${job.driverName}"`,
        `"${job.driverIqama}"`,
        `"${partsStr}"`,
        `"${axlesStr}"`,
        job.subtotalSAR.toFixed(2),
        job.vatAmountSAR.toFixed(2),
        job.grandTotalSAR.toFixed(2),
        `"${hasOverride ? "PIN Authorized Override" : "Clean Maintenance"}"`,
        `"${overrideNotes || "N/A"}"`,
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Tala_Transport_Audit_Ledger_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Toast message if any */}
      {toastMessage && (
        <div className="p-3.5 bg-black/[0.85] text-white text-xs font-medium rounded-2xl flex items-center justify-between shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-white/70 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* KPI Stats Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-black/[0.06] rounded-2xl p-4 sm:p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <span className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider block mb-1">
            Total Work Orders
          </span>
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1D1D1F]">
            {jobCards.length}
          </span>
          <p className="text-[11px] text-[#86868B] mt-1">Verified yard service orders</p>
        </div>

        <div className="bg-white border border-black/[0.06] rounded-2xl p-4 sm:p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <span className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider block mb-1">
            Total Spend (SAR)
          </span>
          <span className="text-2xl sm:text-3xl font-mono font-bold tracking-tight text-[#1D1D1F]">
            {totalSpendSAR.toLocaleString("en-US", { maximumFractionDigits: 0 })}
          </span>
          <p className="text-[11px] text-[#86868B] mt-1">Including 15% ZATCA VAT</p>
        </div>

        <div className="bg-emerald-50/70 border border-emerald-200/70 rounded-2xl p-4 sm:p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider block mb-1 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Theft Blocked (SAR)
          </span>
          <span className="text-2xl sm:text-3xl font-mono font-bold tracking-tight text-emerald-700">
            +{blockedSavingsSAR.toLocaleString("en-US")}
          </span>
          <p className="text-[11px] text-emerald-800/80 mt-1">
            {totalBlockedClaims} duplicate claims stopped
          </p>
        </div>

        <div className="bg-white border border-black/[0.06] rounded-2xl p-4 sm:p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <span className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider block mb-1">
            Supervisor Overrides
          </span>
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-amber-600">
            {totalOverrides}
          </span>
          <p className="text-[11px] text-[#86868B] mt-1">PIN logged with justification</p>
        </div>
      </div>

      {/* Main Ledger Card */}
      <div className="bg-white border border-black/[0.06] rounded-3xl p-6 sm:p-8 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-6">
        {/* Header & Export Action */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-black/[0.06] pb-5">
          <div>
            <h2 className="text-lg font-semibold text-[#1D1D1F] tracking-tight">
              Audit Ledger & Maintenance History
            </h2>
            <p className="text-xs text-[#86868B]">
              Real-time audit log of all completed job cards, price calculations, and anti-theft overrides
            </p>
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            className="h-9 px-4 bg-[#1D1D1F] hover:bg-black text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#86868B]">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Plate (7842-JED), Driver, or Part..."
              className="w-full h-10 pl-9 pr-8 bg-black/[0.03] border border-black/[0.08] rounded-xl text-xs font-medium text-[#1D1D1F] focus:bg-white focus:border-emerald-500 transition-all outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#86868B] hover:text-[#1D1D1F]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                statusFilter === "ALL"
                  ? "bg-[#1D1D1F] text-white"
                  : "bg-black/[0.04] text-[#86868B] hover:text-[#1D1D1F]"
              }`}
            >
              All ({jobCards.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("CLEAN")}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                statusFilter === "CLEAN"
                  ? "bg-emerald-600 text-white"
                  : "bg-black/[0.04] text-[#86868B] hover:text-[#1D1D1F]"
              }`}
            >
              Clean Service
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("FLAGGED_OVERRIDE")}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                statusFilter === "FLAGGED_OVERRIDE"
                  ? "bg-amber-600 text-white"
                  : "bg-black/[0.04] text-[#86868B] hover:text-[#1D1D1F]"
              }`}
            >
              Overrides ({totalOverrides})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("BLOCKED_FRAUD")}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                statusFilter === "BLOCKED_FRAUD"
                  ? "bg-red-600 text-white"
                  : "bg-black/[0.04] text-[#86868B] hover:text-[#1D1D1F]"
              }`}
            >
              Blocked Fraud ({totalBlockedClaims})
            </button>

            <span className="text-black/20 mx-1">|</span>

            <button
              type="button"
              onClick={() => setDateFilter("ALL")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                dateFilter === "ALL"
                  ? "bg-black/[0.08] text-[#1D1D1F] font-semibold"
                  : "text-[#86868B] hover:text-[#1D1D1F]"
              }`}
            >
              All Time
            </button>
            <button
              type="button"
              onClick={() => setDateFilter("7DAYS")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                dateFilter === "7DAYS"
                  ? "bg-black/[0.08] text-[#1D1D1F] font-semibold"
                  : "text-[#86868B] hover:text-[#1D1D1F]"
              }`}
            >
              7 Days
            </button>
            <button
              type="button"
              onClick={() => setDateFilter("30DAYS")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                dateFilter === "30DAYS"
                  ? "bg-black/[0.08] text-[#1D1D1F] font-semibold"
                  : "text-[#86868B] hover:text-[#1D1D1F]"
              }`}
            >
              30 Days
            </button>
          </div>
        </div>

        {/* Records Table or Empty State */}
        {statusFilter === "BLOCKED_FRAUD" ? (
          /* Render Blocked Fraud Audits Table */
          <div className="border border-black/[0.08] rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-black/[0.03] text-[#86868B] uppercase text-[10px] font-semibold border-b border-black/[0.06]">
                <tr>
                  <th className="py-2.5 px-3.5">Timestamp</th>
                  <th className="py-2.5 px-3.5">Trailer Plate</th>
                  <th className="py-2.5 px-3.5">Driver</th>
                  <th className="py-2.5 px-3.5">Flagged Part</th>
                  <th className="py-2.5 px-3.5">Status</th>
                  <th className="py-2.5 px-3.5">Anti-Theft Enforcement Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.06]">
                {filteredBlockedAudits.map((log) => (
                  <tr key={log.id} className="hover:bg-black/[0.02]">
                    <td className="py-3 px-3.5 font-mono text-[11px] text-[#86868B]">
                      {log.timestamp?.toDate
                        ? log.timestamp.toDate().toLocaleDateString("en-GB")
                        : "Recent"}
                    </td>
                    <td className="py-3 px-3.5 font-mono font-bold text-[#1D1D1F]">
                      {log.trailerPlate}
                    </td>
                    <td className="py-3 px-3.5 font-medium text-[#1D1D1F]">
                      {log.driverName}
                    </td>
                    <td className="py-3 px-3.5 font-semibold text-[#1D1D1F]">
                      {log.partName} ({log.axlePosition})
                    </td>
                    <td className="py-3 px-3.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
                        <ShieldAlert className="w-3 h-3" />
                        BLOCKED THEFT
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-xs text-[#86868B]">
                      {log.managerNote}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-black/[0.08] rounded-2xl space-y-2">
            <p className="text-xs font-semibold text-[#86868B]">
              No job cards match the current search or filters.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("ALL");
              }}
              className="text-xs text-emerald-600 hover:underline font-medium"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="border border-black/[0.08] rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-black/[0.03] text-[#86868B] uppercase text-[10px] font-semibold border-b border-black/[0.06]">
                <tr>
                  <th className="py-2.5 px-3.5">Job Card #</th>
                  <th className="py-2.5 px-3.5">Trailer Plate</th>
                  <th className="py-2.5 px-3.5">Driver</th>
                  <th className="py-2.5 px-3.5">Replaced Parts</th>
                  <th className="py-2.5 px-3.5 text-right">Total (SAR)</th>
                  <th className="py-2.5 px-3.5 text-center">Anti-Theft Status</th>
                  <th className="py-2.5 px-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.06]">
                {filteredJobs.map((job) => {
                  const hasOverride = job.items.some((i) => i.authorizedByPin);
                  return (
                    <tr key={job.id} className="hover:bg-black/[0.02] transition-colors">
                      <td className="py-3 px-3.5 font-mono font-bold text-[#1D1D1F]">
                        {job.jobCardNumber}
                      </td>
                      <td className="py-3 px-3.5">
                        <span className="font-mono font-bold text-[#1D1D1F]">
                          {job.trailerPlate}
                        </span>
                        <span className="block text-[10px] text-[#86868B]">
                          {job.trailerModel}
                        </span>
                      </td>
                      <td className="py-3 px-3.5">
                        <span className="font-medium text-[#1D1D1F] block">
                          {job.driverName}
                        </span>
                        <span className="font-mono text-[10px] text-[#86868B]">
                          {job.driverIqama}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 max-w-xs">
                        <span className="font-medium text-[#1D1D1F] line-clamp-1">
                          {job.items.map((i) => i.partName).join(", ")}
                        </span>
                        <span className="text-[10px] text-[#86868B] block">
                          {job.items.length} line item{job.items.length > 1 ? "s" : ""}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono font-bold text-[#1D1D1F]">
                        {job.grandTotalSAR.toFixed(2)} SAR
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        {hasOverride ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                            <Lock className="w-2.5 h-2.5" />
                            PIN Override
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            Clean
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedJob(job)}
                          className="h-7 px-2.5 rounded-lg bg-black/[0.04] hover:bg-black/[0.08] text-[#1D1D1F] text-[11px] font-medium transition-colors inline-flex items-center gap-1"
                        >
                          <Printer className="w-3 h-3 text-[#86868B]" />
                          <span>View / Print</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* A4 Printable Job Card Dialog */}
      <PrintableJobCard
        jobCard={selectedJob}
        onClose={() => setSelectedJob(null)}
      />
    </div>
  );
}
