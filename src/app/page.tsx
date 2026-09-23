"use client";

import React, { useState } from "react";
import { OnboardingGate } from "@/components/onboarding/OnboardingGate";
import { useAuth } from "@/context/AuthContext";
import { JobCardTerminal } from "@/components/terminal/JobCardTerminal";
import { LedgerView } from "@/components/records/LedgerView";
import { ReportsView } from "@/components/reports/ReportsView";
import { FleetDirectoryView } from "@/components/fleet/FleetDirectoryView";
import { FleetSettingsModal } from "@/components/settings/FleetSettingsModal";
import {
  FileText,
  Plus,
  BarChart3,
  SlidersHorizontal,
  Truck,
} from "lucide-react";

function WorkshopTerminal({ onRerunOnboarding }: { onRerunOnboarding: () => void }) {
  const { companyProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<"terminal" | "records" | "reports" | "fleet">("terminal");
  const [selectedTrailerForJob, setSelectedTrailerForJob] = useState<string>("1286");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [lastSavedTimestamp, setLastSavedTimestamp] = useState<number>(Date.now());

  return (
    <div className="min-h-screen bg-[#F5F5F7] font-sans flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Apple-Style Glassmorphic Header */}
      <header className="bg-white/75 backdrop-blur-xl sticky top-0 z-30 border-b border-black/[0.06] print:hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand & Fleet Info */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1D1D1F] text-white flex items-center justify-center font-bold text-xs shadow-sm tracking-wider">
              TT
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-semibold tracking-tight text-[#1D1D1F]">
                  {companyProfile?.name || "Tala Transport"}
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Anti-Theft Active
                </span>
              </div>
              <p className="text-[11px] text-[#86868B]">
                {companyProfile?.branch || "Jeddah Fleet Yard 3"} · SAR Fleet Workshop
              </p>
            </div>
          </div>

          {/* Segmented Tab Pill */}
          <div className="flex items-center bg-black/[0.04] p-1 rounded-full border border-black/[0.04]">
            <button
              onClick={() => setActiveTab("terminal")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${
                activeTab === "terminal"
                  ? "bg-white text-[#1D1D1F] shadow-[0_1px_4px_rgba(0,0,0,0.08)] font-semibold"
                  : "text-[#86868B] hover:text-[#1D1D1F]"
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Job Card</span>
            </button>
            <button
              onClick={() => setActiveTab("records")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${
                activeTab === "records"
                  ? "bg-white text-[#1D1D1F] shadow-[0_1px_4px_rgba(0,0,0,0.08)] font-semibold"
                  : "text-[#86868B] hover:text-[#1D1D1F]"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Audit Ledger & History</span>
            </button>
            <button
              onClick={() => setActiveTab("reports")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${
                activeTab === "reports"
                  ? "bg-white text-[#1D1D1F] shadow-[0_1px_4px_rgba(0,0,0,0.08)] font-semibold"
                  : "text-[#86868B] hover:text-[#1D1D1F]"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Fleet Reports</span>
            </button>
            <button
              onClick={() => setActiveTab("fleet")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${
                activeTab === "fleet"
                  ? "bg-white text-[#1D1D1F] shadow-[0_1px_4px_rgba(0,0,0,0.08)] font-semibold"
                  : "text-[#86868B] hover:text-[#1D1D1F]"
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Fleet & Drivers (50)</span>
            </button>
          </div>

          {/* Settings Control */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="h-9 px-3.5 rounded-full bg-black/[0.04] hover:bg-black/[0.08] text-[#1D1D1F] text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer"
              title="Configure Fleet Settings, Default VAT & Supervisor PIN"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#86868B]" />
              <span className="hidden sm:inline">Settings</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Workspace - Preserved DOM state with instant smooth switching */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className={activeTab === "terminal" ? "block animate-in fade-in duration-200" : "hidden"}>
          <JobCardTerminal
            selectedTrailerNumber={selectedTrailerForJob}
            onJobSaved={() => setLastSavedTimestamp(Date.now())}
          />
        </div>
        <div className={activeTab === "records" ? "block animate-in fade-in duration-200" : "hidden"}>
          <LedgerView refreshTrigger={lastSavedTimestamp} />
        </div>
        <div className={activeTab === "reports" ? "block animate-in fade-in duration-200" : "hidden"}>
          <ReportsView refreshTrigger={lastSavedTimestamp} />
        </div>
        <div className={activeTab === "fleet" ? "block animate-in fade-in duration-200" : "hidden"}>
          <FleetDirectoryView
            onSelectTrailerForJob={(trailerNum) => {
              setSelectedTrailerForJob(trailerNum);
              setActiveTab("terminal");
            }}
          />
        </div>
      </main>

      {/* Clean Apple Minimal Footer */}
      <footer className="bg-white/60 border-t border-black/[0.06] py-3.5 text-xs text-[#86868B] print:hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px]">
          <span>{companyProfile?.name || "Tala Transport"} · Commercial Fleet Terminal</span>
          <span>Kingdom of Saudi Arabia · ZATCA VAT Compliant</span>
        </div>
      </footer>

      {/* Settings Modal */}
      <FleetSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onRerunOnboarding={onRerunOnboarding}
      />
    </div>
  );
}

export default function Home() {
  const [resetKey, setResetKey] = useState(0);

  const handleRerunOnboarding = () => {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("tala_company_tala-transport");
      } catch {}
    }
    setResetKey((prev) => prev + 1);
  };

  return (
    <OnboardingGate key={resetKey}>
      <WorkshopTerminal onRerunOnboarding={handleRerunOnboarding} />
    </OnboardingGate>
  );
}
