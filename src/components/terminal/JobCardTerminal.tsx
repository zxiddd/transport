"use client";

import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  setDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { syncJobCardToFirestore } from "@/lib/firestoreSync";
import { useAuth } from "@/context/AuthContext";
import {
  Trailer,
  Driver,
  PartCatalogItem,
  JobCard,
  JobLineItem,
} from "@/types/workshop";
import {
  Truck,
  User,
  Wrench,
  CheckCircle2,
  Plus,
  Trash2,
  ShieldAlert,
  History,
  Sparkles,
  ShieldCheck,
  Search,
  MapPin,
  Calendar,
  ChevronDown,
  AlertTriangle,
  X,
  Printer,
  Save,
} from "lucide-react";
import { PinOverrideModal } from "./PinOverrideModal";
import { AddNewPartModal } from "./AddNewPartModal";
import { JobInvoiceModal } from "./JobInvoiceModal";
import { INITIAL_PARTS } from "../onboarding/WizardStep3";
import {
  getTalaTrailers,
  getTalaDrivers,
  TALA_FLEET_50,
} from "@/lib/talaFleetData";

const AXLE_POSITIONS = [
  "Steer Axle Left",
  "Steer Axle Right",
  "Drive Axle 1 Outer Left",
  "Drive Axle 1 Inner Left",
  "Drive Axle 1 Outer Right",
  "Drive Axle 1 Inner Right",
  "Drive Axle 2",
  "Trailer Axle 1",
  "Trailer Axle 2",
  "Chassis / General",
];

function getDaysSinceService(createdAt: any): number {
  if (!createdAt) return 14;
  let d: Date;
  if (typeof createdAt?.toDate === "function") {
    d = createdAt.toDate();
  } else if (createdAt?.seconds) {
    d = new Date(createdAt.seconds * 1000);
  } else if (typeof createdAt === "string" || typeof createdAt === "number") {
    d = new Date(createdAt);
  } else if (createdAt instanceof Date) {
    d = createdAt;
  } else {
    return 14;
  }
  const diffDays = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(1, isNaN(diffDays) ? 14 : diffDays);
}

function getInitialPastJobsForTrailer(
  plate: string,
  companyId: string,
  driverName?: string
): JobCard[] {
  const date14DaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const date28DaysAgo = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000);

  return [
    {
      id: `job-past-${plate}-01`,
      jobCardNumber: `TT-2026-${Math.abs(
        plate.split("").reduce((a, b) => a + b.charCodeAt(0), 1000)
      )}`,
      companyId,
      trailerPlate: plate,
      trailerModel: "Flatbed 40ft",
      driverId: `driver-${plate}`,
      driverName: driverName || "Mohd Dilshad",
      driverIqama: "2489102934",
      operatorName: "Yard Supervisor",
      items: [
        {
          id: `line-past-01`,
          partName: "Drive Tire 315/80 R22.5",
          category: "Tires",
          axlePosition: "Trailer Axle 1",
          action: "replace",
          quantity: 1,
          unitCostSAR: 950,
          subtotalSAR: 950,
          isFlagged: false,
        },
        {
          id: `line-past-02`,
          partName: "Heavy Duty Brake Drum",
          category: "Brakes",
          axlePosition: "Trailer Axle 2",
          action: "replace",
          quantity: 1,
          unitCostSAR: 620,
          subtotalSAR: 620,
          isFlagged: false,
        },
      ],
      subtotalSAR: 1570,
      vatRatePercentage: 15,
      vatAmountSAR: 235.5,
      grandTotalSAR: 1805.5,
      status: "completed",
      createdAt: {
        seconds: Math.floor(date14DaysAgo.getTime() / 1000),
        nanoseconds: 0,
        toDate: () => date14DaysAgo,
      } as any,
    },
    {
      id: `job-past-${plate}-02`,
      jobCardNumber: `TT-2026-${Math.abs(
        plate.split("").reduce((a, b) => a + b.charCodeAt(0), 2000)
      )}`,
      companyId,
      trailerPlate: plate,
      trailerModel: "Flatbed 40ft",
      driverId: `driver-${plate}`,
      driverName: driverName || "Mohd Dilshad",
      driverIqama: "2489102934",
      operatorName: "Yard Supervisor",
      items: [
        {
          id: `line-past-03`,
          partName: "Air Brake Chamber Type 30/30",
          category: "Brakes",
          axlePosition: "Trailer Axle 3",
          action: "replace",
          quantity: 1,
          unitCostSAR: 380,
          subtotalSAR: 380,
          isFlagged: false,
        },
      ],
      subtotalSAR: 380,
      vatRatePercentage: 15,
      vatAmountSAR: 57,
      grandTotalSAR: 437,
      status: "completed",
      createdAt: {
        seconds: Math.floor(date28DaysAgo.getTime() / 1000),
        nanoseconds: 0,
        toDate: () => date28DaysAgo,
      } as any,
    },
  ];
}

const DEFAULT_TRAILERS: Trailer[] = getTalaTrailers("tala-transport");
const DEFAULT_DRIVERS: Driver[] = getTalaDrivers("tala-transport");

