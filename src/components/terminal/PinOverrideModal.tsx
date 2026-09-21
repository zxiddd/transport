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

    if (pin.trim() !== requiredPin) {
      setError("Invalid Supervisor Authorization PIN.");
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

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-[#E5E5EA] rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#86868B] hover:text-[#1D1D1F] p-2 rounded-full hover:bg-[#F5F5F7] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#1D1D1F]">
              Authorize Replacement Override
            </h3>
            <p className="text-xs text-[#86868B]">
              Supervisor PIN & Mandatory Audit Justification
            </p>
          </div>
        </div>

        <div className="bg-[#F5F5F7] border border-[#E5E5EA] rounded-2xl p-4 space-y-2 text-xs text-[#1D1D1F]">
          <div>
            <span className="font-semibold text-[#86868B]">Flagged Item: </span>
            <span className="font-bold">{partName}</span> ({axlePosition})
          </div>
          <div>
            <span className="font-semibold text-[#86868B]">Cooldown Violation: </span>
            <span className="font-bold text-red-600">
              Replaced {daysSinceLastService} days ago
            </span>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-600">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Supervisor PIN */}
          <div>
            <label className="block text-xs font-semibold text-[#1D1D1F] uppercase tracking-wider mb-1.5">
              Supervisor Security PIN
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#86868B]">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                placeholder="Enter 4-digit PIN"
                className="w-full h-[48px] pl-10 pr-4 bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl text-sm font-mono tracking-widest text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:bg-white"
              />
            </div>
          </div>

          {/* Mandatory Justification */}
          <div>
            <label className="block text-xs font-semibold text-[#1D1D1F] uppercase tracking-wider mb-1.5">
              Mandatory Override Justification Note
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Highway blowout confirmed via physical yard inspection"
              className="w-full p-3 bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl text-xs text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:bg-white resize-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-[48px] bg-[#F5F5F7] hover:bg-[#E5E5EA] text-[#1D1D1F] text-sm font-semibold rounded-2xl transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleVerifyAndSubmit}
            className="flex-1 h-[48px] bg-[#10B981] hover:bg-[#059669] text-white text-sm font-bold rounded-2xl transition-all shadow-md hover:shadow-lg"
          >
            Verify & Authorize
          </button>
        </div>
      </div>
    </div>
  );
}
