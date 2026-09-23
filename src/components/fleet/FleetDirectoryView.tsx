"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Truck,
  Search,
  User,
  Calendar,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Download,
  Plus,
  X,
  Wrench,
  ShieldCheck,
  Phone,
  Info,
  ArrowRight,
  Clock,
} from "lucide-react";
import { TALA_FLEET_50, TalaFleetRecord } from "@/lib/talaFleetData";
import { useAuth } from "@/context/AuthContext";
import { JobCard } from "@/types/workshop";
import { doc, setDoc } from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { syncTrailerToFirestore } from "@/lib/firestoreSync";

interface FleetDirectoryViewProps {
  onSelectTrailerForJob?: (trailerNumber: string) => void;
}

export function FleetDirectoryView({ onSelectTrailerForJob }: FleetDirectoryViewProps) {
  const { companyId } = useAuth();
  const targetCid = companyId || "tala-transport";

  const [fleetList, setFleetList] = useState<TalaFleetRecord[]>(TALA_FLEET_50);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "GROUNDED">("ALL");
  const [routeFilter, setRouteFilter] = useState<string>("ALL");

  // Modals
  const [isAddDriverOpen, setIsAddDriverOpen] = useState(false);
  const [selectedDriverDetail, setSelectedDriverDetail] = useState<TalaFleetRecord | null>(null);
  const [driverJobsHistory, setDriverJobsHistory] = useState<JobCard[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Add Driver Form State
  const [newDriverName, setNewDriverName] = useState("");
  const [newTrailerNumber, setNewTrailerNumber] = useState("");
  const [newIqamaNumber, setNewIqamaNumber] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newModelType, setNewModelType] = useState("Flatbed 40ft");
  const [newFromLocation, setNewFromLocation] = useState("Jeddah");
  const [newToLocation, setNewToLocation] = useState("9 am Port");
  const [newStatus, setNewStatus] = useState<"active" | "grounded">("active");
  const [formError, setFormError] = useState<string | null>(null);

  // Load Fleet Roster
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const localFleetStr = localStorage.getItem(`tala_fleet_${targetCid}`);
        if (localFleetStr) {
          const rows = JSON.parse(localFleetStr);
          if (Array.isArray(rows)) {
            setFleetList(rows);
            return;
          }
        }
      } catch {}
      setFleetList([]);
    }
  }, [targetCid]);

  // Load Driver Repair History when a detail card is opened
  useEffect(() => {
    if (!selectedDriverDetail) {
      setDriverJobsHistory([]);
      return;
    }

    setLoadingHistory(true);
    const plate = selectedDriverDetail.trailerNumber;
    let jobs: JobCard[] = [];

    if (typeof window !== "undefined") {
      try {
        const localJobsStr = localStorage.getItem(`tala_jobs_${targetCid}`);
        if (localJobsStr) {
          const parsed: JobCard[] = JSON.parse(localJobsStr);
          jobs = parsed.filter(
            (j) =>
              (j.trailerPlate || "").toLowerCase() === plate.toLowerCase() ||
              (j.driverName || "").toLowerCase() === selectedDriverDetail.driverName.toLowerCase()
          );
        }
      } catch {}
    }

    setDriverJobsHistory(jobs);
    setLoadingHistory(false);
  }, [selectedDriverDetail, targetCid]);

  // Handle Adding New Driver & Trailer
  const handleAddDriverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Mandatory Validation
    if (!newDriverName.trim()) {
      setFormError("Driver Name is required.");
      return;
    }

    if (!newTrailerNumber.trim()) {
      setFormError("Trailer Number is required.");
      return;
    }

    const newRecord: TalaFleetRecord = {
      sn: fleetList.length + 1,
      driverName: newDriverName.trim(),
      trailerNumber: newTrailerNumber.trim().toUpperCase(),
      loadDate: new Date().toLocaleDateString("en-GB"),
      fromLocation: newFromLocation.trim() || "Jeddah",
      toLocation: newToLocation.trim() || "9 am Port",
      status: newStatus,
      modelType: newModelType.trim() || "Flatbed 40ft",
      iqamaNumber: newIqamaNumber.trim() || "N/A",
      phone: newPhone.trim() || "N/A",
    };

    const updatedList = [newRecord, ...fleetList];
    setFleetList(updatedList);

    // Persist to LocalStorage
    if (typeof window !== "undefined") {
      localStorage.setItem(`tala_fleet_${targetCid}`, JSON.stringify(updatedList));
    }

    // Persist to Cloud Firestore if connected
    await syncTrailerToFirestore(targetCid, newRecord);

    // Reset Form
    setNewDriverName("");
    setNewTrailerNumber("");
    setNewIqamaNumber("");
    setNewPhone("");
    setNewModelType("Flatbed 40ft");
    setIsAddDriverOpen(false);
  };

  // Filtering
  const filteredRecords = useMemo(() => {
    return fleetList.filter((item) => {
      if (statusFilter === "ACTIVE" && item.status !== "active") return false;
      if (statusFilter === "GROUNDED" && item.status !== "grounded") return false;

      if (routeFilter !== "ALL") {
        if (routeFilter === "PORT" && !(item.toLocation || "").toLowerCase().includes("port")) return false;
        if (routeFilter === "YARD" && (item.toLocation || "").toLowerCase().includes("port")) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTrailer = (item.trailerNumber || "").toLowerCase().includes(q);
        const matchDriver = (item.driverName || "").toLowerCase().includes(q);
        const matchFrom = (item.fromLocation || "").toLowerCase().includes(q);
        const matchTo = (item.toLocation || "").toLowerCase().includes(q);
        const matchIqama = (item.iqamaNumber || "").toLowerCase().includes(q);
        const matchModel = (item.modelType || "").toLowerCase().includes(q);
        const matchDate = (item.loadDate || "").toLowerCase().includes(q);
        return (
          matchTrailer ||
          matchDriver ||
          matchFrom ||
          matchTo ||
          matchIqama ||
          matchModel ||
          matchDate
        );
      }

      return true;
    });
  }, [fleetList, searchQuery, statusFilter, routeFilter]);

  // Summary Metrics
  const totalFleet = fleetList.length;
  const activeCount = fleetList.filter((r) => r.status === "active").length;
  const groundedCount = fleetList.filter((r) => r.status === "grounded").length;
  const portRunsCount = fleetList.filter((r) =>
    (r.toLocation || "").toLowerCase().includes("port")
  ).length;

  const handleExportCSV = () => {
    const headers = [
      "S.No",
      "Driver Name",
      "Trailer Number",
      "Load Date",
      "From Location",
      "To Location",
      "Status",
      "Model Type",
      "Iqama Number",
      "Phone",
    ];

    const rows = filteredRecords.map((r) => [
      r.sn,
      `"${r.driverName}"`,
      r.trailerNumber,
      r.loadDate,
      `"${r.fromLocation}"`,
      `"${r.toLocation}"`,
      r.status.toUpperCase(),
      `"${r.modelType}"`,
      r.iqamaNumber,
      `"${r.phone}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Fleet_Directory_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-[#1D1D1F]">
              Fleet & Driver Directory
            </h2>
          </div>
          <p className="text-xs text-[#86868B]">
            Commercial fleet roster with trailer numbers, assigned drivers, and repair histories.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAddDriverOpen(true)}
            className="h-9 px-4 rounded-full bg-[#1D1D1F] hover:bg-black text-white text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Driver & Trailer</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="h-9 px-3.5 rounded-full bg-white border border-black/[0.08] text-xs font-semibold text-[#1D1D1F] hover:bg-black/[0.03] transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#86868B]" />
            <span>Export (CSV)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-black/[0.06] rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider block mb-1">
            Total Trailers
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-mono font-extrabold text-[#1D1D1F]">
              {totalFleet}
            </span>
            <span className="text-[11px] text-[#86868B]">Fleet Roster</span>
          </div>
        </div>

        <div className="bg-white border border-black/[0.06] rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider block mb-1">
            Active / On-Duty
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-mono font-extrabold text-emerald-600">
              {activeCount}
            </span>
            <span className="text-[11px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full font-medium">
              Ready
            </span>
          </div>
        </div>

        <div className="bg-white border border-black/[0.06] rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider block mb-1">
            Port Dispatches
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-mono font-extrabold text-[#1D1D1F]">
              {portRunsCount}
            </span>
            <span className="text-[11px] text-[#86868B]">9 am Port</span>
          </div>
        </div>

        <div className="bg-white border border-black/[0.06] rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider block mb-1">
            Grounded / Standby
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-mono font-extrabold text-rose-600">
              {groundedCount}
            </span>
            <span className="text-[11px] text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded-full font-medium">
              Service Needed
            </span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-black/[0.06] rounded-2xl p-3 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#86868B] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by driver name, trailer number, iqama, phone, or route..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-[#F5F5F7] border border-black/[0.04] rounded-xl text-xs text-[#1D1D1F] font-medium outline-none focus:bg-white focus:border-black/20 transition-all placeholder:text-[#86868B]"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-black/[0.03] p-1 rounded-xl border border-black/[0.04] text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                statusFilter === "ALL"
                  ? "bg-white text-[#1D1D1F] shadow-sm font-semibold"
                  : "text-[#86868B] hover:text-[#1D1D1F]"
              }`}
            >
              All ({totalFleet})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("ACTIVE")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                statusFilter === "ACTIVE"
                  ? "bg-white text-emerald-700 shadow-sm font-semibold"
                  : "text-[#86868B] hover:text-[#1D1D1F]"
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("GROUNDED")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                statusFilter === "GROUNDED"
                  ? "bg-white text-rose-700 shadow-sm font-semibold"
                  : "text-[#86868B] hover:text-[#1D1D1F]"
              }`}
            >
              Grounded ({groundedCount})
            </button>
          </div>
        </div>
      </div>

      {/* Fleet Roster Table */}
      <div className="bg-white border border-black/[0.06] rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-black/[0.06] flex items-center justify-between">
          <span className="text-xs font-semibold text-[#1D1D1F]">
            Showing {filteredRecords.length} of {totalFleet} Vehicles
          </span>
          <span className="text-[11px] text-[#86868B]">
            Click any row or driver name to view profile & repair history
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-black/[0.06] bg-[#F5F5F7]/50 text-[11px] font-semibold text-[#86868B] uppercase tracking-wider">
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">Trailer Number</th>
                <th className="py-3 px-4">Assigned Driver</th>
                <th className="py-3 px-4">Load Date</th>
                <th className="py-3 px-4">Dispatch Route</th>
                <th className="py-3 px-4">Trailer Type</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04] text-xs font-medium text-[#1D1D1F]">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#86868B]">
                    <div className="space-y-2">
                      <Truck className="w-8 h-8 text-[#86868B]/40 mx-auto" />
                      <div className="font-semibold text-xs text-[#1D1D1F]">No trailers found</div>
                      <p className="text-[11px]">Click &quot;Add Driver &amp; Trailer&quot; above to add your first vehicle.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((item) => {
                  const isGrounded = item.status === "grounded";
                  return (
                    <tr
                      key={item.sn || item.trailerNumber}
                      onClick={() => setSelectedDriverDetail(item)}
                      className={`hover:bg-[#F5F5F7] cursor-pointer transition-colors ${
                        isGrounded ? "bg-rose-50/30" : ""
                      }`}
                    >
                      {/* S.No */}
                      <td className="py-3 px-4 text-center font-mono text-[11px] text-[#86868B]">
                        {item.sn}
                      </td>

                      {/* Trailer Number */}
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-sm text-[#1D1D1F] bg-black/[0.04] px-2.5 py-1 rounded-lg border border-black/[0.06]">
                          {item.trailerNumber}
                        </span>
                      </td>

                      {/* Driver Name & Iqama */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <div>
                            <span className="font-semibold block text-[#1D1D1F] hover:underline">
                              {item.driverName}
                            </span>
                            <span className="text-[10px] text-[#86868B] font-mono">
                              Iqama: {item.iqamaNumber || "N/A"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Load Date */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-[#86868B]">
                          <Calendar className="w-3.5 h-3.5 text-[#86868B]" />
                          <span className="font-mono text-[11px] text-[#1D1D1F]">
                            {item.loadDate || "N/A"}
                          </span>
                        </div>
                      </td>

                      {/* Dispatch Route */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <div className="text-xs">
                            <span className="text-[#1D1D1F] font-medium">{item.fromLocation || "Jeddah"}</span>
                            <span className="text-[#86868B] mx-1">➔</span>
                            <span className="font-semibold text-[#1D1D1F]">
                              {item.toLocation || "9 am Port"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Trailer Type */}
                      <td className="py-3 px-4 text-[#86868B] text-[11px]">
                        {item.modelType}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        {isGrounded ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            <AlertTriangle className="w-3 h-3" />
                            Grounded
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Active
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => onSelectTrailerForJob?.(item.trailerNumber)}
                          className="px-3 py-1.5 rounded-xl bg-black/[0.04] hover:bg-[#1D1D1F] hover:text-white text-[11px] font-semibold text-[#1D1D1F] transition-all flex items-center gap-1.5 ml-auto cursor-pointer"
                        >
                          <FileText className="w-3 h-3" />
                          <span>New Job</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: ADD DRIVER & TRAILER */}
      {isAddDriverOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white/95 backdrop-blur-2xl border border-black/[0.08] rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-[0_32px_64px_rgba(0,0,0,0.16)] relative text-[#1D1D1F] space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-[#1D1D1F]">
                    Add Driver & Trailer
                  </h3>
                  <p className="text-xs text-[#86868B]">
                    Mandatory fields: Driver Name &amp; Trailer Number
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddDriverOpen(false)}
                className="w-8 h-8 rounded-full bg-black/[0.04] hover:bg-black/[0.08] text-[#86868B] hover:text-[#1D1D1F] flex items-center justify-center transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-2xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleAddDriverSubmit} className="space-y-4">
              {/* Mandatory Section */}
              <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4 space-y-3">
                <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Mandatory Inputs</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#1D1D1F] mb-1">
                      Driver Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mohd Dilshad"
                      value={newDriverName}
                      onChange={(e) => setNewDriverName(e.target.value)}
                      className="w-full h-10 px-3 bg-white border border-black/[0.1] rounded-xl text-xs text-[#1D1D1F] font-medium outline-none focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#1D1D1F] mb-1">
                      Trailer Number / Plate *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 1286"
                      value={newTrailerNumber}
                      onChange={(e) => setNewTrailerNumber(e.target.value)}
                      className="w-full h-10 px-3 bg-white border border-black/[0.1] rounded-xl text-xs font-mono font-bold text-[#1D1D1F] outline-none focus:border-black"
                    />
                  </div>
                </div>
              </div>

              {/* Optional Section */}
              <div className="space-y-3">
                <div className="text-[11px] font-bold text-[#86868B] uppercase tracking-wider">
                  Optional Roster Details
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#86868B] mb-1">
                      Iqama Number (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="248910xxxx"
                      value={newIqamaNumber}
                      onChange={(e) => setNewIqamaNumber(e.target.value)}
                      className="w-full h-10 px-3 bg-black/[0.03] border border-black/[0.06] rounded-xl text-xs font-mono text-[#1D1D1F] outline-none focus:bg-white focus:border-black/20"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#86868B] mb-1">
                      Phone Number (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="+966 50 xxx xxxx"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className="w-full h-10 px-3 bg-black/[0.03] border border-black/[0.06] rounded-xl text-xs font-mono text-[#1D1D1F] outline-none focus:bg-white focus:border-black/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#86868B] mb-1">
                      Trailer Type
                    </label>
                    <select
                      value={newModelType}
                      onChange={(e) => setNewModelType(e.target.value)}
                      className="w-full h-10 px-3 bg-black/[0.03] border border-black/[0.06] rounded-xl text-xs text-[#1D1D1F] outline-none focus:bg-white"
                    >
                      <option value="Flatbed 40ft">Flatbed 40ft</option>
                      <option value="40ft Container Chassis">40ft Container Chassis</option>
                      <option value="Lowbed Heavy Duty">Lowbed Heavy Duty</option>
                      <option value="Curtain Sider">Curtain Sider</option>
                      <option value="Box Trailer">Box Trailer</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#86868B] mb-1">
                      Initial Status
                    </label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as any)}
                      className="w-full h-10 px-3 bg-black/[0.03] border border-black/[0.06] rounded-xl text-xs text-[#1D1D1F] outline-none focus:bg-white"
                    >
                      <option value="active">Active / On-Duty</option>
                      <option value="grounded">Grounded / Out of Service</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#86868B] mb-1">
                      From Location
                    </label>
                    <input
                      type="text"
                      placeholder="Jeddah"
                      value={newFromLocation}
                      onChange={(e) => setNewFromLocation(e.target.value)}
                      className="w-full h-10 px-3 bg-black/[0.03] border border-black/[0.06] rounded-xl text-xs text-[#1D1D1F] outline-none focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#86868B] mb-1">
                      To Location
                    </label>
                    <input
                      type="text"
                      placeholder="9 am Port"
                      value={newToLocation}
                      onChange={(e) => setNewToLocation(e.target.value)}
                      className="w-full h-10 px-3 bg-black/[0.03] border border-black/[0.06] rounded-xl text-xs text-[#1D1D1F] outline-none focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddDriverOpen(false)}
                  className="flex-1 h-11 bg-black/[0.04] hover:bg-black/[0.08] text-[#1D1D1F] text-xs font-semibold rounded-2xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-11 bg-[#1D1D1F] hover:bg-black text-white text-xs font-semibold rounded-2xl transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  <span>Save Driver &amp; Trailer</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: DRIVER DETAIL CARD & REPAIR HISTORY */}
      {selectedDriverDetail && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white/95 backdrop-blur-2xl border border-black/[0.08] rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-[0_32px_64px_rgba(0,0,0,0.16)] relative text-[#1D1D1F] space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-black/[0.06] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-black/[0.04] text-[#1D1D1F] flex items-center justify-center font-bold text-lg">
                  <User className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold tracking-tight text-[#1D1D1F]">
                      {selectedDriverDetail.driverName}
                    </h3>
                    {selectedDriverDetail.status === "grounded" ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                        Grounded
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Active On-Duty
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#86868B]">
                    Assigned Trailer: <strong className="font-mono text-[#1D1D1F]">#{selectedDriverDetail.trailerNumber}</strong> ({selectedDriverDetail.modelType})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDriverDetail(null)}
                className="w-8 h-8 rounded-full bg-black/[0.04] hover:bg-black/[0.08] text-[#86868B] hover:text-[#1D1D1F] flex items-center justify-center transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#F5F5F7] p-4 rounded-2xl border border-black/[0.04] text-xs">
              <div>
                <span className="text-[10px] font-semibold text-[#86868B] uppercase block">Iqama Number</span>
                <span className="font-mono font-bold text-[#1D1D1F]">{selectedDriverDetail.iqamaNumber || "N/A"}</span>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-[#86868B] uppercase block">Phone Contact</span>
                <span className="font-mono font-bold text-[#1D1D1F]">{selectedDriverDetail.phone || "N/A"}</span>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-[#86868B] uppercase block">Route</span>
                <span className="font-medium text-[#1D1D1F]">{selectedDriverDetail.fromLocation} ➔ {selectedDriverDetail.toLocation}</span>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-[#86868B] uppercase block">Load Date</span>
                <span className="font-mono font-bold text-[#1D1D1F]">{selectedDriverDetail.loadDate || "N/A"}</span>
              </div>
            </div>

            {/* Real-Time Maintenance & Repair History */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-sm font-bold text-[#1D1D1F]">
                    Maintenance &amp; Repair History ({driverJobsHistory.length})
                  </h4>
                </div>
                <span className="text-[11px] text-[#86868B]">Real-time Database Audit Trail</span>
              </div>

              {loadingHistory ? (
                <div className="py-8 text-center text-xs text-[#86868B]">Loading repair records...</div>
              ) : driverJobsHistory.length === 0 ? (
                <div className="bg-[#F5F5F7] p-6 rounded-2xl text-center text-xs text-[#86868B] border border-black/[0.04]">
                  No past maintenance or repair job cards recorded for Trailer #{selectedDriverDetail.trailerNumber}.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {driverJobsHistory.map((job) => (
                    <div
                      key={job.id || job.jobCardNumber}
                      className="bg-white p-3.5 rounded-2xl border border-black/[0.08] shadow-sm space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          #{job.jobCardNumber}
                        </span>
                        <div className="flex items-center gap-2 text-[#86868B]">
                          <Clock className="w-3 h-3" />
                          <span>
                            {(() => {
                              const c = job.createdAt as any;
                              if (!c) return "Recent";
                              if (typeof c?.toDate === "function") return c.toDate().toLocaleDateString("en-GB");
                              if (c?.seconds) return new Date(c.seconds * 1000).toLocaleDateString("en-GB");
                              if (typeof c === "string" || typeof c === "number") return new Date(c).toLocaleDateString("en-GB");
                              return "Recent";
                            })()}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="font-semibold text-[#1D1D1F]">
                          Items: {(job.items || []).map((i) => i.partName).join(", ")}
                        </div>
                        <div className="text-[11px] text-[#86868B] flex items-center justify-between">
                          <span>
                            Total SAR:{" "}
                            <strong className="text-[#1D1D1F]">
                              {(job.grandTotalSAR || job.subtotalSAR || 0).toFixed(2)} SAR
                            </strong>{" "}
                            (incl. VAT)
                          </span>
                          {(job.items || []).some((i) => i.authorizedByPin) && (
                            <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-bold border border-amber-200">
                              PIN Authorized
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2 border-t border-black/[0.06]">
              <button
                type="button"
                onClick={() => setSelectedDriverDetail(null)}
                className="flex-1 h-11 bg-black/[0.04] hover:bg-black/[0.08] text-[#1D1D1F] text-xs font-semibold rounded-2xl transition-all"
              >
                Close Profile
              </button>
              <button
                type="button"
                onClick={() => {
                  const trailerNum = selectedDriverDetail.trailerNumber;
                  setSelectedDriverDetail(null);
                  onSelectTrailerForJob?.(trailerNum);
                }}
                className="flex-1 h-11 bg-[#1D1D1F] hover:bg-black text-white text-xs font-semibold rounded-2xl transition-all shadow-md flex items-center justify-center gap-1.5"
              >
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>Create New Job Card</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
