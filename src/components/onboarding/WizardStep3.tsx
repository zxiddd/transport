"use client";

import React, { useState } from "react";
import { ShieldCheck, Plus, Trash2, ShieldAlert, Sparkles } from "lucide-react";

export interface PartSeedItem {
  id: string;
  name: string;
  category: "Tires" | "Brakes" | "Suspension" | "Fluids" | "Body" | "Other";
  cooldownDays: number;
  baselineCostSAR: number;
}

interface WizardStep3Props {
  parts: PartSeedItem[];
  onChange: (parts: PartSeedItem[]) => void;
  onComplete: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}

const CATEGORIES: ("Tires" | "Brakes" | "Suspension" | "Fluids" | "Body" | "Other")[] = [
  "Tires",
  "Brakes",
  "Suspension",
  "Fluids",
  "Body",
  "Other",
];

export const INITIAL_PARTS: PartSeedItem[] = [
  {
    id: "part-1",
    name: "Drive Tire 315/80 R22.5",
    category: "Tires",
    cooldownDays: 45,
    baselineCostSAR: 950,
  },
  {
    id: "part-2",
    name: "Trailer Axle Tire",
    category: "Tires",
    cooldownDays: 45,
    baselineCostSAR: 900,
  },
  {
    id: "part-3",
    name: "Brake Drums / Shoes",
    category: "Brakes",
    cooldownDays: 30,
    baselineCostSAR: 380,
  },
  {
    id: "part-4",
    name: "Hub Seals",
    category: "Suspension",
    cooldownDays: 60,
    baselineCostSAR: 95,
  },
  {
    id: "part-5",
    name: "Engine Oil 15W-40",
    category: "Fluids",
    cooldownDays: 20,
    baselineCostSAR: 320,
  },
];

export function WizardStep3({
  parts,
  onChange,
  onComplete,
  onBack,
  isSubmitting,
}: WizardStep3Props) {
  const [customName, setCustomName] = useState("");
  const [customCategory, setCustomCategory] = useState<
    "Tires" | "Brakes" | "Suspension" | "Fluids" | "Body" | "Other"
  >("Tires");
  const [customCooldown, setCustomCooldown] = useState(30);
  const [customPrice, setCustomPrice] = useState(250);

  const handleUpdatePart = (
    id: string,
    field: keyof PartSeedItem,
    value: string | number
  ) => {
    const updated = parts.map((item) => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    });
    onChange(updated);
  };

  const handleRemovePart = (id: string) => {
    if (parts.length <= 1) return;
    onChange(parts.filter((p) => p.id !== id));
  };

  const handleAddCustomPart = () => {
    if (!customName.trim()) return;
    const newPart: PartSeedItem = {
      id: `custom-${Date.now()}`,
      name: customName.trim(),
      category: customCategory,
      cooldownDays: Number(customCooldown) || 30,
      baselineCostSAR: Number(customPrice) || 100,
    };
    onChange([...parts, newPart]);
    setCustomName("");
    setCustomCooldown(30);
    setCustomPrice(250);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
      <div className="text-center space-y-2 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#10B981] flex items-center justify-center mx-auto mb-3 shadow-sm">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-[#1D1D1F] tracking-tight">
          Step 3: Anti-Theft Cooldown Benchmarks
        </h2>
        <p className="text-sm text-[#86868B] max-w-lg mx-auto">
          Set minimum replacement intervals (in days) and baseline costs. If a driver brings a trailer back before the cooldown expires, the system automatically flags a potential unauthorized part resale.
        </p>
      </div>

      {/* Parts List */}
      <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
        {parts.map((part) => (
          <div
            key={part.id}
            className="bg-[#F5F5F7] border border-[#E5E5EA] rounded-2xl p-4 space-y-3 hover:border-[#10B981]/40 transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-[#1D1D1F]">{part.name}</span>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 text-xs font-semibold bg-white text-[#86868B] border border-[#E5E5EA] rounded-full">
                  {part.category}
                </span>
                {parts.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemovePart(part.id)}
                    className="text-red-500 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Cooldown Days Slider & Input */}
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-[#86868B] mb-1">
                  <span>Anti-Theft Cooldown</span>
                  <span className="text-[#10B981] font-bold">
                    {part.cooldownDays} Days
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={5}
                    max={120}
                    step={5}
                    value={part.cooldownDays}
                    onChange={(e) =>
                      handleUpdatePart(part.id, "cooldownDays", Number(e.target.value))
                    }
                    className="w-full accent-[#10B981] cursor-pointer"
                  />
                  <input
                    type="number"
                    value={part.cooldownDays}
                    onChange={(e) =>
                      handleUpdatePart(part.id, "cooldownDays", Number(e.target.value))
                    }
                    className="w-16 h-9 px-2 bg-white border border-[#E5E5EA] rounded-xl text-xs font-bold font-mono text-center text-[#1D1D1F]"
                  />
                </div>
              </div>

              {/* Baseline Cost */}
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-[#86868B] mb-1">
                  <span>Baseline Unit Cost</span>
                  <span className="text-[#1D1D1F] font-bold font-mono">
                    {part.baselineCostSAR} SAR
                  </span>
                </div>
                <input
                  type="number"
                  value={part.baselineCostSAR}
                  onChange={(e) =>
                    handleUpdatePart(part.id, "baselineCostSAR", Number(e.target.value))
                  }
                  className="w-full h-9 px-3 bg-white border border-[#E5E5EA] rounded-xl text-xs font-bold font-mono text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Custom Component */}
      <div className="bg-white border border-[#E5E5EA] rounded-2xl p-4 space-y-3">
        <h4 className="text-xs font-bold text-[#1D1D1F] uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-[#10B981]" />
          Append Custom Component
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <input
            type="text"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="Part Name (e.g. Brake Chamber)"
            className="sm:col-span-2 h-[42px] px-3 bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl text-xs font-medium text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#10B981]"
          />
          <select
            value={customCategory}
            onChange={(e) =>
              setCustomCategory(
                e.target.value as "Tires" | "Brakes" | "Suspension" | "Fluids" | "Body" | "Other"
              )
            }
            className="h-[42px] px-3 bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl text-xs font-medium text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#10B981]"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleAddCustomPart}
            className="h-[42px] bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Part</span>
          </button>
        </div>
      </div>

      {/* Step Actions */}
      <div className="grid grid-cols-2 gap-4 pt-4">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="h-[52px] bg-[#F5F5F7] hover:bg-[#E5E5EA] text-[#1D1D1F] text-base font-semibold rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <span>← Back</span>
        </button>

        <button
          type="button"
          onClick={onComplete}
          disabled={isSubmitting || parts.length === 0}
          className="h-[52px] bg-[#10B981] hover:bg-[#059669] disabled:bg-[#E5E5EA] disabled:text-[#86868B] text-white text-base font-bold rounded-2xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Initializing Firestore...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              <span>Complete Setup & Launch Workshop</span>
            </div>
          )}
        </button>
      </div>
    </div>
  );
}
