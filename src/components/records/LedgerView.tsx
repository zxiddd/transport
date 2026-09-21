"use client";

import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { JobCard, TheftAuditRecord } from "@/types/workshop";
import {
  FileText,
  Download,
  Search,
  ShieldAlert,
  CheckCircle2,
  Lock,
  Printer,
} from "lucide-react";
import { PrintableJobCard } from "./PrintableJobCard";

export function LedgerView() {
  const { companyId } = useAuth();
  const targetCid = companyId || "tala-transport";

  const [jobCards, setJobCards] = useState<JobCard[]>([]);
  const [auditLogs, setAuditLogs] = useState<TheftAuditRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filter state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "CLEAN" | "FLAGGED_OVERRIDE" | "BLOCKED_FRAUD"
  >("ALL");
  const [dateFilter, setDateFilter] = useState<"ALL" | "7DAYS" | "30DAYS">("ALL");

  // Selected job card for A4 printing modal
  const [selectedJob, setSelectedJob] = useState<JobCard | null>(null);

  // Fetch Firestore Records
  useEffect(() => {
    const fetchRecords = async () => {
      try {
        setLoading(true);

        try {
          const jobsQuery = query(
            collection(db, "job_cards"),
            where("companyId", "==", targetCid),
            orderBy("createdAt", "desc")
          );
          const jobsSnap = await getDocs(jobsQuery);
          const fetchedJobs: JobCard[] = jobsSnap.docs.map((d) => d.data() as JobCard);
          setJobCards(fetchedJobs);
        } catch (e) {
          console.warn("Firestore job cards fetch fallback:", e);
        }

        try {
          const auditQuery = query(
            collection(db, "theft_audit_records"),
            where("companyId", "==", targetCid),
            orderBy("timestamp", "desc")
          );
          const auditSnap = await getDocs(auditQuery);
          const fetchedAudits: TheftAuditRecord[] = auditSnap.docs.map(
            (d) => d.data() as TheftAuditRecord
          );
          setAuditLogs(fetchedAudits);
        } catch (e) {
          console.warn("Firestore audit records fetch fallback:", e);
        }
      } catch (err) {
        console.error("Failed to load audit ledger records:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, [targetCid]);

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
      alert("No maintenance records available to export.");
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
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <div className="bg-white border border-[#E5E5EA] rounded-3xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#1D1D1F] tracking-tight">
              Audit Ledger & Maintenance Records
            </h2>
            <p className="text-xs text-[#86868B]">
              Real-time audit log of all completed job cards, price calculations, and fraud prevention overrides
            </p>
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            className="h-[44px] px-5 bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold rounded-2xl flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download Excel (.csv)</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
          <div className="relative sm:col-span-2">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#86868B]">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Plate (7842-JED), Driver, or Part..."
              className="w-full h-[44px] pl-10 pr-4 bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl text-xs font-medium text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:bg-white transition-all"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value as "ALL" | "CLEAN" | "FLAGGED_OVERRIDE" | "BLOCKED_FRAUD"
                )
              }
              className="w-full h-[44px] px-3 bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl text-xs font-semibold text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:bg-white"
            >
              <option value="ALL">All Maintenance Records</option>
              <option value="CLEAN">Clean Maintenance Only</option>
              <option value="FLAGGED_OVERRIDE">PIN Authorized Overrides</option>
              <option value="BLOCKED_FRAUD">Blocked Fraud Attempts</option>
            </select>
          </div>

          <div>
            <select
              value={dateFilter}
              onChange={(e) =>
                setDateFilter(e.target.value as "ALL" | "7DAYS" | "30DAYS")
              }
              className="w-full h-[44px] px-3 bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl text-xs font-semibold text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:bg-white"
            >
              <option value="ALL">All Time</option>
              <option value="7DAYS">Last 7 Days</option>
              <option value="30DAYS">Last 30 Days</option>
            </select>
          </div>
        </div>
      </div>

      {statusFilter === "BLOCKED_FRAUD" && (
        <div className="bg-red-50 border border-red-200 rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-red-600 font-bold text-sm">
            <ShieldAlert className="w-5 h-5" />
            <span>Prevented Theft & Duplicate Replacement Attempts</span>
          </div>
          {filteredBlockedAudits.length === 0 ? (
            <p className="text-xs text-red-800">No blocked fraud attempts logged yet.</p>
          ) : (
            <div className="space-y-3">
              {filteredBlockedAudits.map((log) => (
                <div
                  key={log.id}
                  className="bg-white border border-red-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <span className="font-bold text-red-700 block">
                      Trailer {log.trailerPlate} · {log.partName} ({log.axlePosition})
                    </span>
                    <span className="text-[#86868B] block">
                      Driver: <strong>{log.driverName}</strong> · Action:{" "}
                      <strong className="text-red-600 uppercase">{log.actionTaken}</strong>
                    </span>
                    <p className="text-red-900 mt-1 italic">{log.managerNote}</p>
                  </div>
                  <span className="px-3 py-1 bg-red-100 text-red-700 font-mono text-[10px] font-bold rounded-full">
                    FRAUD BLOCKED
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {statusFilter !== "BLOCKED_FRAUD" && (
        <div className="bg-white border border-[#E5E5EA] rounded-3xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-8 h-8 border-4 border-[#10B981] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-semibold text-[#86868B]">
                Fetching audit ledger from Firestore...
              </p>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <FileText className="w-10 h-10 text-[#86868B] mx-auto" />
              <p className="text-sm font-bold text-[#1D1D1F]">
                No completed job cards found
              </p>
              <p className="text-xs text-[#86868B] max-w-sm mx-auto">
                Completed work orders will appear here automatically with full price breakdown and anti-theft audit status.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F5F5F7] text-[#86868B] uppercase font-bold border-b border-[#E5E5EA]">
                  <tr>
                    <th className="py-4 px-4">Date & Time</th>
                    <th className="py-4 px-4">Job ID</th>
                    <th className="py-4 px-4">Trailer Plate</th>
                    <th className="py-4 px-4">Driver Name</th>
                    <th className="py-4 px-4">Parts Replaced</th>
                    <th className="py-4 px-4 text-right">Subtotal</th>
                    <th className="py-4 px-4 text-right">15% VAT</th>
                    <th className="py-4 px-4 text-right">Grand Total</th>
                    <th className="py-4 px-4 text-center">Anti-Theft Status</th>
                    <th className="py-4 px-4 text-center">Print</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E5EA]">
                  {filteredJobs.map((job) => {
                    const dateFormatted = job.createdAt?.toDate
                      ? job.createdAt.toDate().toLocaleDateString("en-GB")
                      : new Date().toLocaleDateString("en-GB");
                    const hasOverride = job.items.some((i) => i.authorizedByPin);

                    return (
                      <tr
                        key={job.id}
                        className="hover:bg-[#F5F5F7] transition-colors cursor-pointer group"
                        onClick={() => setSelectedJob(job)}
                      >
                        <td className="py-4 px-4 text-[#86868B] font-mono">
                          {dateFormatted}
                        </td>
                        <td className="py-4 px-4 font-mono font-bold text-[#10B981] group-hover:underline">
                          {job.jobCardNumber}
                        </td>
                        <td className="py-4 px-4 font-mono font-bold text-[#1D1D1F]">
                          {job.trailerPlate}
                        </td>
                        <td className="py-4 px-4 font-bold text-[#1D1D1F]">
                          {job.driverName}
                        </td>
                        <td className="py-4 px-4 text-[#1D1D1F] max-w-xs truncate">
                          {job.items.map((i) => i.partName).join(", ")}
                        </td>
                        <td className="py-4 px-4 text-right font-mono text-[#86868B]">
                          {job.subtotalSAR.toFixed(2)} SAR
                        </td>
                        <td className="py-4 px-4 text-right font-mono text-[#86868B]">
                          {job.vatAmountSAR.toFixed(2)} SAR
                        </td>
                        <td className="py-4 px-4 text-right font-mono font-extrabold text-[#1D1D1F]">
                          {job.grandTotalSAR.toFixed(2)} SAR
                        </td>
                        <td className="py-4 px-4 text-center">
                          {hasOverride ? (
                            <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full inline-flex items-center gap-1">
                              <Lock className="w-3 h-3 text-amber-600" />
                              <span>PIN Override</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-emerald-50 text-[#059669] text-[10px] font-bold rounded-full inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-[#10B981]" />
                              <span>Clean</span>
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedJob(job);
                            }}
                            className="p-1.5 text-[#86868B] hover:text-[#10B981] hover:bg-emerald-50 rounded-lg transition-all"
                            title="Print A4 Job Card"
                          >
                            <Printer className="w-4 h-4" />
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
      )}

      <PrintableJobCard
        jobCard={selectedJob}
        onClose={() => setSelectedJob(null)}
      />
    </div>
  );
}
