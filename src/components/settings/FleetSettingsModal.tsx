"use client";

import React, { useState } from "react";
import {
  X,
  Building2,
  Lock,
  Check,
  RotateCcw,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { doc, setDoc } from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";

interface FleetSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRerunOnboarding: () => void;
}

export function FleetSettingsModal({
  isOpen,
  onClose,
  onRerunOnboarding,
}: FleetSettingsModalProps) {
  const { companyId, companyProfile, refreshCompanyProfile } = useAuth();
  const targetCid = companyId || "tala-transport";

  const [companyName, setCompanyName] = useState(
    companyProfile?.name || "Tala Transport"
  );
  const [branch, setBranch] = useState(
    companyProfile?.branch || "Jeddah Fleet Yard 3"
  );
  const [managerPin, setManagerPin] = useState(
    companyProfile?.managerPin || "7788"
  );
  const [vatRatePercentage, setVatRatePercentage] = useState<number>(
    companyProfile?.vatRatePercentage ?? (companyProfile?.vatEnabled ? 15 : 0)
  );
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const cleanVatRate = Math.max(0, Number(vatRatePercentage) || 0);
      const updatedProfile = {
        id: targetCid,
        name: companyName.trim() || "Tala Transport",
        branch: branch.trim() || "Jeddah Fleet Yard 3",
        currency: "SAR" as const,
        vatEnabled: cleanVatRate > 0,
        vatRatePercentage: cleanVatRate,
        managerPin: managerPin.trim() || "7788",
        hasCompletedOnboarding: true,
      };

      // 1. LocalStorage
      if (typeof window !== "undefined") {
        localStorage.setItem(
          `tala_company_${targetCid}`,
          JSON.stringify(updatedProfile)
        );
      }

      // 2. Firestore if online (non-blocking)
      if (isFirebaseConfigured && db) {
        setDoc(doc(db, "companies", targetCid), updatedProfile, {
          merge: true,
        }).catch(() => {});
      }

      await refreshCompanyProfile();
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 500);
    } catch {
      // safe fallback
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white/95 backdrop-blur-2xl border border-black/[0.08] rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-[0_24px_48px_rgba(0,0,0,0.12)] space-y-6 relative text-[#1D1D1F]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/[0.06] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-black/[0.04] text-[#1D1D1F] flex items-center justify-center">
              <Building2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold tracking-tight text-[#1D1D1F]">
                Workshop & Fleet Settings
              </h3>
              <p className="text-xs text-[#86868B]">
                Configure yard profile, supervisor security PIN & VAT
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#86868B] hover:text-[#1D1D1F] hover:bg-black/[0.05] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Settings Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#86868B] uppercase tracking-wider mb-1.5">
              Workshop / Company Name
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full h-11 px-3.5 bg-black/[0.03] border border-black/[0.08] rounded-xl text-sm font-medium text-[#1D1D1F] focus:bg-white focus:border-emerald-500 transition-all outline-none"
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
              className="w-full h-11 px-3.5 bg-black/[0.03] border border-black/[0.08] rounded-xl text-sm font-medium text-[#1D1D1F] focus:bg-white focus:border-emerald-500 transition-all outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#86868B] uppercase tracking-wider mb-1.5">
                Supervisor PIN (4 Digits)
              </label>
              <div className="relative">
                <input
                  type="password"
                  maxLength={4}
                  value={managerPin}
                  onChange={(e) => setManagerPin(e.target.value.replace(/\D/g, ""))}
                  className="w-full h-11 pl-3.5 pr-8 bg-black/[0.03] border border-black/[0.08] rounded-xl text-sm font-mono tracking-widest text-[#1D1D1F] focus:bg-white focus:border-emerald-500 transition-all outline-none"
                />
                <Lock className="w-4 h-4 text-[#86868B] absolute right-2.5 top-3.5 pointer-events-none" />
              </div>
              <span className="text-[10px] text-[#86868B] mt-1 block">
                Default demo: 7788
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#86868B] uppercase tracking-wider mb-1.5">
                Fleet VAT Percentage (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={vatRatePercentage}
                  onChange={(e) => setVatRatePercentage(Math.max(0, Number(e.target.value)))}
                  placeholder="e.g. 15"
                  className="w-full h-11 pl-3.5 pr-8 bg-black/[0.03] border border-black/[0.08] rounded-xl text-sm font-mono font-semibold text-[#1D1D1F] focus:bg-white focus:border-emerald-500 transition-all outline-none"
                />
                <span className="text-xs font-bold text-[#86868B] absolute right-3 top-3.5 pointer-events-none">
                  %
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-1.5">
                <button
                  type="button"
                  onClick={() => setVatRatePercentage(15)}
                  className={`text-[10px] px-2 py-0.5 rounded-md font-semibold transition-all ${
                    vatRatePercentage === 15
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-black/[0.04] text-[#86868B] hover:text-[#1D1D1F]"
                  }`}
                >
                  15% Standard
                </button>
                <button
                  type="button"
                  onClick={() => setVatRatePercentage(5)}
                  className={`text-[10px] px-2 py-0.5 rounded-md font-semibold transition-all ${
                    vatRatePercentage === 5
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-black/[0.04] text-[#86868B] hover:text-[#1D1D1F]"
                  }`}
                >
                  5%
                </button>
                <button
                  type="button"
                  onClick={() => setVatRatePercentage(0)}
                  className={`text-[10px] px-2 py-0.5 rounded-md font-semibold transition-all ${
                    vatRatePercentage === 0
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-black/[0.04] text-[#86868B] hover:text-[#1D1D1F]"
                  }`}
                >
                  0% Exempt
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Actions */}
        <div className="pt-2 border-t border-black/[0.06] flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              onClose();
              onRerunOnboarding();
            }}
            className="text-xs font-semibold text-[#86868B] hover:text-[#1D1D1F] flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Re-run Onboarding Setup</span>
          </button>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-11 bg-black/[0.04] hover:bg-black/[0.08] text-[#1D1D1F] text-xs font-semibold rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="flex-1 h-11 bg-[#1D1D1F] hover:bg-black text-white text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Saved</span>
              </>
            ) : isSaving ? (
              <span>Saving...</span>
            ) : (
              <span>Save Changes</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
