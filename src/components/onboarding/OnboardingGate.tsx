"use client";

import React, { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Wizard } from "./Wizard";

interface OnboardingGateProps {
  children: React.ReactNode;
}

export function OnboardingGate({ children }: OnboardingGateProps) {
  const { companyId, companyProfile, loading, refreshCompanyProfile } = useAuth();
  const [checkingStatus, setCheckingStatus] = useState<boolean>(true);
  const [completed, setCompleted] = useState<boolean>(false);

  useEffect(() => {
    // Failsafe timer to prevent infinite loading UI
    const safetyTimeout = setTimeout(() => {
      setCheckingStatus(false);
    }, 1000);

    if (!companyId) {
      setCheckingStatus(false);
      clearTimeout(safetyTimeout);
      return;
    }

    // Check local storage status first
    if (typeof window !== "undefined") {
      const local = localStorage.getItem(`tala_company_${companyId}`);
      if (local) {
        try {
          const parsed = JSON.parse(local);
          if (parsed?.hasCompletedOnboarding) {
            setCompleted(true);
            setCheckingStatus(false);
            clearTimeout(safetyTimeout);
            return;
          }
        } catch {
          // ignore
        }
      }
    }

    if (companyProfile?.hasCompletedOnboarding) {
      setCompleted(true);
      setCheckingStatus(false);
      clearTimeout(safetyTimeout);
      return;
    }

    // Only subscribe to Firestore if cloud credentials exist
    if (!isFirebaseConfigured || !db) {
      setCheckingStatus(false);
      clearTimeout(safetyTimeout);
      return;
    }

    let unsubscribe = () => {};
    try {
      const companyRef = doc(db, "companies", companyId);
      unsubscribe = onSnapshot(
        companyRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            setCompleted(Boolean(data.hasCompletedOnboarding));
          }
          setCheckingStatus(false);
          clearTimeout(safetyTimeout);
        },
        () => {
          // Graceful fallback on network/offline interruption
          setCheckingStatus(false);
          clearTimeout(safetyTimeout);
        }
      );
    } catch {
      setCheckingStatus(false);
      clearTimeout(safetyTimeout);
    }

    return () => {
      clearTimeout(safetyTimeout);
      unsubscribe();
    };
  }, [companyId, companyProfile]);

  if (loading || checkingStatus) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex flex-col items-center justify-center font-sans">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#10B981] border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#1D1D1F]">
              Tala Transport Workshop Terminal
            </h3>
            <p className="text-xs font-semibold text-[#86868B]">
              Verifying company status & workshop records...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If onboarding has not been completed in cloud or local cache, render setup wizard
  const isUnlocked = completed || Boolean(companyProfile?.hasCompletedOnboarding);

  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex flex-col justify-center py-10 font-sans selection:bg-[#10B981] selection:text-white">
        <div className="text-center mb-4">
          <h1 className="text-xl font-bold text-[#1D1D1F] tracking-tight">
            Tala Transport · Master Fleet Asset Setup
          </h1>
          <p className="text-xs text-[#86868B]">
            Commercial B2B Maintenance & Anti-Theft Platform · Jeddah, Saudi Arabia
          </p>
        </div>

        <Wizard
          onOnboardingComplete={() => {
            setCompleted(true);
            refreshCompanyProfile();
          }}
        />
      </div>
    );
  }

  // Onboarding completed: unlock main application dashboard
  return <>{children}</>;
}
