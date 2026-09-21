"use client";

import React from "react";
import { Building2, MapPin, DollarSign, Percent, Lock } from "lucide-react";

export interface Step1Data {
  companyName: string;
  branch: string;
  currency: "SAR";
  vatEnabled: boolean;
  managerPin: string;
}

interface WizardStep1Props {
  data: Step1Data;
  onChange: (updated: Partial<Step1Data>) => void;
  onNext: () => void;
}

export function WizardStep1({ data, onChange, onNext }: WizardStep1Props) {
  const isValid =
    data.companyName.trim().length > 0 &&
    data.branch.trim().length > 0 &&
    data.managerPin.trim().length === 4 &&
    /^\d+$/.test(data.managerPin);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-2xl font-bold text-[#1D1D1F] tracking-tight">
          Step 1: Workshop Profile
        </h2>
        <p className="text-sm text-[#86868B] max-w-md mx-auto">
          Configure your facility credentials and security authorization PIN for Tala Transport fleet operations.
        </p>
      </div>

      <div className="space-y-5">
        {/* Company Name */}
        <div>
          <label className="block text-xs font-semibold text-[#1D1D1F] uppercase tracking-wider mb-2">
            Company Name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#86868B]">
              <Building2 className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={data.companyName}
              onChange={(e) => onChange({ companyName: e.target.value })}
              placeholder="e.g. Tala Transport"
              className="w-full h-[52px] pl-12 pr-4 bg-[#F5F5F7] border border-[#E5E5EA] rounded-2xl text-[#1D1D1F] text-base font-medium placeholder-[#86868B] focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Workshop Branch */}
        <div>
          <label className="block text-xs font-semibold text-[#1D1D1F] uppercase tracking-wider mb-2">
            Workshop Branch / Yard Location
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#86868B]">
              <MapPin className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={data.branch}
              onChange={(e) => onChange({ branch: e.target.value })}
              placeholder="e.g. Jeddah Industrial Yard 3"
              className="w-full h-[52px] pl-12 pr-4 bg-[#F5F5F7] border border-[#E5E5EA] rounded-2xl text-[#1D1D1F] text-base font-medium placeholder-[#86868B] focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Currency & VAT Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Currency (Locked to SAR) */}
          <div>
            <label className="block text-xs font-semibold text-[#1D1D1F] uppercase tracking-wider mb-2">
              Operating Currency
            </label>
            <div className="h-[52px] px-4 bg-[#F5F5F7] border border-[#E5E5EA] rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#1D1D1F] font-semibold">
                <DollarSign className="w-5 h-5 text-[#86868B]" />
                <span>Saudi Riyal (SAR)</span>
              </div>
              <span className="px-2.5 py-1 text-xs font-bold bg-[#E5E5EA] text-[#1D1D1F] rounded-full">
                Preset
              </span>
            </div>
          </div>

          {/* 15% VAT Toggle */}
          <div>
            <label className="block text-xs font-semibold text-[#1D1D1F] uppercase tracking-wider mb-2">
              KSA 15% Standard VAT
            </label>
            <div
              onClick={() => onChange({ vatEnabled: !data.vatEnabled })}
              className="h-[52px] px-4 bg-[#F5F5F7] border border-[#E5E5EA] rounded-2xl flex items-center justify-between cursor-pointer hover:bg-white transition-all"
            >
              <div className="flex items-center gap-2 text-[#1D1D1F] font-semibold">
                <Percent className="w-5 h-5 text-[#86868B]" />
                <span>Enable 15% VAT</span>
              </div>
              <div
                className={`w-12 h-7 rounded-full p-1 transition-colors duration-200 ease-in-out ${
                  data.vatEnabled ? "bg-[#10B981]" : "bg-[#D1D1D6]"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
                    data.vatEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Supervisor Security PIN */}
        <div>
          <label className="block text-xs font-semibold text-[#1D1D1F] uppercase tracking-wider mb-2">
            Supervisor Security Authorization PIN (4 Digits)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#86868B]">
              <Lock className="w-5 h-5" />
            </div>
            <input
              type="password"
              maxLength={4}
              value={data.managerPin}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                onChange({ managerPin: val });
              }}
              placeholder="e.g. 7788"
              className="w-full h-[52px] pl-12 pr-4 bg-[#F5F5F7] border border-[#E5E5EA] rounded-2xl text-[#1D1D1F] text-[#1D1D1F] text-lg tracking-widest font-mono font-bold placeholder-[#86868B] placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:bg-white transition-all"
            />
          </div>
          <p className="mt-1.5 text-xs text-[#86868B]">
            This PIN is required by yard managers to authorize emergency part replacements before anti-theft cooldown windows expire.
          </p>
        </div>
      </div>

      {/* Action Button */}
      <div className="pt-4">
        <button
          type="button"
          disabled={!isValid}
          onClick={onNext}
          className="w-full h-[52px] bg-[#10B981] hover:bg-[#059669] disabled:bg-[#E5E5EA] disabled:text-[#86868B] text-white text-base font-semibold rounded-2xl transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
        >
          <span>Continue to Fleet Ingestion</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
}
