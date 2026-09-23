"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  Truck,
  FileText,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  Lock,
  Zap,
  Sparkles,
  Receipt,
  Layers,
  Activity,
  ChevronRight,
} from "lucide-react";

interface LandingPageProps {
  onOpenLogin: () => void;
  onOpenRegister: () => void;
}

export function LandingPage({ onOpenLogin, onOpenRegister }: LandingPageProps) {
  const [activeDemoTab, setActiveDemoTab] = useState<"terminal" | "ledger" | "analytics">("terminal");

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] font-sans selection:bg-emerald-500 selection:text-white flex flex-col">
      {/* Glassmorphic Navigation Header */}
      <header className="bg-white/80 backdrop-blur-xl sticky top-0 z-40 border-b border-black/[0.06]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1D1D1F] text-white flex items-center justify-center font-bold text-xs shadow-sm tracking-wider">
              ZT
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold tracking-tight text-[#1D1D1F]">
                  Z Transport Management
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  SaaS v2.4
                </span>
              </div>
              <p className="text-[11px] text-[#86868B]">Fleet Workshop & Anti-Theft OS</p>
            </div>
          </div>

          {/* Nav Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenLogin}
              className="h-9 px-4 rounded-full bg-black/[0.04] hover:bg-black/[0.08] text-[#1D1D1F] text-xs font-semibold transition-all"
            >
              Sign In
            </button>
            <button
              onClick={onOpenRegister}
              className="h-9 px-4 rounded-full bg-[#1D1D1F] hover:bg-black text-white text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-16 sm:pt-20 sm:pb-24 overflow-hidden">
        {/* Subtle Background Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-emerald-200/40 via-sky-200/30 to-purple-200/20 blur-3xl pointer-events-none rounded-full -z-10" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-black/[0.08] text-xs font-medium text-[#1D1D1F] shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Anti-Theft Parts Protection & ZATCA VAT Engine</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#1D1D1F] leading-[1.15]">
            The Operating System for <br />
            <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 bg-clip-text text-transparent">
              Commercial Fleet Workshops
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-[#86868B] max-w-2xl mx-auto leading-relaxed font-normal">
            Eliminate parts theft, enforce supervisor PIN authorizations, generate ZATCA-compliant
            VAT invoices, and track expenditure for your trailers in real-time.
          </p>

          {/* Hero Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onOpenRegister}
              className="w-full sm:w-auto h-12 px-7 rounded-2xl bg-[#1D1D1F] hover:bg-black text-white text-xs font-semibold transition-all shadow-md hover:shadow-xl flex items-center justify-center gap-2"
            >
              <span>Start Free Setup</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenLogin}
              className="w-full sm:w-auto h-12 px-7 rounded-2xl bg-white/80 hover:bg-white text-[#1D1D1F] border border-black/[0.08] text-xs font-semibold transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <span>Sign In to Existing Fleet</span>
            </button>
          </div>

          {/* Trust Highlights */}
          <div className="pt-6 flex items-center justify-center gap-6 text-xs text-[#86868B]">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>ZATCA VAT 15% Ready</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Anti-Theft Cooldown Locks</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Instant Local & Cloud Sync</span>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Product Demo Switcher */}
      <section className="py-12 max-w-5xl mx-auto px-4 sm:px-6 w-full">
        <div className="bg-white/90 backdrop-blur-2xl border border-black/[0.08] rounded-3xl p-6 sm:p-8 shadow-[0_24px_48px_rgba(0,0,0,0.08)] space-y-6">
          {/* Demo Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-black/[0.06] pb-5">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-[#1D1D1F]">
                Interactive SaaS Platform Showcase
              </h2>
              <p className="text-xs text-[#86868B]">
                Explore how Z Transport Management handles fleet maintenance and anti-theft workflows.
              </p>
            </div>

            {/* Segmented Demo Tabs */}
            <div className="flex items-center bg-black/[0.04] p-1 rounded-2xl border border-black/[0.04]">
              <button
                onClick={() => setActiveDemoTab("terminal")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeDemoTab === "terminal"
                    ? "bg-white text-[#1D1D1F] shadow-sm"
                    : "text-[#86868B] hover:text-[#1D1D1F]"
                }`}
              >
                Job Terminal
              </button>
              <button
                onClick={() => setActiveDemoTab("ledger")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeDemoTab === "ledger"
                    ? "bg-white text-[#1D1D1F] shadow-sm"
                    : "text-[#86868B] hover:text-[#1D1D1F]"
                }`}
              >
                Audit Ledger
              </button>
              <button
                onClick={() => setActiveDemoTab("analytics")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeDemoTab === "analytics"
                    ? "bg-white text-[#1D1D1F] shadow-sm"
                    : "text-[#86868B] hover:text-[#1D1D1F]"
                }`}
              >
                Expenditure Analytics
              </button>
            </div>
          </div>

          {/* Demo Screen Views */}
          <div className="bg-[#F5F5F7] rounded-2xl p-6 border border-black/[0.04] min-h-[260px] flex items-center justify-center">
            {activeDemoTab === "terminal" && (
              <div className="w-full space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-black/[0.06] shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-semibold text-xs">
                      TR
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#1D1D1F]">Trailer #7842-JED</div>
                      <div className="text-[11px] text-[#86868B]">Flatbed 40ft · Driver: Ahmed Al-Ghamdi</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-200">
                    Ready for Service
                  </span>
                </div>

                <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3.5 flex items-center justify-between text-xs text-amber-900">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-amber-600" />
                    <span>
                      <strong>Anti-Theft Alert:</strong> Drive Tire 315/80 replaced 12 days ago (Cooldown: 45 days).
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-amber-700 uppercase bg-amber-100 px-2 py-0.5 rounded">
                    PIN Required
                  </span>
                </div>
              </div>
            )}

            {activeDemoTab === "ledger" && (
              <div className="w-full space-y-3 animate-in fade-in duration-200">
                <div className="grid grid-cols-4 text-[11px] font-bold text-[#86868B] uppercase tracking-wider pb-2 border-b border-black/[0.06]">
                  <span>Job Ref</span>
                  <span>Trailer</span>
                  <span>Part / Service</span>
                  <span>Amount (SAR)</span>
                </div>
                <div className="grid grid-cols-4 text-xs font-medium text-[#1D1D1F] py-2 border-b border-black/[0.04]">
                  <span className="font-mono text-emerald-700">#JOB-2026-091</span>
                  <span>1286 (Flatbed)</span>
                  <span>Drive Tire Replacement</span>
                  <span className="font-semibold">1,092.50 SAR</span>
                </div>
                <div className="grid grid-cols-4 text-xs font-medium text-[#1D1D1F] py-2">
                  <span className="font-mono text-emerald-700">#JOB-2026-090</span>
                  <span>8440 (Chassis)</span>
                  <span>Brake Drum Servicing</span>
                  <span className="font-semibold">437.00 SAR</span>
                </div>
              </div>
            )}

            {activeDemoTab === "analytics" && (
              <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in duration-200">
                <div className="bg-white p-4 rounded-xl border border-black/[0.06] shadow-sm">
                  <div className="text-[11px] font-medium text-[#86868B]">Monthly Maintenance</div>
                  <div className="text-xl font-bold text-[#1D1D1F] mt-1">14,280 SAR</div>
                  <div className="text-[10px] text-emerald-600 mt-1 font-semibold">↓ 18% Fraud Savings</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-black/[0.06] shadow-sm">
                  <div className="text-[11px] font-medium text-[#86868B]">ZATCA VAT Collected</div>
                  <div className="text-xl font-bold text-[#1D1D1F] mt-1">1,862.60 SAR</div>
                  <div className="text-[10px] text-sky-600 mt-1 font-semibold">15% Standard Rate</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-black/[0.06] shadow-sm">
                  <div className="text-[11px] font-medium text-[#86868B]">PIN Overrides Authorized</div>
                  <div className="text-xl font-bold text-[#1D1D1F] mt-1">3 Audited</div>
                  <div className="text-[10px] text-amber-600 mt-1 font-semibold">100% Verified</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Feature Value Pillars */}
      <section className="py-16 border-t border-black/[0.06] bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto space-y-2 mb-12">
            <h2 className="text-2xl font-bold tracking-tight text-[#1D1D1F]">
              Built Specifically for Heavy Logistics & Workshop Control
            </h2>
            <p className="text-xs text-[#86868B]">
              Standard fleet software lacks anti-theft logic. Z Transport Management closes the loop.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Feature 1 */}
            <div className="bg-[#F5F5F7] p-6 rounded-3xl border border-black/[0.04] space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#1D1D1F]">Anti-Theft Cooldown Locks</h3>
              <p className="text-xs text-[#86868B] leading-relaxed">
                Prevents premature component swaps. High-value tires and brake drums require supervisor
                4-digit PIN override if replaced within cooldown limits.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-[#F5F5F7] p-6 rounded-3xl border border-black/[0.04] space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-800 flex items-center justify-center">
                <Receipt className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#1D1D1F]">ZATCA Tax Invoicing</h3>
              <p className="text-xs text-[#86868B] leading-relaxed">
                Automatic 15% / 5% VAT rate calculations, line item taxonomy, and instant printable PDF job
                cards for client billing & records.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-[#F5F5F7] p-6 rounded-3xl border border-black/[0.04] space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#1D1D1F]">Fleet Audit Ledger</h3>
              <p className="text-xs text-[#86868B] leading-relaxed">
                Complete historical record of every maintenance ticket, driver assignment, component lifespan,
                and PIN override audit trail.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer Banner */}
      <section className="py-16 bg-[#1D1D1F] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-5">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Ready to Secure Your Fleet Maintenance & Operations?
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 max-w-lg mx-auto">
            Get started in under 2 minutes. Add your trailers, define parts catalog, and control workshop jobs.
          </p>
          <div className="pt-2">
            <button
              onClick={onOpenRegister}
              className="h-12 px-8 rounded-2xl bg-white text-[#1D1D1F] hover:bg-gray-100 text-xs font-bold transition-all shadow-lg inline-flex items-center gap-2"
            >
              <span>Create Account Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Minimal Apple Footer */}
      <footer className="mt-auto bg-white border-t border-black/[0.06] py-6 text-xs text-[#86868B]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
          <div>
            © {new Date().getFullYear()} Z Transport Management SaaS. All rights reserved.
          </div>
          <div className="flex items-center gap-4 text-[#86868B]">
            <span>Kingdom of Saudi Arabia</span>
            <span>·</span>
            <span>ZATCA VAT Compliant</span>
            <span>·</span>
            <span className="text-emerald-600 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Engine Online
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
