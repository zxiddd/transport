"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  FileText,
  Printer,
  Download,
  Calendar,
  ShieldCheck,
  Building2,
  Truck,
  DollarSign,
  PieChart,
} from "lucide-react";
import { JobCard, TheftAuditRecord } from "@/types/workshop";
import { useAuth } from "@/context/AuthContext";
import { printFleetReport } from "@/lib/printUtils";
import { isFirebaseConfigured, db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";

interface ReportsViewProps {
  refreshTrigger?: number;
}

const PILOT_BASELINE_JOBS: JobCard[] = [
  {
    id: "job-baseline-01",
    jobCardNumber: "TT-2026-1042",
    companyId: "tala-transport",
    trailerPlate: "7842-JED",
    trailerModel: "Flatbed 40ft",
    driverId: "driver-7842-JED",
    driverName: "Ahmed Al-Ghamdi",
    driverIqama: "2489102934",
    operatorName: "Yard Coordinator",
    items: [
      {
        id: "b1",
        partName: "Drive Tire 315/80 R22.5",
        category: "Tires",
        axlePosition: "Trailer Axle 1",
        action: "replace",
        quantity: 2,
        unitCostSAR: 950,
        subtotalSAR: 1900,
        isFlagged: false,
      },
    ],
    subtotalSAR: 1900,
    vatRatePercentage: 15,
    vatAmountSAR: 285,
    grandTotalSAR: 2185,
    status: "completed",
    createdAt: {
      toDate: () => new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    } as any,
  },
  {
    id: "job-baseline-02",
    jobCardNumber: "TT-2026-0988",
    companyId: "tala-transport",
    trailerPlate: "9102-JED",
    trailerModel: "Curtain Sider",
    driverId: "driver-9102-JED",
    driverName: "Tariq Mansoor",
    driverIqama: "2501928374",
    operatorName: "Yard Coordinator",
    items: [
      {
        id: "b2",
        partName: "Front Brake Pads",
        category: "Brakes",
        axlePosition: "Trailer Axle 1",
        action: "replace",
        quantity: 2,
        unitCostSAR: 450,
        subtotalSAR: 900,
        isFlagged: false,
      },
      {
        id: "b3",
        partName: "Air Brake Booster",
        category: "Brakes",
        axlePosition: "Trailer Axle 2",
        action: "replace",
        quantity: 1,
        unitCostSAR: 320,
        subtotalSAR: 320,
        isFlagged: false,
      },
    ],
    subtotalSAR: 1220,
    vatRatePercentage: 15,
    vatAmountSAR: 183,
    grandTotalSAR: 1403,
    status: "completed",
    createdAt: {
      toDate: () => new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
    } as any,
  },
];

const PILOT_BASELINE_AUDITS: TheftAuditRecord[] = [
  {
    id: "audit-01",
    companyId: "tala-transport",
    trailerPlate: "7842-JED",
    driverName: "Ahmed Al-Ghamdi",
    partName: "Drive Tire 315/80 R22.5",
    axlePosition: "Trailer Axle 1",
    daysSinceLastService: 14,
    previousJobId: "TT-2026-1042",
    actionTaken: "BLOCKED",
    managerNote: "Coordinator rejected duplicate part claim based on anti-theft cooldown warning.",
    timestamp: {
      toDate: () => new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    } as any,
  },
];

export function ReportsView({ refreshTrigger }: ReportsViewProps) {
  const { companyId, companyProfile } = useAuth();
  const targetCid = companyId || "tala-transport";

  const [jobCards, setJobCards] = useState<JobCard[]>([]);
  const [auditLogs, setAuditLogs] = useState<TheftAuditRecord[]>([]);

  // Report Mode: "MONTHLY" | "TILL_DATE"
  const [reportType, setReportType] = useState<"MONTHLY" | "TILL_DATE">("MONTHLY");

  // Selected Month: "YYYY-MM"
  const currentYearMonth = useMemo(() => {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    return `${d.getFullYear()}-${m}`;
  }, []);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentYearMonth);

  // Search in report items
  const [searchTerm, setSearchTerm] = useState("");

  // Instant local retrieval
  const loadData = () => {
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

    // Merge with baseline
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

    // Non-blocking cloud sync in background
    if (isFirebaseConfigured && db) {
      Promise.allSettled([
        getDocs(query(collection(db, "job_cards"), where("companyId", "==", targetCid), orderBy("createdAt", "desc"))),
        getDocs(query(collection(db, "theft_audit_records"), where("companyId", "==", targetCid), orderBy("timestamp", "desc"))),
      ]).then(([jobsRes, auditsRes]) => {
        if (jobsRes.status === "fulfilled" && jobsRes.value?.docs) {
          const cloudJobs = jobsRes.value.docs.map((d: any) => d.data() as JobCard);
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
        if (auditsRes.status === "fulfilled" && auditsRes.value?.docs) {
          const cloudAudits = auditsRes.value.docs.map((d: any) => d.data() as TheftAuditRecord);
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
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetCid, refreshTrigger]);

  // Filter jobs by selected report mode
  const filteredJobs = useMemo(() => {
    return jobCards.filter((job) => {
      const jobDate = job.createdAt?.toDate ? job.createdAt.toDate() : new Date();

      if (reportType === "MONTHLY") {
        const ym = `${jobDate.getFullYear()}-${String(jobDate.getMonth() + 1).padStart(2, "0")}`;
        if (ym !== selectedMonth) return false;
      }

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matches =
          job.jobCardNumber.toLowerCase().includes(q) ||
          job.trailerPlate.toLowerCase().includes(q) ||
          job.driverName.toLowerCase().includes(q) ||
          job.items.some((i) => i.partName.toLowerCase().includes(q));
        if (!matches) return false;
      }

      return true;
    });
  }, [jobCards, reportType, selectedMonth, searchTerm]);

  // Filter audits for this period
  const filteredAudits = useMemo(() => {
    return auditLogs.filter((audit) => {
      const aDate = audit.timestamp?.toDate ? audit.timestamp.toDate() : new Date();
      if (reportType === "MONTHLY") {
        const ym = `${aDate.getFullYear()}-${String(aDate.getMonth() + 1).padStart(2, "0")}`;
        return ym === selectedMonth;
      }
      return true;
    });
  }, [auditLogs, reportType, selectedMonth]);

  // Aggregate Metrics
  const summary = useMemo(() => {
    const totalJobs = filteredJobs.length;
    const subtotalSAR = filteredJobs.reduce((acc, j) => acc + (j.subtotalSAR || 0), 0);
    const vatAmountSAR = filteredJobs.reduce((acc, j) => acc + (j.vatAmountSAR || 0), 0);
    const totalSpendSAR = filteredJobs.reduce((acc, j) => acc + (j.grandTotalSAR || 0), 0);
    const blockedClaimsCount = filteredAudits.filter((a) => a.actionTaken === "BLOCKED").length;
    const preventedLeakageSAR = blockedClaimsCount * 950;
    const supervisorOverridesCount = filteredJobs.filter((j) =>
      j.items.some((i) => i.authorizedByPin)
    ).length;
    const totalPartsInstalled = filteredJobs.reduce(
      (acc, j) => acc + j.items.reduce((s, it) => s + (it.quantity || 1), 0),
      0
    );

    const defaultVatRate =
      companyProfile?.vatRatePercentage ?? (companyProfile?.vatEnabled ? 15 : 0);

    return {
      totalJobs,
      subtotalSAR,
      vatAmountSAR,
      totalSpendSAR,
      vatRatePercentage: defaultVatRate,
      preventedLeakageSAR,
      blockedClaimsCount,
      supervisorOverridesCount,
      totalPartsInstalled,
    };
  }, [filteredJobs, filteredAudits, companyProfile]);

  // Breakdown by Trailer
  const trailerBreakdown = useMemo(() => {
    const map = new Map<
      string,
      { plate: string; model: string; count: number; totalSAR: number }
    >();
    for (const j of filteredJobs) {
      const cur = map.get(j.trailerPlate) || {
        plate: j.trailerPlate,
        model: j.trailerModel,
        count: 0,
        totalSAR: 0,
      };
      cur.count += 1;
      cur.totalSAR += j.grandTotalSAR;
      map.set(j.trailerPlate, cur);
    }
    return Array.from(map.values()).sort((a, b) => b.totalSAR - a.totalSAR);
  }, [filteredJobs]);

  // Breakdown by Category
  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, { category: string; count: number; spendSAR: number }>();
    for (const j of filteredJobs) {
      for (const it of j.items) {
        const cat = it.category || "Other";
        const cur = map.get(cat) || { category: cat, count: 0, spendSAR: 0 };
        cur.count += it.quantity || 1;
        cur.spendSAR += it.subtotalSAR || 0;
        map.set(cat, cur);
      }
    }
    return Array.from(map.values()).sort((a, b) => b.spendSAR - a.spendSAR);
  }, [filteredJobs]);

  // Handle Printable A4 Report
  const handlePrint = () => {
    const reportTitle =
      reportType === "MONTHLY"
        ? `Monthly Fleet Maintenance Report`
        : `Cumulative Till-Date Fleet Report`;

    const periodSubtitle =
      reportType === "MONTHLY"
        ? `Period: ${new Date(selectedMonth + "-01").toLocaleString("default", {
            month: "long",
            year: "numeric",
          })}`
        : `All Records Up to ${new Date().toLocaleDateString("en-GB")}`;

    printFleetReport({
      title: reportTitle,
      periodSubtitle,
      companyProfile,
      summary,
      jobs: filteredJobs,
    });
  };

  // Export CSV
  const handleExportCSV = () => {
    if (filteredJobs.length === 0) return;

    const headers = [
      "Job Card Number",
      "Date",
      "Trailer Plate",
      "Trailer Model",
      "Driver Name",
      "Driver Iqama",
      "Operator",
      "Items Serviced",
      "Subtotal (SAR)",
      "VAT Applied (SAR)",
      "Grand Total (SAR)",
      "Status",
    ];

    const rows = filteredJobs.map((j) => {
      const dStr = j.createdAt?.toDate
        ? j.createdAt.toDate().toLocaleDateString("en-GB")
        : "";
      const itemsList = j.items
        .map((it) => `${it.partName} [${it.quantity}x @ ${it.unitCostSAR} SAR]`)
        .join(" | ");

      return [
        `"${j.jobCardNumber}"`,
        `"${dStr}"`,
        `"${j.trailerPlate}"`,
        `"${j.trailerModel}"`,
        `"${j.driverName}"`,
        `"${j.driverIqama}"`,
        `"${j.operatorName}"`,
        `"${itemsList.replace(/"/g, '""')}"`,
        (j.subtotalSAR || 0).toFixed(2),
        (j.vatAmountSAR || 0).toFixed(2),
        (j.grandTotalSAR || 0).toFixed(2),
        `"${j.status}"`,
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    const filename =
      reportType === "MONTHLY"
        ? `Tala_Monthly_Report_${selectedMonth}.csv`
        : `Tala_TillDate_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="bg-white border border-black/[0.06] rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-semibold tracking-tight text-[#1D1D1F]">
              Fleet Reports & Financial Statements
            </h2>
          </div>
          <p className="text-xs text-[#86868B]">
            Generate official monthly statements, till-date cumulative reports, and anti-theft audits
          </p>
        </div>

        {/* Actions & Report Switcher */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Mode Switcher */}
          <div className="flex items-center bg-black/[0.04] p-1 rounded-full border border-black/[0.04]">
            <button
              type="button"
              onClick={() => setReportType("MONTHLY")}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                reportType === "MONTHLY"
                  ? "bg-white text-[#1D1D1F] shadow-[0_1px_3px_rgba(0,0,0,0.08)] font-semibold"
                  : "text-[#86868B] hover:text-[#1D1D1F]"
              }`}
            >
              Total Monthly Report
            </button>
            <button
              type="button"
              onClick={() => setReportType("TILL_DATE")}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                reportType === "TILL_DATE"
                  ? "bg-white text-[#1D1D1F] shadow-[0_1px_3px_rgba(0,0,0,0.08)] font-semibold"
                  : "text-[#86868B] hover:text-[#1D1D1F]"
              }`}
            >
              Till-Date Report (All Time)
            </button>
          </div>

          {/* Month Picker when Monthly is active */}
          {reportType === "MONTHLY" && (
            <div className="flex items-center gap-1.5 bg-black/[0.03] border border-black/[0.06] px-3 py-1 rounded-xl">
              <Calendar className="w-3.5 h-3.5 text-[#86868B]" />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-xs font-semibold text-[#1D1D1F] outline-none cursor-pointer"
              />
            </div>
          )}

          {/* Print A4 Report Button */}
          <button
            type="button"
            onClick={handlePrint}
            className="h-9 px-4 bg-[#1D1D1F] hover:bg-black text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
            title="Open printable A4 tax report view"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>

          {/* Export CSV Button */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="h-9 px-3.5 bg-black/[0.04] hover:bg-black/[0.08] text-[#1D1D1F] text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all"
            title="Download CSV spreadsheet"
          >
            <Download className="w-3.5 h-3.5 text-[#86868B]" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Report Header Badge */}
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-emerald-900">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-sm">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#1D1D1F]">
                {companyProfile?.name || "Tala Transport"} ·{" "}
                {reportType === "MONTHLY"
                  ? `Monthly Statement (${new Date(selectedMonth + "-01").toLocaleString("default", {
                      month: "long",
                      year: "numeric",
                    })})`
                  : `Cumulative Till-Date Fleet Audit`}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white">
                ZATCA Compliant
              </span>
            </div>
            <p className="text-xs text-emerald-800/80">
              {companyProfile?.branch || "Jeddah Fleet Yard 3"} · VAT Registration #310284910200003
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[11px] font-semibold text-[#86868B] block uppercase tracking-wider">
            Total Records Analyzed
          </span>
          <span className="font-mono font-bold text-sm text-[#1D1D1F]">
            {filteredJobs.length} Work Orders · {filteredAudits.length} Audits
          </span>
        </div>
      </div>

      {/* Executive KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Spend */}
        <div className="bg-white border border-black/[0.06] rounded-3xl p-5 shadow-sm space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider">
              Total Fleet Spend
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-mono font-extrabold text-[#1D1D1F] tracking-tight">
            {summary.totalSpendSAR.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            <span className="text-xs font-normal text-[#86868B] ml-1">SAR</span>
          </div>
          <div className="text-[11px] text-[#86868B]">
            Subtotal: {summary.subtotalSAR.toLocaleString("en-US", { minimumFractionDigits: 2 })} SAR
          </div>
        </div>

        {/* Total VAT */}
        <div className="bg-white border border-black/[0.06] rounded-3xl p-5 shadow-sm space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider">
              VAT Total
            </span>
            <div className="w-7 h-7 rounded-lg bg-black/[0.04] text-[#1D1D1F] flex items-center justify-center font-mono text-xs font-bold">
              %
            </div>
          </div>
          <div className="text-2xl font-mono font-extrabold text-[#1D1D1F] tracking-tight">
            {summary.vatAmountSAR.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            <span className="text-xs font-normal text-[#86868B] ml-1">SAR</span>
          </div>
          <div className="text-[11px] text-[#86868B]">
            Fleet VAT Rate: <strong>{summary.vatRatePercentage}%</strong>
          </div>
        </div>

        {/* Anti-Theft Savings */}
        <div className="bg-emerald-50 border border-emerald-200/80 rounded-3xl p-5 shadow-sm space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">
              Anti-Theft Savings
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-sm">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-mono font-extrabold text-emerald-700 tracking-tight">
            +{summary.preventedLeakageSAR.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            <span className="text-xs font-normal text-emerald-800 ml-1">SAR</span>
          </div>
          <div className="text-[11px] text-emerald-700">
            {summary.blockedClaimsCount} duplicate claims stopped
          </div>
        </div>

        {/* Work Orders Count */}
        <div className="bg-white border border-black/[0.06] rounded-3xl p-5 shadow-sm space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider">
              Work Orders
            </span>
            <div className="w-7 h-7 rounded-lg bg-black/[0.04] text-[#1D1D1F] flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-mono font-extrabold text-[#1D1D1F] tracking-tight">
            {summary.totalJobs}
            <span className="text-xs font-normal text-[#86868B] ml-1">Jobs</span>
          </div>
          <div className="text-[11px] text-[#86868B]">
            {summary.totalPartsInstalled} replacement parts fitted
          </div>
        </div>
      </div>

      {/* Analytical Breakdowns Grid: Trailer & Category */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Maintenance Spend by Trailer */}
        <div className="bg-white border border-black/[0.06] rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-600" />
              <h4 className="text-sm font-semibold text-[#1D1D1F]">
                Maintenance Spend by Trailer
              </h4>
            </div>
            <span className="text-[11px] text-[#86868B]">
              {trailerBreakdown.length} Trailers Serviced
            </span>
          </div>

          <div className="space-y-2.5">
            {trailerBreakdown.length === 0 ? (
              <p className="text-xs text-[#86868B] py-4 text-center">No maintenance recorded for this period</p>
            ) : (
              trailerBreakdown.slice(0, 5).map((t) => {
                const percent =
                  summary.totalSpendSAR > 0
                    ? Math.round((t.totalSAR / summary.totalSpendSAR) * 100)
                    : 0;
                return (
                  <div
                    key={t.plate}
                    className="p-3 bg-black/[0.02] border border-black/[0.04] rounded-2xl space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#1D1D1F]">{t.plate}</span>
                        <span className="text-[#86868B]">({t.model})</span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-emerald-600">
                          {t.totalSAR.toFixed(2)} SAR
                        </span>
                        <span className="text-[10px] text-[#86868B] ml-1.5">({t.count} jobs)</span>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-black/[0.06] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Spend by Component Category */}
        <div className="bg-white border border-black/[0.06] rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-600" />
              <h4 className="text-sm font-semibold text-[#1D1D1F]">
                Spend by Component Category
              </h4>
            </div>
            <span className="text-[11px] text-[#86868B]">
              {categoryBreakdown.length} Categories Active
            </span>
          </div>

          <div className="space-y-2.5">
            {categoryBreakdown.length === 0 ? (
              <p className="text-xs text-[#86868B] py-4 text-center">No category data for this period</p>
            ) : (
              categoryBreakdown.map((c) => {
                const percent =
                  summary.subtotalSAR > 0
                    ? Math.round((c.spendSAR / summary.subtotalSAR) * 100)
                    : 0;
                return (
                  <div
                    key={c.category}
                    className="p-3 bg-black/[0.02] border border-black/[0.04] rounded-2xl space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#1D1D1F]">{c.category}</span>
                        <span className="text-[10px] text-[#86868B] font-mono">
                          ({c.count} parts)
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-[#1D1D1F]">
                          {c.spendSAR.toFixed(2)} SAR
                        </span>
                        <span className="text-[10px] text-[#86868B] ml-1.5">({percent}%)</span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-black/[0.06] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#1D1D1F] rounded-full transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Itemized Work Order Table */}
      <div className="bg-white border border-black/[0.06] rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-black/[0.06] pb-4">
          <div>
            <h4 className="text-sm font-semibold text-[#1D1D1F]">
              Itemized Work Orders & Job Cards
            </h4>
            <p className="text-xs text-[#86868B]">
              Detailed record of all maintenance events in this reporting window
            </p>
          </div>

          <input
            type="text"
            placeholder="Search by job #, plate, or driver..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9 px-3.5 bg-black/[0.03] border border-black/[0.08] rounded-xl text-xs text-[#1D1D1F] placeholder:text-[#86868B] focus:bg-white focus:border-emerald-500 outline-none w-full sm:w-64"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-black/[0.06] text-[#86868B]">
                <th className="py-2.5 px-3 font-semibold uppercase text-[10px]">Job Card</th>
                <th className="py-2.5 px-3 font-semibold uppercase text-[10px]">Date</th>
                <th className="py-2.5 px-3 font-semibold uppercase text-[10px]">Trailer</th>
                <th className="py-2.5 px-3 font-semibold uppercase text-[10px]">Driver</th>
                <th className="py-2.5 px-3 font-semibold uppercase text-[10px]">Items Serviced</th>
                <th className="py-2.5 px-3 font-semibold uppercase text-[10px] text-right">Subtotal</th>
                <th className="py-2.5 px-3 font-semibold uppercase text-[10px] text-right">VAT</th>
                <th className="py-2.5 px-3 font-semibold uppercase text-[10px] text-right">Grand Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-[#86868B]">
                    No job cards found for the selected reporting period
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job) => {
                  const dStr = job.createdAt?.toDate
                    ? job.createdAt.toDate().toLocaleDateString("en-GB")
                    : "N/A";
                  const hasOverride = job.items.some((i) => i.authorizedByPin);
                  const itemsList = job.items
                    .map((it) => `${it.partName} (${it.quantity})`)
                    .join(", ");

                  return (
                    <tr key={job.id} className="hover:bg-black/[0.01] transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-emerald-700">
                        {job.jobCardNumber}
                        {hasOverride && (
                          <span className="block text-[9px] font-sans font-semibold text-amber-600">
                            PIN Override
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-[#86868B]">{dStr}</td>
                      <td className="py-3 px-3 font-mono font-bold text-[#1D1D1F]">
                        {job.trailerPlate}
                        <span className="block font-sans font-normal text-[10px] text-[#86868B]">
                          {job.trailerModel}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[#1D1D1F]">
                        {job.driverName}
                        <span className="block font-mono text-[10px] text-[#86868B]">
                          {job.driverIqama}
                        </span>
                      </td>
                      <td className="py-3 px-3 max-w-xs truncate text-[#1D1D1F]" title={itemsList}>
                        {itemsList}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-[#1D1D1F]">
                        {job.subtotalSAR.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-[#86868B]">
                        {job.vatAmountSAR.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-[#1D1D1F]">
                        {job.grandTotalSAR.toFixed(2)} SAR
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
