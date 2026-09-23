import { doc, setDoc, Timestamp } from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { CompanyProfile, JobCard, PartCatalogItem } from "@/types/workshop";

/**
 * Fallback Server API sync to ensure writes succeed even if browser client SDK rules are strict
 */
async function pushViaServerApi(collectionName: string, documentId: string, data: any): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const res = await fetch("/api/firestore", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ collectionName, documentId, data }),
    });
    const result = await res.json();
    if (result.success) {
      console.log(`[Server Sync] Pushed ${collectionName}/${documentId} to Firestore.`);
      return true;
    }
  } catch (err) {
    console.error("[Server Sync Error]", err);
  }
  return false;
}

/**
 * Syncs company profile to Firestore.
 */
export async function syncCompanyToFirestore(profile: CompanyProfile): Promise<boolean> {
  let clientSuccess = false;
  if (isFirebaseConfigured && db) {
    try {
      const ref = doc(db, "companies", profile.id);
      await setDoc(ref, {
        ...profile,
        updatedAt: Timestamp.now(),
      }, { merge: true });
      console.log(`[Firestore Sync] Successfully synced company profile: ${profile.id}`);
      clientSuccess = true;
    } catch (err: any) {
      console.warn("[Firestore Sync] Web SDK write returned error, triggering Server API sync fallback...", err);
    }
  }

  // Always execute Server Sync fallback
  const serverSuccess = await pushViaServerApi("companies", profile.id, {
    name: profile.name,
    branch: profile.branch,
    crNumber: profile.crNumber || "",
    vatRegistrationNumber: profile.vatRegistrationNumber || "",
    address: profile.address || "",
    phone: profile.phone || "",
    managerPin: profile.managerPin || "7788",
    vatRatePercentage: profile.vatRatePercentage || 15,
  });

  return clientSuccess || serverSuccess;
}

/**
 * Syncs a job card to Firestore.
 */
export async function syncJobCardToFirestore(jobCard: JobCard): Promise<boolean> {
  let clientSuccess = false;
  if (isFirebaseConfigured && db) {
    try {
      const payload = {
        ...jobCard,
        createdAt: Timestamp.now(),
      };
      await setDoc(doc(db, `companies/${jobCard.companyId}/job_cards`, jobCard.id), payload);
      await setDoc(doc(db, "job_cards", jobCard.id), payload);
      console.log(`[Firestore Sync] Saved Job Card ${jobCard.jobCardNumber} via Web SDK.`);
      clientSuccess = true;
    } catch (err: any) {
      console.warn("[Firestore Sync] Web SDK Job Card write returned error, triggering Server API fallback...", err);
    }
  }

  const serverSuccess = await pushViaServerApi("job_cards", jobCard.id, {
    jobCardNumber: jobCard.jobCardNumber,
    companyId: jobCard.companyId,
    trailerPlate: jobCard.trailerPlate,
    driverName: jobCard.driverName,
    subtotalSAR: jobCard.subtotalSAR,
    vatAmountSAR: jobCard.vatAmountSAR,
    grandTotalSAR: jobCard.grandTotalSAR,
    status: jobCard.status,
    itemsCount: jobCard.items?.length || 0,
    itemsSummary: (jobCard.items || []).map((i) => `${i.partName} (${i.subtotalSAR} SAR)`).join(", "),
  });

  return clientSuccess || serverSuccess;
}

/**
 * Syncs trailer & driver record to Firestore.
 */
export async function syncTrailerToFirestore(companyId: string, record: {
  trailerNumber: string;
  driverName: string;
  iqamaNumber?: string;
  phone?: string;
  modelType?: string;
  status?: "active" | "grounded";
  fromLocation?: string;
  toLocation?: string;
  loadDate?: string;
}): Promise<boolean> {
  const trailerId = `TR-${record.trailerNumber}`;
  const payload = {
    id: trailerId,
    companyId,
    plateNumber: record.trailerNumber,
    trailerNumber: record.trailerNumber,
    modelType: record.modelType || "Flatbed 40ft",
    status: record.status || "active",
    driverName: record.driverName,
    iqamaNumber: record.iqamaNumber || "N/A",
    phone: record.phone || "N/A",
    fromLocation: record.fromLocation || "Jeddah",
    toLocation: record.toLocation || "9 am Port",
    loadDate: record.loadDate || "20/09/2026",
  };

  let clientSuccess = false;
  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, "trailers", trailerId), { ...payload, createdAt: Timestamp.now() }, { merge: true });
      clientSuccess = true;
    } catch {}
  }

  const serverSuccess = await pushViaServerApi("trailers", trailerId, payload);
  return clientSuccess || serverSuccess;
}

/**
 * Syncs part catalog item to Firestore.
 */
export async function syncPartToFirestore(companyId: string, part: PartCatalogItem): Promise<boolean> {
  let clientSuccess = false;
  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, "part_catalog", part.id), part, { merge: true });
      clientSuccess = true;
    } catch {}
  }

  const serverSuccess = await pushViaServerApi("part_catalog", part.id, {
    name: part.name,
    category: part.category,
    cooldownDays: part.cooldownDays,
    baselineCostSAR: part.baselineCostSAR,
    companyId,
  });

  return clientSuccess || serverSuccess;
}

/**
 * Pushes all initial / existing local records for a company to Firestore.
 */
export async function pushFullStateToFirestore(companyId: string, companyProfile?: CompanyProfile | null): Promise<void> {
  console.log(`[Firestore Sync] Beginning full sync push for company ID: ${companyId}`);

  try {
    if (companyProfile) {
      await syncCompanyToFirestore(companyProfile);
    } else {
      await syncCompanyToFirestore({
        id: companyId,
        name: "Z Transport Management",
        branch: "Jeddah Fleet Yard 3",
        currency: "SAR",
        vatEnabled: true,
        vatRatePercentage: 15,
        managerPin: "7788",
        hasCompletedOnboarding: true,
        createdAt: Timestamp.now(),
      });
    }

    // Sync Trailers & Drivers
    const fleetStr = typeof window !== "undefined" ? localStorage.getItem(`tala_fleet_${companyId}`) : null;
    if (fleetStr) {
      try {
        const fleetList = JSON.parse(fleetStr);
        for (const item of fleetList) {
          await syncTrailerToFirestore(companyId, item);
        }
      } catch {}
    }

    // Sync Parts Catalog
    const partsStr = typeof window !== "undefined" ? localStorage.getItem(`tala_parts_${companyId}`) : null;
    if (partsStr) {
      try {
        const partsList = JSON.parse(partsStr);
        for (const part of partsList) {
          await syncPartToFirestore(companyId, { ...part, companyId });
        }
      } catch {}
    }

    // Sync Job Cards
    const jobsStr = typeof window !== "undefined" ? localStorage.getItem(`tala_jobs_${companyId}`) : null;
    if (jobsStr) {
      try {
        const jobsList = JSON.parse(jobsStr);
        for (const job of jobsList) {
          await syncJobCardToFirestore({ ...job, companyId });
        }
      } catch {}
    }

    console.log("[Firestore Sync] Full state push complete!");
  } catch (err) {
    console.error("[Firestore Sync Error] High-level sync failed:", err);
  }
}
