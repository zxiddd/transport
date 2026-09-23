"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
  Lock,
  Check,
  RotateCcw,
  Trash2,
  LogOut,
  UserCheck,
  Percent,
  Shield,
  Phone,
  MapPin,
  FileCheck,
  Building,
  Save,
  Database,
  CloudUpload,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { syncCompanyToFirestore, pushFullStateToFirestore } from "@/lib/firestoreSync";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";

interface SettingsViewProps {
  onRerunOnboarding: () => void;
}

export function SettingsView({ onRerunOnboarding }: SettingsViewProps) {
  const { companyId, companyProfile, refreshCompanyProfile, userEmail, logout } = useAuth();
  const targetCid = companyId || "tala-transport";

  const [companyName, setCompanyName] = useState(
    companyProfile?.name || "Z Transport Management"
  );
  const [branch, setBranch] = useState(
    companyProfile?.branch || "Jeddah Fleet Yard 3"
  );
  const [crNumber, setCrNumber] = useState(
    companyProfile?.crNumber || ""
  );
  const [vatRegistrationNumber, setVatRegistrationNumber] = useState(
    companyProfile?.vatRegistrationNumber || ""
  );
  const [address, setAddress] = useState(
    companyProfile?.address || ""
  );
  const [phone, setPhone] = useState(
    companyProfile?.phone || ""
  );
  const [managerPin, setManagerPin] = useState(
    companyProfile?.managerPin || "7788"
  );
  const [vatRatePercentage, setVatRatePercentage] = useState<number>(
    companyProfile?.vatRatePercentage ?? (companyProfile?.vatEnabled ? 15 : 0)
  );
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSyncingDb, setIsSyncingDb] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState("");

  const handleSyncDatabase = async () => {
    try {
      setIsSyncingDb(true);
      setSyncStatusMsg("Pushing all company profiles, fleet records, parts catalog & job cards to Firestore...");
      await pushFullStateToFirestore(targetCid, companyProfile);
      setSyncStatusMsg("✅ Cloud Firestore database synced successfully! Refresh your Firebase console to view collections.");
      setTimeout(() => setSyncStatusMsg(""), 6000);
    } catch {
      setSyncStatusMsg("❌ Firestore sync failed. Please check browser console or network connection.");
    } finally {
      setIsSyncingDb(false);
    }
  };

  useEffect(() => {
    if (companyProfile) {
      setCompanyName(companyProfile.name || "Z Transport Management");
      setBranch(companyProfile.branch || "Jeddah Fleet Yard 3");
      setCrNumber(companyProfile.crNumber || "");
      setVatRegistrationNumber(companyProfile.vatRegistrationNumber || "");
      setAddress(companyProfile.address || "");
      setPhone(companyProfile.phone || "");
      setManagerPin(companyProfile.managerPin || "7788");
      setVatRatePercentage(companyProfile.vatRatePercentage ?? (companyProfile.vatEnabled ? 15 : 0));
    }
  }, [companyProfile]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const cleanVatRate = Math.max(0, Number(vatRatePercentage) || 0);
      const updatedProfile = {
        id: targetCid,
        name: companyName.trim() || "Z Transport Management",
        branch: branch.trim() || "Jeddah Fleet Yard 3",
        crNumber: crNumber.trim(),
        vatRegistrationNumber: vatRegistrationNumber.trim(),
        address: address.trim(),
        phone: phone.trim(),
        currency: "SAR" as const,
        vatEnabled: cleanVatRate > 0,
        vatRatePercentage: cleanVatRate,
        managerPin: managerPin.trim() || "7788",
        hasCompletedOnboarding: true,
        createdAt: companyProfile?.createdAt || Timestamp.now(),
      };

      // 1. LocalStorage
      if (typeof window !== "undefined") {
        localStorage.setItem(
          `tala_company_${targetCid}`,
          JSON.stringify(updatedProfile)
        );
      }

      // 2. Cloud Firestore
      await syncCompanyToFirestore(updatedProfile);

      await refreshCompanyProfile();
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch {
      // safe fallback
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearAllData = () => {
    if (
      confirm(
        "Are you sure you want to clear all stored fleet, parts, job cards, and audit records? This action cannot be undone."
      )
    ) {
      if (typeof window !== "undefined") {
        localStorage.removeItem(`tala_fleet_${targetCid}`);
        localStorage.removeItem(`tala_parts_${targetCid}`);
        localStorage.removeItem(`tala_jobs_${targetCid}`);
        localStorage.removeItem(`tala_audits_${targetCid}`);
        window.location.reload();
      }
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-white border border-[#E5E5EA] rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-black/[0.04] text-[#1D1D1F] flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-[#1D1D1F] tracking-tight">
              Settings & Account Management
            </h2>
            <p className="text-xs text-[#86868B]">
              Configure company profile, tax numbers, security PIN, and manage user sessions
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={isSaving}
          onClick={handleSave}
          className="h-11 px-6 bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold rounded-2xl transition-all shadow-md hover:shadow-lg flex items-center gap-2 cursor-pointer active:scale-[0.99]"
        >
          {savedSuccess ? (
            <>
              <Check className="w-4 h-4 text-white" />
              <span>Saved Successfully</span>
            </>
          ) : isSaving ? (
            <span>Saving Settings...</span>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>

      {/* SECTION 1: ACCOUNT & SESSION INFORMATION */}
      <div className="bg-white border border-[#E5E5EA] rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#E5E5EA] pb-3">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-extrabold text-[#1D1D1F] uppercase tracking-wider">
              1. Account & Session Info
            </h3>
          </div>
          <span className="text-[11px] font-mono text-[#86868B] bg-black/[0.04] px-2.5 py-1 rounded-full">
            Active User
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-1">
          <div className="space-y-1">
            <span className="text-xs text-[#86868B] block font-medium">Logged in Account</span>
            <div className="text-sm font-bold font-mono text-[#1D1D1F] flex items-center gap-2">
              <span>{userEmail || "Administrator"}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => logout()}
            className="h-10 px-5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all flex items-center gap-2 border border-rose-200/80 cursor-pointer shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out of Session</span>
          </button>
        </div>
      </div>

      {/* SECTION 2: WORKSHOP & COMPANY PROFILE */}
      <div className="bg-white border border-[#E5E5EA] rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
        <div className="flex items-center gap-2 border-b border-[#E5E5EA] pb-3">
          <Building className="w-5 h-5 text-emerald-600" />
          <h3 className="text-sm font-extrabold text-[#1D1D1F] uppercase tracking-wider">
            2. Company Profile & Print Details
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#86868B] uppercase tracking-wider mb-1.5">
              Company / Business Name
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Al-Farabi Logistics & Transport"
              className="w-full h-11 px-3.5 bg-black/[0.03] border border-black/[0.08] rounded-xl text-sm font-bold text-[#1D1D1F] focus:bg-white focus:border-emerald-500 transition-all outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#86868B] uppercase tracking-wider mb-1.5">
              Operating Yard / Branch Location
            </label>
            <input
              type="text"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              placeholder="e.g. Jeddah Fleet Yard 3"
              className="w-full h-11 px-3.5 bg-black/[0.03] border border-black/[0.08] rounded-xl text-sm font-semibold text-[#1D1D1F] focus:bg-white focus:border-emerald-500 transition-all outline-none"
            />
          </div>
        </div>

        {/* Optional Printable Invoice Details */}
        <div className="bg-black/[0.02] border border-black/[0.06] rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#1D1D1F] uppercase tracking-wider flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-emerald-600" />
              Official Invoice Header Info (Optional)
            </span>
            <span className="text-[10px] text-[#86868B]">Leave blank to exclude from printouts</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-[#86868B] mb-1">
                Commercial Registration (CR) Number
              </label>
              <input
                type="text"
                placeholder="e.g. CR #4030182940"
                value={crNumber}
                onChange={(e) => setCrNumber(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-black/[0.08] rounded-xl text-xs font-mono font-semibold text-[#1D1D1F] outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#86868B] mb-1">
                VAT Registration Number (ZATCA)
              </label>
              <input
                type="text"
                placeholder="e.g. VAT #310284910200003"
                value={vatRegistrationNumber}
                onChange={(e) => setVatRegistrationNumber(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-black/[0.08] rounded-xl text-xs font-mono font-semibold text-[#1D1D1F] outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#86868B] mb-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#86868B]" />
                Yard Physical Address
              </label>
              <input
                type="text"
                placeholder="e.g. Industrial Area Phase 2, Jeddah"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-black/[0.08] rounded-xl text-xs font-medium text-[#1D1D1F] outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#86868B] mb-1 flex items-center gap-1">
                <Phone className="w-3 h-3 text-[#86868B]" />
                Contact Phone
              </label>
              <input
                type="text"
                placeholder="e.g. +966 12 600 0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-black/[0.08] rounded-xl text-xs font-mono font-semibold text-[#1D1D1F] outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: FINANCIAL & SUPERVISOR CONTROLS */}
      <div className="bg-white border border-[#E5E5EA] rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
        <div className="flex items-center gap-2 border-b border-[#E5E5EA] pb-3">
          <Shield className="w-5 h-5 text-emerald-600" />
          <h3 className="text-sm font-extrabold text-[#1D1D1F] uppercase tracking-wider">
            3. Financial & Security Rules
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-[#86868B] uppercase tracking-wider mb-1.5">
              Supervisor Security PIN (4 Digits)
            </label>
            <div className="relative">
              <input
                type="password"
                maxLength={4}
                value={managerPin}
                onChange={(e) => setManagerPin(e.target.value.replace(/\D/g, ""))}
                className="w-full h-11 pl-3.5 pr-8 bg-black/[0.03] border border-black/[0.08] rounded-xl text-sm font-mono tracking-widest text-[#1D1D1F] focus:bg-white focus:border-emerald-500 transition-all outline-none"
              />
              <Lock className="w-4 h-4 text-[#86868B] absolute right-3 top-3.5 pointer-events-none" />
            </div>
            <span className="text-[11px] text-[#86868B] mt-1 block">
              Required to override anti-theft cooldown flags. Default: <strong>7788</strong>
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#86868B] uppercase tracking-wider mb-1.5">
              Default Fleet VAT Rate (%)
            </label>
            <div className="relative">
              <input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={vatRatePercentage}
                onChange={(e) => setVatRatePercentage(Math.max(0, Number(e.target.value)))}
                className="w-full h-11 pl-3.5 pr-8 bg-black/[0.03] border border-black/[0.08] rounded-xl text-sm font-mono font-bold text-[#1D1D1F] focus:bg-white focus:border-emerald-500 transition-all outline-none"
              />
              <Percent className="w-4 h-4 text-[#86868B] absolute right-3 top-3.5 pointer-events-none" />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <button
                type="button"
                onClick={() => setVatRatePercentage(15)}
                className={`text-[11px] px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  vatRatePercentage === 15
                    ? "bg-emerald-600 text-white"
                    : "bg-black/[0.04] text-[#86868B] hover:text-[#1D1D1F]"
                }`}
              >
                15% KSA Standard
              </button>
              <button
                type="button"
                onClick={() => setVatRatePercentage(5)}
                className={`text-[11px] px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  vatRatePercentage === 5
                    ? "bg-emerald-600 text-white"
                    : "bg-black/[0.04] text-[#86868B] hover:text-[#1D1D1F]"
                }`}
              >
                5%
              </button>
              <button
                type="button"
                onClick={() => setVatRatePercentage(0)}
                className={`text-[11px] px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  vatRatePercentage === 0
                    ? "bg-emerald-600 text-white"
                    : "bg-black/[0.04] text-[#86868B] hover:text-[#1D1D1F]"
                }`}
              >
                0% Exempt
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: ADVANCED SYSTEM MAINTENANCE */}
      <div className="bg-white border border-[#E5E5EA] rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
        <div className="flex items-center gap-2 border-b border-[#E5E5EA] pb-3">
          <Database className="w-5 h-5 text-emerald-600" />
          <h3 className="text-sm font-extrabold text-[#1D1D1F] uppercase tracking-wider">
            4. Cloud Firestore Sync & System Maintenance
          </h3>
        </div>

        <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-[#1D1D1F] block flex items-center gap-1.5">
              <CloudUpload className="w-4 h-4 text-emerald-600" />
              Force Push Local Fleet Records to Firestore
            </span>
            <p className="text-[11px] text-[#86868B] mt-0.5">
              Syncs companies, trailers, drivers, parts catalog, and job cards directly to Cloud Firestore.
            </p>
          </div>

          <button
            type="button"
            disabled={isSyncingDb}
            onClick={handleSyncDatabase}
            className="h-10 px-5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm shrink-0 cursor-pointer flex items-center justify-center gap-2"
          >
            {isSyncingDb ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Syncing to Firestore...</span>
              </>
            ) : (
              <>
                <CloudUpload className="w-4 h-4" />
                <span>Sync All Data to Firestore</span>
              </>
            )}
          </button>
        </div>

        {syncStatusMsg && (
          <p className="text-xs font-bold p-3 rounded-xl bg-black/[0.04] text-[#1D1D1F] border border-black/[0.06] animate-in fade-in">
            {syncStatusMsg}
          </p>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-[#E5E5EA]">
          <button
            type="button"
            onClick={onRerunOnboarding}
            className="text-xs font-bold text-[#1D1D1F] hover:text-emerald-600 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-[#86868B]" />
            <span>Re-run Initial Onboarding Wizard</span>
          </button>
          <button
            type="button"
            onClick={handleClearAllData}
            className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear Local Storage & Reset Records</span>
          </button>
        </div>
      </div>
    </div>
  );
}
