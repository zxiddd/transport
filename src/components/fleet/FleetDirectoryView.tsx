"use client";

import React, { useState, useMemo } from "react";
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
} from "lucide-react";
import { TALA_FLEET_50 } from "@/lib/talaFleetData";

interface FleetDirectoryViewProps {
  onSelectTrailerForJob?: (trailerNumber: string) => void;
}

export function FleetDirectoryView({ onSelectTrailerForJob }: FleetDirectoryViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "GROUNDED">("ALL");
  const [routeFilter, setRouteFilter] = useState<string>("ALL");

  // Filtering
  const filteredRecords = useMemo(() => {
    return TALA_FLEET_50.filter((item) => {
      // Status filter
      if (statusFilter === "ACTIVE" && item.status !== "active") return false;
      if (statusFilter === "GROUNDED" && item.status !== "grounded") return false;

      // Route filter
      if (routeFilter !== "ALL") {
        if (routeFilter === "PORT" && !item.toLocation.toLowerCase().includes("port")) return false;
        if (routeFilter === "YARD" && item.toLocation.toLowerCase().includes("port")) return false;
      }

      // Search query (trailer number, driver name, phone, iqama, route, model)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTrailer = item.trailerNumber.toLowerCase().includes(q);
        const matchDriver = item.driverName.toLowerCase().includes(q);
        const matchFrom = item.fromLocation.toLowerCase().includes(q);
        const matchTo = item.toLocation.toLowerCase().includes(q);
        const matchIqama = item.iqamaNumber.toLowerCase().includes(q);
        const matchModel = item.modelType.toLowerCase().includes(q);
        const matchDate = item.loadDate.toLowerCase().includes(q);
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
  }, [searchQuery, statusFilter, routeFilter]);

  // Summary Metrics
  const totalFleet = TALA_FLEET_50.length;
  const activeCount = TALA_FLEET_50.filter((r) => r.status === "active").length;
  const groundedCount = TALA_FLEET_50.filter((r) => r.status === "grounded").length;
  const portRunsCount = TALA_FLEET_50.filter((r) =>
    r.toLocation.toLowerCase().includes("port")
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
      "Trailer Type",
      "Driver Iqama",
      "Driver Phone",
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
      `Tala_Transport_Fleet_Directory_${new Date().toISOString().split("T")[0]}.csv`
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
              Tala Transport · Fleet & Driver Directory
            </h2>
          </div>
          <p className="text-xs text-[#86868B]">
            Commercial fleet roster with trailer numbers, assigned drivers, and dispatch load schedules.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="h-9 px-3.5 rounded-full bg-white border border-black/[0.08] text-xs font-semibold text-[#1D1D1F] hover:bg-black/[0.03] transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#86868B]" />
            <span>Export Roster (CSV)</span>
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
            <span className="text-[11px] text-[#86868B]">Tala Fleet</span>
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
              Requires Review
            </span>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white border border-black/[0.06] rounded-2xl p-3 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        {/* Search input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-[#86868B] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by trailer number (e.g. 1286, 8440), driver name (e.g. Dilshad), or route..."
            className="w-full h-10 pl-10 pr-4 bg-black/[0.03] border border-black/[0.06] rounded-xl text-xs font-medium text-[#1D1D1F] outline-none focus:border-emerald-500 focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-[10px] text-[#86868B] hover:text-[#1D1D1F] absolute right-3 top-1/2 -translate-y-1/2 font-semibold"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
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

          <div className="flex items-center bg-black/[0.03] p-1 rounded-xl border border-black/[0.04] text-xs">
            <button
              type="button"
              onClick={() => setRouteFilter("ALL")}
              className={`px-2 py-1 rounded-lg font-medium transition-all ${
                routeFilter === "ALL"
                  ? "bg-white text-[#1D1D1F] shadow-sm font-semibold"
                  : "text-[#86868B] hover:text-[#1D1D1F]"
              }`}
            >
              All Routes
            </button>
            <button
              type="button"
              onClick={() => setRouteFilter("PORT")}
              className={`px-2 py-1 rounded-lg font-medium transition-all ${
                routeFilter === "PORT"
                  ? "bg-white text-[#1D1D1F] shadow-sm font-semibold"
                  : "text-[#86868B] hover:text-[#1D1D1F]"
              }`}
            >
              Port (9 am)
            </button>
            <button
              type="button"
              onClick={() => setRouteFilter("YARD")}
              className={`px-2 py-1 rounded-lg font-medium transition-all ${
                routeFilter === "YARD"
                  ? "bg-white text-[#1D1D1F] shadow-sm font-semibold"
                  : "text-[#86868B] hover:text-[#1D1D1F]"
              }`}
            >
              Local / Yard
            </button>
          </div>
        </div>
      </div>

      {/* Fleet Table */}
      <div className="bg-white border border-black/[0.06] rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-black/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#1D1D1F]">
              Showing {filteredRecords.length} of {totalFleet} Vehicles
            </span>
            {searchQuery && (
              <span className="text-[11px] text-[#86868B]">
                matching &quot;{searchQuery}&quot;
              </span>
            )}
          </div>
          <span className="text-[11px] text-[#86868B]">
            Click &quot;New Job Card&quot; to inspect or log repairs
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
                    No trailers found matching your search.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((item) => {
                  const isGrounded = item.status === "grounded";
                  return (
                    <tr
                      key={item.sn}
                      className={`hover:bg-[#F5F5F7]/80 transition-colors ${
                        isGrounded ? "bg-rose-50/40" : ""
                      }`}
                    >
                      {/* S.No */}
                      <td className="py-3 px-4 text-center font-mono text-[11px] text-[#86868B]">
                        {item.sn}
                      </td>

                      {/* Trailer Number */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-[#1D1D1F] bg-black/[0.04] px-2.5 py-1 rounded-lg border border-black/[0.06]">
                            {item.trailerNumber}
                          </span>
                        </div>
                      </td>

                      {/* Driver Name & Iqama */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-[#86868B] shrink-0" />
                          <div>
                            <span className="font-semibold block text-[#1D1D1F]">
                              {item.driverName}
                            </span>
                            <span className="text-[10px] text-[#86868B] font-mono">
                              Iqama: {item.iqamaNumber}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Load Date */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-[#86868B]">
                          <Calendar className="w-3.5 h-3.5 text-[#86868B]" />
                          <span className="font-mono text-[11px] text-[#1D1D1F]">
                            {item.loadDate}
                          </span>
                        </div>
                      </td>

                      {/* Dispatch Route */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <div className="text-xs">
                            <span className="text-[#1D1D1F] font-medium">{item.fromLocation}</span>
                            <span className="text-[#86868B] mx-1">➔</span>
                            <span
                              className={`font-semibold ${
                                item.toLocation.toLowerCase().includes("port")
                                  ? "text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60"
                                  : "text-[#86868B]"
                              }`}
                            >
                              {item.toLocation}
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
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => onSelectTrailerForJob?.(item.trailerNumber)}
                          className="px-3 py-1.5 rounded-xl bg-black/[0.04] hover:bg-[#1D1D1F] hover:text-white text-[11px] font-semibold text-[#1D1D1F] transition-all flex items-center gap-1.5 ml-auto cursor-pointer"
                          title={`Create Job Card for Trailer ${item.trailerNumber}`}
                        >
                          <FileText className="w-3 h-3" />
                          <span>New Job Card</span>
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
    </div>
  );
}
