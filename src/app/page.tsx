"use client";

import React, { useState } from "react";
import { OnboardingGate } from "@/components/onboarding/OnboardingGate";
import { useAuth } from "@/context/AuthContext";
import { JobCardTerminal } from "@/components/terminal/JobCardTerminal";
import { LedgerView } from "@/components/records/LedgerView";
import {
  Wrench,
  ShieldCheck,
  Building2,
  FileText,
  History,
  PlusCircle,
} from "lucide-react";

function WorkshopTerminal() {
  const { companyProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<"terminal" | "records">("terminal");

  return (
    <div className="min-h-screen bg-[#F5F5F7] font-sans flex flex-col selection:bg-[#10B981] selection:text-white">
      {/* Apple-Style Navigation Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-[#E5E5EA] print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#10B981] text-white flex items-center justify-center font-bold text-lg shadow-sm">
              TT
            </div>
            <div>
              <h1 className="text-base font-bold text-[#1D1D1F] leading-tight">
                {companyProfile?.name || "Tala Transport"}
              </h1>
              <p className="text-xs text-[#86868B]">
                {companyProfile?.branch || "Jeddah Fleet Yard 3"} · SAR Workshop
              </p>
            </div>
          </div>

          {/* Tab Navigation Pill */}
          <div className="flex items-center bg-[#F5F5F7] p-1 rounded-2xl border border-[#E5E5EA]">
            <button
              onClick={() => setActiveTab("terminal")}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "terminal"
                  ? "bg-white text-[#10B981] shadow-sm"
                  : "text-[#86868B] hover:text-[#1D1D1F]"
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Job Card</span>
            </button>
            <button
              onClick={() => setActiveTab("records")}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "records"
                  ? "bg-white text-[#10B981] shadow-sm"
                  : "text-[#86868B] hover:text-[#1D1D1F]"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Audit Ledger & Records</span>
            </button>
          </div>

          {/* Status Badge */}
          <div className="hidden sm:flex items-center gap-2">
            <span className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-[#059669] text-xs font-bold rounded-full flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Fraud Engine Active
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "terminal" && <JobCardTerminal />}
        {activeTab === "records" && <LedgerView />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E5E5EA] py-4 text-center text-xs text-[#86868B] print:hidden">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>{companyProfile?.name || "Tala Transport"} · Commercial Fleet Terminal</span>
          <span>Jeddah • Dammam • Riyadh Operations · Saudi Arabia</span>
        </div>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <OnboardingGate>
      <WorkshopTerminal />
    </OnboardingGate>
  );
}
