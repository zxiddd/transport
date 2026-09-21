"use client";

import React, { useState } from "react";
import { X, Package } from "lucide-react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { PartCatalogItem } from "@/types/workshop";

interface AddNewPartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPartAdded: (newPart: PartCatalogItem) => void;
}

const CATEGORIES: ("Tires" | "Brakes" | "Suspension" | "Fluids" | "Body" | "Other")[] = [
  "Tires",
  "Brakes",
  "Suspension",
  "Fluids",
  "Body",
  "Other",
];

export function AddNewPartModal({
  isOpen,
  onClose,
  onPartAdded,
}: AddNewPartModalProps) {
  const { companyId } = useAuth();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<
    "Tires" | "Brakes" | "Suspension" | "Fluids" | "Body" | "Other"
  >("Tires");
  const [cooldownDays, setCooldownDays] = useState<number>(45);
  const [baselineCostSAR, setBaselineCostSAR] = useState<number>(500);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSavePart = async () => {
    if (!name.trim()) return;
    const targetCid = companyId || "tala-transport";

    try {
      setSaving(true);
      const partDocId = `part-${Date.now()}`;
      
      const newPart: PartCatalogItem = {
        id: partDocId,
        companyId: targetCid,
        name: name.trim(),
        category,
        cooldownDays: Number(cooldownDays) || 30,
        baselineCostSAR: Number(baselineCostSAR) || 100,
      };

      // Write to subcollection & top-level
      await setDoc(doc(db, `companies/${targetCid}/parts`, partDocId), newPart);
      await setDoc(doc(db, "part_catalog", partDocId), newPart);

      onPartAdded(newPart);
      setName("");
      setCooldownDays(45);
      setBaselineCostSAR(500);
      onClose();
    } catch (err) {
      console.error("Failed to add new part:", err);
      alert("Failed to save new part to catalog.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-[#E5E5EA] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#86868B] hover:text-[#1D1D1F] p-2 rounded-full hover:bg-[#F5F5F7] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#10B981] flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#1D1D1F]">
              Add New Catalog Part
            </h3>
            <p className="text-xs text-[#86868B]">
              Define anti-theft cooldown interval and baseline price
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#1D1D1F] uppercase tracking-wider mb-1">
              Part Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Brake Caliper Heavy Duty"
              className="w-full h-[48px] px-4 bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl text-sm font-medium text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1D1D1F] uppercase tracking-wider mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) =>
                setCategory(
                  e.target.value as "Tires" | "Brakes" | "Suspension" | "Fluids" | "Body" | "Other"
                )
              }
              className="w-full h-[48px] px-4 bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl text-sm font-medium text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:bg-white"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1D1D1F] uppercase tracking-wider mb-1">
                Cooldown (Days)
              </label>
              <input
                type="number"
                value={cooldownDays}
                onChange={(e) => setCooldownDays(Number(e.target.value))}
                className="w-full h-[48px] px-4 bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl text-sm font-bold font-mono text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1D1D1F] uppercase tracking-wider mb-1">
                Base Cost (SAR)
              </label>
              <input
                type="number"
                value={baselineCostSAR}
                onChange={(e) => setBaselineCostSAR(Number(e.target.value))}
                className="w-full h-[48px] px-4 bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl text-sm font-bold font-mono text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:bg-white"
              />
            </div>
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
            onClick={handleSavePart}
            disabled={saving || !name.trim()}
            className="flex-1 h-[48px] bg-[#10B981] hover:bg-[#059669] text-white text-sm font-bold rounded-2xl transition-all shadow-md hover:shadow-lg disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Part"}
          </button>
        </div>
      </div>
    </div>
  );
}
