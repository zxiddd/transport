"use client";

import React, { useState } from "react";
import { OnboardingGate } from "@/components/onboarding/OnboardingGate";
import { useAuth } from "@/context/AuthContext";
import { JobCardTerminal } from "@/components/terminal/JobCardTerminal";
import { LedgerView } from "@/components/records/LedgerView";
import { ReportsView } from "@/components/reports/ReportsView";
import { FleetDirectoryView } from "@/components/fleet/FleetDirectoryView";
import { SettingsView } from "@/components/settings/SettingsView";
import { FleetSettingsModal } from "@/components/settings/FleetSettingsModal";
import { LandingPage } from "@/components/landing/LandingPage";
import { AuthModal } from "@/components/auth/AuthModal";
import {
  FileText,
  Plus,
  BarChart3,
  SlidersHorizontal,
  Truck,
  LogOut,
  UserCheck,
} from "lucide-react";

function WorkshopTerminal({ onRerunOnboarding }: { onRerunOnboarding: () => void }) {
  const { companyProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<"terminal" | "records" | "reports" | "fleet" | "settings">("terminal");
  const [selectedTrailerForJob, setSelectedTrailerForJob] = useState<string>("");
  const [lastSavedTimestamp, setLastSavedTimestamp] = useState<number>(Date.now());

  return (
    <div className="min-h-screen bg-[#F5F5F7] font-sans flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Apple-Style Glassmorphic Minimal Header */}
      <header className="bg-white/80 backdrop-blur-xl sticky top-0 z-30 border-b border-black/[0.06] print:hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand & Fleet Info */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1D1D1F] text-white flex items-center justify-center font-bold text-xs shadow-sm tracking-wider shrink-0">
              ZT
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#86868B] block">
                Z Transport Management
              </span>
              <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-[#1D1D1F] leading-snug">
                {companyProfile?.name || "Yard Fleet Operations"}
              </h1>
            </div>
          </div>

          {/* Segmented Main Navigation Bar */}
          <div className="hidden md:flex items-center bg-black/[0.04] p-1 rounded-full border border-black/[0.04]">
            <button
              onClick={() => setActiveTab("terminal")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                activeTab === "terminal"
                  ? "bg-white text-[#1D1D1F] shadow-[0_1px_4px_rgba(0,0,0,0.08)] font-bold"
                  : "text-[#86868B] hover:text-[#1D1D1F]"
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Job Card</span>
            </button>
            <button
              onClick={() => setActiveTab("records")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                activeTab === "records"
                  ? "bg-white text-[#1D1D1F] shadow-[0_1px_4px_rgba(0,0,0,0.08)] font-bold"
                  : "text-[#86868B] hover:text-[#1D1D1F]"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Audit Ledger</span>
            </button>
            <button
              onClick={() => setActiveTab("reports")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                activeTab === "reports"
                  ? "bg-white text-[#1D1D1F] shadow-[0_1px_4px_rgba(0,0,0,0.08)] font-bold"
                  : "text-[#86868B] hover:text-[#1D1D1F]"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Fleet Reports</span>
            </button>
            <button
              onClick={() => setActiveTab("fleet")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                activeTab === "fleet"
                  ? "bg-white text-[#1D1D1F] shadow-[0_1px_4px_rgba(0,0,0,0.08)] font-bold"
                  : "text-[#86868B] hover:text-[#1D1D1F]"
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Fleet Directory</span>
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                activeTab === "settings"
                  ? "bg-white text-[#1D1D1F] shadow-[0_1px_4px_rgba(0,0,0,0.08)] font-bold"
                  : "text-[#86868B] hover:text-[#1D1D1F]"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Settings</span>
            </button>
          </div>
        </div>

        {/* Mobile Tab Navigation */}
        <div className="flex md:hidden items-center justify-around bg-black/[0.03] p-1.5 border-t border-black/[0.04] overflow-x-auto">
          <button
            onClick={() => setActiveTab("terminal")}
            className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap ${
              activeTab === "terminal" ? "bg-white text-[#1D1D1F] shadow-sm" : "text-[#86868B]"
            }`}
          >
            Job Terminal
          </button>
          <button
            onClick={() => setActiveTab("records")}
            className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap ${
              activeTab === "records" ? "bg-white text-[#1D1D1F] shadow-sm" : "text-[#86868B]"
            }`}
          >
            Audit Ledger
          </button>
          <button
            onClick={() => setActiveTab("reports")}
            className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap ${
              activeTab === "reports" ? "bg-white text-[#1D1D1F] shadow-sm" : "text-[#86868B]"
            }`}
          >
            Reports
          </button>
          <button
            onClick={() => setActiveTab("fleet")}
            className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap ${
              activeTab === "fleet" ? "bg-white text-[#1D1D1F] shadow-sm" : "text-[#86868B]"
            }`}
          >
            Fleet
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap ${
              activeTab === "settings" ? "bg-white text-[#1D1D1F] shadow-sm" : "text-[#86868B]"
            }`}
          >
            Settings
          </button>
        </div>
      </header>

      {/* Main Content Workspace */}
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
        <div className={activeTab === "settings" ? "block animate-in fade-in duration-200" : "hidden"}>
          <SettingsView onRerunOnboarding={onRerunOnboarding} />
        </div>
      </main>

      {/* Clean Apple Minimal Footer */}
      <footer className="bg-white/60 border-t border-black/[0.06] py-3.5 text-xs text-[#86868B] print:hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px]">
          <span>{companyProfile?.name || "Z Transport Management"} · Commercial Fleet Terminal</span>
          <span>Kingdom of Saudi Arabia · ZATCA VAT Compliant</span>
        </div>
      </footer>
    </div>
  );
}

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("register");
  const [resetKey, setResetKey] = useState(0);

  const handleOpenLogin = () => {
    setAuthMode("login");
    setAuthModalOpen(true);
  };

  const handleOpenRegister = () => {
    setAuthMode("register");
    setAuthModalOpen(true);
  };

  const handleRerunOnboarding = () => {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("z_transport_active_session");
      } catch {}
    }
    setResetKey((prev) => prev + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 rounded-2xl bg-[#1D1D1F] text-white flex items-center justify-center font-bold text-xs animate-pulse mb-3">
          ZT
        </div>
        <div className="text-xs font-semibold text-[#86868B]">Loading Z Transport Management...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <LandingPage onOpenLogin={handleOpenLogin} onOpenRegister={handleOpenRegister} />
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          initialMode={authMode}
        />
      </>
    );
  }

  return (
    <OnboardingGate key={resetKey}>
      <WorkshopTerminal onRerunOnboarding={handleRerunOnboarding} />
    </OnboardingGate>
  );
}