export function JobCardTerminal({
  onJobSaved,
  selectedTrailerNumber,
}: {
  onJobSaved?: () => void;
  selectedTrailerNumber?: string;
} = {}) {
  const { companyId, companyProfile } = useAuth();
  const targetCid = companyId || "tala-transport";

  // Catalog State
  const [trailers, setTrailers] = useState<Trailer[]>(DEFAULT_TRAILERS);
  const [drivers, setDrivers] = useState<Driver[]>(DEFAULT_DRIVERS);
  const [partCatalog, setPartCatalog] = useState<PartCatalogItem[]>(
    INITIAL_PARTS as any
  );
  const [loadingCatalog, setLoadingCatalog] = useState(false);

  // Card 1 State: Vehicle & Driver Selection
  const [selectedPlate, setSelectedPlate] = useState<string>("");
  const [selectedTrailer, setSelectedTrailer] = useState<Trailer | null>(
    DEFAULT_TRAILERS[0] || null
  );
  const [assignedDriver, setAssignedDriver] = useState<Driver | null>(
    DEFAULT_DRIVERS[0] || null
  );
  const [isReassigningDriver, setIsReassigningDriver] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");

  // Search Combobox State
  const [trailerSearchQuery, setTrailerSearchQuery] = useState<string>("");
  const [isTrailerDropdownOpen, setIsTrailerDropdownOpen] = useState(false);

  // Timeline State
  const [pastJobCards, setPastJobCards] = useState<JobCard[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  // Card 2 State: Line Items
  const [lineItems, setLineItems] = useState<JobLineItem[]>([]);

  // Prevented Financial Leakage Counter
  const [preventedLeakageSAR, setPreventedLeakageSAR] = useState<number>(0);

  // Dynamic VAT Percentage State
  const [vatRate, setVatRate] = useState<number>(
    companyProfile?.vatRatePercentage ?? (companyProfile?.vatEnabled ? 15 : 0)
  );

  // Modals
  const [activeOverrideIndex, setActiveOverrideIndex] = useState<number | null>(
    null
  );
  const [theftAlertPopup, setTheftAlertPopup] = useState<{
    item: JobLineItem;
    index: number;
  } | null>(null);
  const [isAddPartOpen, setIsAddPartOpen] = useState(false);
  const [savedJobCard, setSavedJobCard] = useState<JobCard | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // 1. Instant Catalog Load + Background Firestore Sync
  useEffect(() => {
    let fetchedTrailers: Trailer[] = [];
    let fetchedDrivers: Driver[] = [];
    let customParts: PartCatalogItem[] = [];

    if (typeof window !== "undefined") {
      try {
        const localFleetStr = localStorage.getItem(`tala_fleet_${targetCid}`);
        if (localFleetStr) {
          const rows = JSON.parse(localFleetStr);
          if (Array.isArray(rows) && rows.length > 0) {
            fetchedTrailers = rows.map((r: any) => ({
              id: r.trailerNumber || r.plateNumber,
              companyId: targetCid,
              plateNumber: r.trailerNumber || r.plateNumber,
              trailerNumber: r.trailerNumber || r.plateNumber,
              modelType: r.modelType || "Flatbed 40ft",
              defaultDriverId: `driver-${r.trailerNumber || r.plateNumber}`,
              driverName: r.driverName || r.driverFullName,
              loadDate: r.loadDate || "",
              fromLocation: r.fromLocation || "",
              toLocation: r.toLocation || "",
              status: r.status || "active",
              createdAt: new Date() as any,
            }));

            fetchedDrivers = rows.map((r: any) => ({
              id: `driver-${r.trailerNumber || r.plateNumber}`,
              companyId: targetCid,
              fullName: r.driverName || r.driverFullName,
              iqamaNumber: r.iqamaNumber || "",
              phone: r.phone || r.driverPhone || "",
              assignedPlate: r.trailerNumber || r.plateNumber,
              trailerNumber: r.trailerNumber || r.plateNumber,
              loadDate: r.loadDate || "",
              fromLocation: r.fromLocation || "",
              toLocation: r.toLocation || "",
              status: r.status || "active",
              createdAt: new Date() as any,
            }));
          }
        }
      } catch {}

      try {
        const localPartsStr = localStorage.getItem(`tala_parts_${targetCid}`);
        if (localPartsStr) {
          customParts = JSON.parse(localPartsStr);
        }
      } catch {}
    }

    const activeTrailers = fetchedTrailers.length > 0 ? fetchedTrailers : DEFAULT_TRAILERS;
    const activeDrivers = fetchedDrivers.length > 0 ? fetchedDrivers : DEFAULT_DRIVERS;

    // Merge custom parts with default catalog
    const mergedPartsMap = new Map<string, PartCatalogItem>();
    INITIAL_PARTS.forEach((p) => mergedPartsMap.set(p.name.toLowerCase(), p as PartCatalogItem));
    customParts.forEach((p) => mergedPartsMap.set(p.name.toLowerCase(), p));
    const activeParts = Array.from(mergedPartsMap.values());

    setTrailers(activeTrailers);
    setDrivers(activeDrivers);
    setPartCatalog(activeParts);
    setLoadingCatalog(false);

    const initialTarget = selectedTrailerNumber || activeTrailers[0]?.plateNumber || "";
    if (initialTarget) {
      handleSelectPlate(initialTarget, activeTrailers, activeDrivers);
    }

    // Non-blocking parallel background sync with Firestore
    if (isFirebaseConfigured && db) {
      Promise.allSettled([
        getDocs(query(collection(db, "trailers"), where("companyId", "==", targetCid))),
        getDocs(query(collection(db, "drivers"), where("companyId", "==", targetCid))),
        getDocs(query(collection(db, "part_catalog"), where("companyId", "==", targetCid))),
      ]).then(([tRes, dRes, pRes]) => {
        if (tRes.status === "fulfilled" && tRes.value?.docs?.length > 0) {
          const cloudTrailers = tRes.value.docs.map((d: any) => d.data() as Trailer);
          if (cloudTrailers.length > 0) setTrailers(cloudTrailers);
        }
        if (dRes.status === "fulfilled" && dRes.value?.docs?.length > 0) {
          const cloudDrivers = dRes.value.docs.map((d: any) => d.data() as Driver);
          if (cloudDrivers.length > 0) setDrivers(cloudDrivers);
        }
        if (pRes.status === "fulfilled" && pRes.value?.docs?.length > 0) {
          const cloudParts = pRes.value.docs.map((d: any) => d.data() as PartCatalogItem);
          if (cloudParts.length > 0) {
            setPartCatalog((prev) => {
              const m = new Map<string, PartCatalogItem>();
              prev.forEach((it) => m.set(it.name.toLowerCase(), it));
              cloudParts.forEach((it) => m.set(it.name.toLowerCase(), it));
              return Array.from(m.values());
            });
          }
        }
      }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetCid]);

  // Synchronize when selectedTrailerNumber prop is triggered externally
  useEffect(() => {
    if (selectedTrailerNumber && trailers.length > 0) {
      handleSelectPlate(selectedTrailerNumber, trailers, drivers);
      setTrailerSearchQuery("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTrailerNumber]);

  // Filtered trailers for live searchable combobox
  const filteredTrailers = React.useMemo(() => {
    if (!trailerSearchQuery.trim()) return trailers;
    const q = trailerSearchQuery.toLowerCase().trim();
    return trailers.filter((t) => {
      const matchPlate = t.plateNumber.toLowerCase().includes(q);
      const matchTrailerNo = (t.trailerNumber || "").toLowerCase().includes(q);
      const matchDriver = (t.driverName || "").toLowerCase().includes(q);
      const matchModel = t.modelType.toLowerCase().includes(q);
      const matchFrom = (t.fromLocation || "").toLowerCase().includes(q);
      const matchTo = (t.toLocation || "").toLowerCase().includes(q);
      const assigned = drivers.find(
        (d) => d.id === t.defaultDriverId || d.assignedPlate === t.plateNumber
      );
      const matchAssignedName = assigned ? assigned.fullName.toLowerCase().includes(q) : false;
      return (
        matchPlate ||
        matchTrailerNo ||
        matchDriver ||
        matchModel ||
        matchFrom ||
        matchTo ||
        matchAssignedName
      );
    });
  }, [trailers, drivers, trailerSearchQuery]);

  // Listen to new part additions from modal
  useEffect(() => {
    const handlePartCatalogUpdate = (e: any) => {
      const newPart = e.detail;
      if (newPart) {
        setPartCatalog((prev) => {
          if (prev.some((p) => p.name.toLowerCase() === newPart.name.toLowerCase())) {
            return prev;
          }
          return [...prev, newPart];
        });
      }
    };
    window.addEventListener("tala_part_catalog_updated", handlePartCatalogUpdate);
    return () => window.removeEventListener("tala_part_catalog_updated", handlePartCatalogUpdate);
  }, []);

  useEffect(() => {
    if (companyProfile) {
      if (typeof companyProfile.vatRatePercentage === "number") {
        setVatRate(companyProfile.vatRatePercentage);
      } else {
        setVatRate(companyProfile.vatEnabled ? 15 : 0);
      }
    }
  }, [companyProfile]);

  // 2. Handle Plate Selection
  const handleSelectPlate = async (
    plate: string,
    currentTrailers = trailers,
    currentDrivers = drivers
  ) => {
    const cleanPlate = (plate || "").trim();
    setSelectedPlate(cleanPlate);

    const trailerMatch = currentTrailers.find(
      (t) =>
        t.plateNumber === cleanPlate ||
        t.trailerNumber === cleanPlate ||
        t.id === cleanPlate ||
        t.id === `TR-${cleanPlate}` ||
        t.plateNumber.toLowerCase() === cleanPlate.toLowerCase()
    );
    setSelectedTrailer(trailerMatch || null);

    let driverMatch: Driver | undefined;
    if (trailerMatch) {
      driverMatch = currentDrivers.find(
        (d) =>
          d.id === trailerMatch.defaultDriverId ||
          d.assignedPlate === trailerMatch.plateNumber ||
          d.assignedPlate === cleanPlate ||
          d.trailerNumber === cleanPlate ||
          (trailerMatch.driverName &&
            d.fullName.toLowerCase() === trailerMatch.driverName.toLowerCase())
      );
      setAssignedDriver(driverMatch || null);
      setSelectedDriverId(driverMatch?.id || "");
    } else {
      setAssignedDriver(null);
      setSelectedDriverId("");
    }

    try {
      setLoadingTimeline(true);
      let jobsList: JobCard[] = [];

      // Check local storage for past jobs for this plate
      if (typeof window !== "undefined") {
        try {
          const localJobsStr = localStorage.getItem(`tala_jobs_${targetCid}`);
          if (localJobsStr) {
            const parsedJobs: JobCard[] = JSON.parse(localJobsStr);
            jobsList = parsedJobs.filter((j) => j.trailerPlate === plate).slice(0, 3);
          }
        } catch {}
      }

      if (isFirebaseConfigured && db) {
        try {
          const jobsQuery = query(
            collection(db, "job_cards"),
            where("companyId", "==", targetCid),
            where("trailerPlate", "==", plate),
            orderBy("createdAt", "desc"),
            limit(3)
          );
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), 2000)
          );
          const jobsSnap = await Promise.race([getDocs(jobsQuery), timeoutPromise]);
          if (jobsSnap?.docs?.length) {
            jobsList = jobsSnap.docs.map((d: any) => d.data() as JobCard);
          }
        } catch {
          // offline fallback
        }
      }

      setPastJobCards(jobsList);
      if (lineItems.length > 0) {
        applyEvaluatedItems(lineItems, jobsList, cleanPlate);
      }
    } catch {
      setPastJobCards([]);
    } finally {
      setLoadingTimeline(false);
    }
  };

  const handleDriverChange = (driverId: string) => {
    setSelectedDriverId(driverId);
    const dMatch = drivers.find((d) => d.id === driverId);
    setAssignedDriver(dMatch || null);
  };

  const evaluateFraudFlags = (
    items: JobLineItem[],
    pastJobs: JobCard[],
    plate: string
  ): JobLineItem[] => {
    if (!plate) return items;

    return items.map((item, idx) => {
      // If already authorized by supervisor PIN, preserve authorization
      if (item.authorizedByPin) {
        return item;
      }

      if (item.action !== "replace") {
        return {
          ...item,
          isFlagged: false,
          flagReason: undefined,
        };
      }

      const partMatch = partCatalog.find(
        (p) => p.name.toLowerCase() === item.partName.toLowerCase()
      );
      const cooldownDays = partMatch?.cooldownDays || 45;
      const normalizedPartName = item.partName.trim().toLowerCase();
      const normalizedAxle = (item.axlePosition || "Trailer Axle 1").trim().toLowerCase();

      // 1. Intra-Job Duplicate Detection:
      // Check if another item in the CURRENT job card replaces the same part
      const matchingItemInCurrentJob = items.find(
        (other, otherIdx) =>
          otherIdx !== idx &&
          other.action === "replace" &&
          other.partName.trim().toLowerCase() === normalizedPartName
      );

      if (matchingItemInCurrentJob) {
        const isSameAxle =
          (matchingItemInCurrentJob.axlePosition || "").trim().toLowerCase() === normalizedAxle;
        const duplicateReason = isSameAxle
          ? `Duplicate item ordered in current job: '${item.partName}' is already requested on ${matchingItemInCurrentJob.axlePosition}. Duplicate component replacement flagged for anti-theft review.`
          : `Multiple duplicate '${item.partName}' replacements requested on Trailer #${plate} (on ${matchingItemInCurrentJob.axlePosition} and ${item.axlePosition}). Duplicate component claim flagged for theft prevention review.`;

        return {
          ...item,
          isFlagged: true,
          flagReason: duplicateReason,
          authorizedByPin: false,
        };
      }

      // 1B. Excessive quantity on single component replacement
      if (item.quantity > 1) {
        return {
          ...item,
          isFlagged: true,
          flagReason: `Quantity (${item.quantity}) exceeds standard single-unit replacement for '${item.partName}' on ${item.axlePosition}. Duplicate replacement units flagged for anti-theft verification.`,
          authorizedByPin: false,
        };
      }

      // 2. Cooldown Detection against past service records
      let pastDuplicate: {
        daysAgo: number;
        jobCardNumber: string;
        driverName: string;
        axlePosition: string;
      } | null = null;

      for (const pastJob of pastJobs) {
        const daysAgo = getDaysSinceService(pastJob.createdAt);
        if (daysAgo <= cooldownDays) {
          const matchingPastItem = (pastJob.items || []).find(
            (pastItem) =>
              pastItem.action === "replace" &&
              pastItem.partName.trim().toLowerCase() === normalizedPartName
          );

          if (matchingPastItem) {
            pastDuplicate = {
              daysAgo,
              jobCardNumber: pastJob.jobCardNumber,
              driverName: pastJob.driverName || "Driver",
              axlePosition: matchingPastItem.axlePosition || "Trailer Axle",
            };
            break;
          }
        }
      }

      if (pastDuplicate) {
        return {
          ...item,
          isFlagged: true,
          flagReason: `Anti-theft cooldown breach: '${item.partName}' was replaced ${pastDuplicate.daysAgo} days ago on Job #${pastDuplicate.jobCardNumber} (${pastDuplicate.driverName}). 45-day anti-theft cooldown active.`,
          authorizedByPin: false,
        };
      }

      // Safe: no fraud detected
      return {
        ...item,
        isFlagged: false,
        flagReason: undefined,
      };
    });
  };

  const applyEvaluatedItems = (
    newItems: JobLineItem[],
    currentPast = pastJobCards,
    plate = selectedPlate
  ) => {
    const evaluated = evaluateFraudFlags(newItems, currentPast, plate);
    setLineItems(evaluated);

    // Look for an item that is newly flagged and not yet authorized
    const flaggedIdx = evaluated.findIndex(
      (it) => it.isFlagged && !it.authorizedByPin
    );
    if (flaggedIdx !== -1) {
      setTheftAlertPopup({ item: evaluated[flaggedIdx], index: flaggedIdx });
    }
    return evaluated;
  };

  const handleAddLineItem = () => {
    const defaultPart = partCatalog[0];
    const newItem: JobLineItem = {
      id: `line-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      partName: defaultPart?.name || "Drive Tire 315/80 R22.5",
      category: defaultPart?.category || "Tires",
      axlePosition: "Trailer Axle 1",
      action: "replace",
      quantity: 1,
      unitCostSAR: defaultPart?.baselineCostSAR || 950,
      subtotalSAR: (defaultPart?.baselineCostSAR || 950) * 1,
      isFlagged: false,
    };

    applyEvaluatedItems([...lineItems, newItem]);
  };

  const handleAddQuickPart = (partName: string, axlePosition = "Trailer Axle 1") => {
    const pMatch = partCatalog.find((p) => p.name === partName) || partCatalog[0];
    const newItem: JobLineItem = {
      id: `line-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      partName: pMatch?.name || partName,
      category: pMatch?.category || "Tires",
      axlePosition,
      action: "replace",
      quantity: 1,
      unitCostSAR: pMatch?.baselineCostSAR || 950,
      subtotalSAR: (pMatch?.baselineCostSAR || 950) * 1,
      isFlagged: false,
    };

    applyEvaluatedItems([...lineItems, newItem]);
  };

  const handleUpdateLineItem = (
    index: number,
    field: keyof JobLineItem,
    value: string | number
  ) => {
    const updated = [...lineItems];
    const targetItem = { ...updated[index], [field]: value };

    if (field === "partName") {
      const pMatch = partCatalog.find((p) => p.name === value);
      if (pMatch) {
        targetItem.category = pMatch.category;
        targetItem.unitCostSAR = pMatch.baselineCostSAR;
      }
    }

    targetItem.subtotalSAR = targetItem.quantity * targetItem.unitCostSAR;
    updated[index] = targetItem;

    applyEvaluatedItems(updated);
  };

  const handleRemoveLineItem = (index: number) => {
    const filtered = lineItems.filter((_, i) => i !== index);
    const evaluated = evaluateFraudFlags(filtered, pastJobCards, selectedPlate);
    setLineItems(evaluated);
    if (theftAlertPopup?.index === index) {
      setTheftAlertPopup(null);
    }
  };

  const handleRejectClaim = async (index: number) => {
    const itemToReject = lineItems[index];
    if (!itemToReject) return;

    setPreventedLeakageSAR((prev) => prev + itemToReject.subtotalSAR);
    setTheftAlertPopup(null);
    handleRemoveLineItem(index);

    try {
      const auditId = `audit-${Date.now()}`;
      const auditPayload = {
        id: auditId,
        companyId: targetCid,
        trailerPlate: selectedPlate,
        driverName: assignedDriver?.fullName || "Unassigned",
        partName: itemToReject.partName,
        axlePosition: itemToReject.axlePosition,
        daysSinceLastService: 14,
        previousJobId: pastJobCards[0]?.jobCardNumber || "TT-2026-PREV",
        actionTaken: "BLOCKED",
        managerNote: "Coordinator rejected duplicate part claim based on anti-theft cooldown warning.",
        timestamp: Timestamp.now(),
      };

      if (typeof window !== "undefined") {
        try {
          const auditsStr = localStorage.getItem(`tala_audits_${targetCid}`);
          const audits = auditsStr ? JSON.parse(auditsStr) : [];
          audits.unshift(auditPayload);
          localStorage.setItem(`tala_audits_${targetCid}`, JSON.stringify(audits));
        } catch {}
      }

      if (isFirebaseConfigured && db) {
        await setDoc(doc(db, "theft_audit_records", auditId), auditPayload);
        await setDoc(doc(db, `companies/${targetCid}/theft_audit_records`, auditId), auditPayload);
      }
    } catch {
      // offline audit save fallback handled
    }
  };

  const handleAuthorizeOverride = async (pin: string, note: string) => {
    if (activeOverrideIndex === null) return;
    const index = activeOverrideIndex;
    const itemToAuthorize = lineItems[index];

    const updated = [...lineItems];
    updated[index] = {
      ...updated[index],
      isFlagged: false,
      authorizedByPin: true,
      overrideNote: note,
    };
    setLineItems(updated);
    setTheftAlertPopup(null);

    try {
      const auditId = `audit-override-${Date.now()}`;
      const auditPayload = {
        id: auditId,
        companyId: targetCid,
        trailerPlate: selectedPlate,
        driverName: assignedDriver?.fullName || "Unassigned",
        partName: itemToAuthorize.partName,
        axlePosition: itemToAuthorize.axlePosition,
        daysSinceLastService: 14,
        previousJobId: pastJobCards[0]?.jobCardNumber || "TT-2026-PREV",
        actionTaken: "AUTHORIZED_OVERRIDE",
        managerNote: note,
        timestamp: Timestamp.now(),
      };

      if (typeof window !== "undefined") {
        try {
          const auditsStr = localStorage.getItem(`tala_audits_${targetCid}`);
          const audits = auditsStr ? JSON.parse(auditsStr) : [];
          audits.unshift(auditPayload);
          localStorage.setItem(`tala_audits_${targetCid}`, JSON.stringify(audits));
        } catch {}
      }

      if (isFirebaseConfigured && db) {
        await setDoc(doc(db, "theft_audit_records", auditId), auditPayload);
        await setDoc(doc(db, `companies/${targetCid}/theft_audit_records`, auditId), auditPayload);
      }
    } catch {
      // offline audit save fallback handled
    }
  };

  const subtotalSAR = lineItems.reduce((acc, i) => acc + i.subtotalSAR, 0);
  const vatAmountSAR = subtotalSAR * (Math.max(0, vatRate) / 100);
  const grandTotalSAR = subtotalSAR + vatAmountSAR;

  const hasUnresolvedFlags = lineItems.some(
    (item) => item.isFlagged && !item.authorizedByPin
  );

  const handleSaveJobCard = async (openInvoice: boolean = true) => {
    // If no line items have been added yet, add a default repair item so the user can immediately generate an invoice
    let currentItems = [...lineItems];
    if (currentItems.length === 0) {
      const defaultPart = partCatalog[0];
      const fallbackItem: JobLineItem = {
        id: `line-${Date.now()}-initial`,
        partName: defaultPart?.name || "Drive Tire 315/80 R22.5",
        category: defaultPart?.category || "Tires",
        axlePosition: "Trailer Axle 1",
        action: "replace",
        quantity: 1,
        unitCostSAR: defaultPart?.baselineCostSAR || 950,
        subtotalSAR: (defaultPart?.baselineCostSAR || 950) * 1,
        isFlagged: false,
      };
      currentItems = [fallbackItem];
      setLineItems(currentItems);
    }

    if (!selectedPlate && trailers.length > 0) {
      setSelectedPlate(trailers[0].plateNumber);
    }

    // If unresolved theft flags exist, prevent saving and highlight the flagged item
    if (currentItems.some((item) => item.isFlagged && !item.authorizedByPin)) {
      alert("Please resolve or authorize the flagged replacement items using Supervisor PIN override before generating the official invoice.");
      return;
    }

    try {
      setIsSaving(true);
      const randomSeq = Math.floor(1000 + Math.random() * 9000);
      const jobCardNumber = `TT-2026-${randomSeq}`;
      const jobDocId = `job-${Date.now()}`;

      const computedSubtotal = currentItems.reduce((acc, i) => acc + i.subtotalSAR, 0);
      const computedVat = computedSubtotal * (Math.max(0, vatRate) / 100);
      const computedGrandTotal = computedSubtotal + computedVat;

      const dateNow = new Date();
      // Safe timestamp object that works in both React state, offline JSON, and Firestore
      const customTimestamp: any = {
        seconds: Math.floor(dateNow.getTime() / 1000),
        nanoseconds: 0,
        toDate: () => dateNow,
      };

      const newJobCard: JobCard = {
        id: jobDocId,
        jobCardNumber,
        companyId: targetCid,
        trailerPlate: selectedPlate || (trailers[0]?.plateNumber || "N/A"),
        trailerModel: selectedTrailer?.modelType || "Flatbed 40ft",
        driverId: assignedDriver?.id || "unassigned",
        driverName: assignedDriver?.fullName || selectedTrailer?.driverName || "Driver Unassigned",
        driverIqama: assignedDriver?.iqamaNumber || "N/A",
        operatorName: companyProfile?.name ? `${companyProfile.name} Coordinator` : "Yard Coordinator",
        items: currentItems,
        subtotalSAR: computedSubtotal,
        vatRatePercentage: vatRate,
        vatAmountSAR: computedVat,
        grandTotalSAR: computedGrandTotal,
        status: "completed",
        createdAt: customTimestamp,
      };

      // Always persist to localStorage for instant offline access in Ledger
      if (typeof window !== "undefined") {
        try {
          const existingJobsStr = localStorage.getItem(`tala_jobs_${targetCid}`);
          const existingJobs = existingJobsStr ? JSON.parse(existingJobsStr) : [];
          existingJobs.unshift(newJobCard);
          localStorage.setItem(`tala_jobs_${targetCid}`, JSON.stringify(existingJobs));
        } catch {}
      }

      // Update in-memory past job cards so immediate follow-up claims on this trailer trigger anti-theft cooldown
      setPastJobCards((prev) => [newJobCard, ...prev]);

      // Sync directly to Cloud Firestore
      await syncJobCardToFirestore(newJobCard);

      onJobSaved?.();

      if (openInvoice) {
        setSavedJobCard(newJobCard);
      } else {
        alert(`Job Card #${jobCardNumber} saved successfully to Ledger!`);
        setLineItems([]);
      }
    } catch (err) {
      console.error("Failed to save job card:", err);
    } finally {
      setIsSaving(false);
    }
  };

  if (loadingCatalog) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-[#10B981] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-semibold text-[#86868B]">
          Connecting to fleet catalog...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {preventedLeakageSAR > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between text-xs text-[#059669]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#10B981]" />
            <span className="font-bold">
              Anti-Theft Fraud Engine Active: Prevented Financial Leakage This Session
            </span>
          </div>
          <span className="font-mono font-extrabold text-sm">
            +{preventedLeakageSAR.toFixed(2)} SAR
          </span>
        </div>
      )}

      {/* CARD 1: VEHICLE & DRIVER AUTO-FILL */}
      <div className="bg-white border border-[#E5E5EA] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-[#E5E5EA] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F5F5F7] text-[#10B981] flex items-center justify-center font-bold">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1D1D1F]">
                1. Vehicle & Driver Auto-Fill
              </h2>
              <p className="text-xs text-[#86868B]">
                Select trailer plate to pull driver profile and maintenance timeline
              </p>
            </div>
          </div>

          <span className="px-3 py-1 bg-[#F5F5F7] border border-[#E5E5EA] rounded-full text-xs font-semibold text-[#86868B]">
            {trailers.length} Active Trailers Loaded
          </span>
        </div>

        {/* Grounded Vehicle Warning if applicable */}
        {selectedTrailer?.status === "grounded" && (
          <div className="bg-rose-50 border border-rose-200/80 rounded-2xl p-4 flex items-center gap-3 text-xs text-rose-900 animate-in fade-in duration-200">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <span className="font-bold block">
                Dispatch Alert: Trailer #{selectedPlate} is Flagged as Grounded / Standby
              </span>
              <span className="text-rose-800">
                This unit ({assignedDriver?.fullName || "Driver"}) is marked as grounded or out-of-service in the dispatch roster. Ensure maintenance supervisor authorizes release.
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Searchable Trailer Combobox */}
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-[#1D1D1F] uppercase tracking-wider">
                Select / Search Trailer ({trailers.length})
              </label>
              <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Selected: #{selectedPlate}
              </span>
            </div>

            <div className="relative">
              <div className="flex items-center w-full h-[52px] bg-[#F5F5F7] border border-[#E5E5EA] rounded-2xl px-4 focus-within:ring-2 focus-within:ring-[#10B981] focus-within:bg-white transition-all">
                <Search className="w-4 h-4 text-[#86868B] mr-2.5 shrink-0" />
                <input
                  type="text"
                  value={trailerSearchQuery}
                  onChange={(e) => {
                    setTrailerSearchQuery(e.target.value);
                    setIsTrailerDropdownOpen(true);
                  }}
                  onFocus={() => setIsTrailerDropdownOpen(true)}
                  placeholder="Type trailer number or driver name..."
                  className="w-full bg-transparent text-sm font-semibold text-[#1D1D1F] outline-none placeholder:text-[#86868B]/70 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setIsTrailerDropdownOpen(!isTrailerDropdownOpen)}
                  className="p-1 hover:bg-black/[0.05] rounded-lg transition-colors ml-1 cursor-pointer"
                  title="Toggle fleet list"
                >
                  <ChevronDown
                    className={`w-4 h-4 text-[#86868B] transition-transform ${
                      isTrailerDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </div>

              {/* Autocomplete Dropdown List */}
              {isTrailerDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl border border-black/[0.08] rounded-2xl shadow-[0_16px_36px_rgba(0,0,0,0.14)] z-50 max-h-72 overflow-y-auto p-1.5 divide-y divide-black/[0.04] animate-in fade-in zoom-in-95 duration-150">
                  {filteredTrailers.length === 0 ? (
                    <div className="p-4 text-center text-xs text-[#86868B]">
                      No trailer or driver matched &quot;{trailerSearchQuery}&quot;
                    </div>
                  ) : (
                    filteredTrailers.map((t) => {
                      const isSelected = t.plateNumber === selectedPlate;
                      const isGrounded = t.status === "grounded";
                      const driverInfo = drivers.find(
                        (d) => d.id === t.defaultDriverId || d.assignedPlate === t.plateNumber
                      );
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            handleSelectPlate(t.plateNumber);
                            setTrailerSearchQuery("");
                            setIsTrailerDropdownOpen(false);
                          }}
                          className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between gap-3 text-xs cursor-pointer ${
                            isSelected
                              ? "bg-emerald-50 text-emerald-950 font-semibold"
                              : "hover:bg-black/[0.04]"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="font-mono font-bold text-xs bg-black/[0.05] px-2 py-1 rounded-md text-[#1D1D1F] shrink-0 border border-black/[0.06]">
                              {t.plateNumber}
                            </span>
                            <div className="truncate">
                              <span className="font-medium text-[#1D1D1F] block truncate">
                                {driverInfo?.fullName || t.driverName || "Driver Unassigned"}
                              </span>
                              <span className="text-[10px] text-[#86868B] block truncate">
                                {t.fromLocation || "Jeddah"} ➔ {t.toLocation || "9 am Port"} ·{" "}
                                {t.modelType}
                              </span>
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-2">
                            {isGrounded ? (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-semibold">
                                Grounded
                              </span>
                            ) : (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium">
                                Active
                              </span>
                            )}
                            {isSelected && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            )}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Quick trailer chips */}
            {trailers.length > 0 && (
              <div className="flex items-center gap-1 mt-2 overflow-x-auto pb-1 text-[11px] scrollbar-none">
                <span className="text-[10px] font-semibold text-[#86868B] uppercase shrink-0 mr-1">
                  Quick:
                </span>
                {trailers.slice(0, 8).map((t) => {
                  const plate = t.plateNumber || t.trailerNumber;
                  return (
                    <button
                      key={t.id || plate}
                      type="button"
                      onClick={() => {
                        handleSelectPlate(plate || "");
                        setTrailerSearchQuery("");
                      }}
                      className={`px-2 py-0.5 rounded-md font-mono text-[11px] transition-all cursor-pointer ${
                        selectedPlate === plate
                          ? "bg-[#1D1D1F] text-white font-bold shadow-sm"
                          : "bg-black/[0.04] text-[#86868B] hover:text-[#1D1D1F] hover:bg-black/[0.08]"
                      }`}
                    >
                      {plate}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Assigned Driver and Dispatch Card */}
          <div className="bg-[#F5F5F7] border border-[#E5E5EA] rounded-2xl p-4 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-[#10B981]" />
                  <span className="font-bold text-sm text-[#1D1D1F]">
                    {assignedDriver?.fullName || selectedTrailer?.driverName || "Unassigned Driver"}
                  </span>
                </div>
                <div className="text-xs text-[#86868B] space-x-2">
                  <span>
                    Iqama:{" "}
                    <strong className="font-mono text-[#1D1D1F]">
                      {assignedDriver?.iqamaNumber || "N/A"}
                    </strong>
                  </span>
                  <span>•</span>
                  <span>
                    Phone:{" "}
                    <strong className="font-mono text-[#1D1D1F]">
                      {assignedDriver?.phone || "N/A"}
                    </strong>
                  </span>
                </div>
              </div>

              <div>
                {!isReassigningDriver ? (
                  <button
                    type="button"
                    onClick={() => setIsReassigningDriver(true)}
                    className="text-xs font-semibold text-[#10B981] hover:underline cursor-pointer"
                  >
                    Reassign Driver
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedDriverId}
                      onChange={(e) => handleDriverChange(e.target.value)}
                      className="h-9 px-2 bg-white border border-[#E5E5EA] rounded-xl text-xs font-medium text-[#1D1D1F]"
                    >
                      {drivers.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.fullName} (Tr: {d.assignedPlate})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setIsReassigningDriver(false)}
                      className="text-xs text-[#86868B] hover:text-[#1D1D1F] cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Dispatch & Route Information */}
            <div className="pt-2 border-t border-black/[0.06] grid grid-cols-2 gap-2 text-[11px]">
              <div className="flex items-center gap-1.5 text-[#86868B] truncate">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">
                  Route:{" "}
                  <strong className="text-[#1D1D1F]">
                    {selectedTrailer?.fromLocation || "Jeddah"} ➔{" "}
                    {selectedTrailer?.toLocation || "9 am Port"}
                  </strong>
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[#86868B] truncate">
                <Calendar className="w-3.5 h-3.5 text-[#86868B] shrink-0" />
                <span>
                  Load Date:{" "}
                  <strong className="text-[#1D1D1F] font-mono">
                    {selectedTrailer?.loadDate || "20/09/2026"}
                  </strong>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 flex items-center gap-3 text-xs text-[#1D1D1F]">
          <History className="w-5 h-5 text-amber-600 shrink-0" />
          <div className="flex-1">
            <span className="font-bold text-amber-900 block">
              Historical Service Timeline Banner
            </span>
            {loadingTimeline ? (
              <span className="text-[#86868B]">Loading historical job cards...</span>
            ) : pastJobCards.length > 0 ? (
              <span className="text-amber-800">
                Last serviced: <strong>{getDaysSinceService(pastJobCards[0].createdAt)} days ago</strong> — Replaced:{" "}
                {pastJobCards[0].items.map((i) => i.partName).join(", ")} (Job #
                {pastJobCards[0].jobCardNumber})
              </span>
            ) : (
              <span className="text-amber-800 font-medium">
                {selectedPlate
                  ? `No recorded service history for Trailer #${selectedPlate}.`
                  : "Select a trailer to view service timeline history."}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* CARD 2: PART & REPAIR LINE ENTRY */}
      <div className="bg-white border border-[#E5E5EA] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-[#E5E5EA] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F5F5F7] text-[#10B981] flex items-center justify-center font-bold">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1D1D1F]">
                2. Part & Repair Line Entry
              </h2>
              <p className="text-xs text-[#86868B]">
                Log parts and repair tasks diagnosed by the workshop mechanic
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsAddPartOpen(true)}
            className="h-9 px-3 bg-[#F5F5F7] hover:bg-[#E5E5EA] text-[#10B981] text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Add New Part to Catalog</span>
          </button>
        </div>

        {/* Quick-Add Common Maintenance Chips */}
        <div className="space-y-2">
          <span className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider block">
            Quick-Add Common Yard Repairs:
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleAddQuickPart("Drive Tire 315/80 R22.5", "Trailer Axle 1")}
              className="h-8 px-3 rounded-full bg-black/[0.04] hover:bg-black/[0.08] text-[11px] font-semibold text-[#1D1D1F] transition-all flex items-center gap-1.5"
            >
              <Plus className="w-3 h-3 text-emerald-600" />
              <span>Drive Tire (Axle 1)</span>
              <span className="text-[#86868B] text-[10px]">950 SAR</span>
            </button>
            <button
              type="button"
              onClick={() => handleAddQuickPart("Front Brake Pads", "Trailer Axle 1")}
              className="h-8 px-3 rounded-full bg-black/[0.04] hover:bg-black/[0.08] text-[11px] font-semibold text-[#1D1D1F] transition-all flex items-center gap-1.5"
            >
              <Plus className="w-3 h-3 text-emerald-600" />
              <span>Brake Pads (Axle 1)</span>
              <span className="text-[#86868B] text-[10px]">450 SAR</span>
            </button>
            <button
              type="button"
              onClick={() => handleAddQuickPart("Air Brake Booster", "Trailer Axle 2")}
              className="h-8 px-3 rounded-full bg-black/[0.04] hover:bg-black/[0.08] text-[11px] font-semibold text-[#1D1D1F] transition-all flex items-center gap-1.5"
            >
              <Plus className="w-3 h-3 text-emerald-600" />
              <span>Air Brake Booster</span>
              <span className="text-[#86868B] text-[10px]">320 SAR</span>
            </button>
            <button
              type="button"
              onClick={() => handleAddQuickPart("Wheel Hub Bearing & Seal", "Trailer Axle 2")}
              className="h-8 px-3 rounded-full bg-black/[0.04] hover:bg-black/[0.08] text-[11px] font-semibold text-[#1D1D1F] transition-all flex items-center gap-1.5"
            >
              <Plus className="w-3 h-3 text-emerald-600" />
              <span>Wheel Hub Bearing</span>
              <span className="text-[#86868B] text-[10px]">680 SAR</span>
            </button>
            <button
              type="button"
              onClick={() => handleAddQuickPart("Leaf Spring Bushing Set", "Trailer Axle 3")}
              className="h-8 px-3 rounded-full bg-black/[0.04] hover:bg-black/[0.08] text-[11px] font-semibold text-[#1D1D1F] transition-all flex items-center gap-1.5"
            >
              <Plus className="w-3 h-3 text-emerald-600" />
              <span>Leaf Spring Bushing</span>
              <span className="text-[#86868B] text-[10px]">190 SAR</span>
            </button>
          </div>
        </div>

        {/* Top Warning Banner if duplicates/unresolved theft flags are detected */}
        {hasUnresolvedFlags && (
          <div className="bg-rose-50 border-2 border-rose-500 rounded-2xl p-4 sm:p-5 shadow-sm space-y-2 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-extrabold text-rose-900 tracking-tight flex items-center gap-2">
                    <span>🚨 Anti-Theft Fraud Engine Active: Duplicate Replacement Claim Flagged</span>
                  </h4>
                  <span className="text-[10px] font-mono font-bold bg-rose-200 text-rose-950 px-2.5 py-0.5 rounded-full">
                    COOLDOWN RESTRICTION
                  </span>
                </div>
                <p className="text-xs text-rose-900 leading-relaxed font-medium">
                  One or more components on Trailer #{selectedPlate} breach company anti-theft rules (duplicate replacement within 45 days or multiple identical claims in this job). You must reject the claim or authorize with a Supervisor PIN override to generate the invoice.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {lineItems.length === 0 ? (
            <div className="text-center py-10 bg-[#F5F5F7] border border-dashed border-[#E5E5EA] rounded-2xl space-y-3">
              <p className="text-xs text-[#86868B] font-medium">
                No repair line items added yet.
              </p>
              <button
                type="button"
                onClick={handleAddLineItem}
                className="h-10 px-4 bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold rounded-xl inline-flex items-center gap-2 shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add First Repair Part</span>
              </button>
            </div>
          ) : (
            lineItems.map((item, idx) => (
              <div key={item.id} className="space-y-3">
                <div
                  className={`rounded-2xl p-4 space-y-3 transition-all ${
                    item.isFlagged && !item.authorizedByPin
                      ? "bg-rose-50/70 border-2 border-rose-500 shadow-md ring-2 ring-rose-300/60"
                      : item.authorizedByPin
                      ? "bg-emerald-50/40 border border-emerald-300"
                      : "bg-[#F5F5F7] border border-[#E5E5EA]"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <span
                        className={
                          item.isFlagged && !item.authorizedByPin
                            ? "text-rose-700 font-extrabold"
                            : "text-[#86868B]"
                        }
                      >
                        Line Item #{idx + 1}
                      </span>
                      {item.isFlagged && !item.authorizedByPin && (
                        <span className="bg-rose-600 text-white text-[10px] font-mono px-2.5 py-0.5 rounded-full flex items-center gap-1 font-bold animate-pulse shadow-sm">
                          <ShieldAlert className="w-3 h-3" />
                          ANTI-THEFT FLAGGED
                        </span>
                      )}
                      {item.authorizedByPin && (
                        <span className="bg-emerald-600 text-white text-[10px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1 font-bold shadow-sm">
                          <CheckCircle2 className="w-3 h-3" />
                          PIN OVERRIDDEN
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveLineItem(idx)}
                      className="text-red-500 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                    <div className="lg:col-span-2">
                      <label className="block text-[11px] font-semibold text-[#86868B] mb-1">
                        Component / Part Name
                      </label>
                      <input
                        type="text"
                        list={`part-catalog-${idx}`}
                        value={item.partName}
                        onChange={(e) =>
                          handleUpdateLineItem(idx, "partName", e.target.value)
                        }
                        placeholder="Type component name or select..."
                        className="w-full h-[46px] px-3 bg-white border border-[#E5E5EA] rounded-xl text-xs font-bold text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                      />
                      <datalist id={`part-catalog-${idx}`}>
                        {partCatalog.map((p) => (
                          <option key={p.id} value={p.name}>
                            {p.name} ({p.category})
                          </option>
                        ))}
                      </datalist>
                    </div>

                    <div className="lg:col-span-1">
                      <label className="block text-[11px] font-semibold text-[#86868B] mb-1">
                        Axle Position
                      </label>
                      <select
                        value={item.axlePosition}
                        onChange={(e) =>
                          handleUpdateLineItem(idx, "axlePosition", e.target.value)
                        }
                        className="w-full h-[46px] px-3 bg-white border border-[#E5E5EA] rounded-xl text-xs font-medium text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                      >
                        {AXLE_POSITIONS.map((pos) => (
                          <option key={pos} value={pos}>
                            {pos}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="lg:col-span-1">
                      <label className="block text-[11px] font-semibold text-[#86868B] mb-1">
                        Action
                      </label>
                      <select
                        value={item.action}
                        onChange={(e) =>
                          handleUpdateLineItem(
                            idx,
                            "action",
                            e.target.value as "replace" | "repair"
                          )
                        }
                        className="w-full h-[46px] px-3 bg-white border border-[#E5E5EA] rounded-xl text-xs font-semibold text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                      >
                        <option value="replace">Replace</option>
                        <option value="repair">Repair</option>
                      </select>
                    </div>

                    <div className="lg:col-span-1">
                      <label className="block text-[11px] font-semibold text-[#86868B] mb-1">
                        Qty & Unit Cost (SAR)
                      </label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) =>
                            handleUpdateLineItem(
                              idx,
                              "quantity",
                              Number(e.target.value)
                            )
                          }
                          className="w-14 h-[46px] px-2 bg-white border border-[#E5E5EA] rounded-xl text-xs font-bold font-mono text-center text-[#1D1D1F]"
                        />
                        <input
                          type="number"
                          value={item.unitCostSAR}
                          onChange={(e) =>
                            handleUpdateLineItem(
                              idx,
                              "unitCostSAR",
                              Number(e.target.value)
                            )
                          }
                          className="w-full h-[46px] px-2 bg-white border border-[#E5E5EA] rounded-xl text-xs font-bold font-mono text-[#1D1D1F]"
                        />
                      </div>
                    </div>

                    <div className="lg:col-span-1 text-right">
                      <label className="block text-[11px] font-semibold text-[#86868B] mb-1">
                        Subtotal
                      </label>
                      <div className="h-[46px] px-3 bg-white border border-[#E5E5EA] rounded-xl flex items-center justify-end text-xs font-bold font-mono text-[#10B981]">
                        {item.subtotalSAR.toFixed(2)} SAR
                      </div>
                    </div>
                  </div>
                </div>

                {item.isFlagged && !item.authorizedByPin && (
                  <div className="bg-rose-100/90 border-2 border-rose-500 rounded-2xl p-4 sm:p-5 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md">
                        <ShieldAlert className="w-6 h-6 animate-pulse" />
                      </div>
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-extrabold text-rose-900 tracking-tight flex items-center gap-2">
                            <span>⚠️ Duplicate Component Replacement Flagged</span>
                            <span className="text-[10px] font-mono bg-rose-200 text-rose-950 px-2 py-0.5 rounded-full font-bold">
                              BLOCKED
                            </span>
                          </h4>
                          <button
                            type="button"
                            onClick={() => setTheftAlertPopup({ item, index: idx })}
                            className="text-xs font-bold text-rose-700 underline hover:text-rose-900 cursor-pointer"
                          >
                            View Alert Details
                          </button>
                        </div>
                        <p className="text-xs text-rose-950 font-bold leading-relaxed">
                          {item.flagReason}
                        </p>
                        <p className="text-[11px] text-rose-800 font-medium">
                          Value at risk: <strong>{item.subtotalSAR.toFixed(2)} SAR</strong>. Duplicate part claims violate anti-theft rules and require Yard Supervisor authorization or cancellation.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2 border-t border-rose-300/80">
                      <button
                        type="button"
                        onClick={() => handleRejectClaim(idx)}
                        className="h-9 px-4 bg-white border border-rose-500 text-rose-700 hover:bg-rose-50 text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Reject Claim (Block Theft)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveOverrideIndex(idx)}
                        className="h-9 px-4 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Authorize (Supervisor PIN)</span>
                      </button>
                    </div>
                  </div>
                )}

                {item.authorizedByPin && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between text-xs text-amber-800">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-amber-600" />
                      <span>
                        <strong>Supervisor Override Authorized:</strong>{" "}
                        {item.overrideNote}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                      PIN VERIFIED
                    </span>
                  </div>
                )}
              </div>
            ))
          )}

          {lineItems.length > 0 && (
            <button
              type="button"
              onClick={handleAddLineItem}
              className="w-full h-[48px] bg-white border-2 border-dashed border-[#E5E5EA] hover:border-[#10B981] hover:text-[#10B981] text-[#86868B] text-sm font-semibold rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Another Part</span>
            </button>
          )}
        </div>
      </div>

      {/* SUMMARY & PERSISTENCE CARD */}
      <div className="bg-white border border-[#E5E5EA] rounded-3xl p-6 sm:p-8 shadow-lg space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E5E5EA] pb-6">
          <div>
            <h2 className="text-xl font-bold text-[#1D1D1F] tracking-tight">
              Work Order Summary & Invoice Total
            </h2>
            <p className="text-xs text-[#86868B]">
              Review calculations before recording to live Firestore collections
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-[#F5F5F7] border border-[#E5E5EA] px-3 h-[46px] rounded-2xl">
              <span className="text-xs font-semibold text-[#86868B] uppercase tracking-wider">
                VAT Rate:
              </span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={vatRate}
                  onChange={(e) => setVatRate(Math.max(0, Number(e.target.value)))}
                  className="w-16 h-8 px-2 bg-white border border-[#E5E5EA] rounded-xl text-xs font-bold font-mono text-center text-[#1D1D1F] outline-none focus:border-[#10B981]"
                />
                <span className="text-xs font-bold text-[#86868B]">%</span>
              </div>
            </div>

            <div className="flex items-center gap-1 bg-[#F5F5F7] p-1 rounded-2xl border border-[#E5E5EA]">
              <button
                type="button"
                onClick={() => setVatRate(15)}
                className={`text-xs px-2.5 py-1.5 rounded-xl font-semibold transition-all ${
                  vatRate === 15
                    ? "bg-[#10B981] text-white shadow-sm"
                    : "text-[#86868B] hover:text-[#1D1D1F]"
                }`}
              >
                15% Standard
              </button>
              <button
                type="button"
                onClick={() => setVatRate(5)}
                className={`text-xs px-2.5 py-1.5 rounded-xl font-semibold transition-all ${
                  vatRate === 5
                    ? "bg-[#10B981] text-white shadow-sm"
                    : "text-[#86868B] hover:text-[#1D1D1F]"
                }`}
              >
                5%
              </button>
              <button
                type="button"
                onClick={() => setVatRate(0)}
                className={`text-xs px-2.5 py-1.5 rounded-xl font-semibold transition-all ${
                  vatRate === 0
                    ? "bg-[#10B981] text-white shadow-sm"
                    : "text-[#86868B] hover:text-[#1D1D1F]"
                }`}
              >
                0% Exempt
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="bg-[#F5F5F7] border border-[#E5E5EA] rounded-2xl p-4">
            <span className="text-xs text-[#86868B] font-semibold block uppercase tracking-wider mb-1">
              Subtotal (SAR)
            </span>
            <span className="text-xl font-mono font-extrabold text-[#1D1D1F]">
              {subtotalSAR.toFixed(2)} SAR
            </span>
          </div>

          <div className="bg-[#F5F5F7] border border-[#E5E5EA] rounded-2xl p-4">
            <span className="text-xs text-[#86868B] font-semibold block uppercase tracking-wider mb-1">
              VAT ({vatRate}%)
            </span>
            <span className="text-xl font-mono font-extrabold text-[#1D1D1F]">
              {vatAmountSAR.toFixed(2)} SAR
            </span>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
            <span className="text-xs text-[#059669] font-bold block uppercase tracking-wider mb-1">
              Grand Total (SAR)
            </span>
            <span className="text-2xl font-mono font-extrabold text-[#10B981]">
              {grandTotalSAR.toFixed(2)} SAR
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSaveJobCard(false)}
              className="w-full h-[52px] bg-white border border-[#E5E5EA] hover:bg-[#F5F5F7] text-[#1D1D1F] text-base font-bold rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
            >
              <Save className="w-5 h-5 text-[#86868B]" />
              <span>Save Job Card Only</span>
            </button>

            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSaveJobCard(true)}
              className="w-full h-[52px] bg-[#10B981] hover:bg-[#059669] text-white text-base font-bold rounded-2xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
            >
              {isSaving ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Printer className="w-5 h-5" />
                  <span>Save & Print Invoice</span>
                </div>
              )}
            </button>
          </div>

          {lineItems.length === 0 && (
            <p className="text-center text-xs text-[#86868B]">
              💡 Clicking Save will automatically initialize with the standard yard maintenance part.
            </p>
          )}
          {hasUnresolvedFlags && (
            <p className="text-center text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 py-1.5 px-3 rounded-xl">
              ⚠️ Cooldown Warning: Authorize duplicate item using Supervisor PIN override or reject claim to generate invoice.
            </p>
          )}
        </div>
      </div>

      <PinOverrideModal
        isOpen={activeOverrideIndex !== null}
        onClose={() => setActiveOverrideIndex(null)}
        partName={
          activeOverrideIndex !== null
            ? lineItems[activeOverrideIndex]?.partName || ""
            : ""
        }
        axlePosition={
          activeOverrideIndex !== null
            ? lineItems[activeOverrideIndex]?.axlePosition || ""
            : ""
        }
        daysSinceLastService={14}
        onAuthorize={handleAuthorizeOverride}
      />

      <AddNewPartModal
        isOpen={isAddPartOpen}
        onClose={() => setIsAddPartOpen(false)}
        onPartAdded={(newPart) => {
          setPartCatalog([...partCatalog, newPart]);
        }}
      />

      <JobInvoiceModal
        jobCard={savedJobCard}
        onClose={() => {
          setSavedJobCard(null);
          setLineItems([]);
        }}
      />

      {/* Immediate Anti-Theft Duplicate Alert Popup */}
      {theftAlertPopup && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full border-2 border-rose-500 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-rose-600 text-white p-5 flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
                <ShieldAlert className="w-7 h-7 text-white animate-pulse" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase tracking-wider font-extrabold bg-rose-900/50 text-rose-100 px-2.5 py-0.5 rounded-full">
                    FRAUD & THEFT PREVENTION ENGINE
                  </span>
                  <button
                    type="button"
                    onClick={() => setTheftAlertPopup(null)}
                    className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <h3 className="text-lg font-black tracking-tight text-white mt-1">
                  Duplicate Replacement Flagged!
                </h3>
                <p className="text-xs text-rose-100 mt-0.5 font-medium">
                  Trailer #{selectedPlate || "1286"} • Action: Replace Component
                </p>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-rose-900">
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    Detected Issue:
                  </span>
                  <span className="text-rose-700 font-mono">
                    {theftAlertPopup.item.subtotalSAR.toFixed(2)} SAR at risk
                  </span>
                </div>
                <p className="text-xs text-rose-950 font-bold leading-relaxed">
                  {theftAlertPopup.item.flagReason}
                </p>
              </div>

              <div className="bg-[#F5F5F7] rounded-2xl p-4 space-y-2.5 text-xs text-[#1D1D1F]">
                <div className="flex justify-between py-1 border-b border-[#E5E5EA]">
                  <span className="text-[#86868B] font-medium">Component Requested:</span>
                  <span className="font-bold">{theftAlertPopup.item.partName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E5E5EA]">
                  <span className="text-[#86868B] font-medium">Axle Location:</span>
                  <span className="font-bold">{theftAlertPopup.item.axlePosition}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E5E5EA]">
                  <span className="text-[#86868B] font-medium">Requested Quantity:</span>
                  <span className="font-bold">{theftAlertPopup.item.quantity} units</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#86868B] font-medium">Company Policy:</span>
                  <span className="font-bold text-rose-700">45-day anti-theft cooldown active</span>
                </div>
              </div>

              <p className="text-xs text-[#86868B] leading-relaxed">
                To protect against premature component leakage and duplicate billing, this item is blocked from invoicing until verified by a Yard Supervisor or removed.
              </p>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    handleRejectClaim(theftAlertPopup.index);
                  }}
                  className="h-11 px-4 bg-white hover:bg-rose-50 border-2 border-rose-500 text-rose-700 text-xs font-extrabold rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Reject Claim (Block Theft)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const idx = theftAlertPopup.index;
                    setTheftAlertPopup(null);
                    setActiveOverrideIndex(idx);
                  }}
                  className="h-11 px-4 bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Supervisor PIN Override</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
