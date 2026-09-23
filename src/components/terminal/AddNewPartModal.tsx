"use client";

import React, { useState } from "react";
import { X, Package } from "lucide-react";
import { doc, setDoc } from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";
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

      // Always save to localStorage immediately
      if (typeof window !== "undefined") {
        try {
          const partsStr = localStorage.getItem(`tala_parts_${targetCid}`);
          const partsList = partsStr ? JSON.parse(partsStr) : [];
          partsList.push(newPart);
          localStorage.setItem(`tala_parts_${targetCid}`, JSON.stringify(partsList));
          window.dispatchEvent(new CustomEvent("tala_part_catalog_updated", { detail: newPart }));
        } catch {}
      }

      // Non-blocking Firestore sync in background (never blocks the UI)
      if (isFirebaseConfigured && db) {
        Promise.allSettled([
          setDoc(doc(db, `companies/${targetCid}/parts`, partDocId), newPart),
          setDoc(doc(db, "part_catalog", partDocId), newPart),
        ]).catch(() => {});
      }

      // Instantly update parent UI and close modal
      onPartAdded(newPart);
      setName("");
      setCooldownDays(45);
      setBaselineCostSAR(500);
      onClose();
    } catch {
      // safe fallback
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white/95 backdrop-blur-2xl border border-black/[0.08] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-[0_24px_48px_rgba(0,0,0,0.12)] space-y-6 relative text-[#1D1D1F]">
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center text-[#86868B] hover:text-[#1D1D1F] hover:bg-black/[0.05] transition-colors absolute top-5 right-5"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-[#1D1D1F]">
              Add New Catalog Part
            </h3>
            <p className="text-xs text-[#86868B]">
              Define anti-theft cooldown interval and baseline price
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#86868B] uppercase tracking-wider mb-1.5">
              Part Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Heavy Duty Brake Caliper"
              className="w-full h-11 px-3.5 bg-black/[0.03] border border-black/[0.08] rounded-xl text-sm font-medium text-[#1D1D1F] focus:bg-white focus:border-emerald-500 transition-all outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#86868B] uppercase tracking-wider mb-1.5">
              Category
            </label>
            <select
              value={category}
              onChange={(e) =>
                setCategory(
                  e.target.value as "Tires" | "Brakes" | "Suspension" | "Fluids" | "Body" | "Other"
                )
              }
              className="w-full h-11 px-3 bg-black/[0.03] border border-black/[0.08] rounded-xl text-sm font-medium text-[#1D1D1F] focus:bg-white focus:border-emerald-500 transition-all outline-none"
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
              <label className="block text-xs font-semibold text-[#86868B] uppercase tracking-wider mb-1.5">
                Cooldown (Days)
              </label>
              <input
                type="number"
                value={cooldownDays}
                onChange={(e) => setCooldownDays(Number(e.target.value))}
                className="w-full h-11 px-3.5 bg-black/[0.03] border border-black/[0.08] rounded-xl text-sm font-mono font-semibold text-[#1D1D1F] focus:bg-white focus:border-emerald-500 transition-all outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#86868B] uppercase tracking-wider mb-1.5">
                Base Cost (SAR)
              </label>
              <input
                type="number"
                value={baselineCostSAR}
                onChange={(e) => setBaselineCostSAR(Number(e.target.value))}
                className="w-full h-11 px-3.5 bg-black/[0.03] border border-black/[0.08] rounded-xl text-sm font-mono font-semibold text-[#1D1D1F] focus:bg-white focus:border-emerald-500 transition-all outline-none"
              />
            </div>
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
            onClick={handleSavePart}
            disabled={saving || !name.trim()}
            className="flex-1 h-11 bg-[#1D1D1F] hover:bg-black text-white text-xs font-semibold rounded-xl transition-all shadow-sm disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Part"}
          </button>
        </div>
      </div>
    </div>
  );
}
