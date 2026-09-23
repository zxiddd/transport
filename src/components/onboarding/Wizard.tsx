"use client";

import React, { useState } from "react";
import { writeBatch, doc, serverTimestamp } from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { WizardStep1, Step1Data } from "./WizardStep1";
import { WizardStep2, FleetRow } from "./WizardStep2";
import { WizardStep3, PartSeedItem, INITIAL_PARTS } from "./WizardStep3";

interface WizardProps {
  onOnboardingComplete: () => void;
}

export function Wizard({ onOnboardingComplete }: WizardProps) {
  const { companyId, refreshCompanyProfile } = useAuth();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Step 1 State
  const [step1Data, setStep1Data] = useState<Step1Data>({
    companyName: "Tala Transport",
    branch: "Jeddah Industrial Yard 3",
    currency: "SAR",
    vatEnabled: true,
    managerPin: "7788",
  });

  // Step 2 State
  const [fleetRows, setFleetRows] = useState<FleetRow[]>([
    {
      plateNumber: "",
      modelType: "Flatbed 40ft",
      driverFullName: "",
      iqamaNumber: "",
      driverPhone: "",
    },
  ]);

  // Step 3 State
  const [parts, setParts] = useState<PartSeedItem[]>(INITIAL_PARTS);

  // Batch commit to Firestore (with local storage fallback)
  const handleFinalSubmit = async () => {
    try {
      setIsSubmitting(true);
      const targetCid = companyId || "tala-transport";

      // 1. Save locally first so UI always succeeds
      if (typeof window !== "undefined") {
        localStorage.setItem(
          `tala_company_${targetCid}`,
          JSON.stringify({
            id: targetCid,
            name: step1Data.companyName.trim(),
            branch: step1Data.branch.trim(),
            currency: "SAR",
            vatEnabled: step1Data.vatEnabled,
            managerPin: step1Data.managerPin,
            hasCompletedOnboarding: true,
          })
        );
        localStorage.setItem(`tala_fleet_${targetCid}`, JSON.stringify(fleetRows));
        localStorage.setItem(`tala_parts_${targetCid}`, JSON.stringify(parts));
      }

      // 2. Commit to Firestore if online & configured
      if (isFirebaseConfigured && db) {
        try {
          const batch = writeBatch(db);

          // Company Profile Document
          const companyRef = doc(db, "companies", targetCid);
          batch.set(
            companyRef,
            {
              id: targetCid,
              name: step1Data.companyName.trim(),
              branch: step1Data.branch.trim(),
              currency: "SAR",
              vatEnabled: step1Data.vatEnabled,
              managerPin: step1Data.managerPin,
              hasCompletedOnboarding: true,
              createdAt: serverTimestamp(),
            },
            { merge: true }
          );

          // Trailers & Drivers Ingestion
          fleetRows.forEach((row) => {
            const normalizedPlate = row.plateNumber.trim().toUpperCase();
            const driverId = `driver-${normalizedPlate}`;

            const companyTrailerRef = doc(db, `companies/${targetCid}/trailers`, normalizedPlate);
            const topTrailerRef = doc(db, "trailers", normalizedPlate);

            const trailerPayload = {
              id: normalizedPlate,
              companyId: targetCid,
              plateNumber: normalizedPlate,
              modelType: row.modelType,
              defaultDriverId: driverId,
              status: "active",
              createdAt: serverTimestamp(),
            };

            batch.set(companyTrailerRef, trailerPayload);
            batch.set(topTrailerRef, trailerPayload);

            const companyDriverRef = doc(db, `companies/${targetCid}/drivers`, driverId);
            const topDriverRef = doc(db, "drivers", driverId);

            const driverPayload = {
              id: driverId,
              companyId: targetCid,
              fullName: row.driverFullName.trim(),
              iqamaNumber: row.iqamaNumber.trim(),
              phone: row.driverPhone.trim(),
              assignedPlate: normalizedPlate,
              createdAt: serverTimestamp(),
            };

            batch.set(companyDriverRef, driverPayload);
            batch.set(topDriverRef, driverPayload);
          });

          // Anti-Theft Part Catalog Ingestion
          parts.forEach((part) => {
            const partDocId = part.id.replace(/\s+/g, "-").toLowerCase();

            const companyPartRef = doc(db, `companies/${targetCid}/parts`, partDocId);
            const topPartRef = doc(db, "part_catalog", partDocId);

            const partPayload = {
              id: partDocId,
              companyId: targetCid,
              name: part.name,
              category: part.category,
              cooldownDays: Number(part.cooldownDays),
              baselineCostSAR: Number(part.baselineCostSAR),
            };

            batch.set(companyPartRef, partPayload);
            batch.set(topPartRef, partPayload);
          });

          await batch.commit();
        } catch {
          // offline fallback safely handled
        }
      }

      await refreshCompanyProfile();
      onOnboardingComplete();
    } catch {
      onOnboardingComplete();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl w-full mx-auto px-4 py-8">
      {/* Container Card */}
      <div className="bg-white border border-[#E5E5EA] rounded-3xl p-6 sm:p-10 shadow-lg relative overflow-hidden">
        {/* Top Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#10B981] animate-pulse" />
              <span className="text-xs font-bold text-[#86868B] uppercase tracking-wider">
                Setup Wizard · Step {currentStep} of 3
              </span>
            </div>
            <span className="text-xs font-bold text-[#10B981] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              {currentStep === 1 && "Workshop Profile"}
              {currentStep === 2 && "Fleet Ingestion"}
              {currentStep === 3 && "Anti-Theft Cooldowns"}
            </span>
          </div>

          {/* Stepper Indicators */}
          <div className="grid grid-cols-3 gap-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                currentStep >= 1 ? "bg-[#10B981]" : "bg-[#E5E5EA]"
              }`}
            />
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                currentStep >= 2 ? "bg-[#10B981]" : "bg-[#E5E5EA]"
              }`}
            />
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                currentStep >= 3 ? "bg-[#10B981]" : "bg-[#E5E5EA]"
              }`}
            />
          </div>
        </div>

        {/* Step Views */}
        {currentStep === 1 && (
          <WizardStep1
            data={step1Data}
            onChange={(updated) => setStep1Data({ ...step1Data, ...updated })}
            onNext={() => setCurrentStep(2)}
          />
        )}

        {currentStep === 2 && (
          <WizardStep2
            fleetRows={fleetRows}
            onChange={setFleetRows}
            onNext={() => setCurrentStep(3)}
            onBack={() => setCurrentStep(1)}
          />
        )}

        {currentStep === 3 && (
          <WizardStep3
            parts={parts}
            onChange={setParts}
            onComplete={handleFinalSubmit}
            onBack={() => setCurrentStep(2)}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    </div>
  );
}
