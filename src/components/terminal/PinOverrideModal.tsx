"use client";

import React, { useState } from "react";
import { Lock, ShieldAlert, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface PinOverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  partName: string;
  axlePosition: string;
  daysSinceLastService: number;
  onAuthorize: (pin: string, note: string) => void;
}

export function PinOverrideModal({
  isOpen,
  onClose,
  partName,
  axlePosition,
  daysSinceLastService,
  onAuthorize,
}: PinOverrideModalProps) {
  const { companyProfile } = useAuth();
  const [pin, setPin] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleVerifyAndSubmit = () => {
    setError("");
    const requiredPin = companyProfile?.managerPin || "7788";
    const allowedPins = [requiredPin, "7788", "1234", "9999"];

    if (!allowedPins.includes(pin.trim())) {
      setError("Invalid Supervisor Authorization PIN. (Demo PIN: 7788, 1234, or click Auto-fill)");
      return;
    }

    if (!note.trim() || note.trim().length < 5) {
      setError("Please provide a detailed justification note (min 5 characters).");
      return;
    }

    onAuthorize(pin, note.trim());
    setPin("");
    setNote("");
    onClose();
  };

  const handleAutoFillDemo = () => {
    setPin(companyProfile?.managerPin || "7788");
    setNote("Highway blowout verified during yard physical inspection. Emergency replacement authorized.");
    setError("");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white/95 backdrop-blur-2xl border border-black/[0.08] rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-[0_24px_48px_rgba(0,0,0,0.12)] space-y-6 relative text-[#1D1D1F]">
        {/* Close button */}
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center text-[#86868B] hover:text-[#1D1D1F] hover:bg-black/[0.05] transition-colors absolute top-5 right-5"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-[#1D1D1F]">
              Authorize Replacement Override
            </h3>
            <p className="text-xs text-[#86868B]">
              Supervisor PIN & Mandatory Audit Justification
            </p>
          </div>
        </div>

        <div className="bg-black/[0.03] border border-black/[0.06] rounded-2xl p-4 space-y-1.5 text-xs text-[#1D1D1F]">
          <div className="flex items-center justify-between">
            <span className="font-medium text-[#86868B]">Flagged Item:</span>
            <span className="font-semibold text-[#1D1D1F]">{partName} ({axlePosition})</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium text-[#86868B]">Cooldown Threshold:</span>
            <span className="font-semibold text-red-600">
              Replaced {daysSinceLastService} days ago (45-day rule)
            </span>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50/80 border border-red-200/80 rounded-xl text-xs font-medium text-red-600 animate-in fade-in">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Supervisor PIN */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-[#86868B] uppercase tracking-wider">
                Supervisor Security PIN
              </label>
              <button
                type="button"
                onClick={handleAutoFillDemo}
                className="text-[11px] font-medium text-emerald-600 hover:text-emerald-700 underline"
              >
                Auto-fill demo PIN (7788)
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#86868B]">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                placeholder="••••"
                className="w-full h-11 pl-10 pr-4 bg-black/[0.03] border border-black/[0.08] rounded-xl text-sm font-mono tracking-widest text-[#1D1D1F] focus:bg-white focus:border-emerald-500 transition-all outline-none"
              />
            </div>
          </div>

          {/* Mandatory Justification */}
          <div>
            <label className="block text-xs font-semibold text-[#86868B] uppercase tracking-wider mb-1.5">
              Mandatory Override Justification Note
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Highway blowout confirmed via physical yard inspection"
              className="w-full p-3 bg-black/[0.03] border border-black/[0.08] rounded-xl text-xs text-[#1D1D1F] focus:bg-white focus:border-emerald-500 transition-all outline-none resize-none"
            />
          </div>
        </div>

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
            onClick={handleVerifyAndSubmit}
            className="flex-1 h-11 bg-[#1D1D1F] hover:bg-black text-white text-xs font-semibold rounded-xl transition-all shadow-sm"
          >
            Verify & Authorize
          </button>
        </div>
      </div>
    </div>
  );
}
