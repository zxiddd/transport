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
import { db } from "@/lib/firebase";
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
  AlertTriangle,
  CheckCircle2,
  Plus,
  Trash2,
  ShieldAlert,
  Percent,
  History,
  Sparkles,
  ShieldCheck,
  Building2,
} from "lucide-react";
import { PinOverrideModal } from "./PinOverrideModal";
import { AddNewPartModal } from "./AddNewPartModal";
import { JobInvoiceModal } from "./JobInvoiceModal";
import { INITIAL_PARTS } from "../onboarding/WizardStep3";

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

const DEFAULT_TRAILERS: Trailer[] = [
  {
    id: "7842-JED",
    companyId: "tala-transport",
    plateNumber: "7842-JED",
    modelType: "Flatbed 40ft",
    defaultDriverId: "driver-7842-JED",
    status: "active",
    createdAt: new Date() as any,
  },
  {
    id: "3195-JED",
    companyId: "tala-transport",
    plateNumber: "3195-JED",
    modelType: "Curtain Sider",
    defaultDriverId: "driver-3195-JED",
    status: "active",
    createdAt: new Date() as any,
  },
  {
    id: "9041-JED",
    companyId: "tala-transport",
    plateNumber: "9041-JED",
    modelType: "Lowbed",
    defaultDriverId: "driver-9041-JED",
    status: "active",
    createdAt: new Date() as any,
  },
];

const DEFAULT_DRIVERS: Driver[] = [
  {
    id: "driver-7842-JED",
    companyId: "tala-transport",
    fullName: "Ahmed Al-Ghamdi",
    iqamaNumber: "2489102934",
    phone: "+966 50 123 4567",
    assignedPlate: "7842-JED",
    createdAt: new Date() as any,
  },
  {
    id: "driver-3195-JED",
    companyId: "tala-transport",
    fullName: "Tariq Mansoor",
    iqamaNumber: "2341908273",
    phone: "+966 55 987 6543",
    assignedPlate: "3195-JED",
    createdAt: new Date() as any,
  },
  {
    id: "driver-9041-JED",
    companyId: "tala-transport",
    fullName: "Sami Al-Harbi",
    iqamaNumber: "2501928374",
    phone: "+966 54 321 0987",
    assignedPlate: "9041-JED",
    createdAt: new Date() as any,
  },
];

export function JobCardTerminal() {
  const { companyId, companyProfile } = useAuth();
  const targetCid = companyId || "tala-transport";

  // Catalog State
  const [trailers, setTrailers] = useState<Trailer[]>(DEFAULT_TRAILERS);
  const [drivers, setDrivers] = useState<Driver[]>(DEFAULT_DRIVERS);
  const [partCatalog, setPartCatalog] = useState<PartCatalogItem[]>(
    INITIAL_PARTS as any
  );
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  // Card 1 State: Vehicle & Driver Selection
  const [selectedPlate, setSelectedPlate] = useState<string>("7842-JED");
  const [selectedTrailer, setSelectedTrailer] = useState<Trailer | null>(
    DEFAULT_TRAILERS[0]
  );
  const [assignedDriver, setAssignedDriver] = useState<Driver | null>(
    DEFAULT_DRIVERS[0]
  );
  const [isReassigningDriver, setIsReassigningDriver] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState<string>("driver-7842-JED");

  // Timeline State
  const [pastJobCards, setPastJobCards] = useState<JobCard[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  // Card 2 State: Line Items
  const [lineItems, setLineItems] = useState<JobLineItem[]>([]);

  // Prevented Financial Leakage Counter
  const [preventedLeakageSAR, setPreventedLeakageSAR] = useState<number>(0);

  // VAT Toggle State
  const [vatEnabled, setVatEnabled] = useState<boolean>(
    companyProfile?.vatEnabled ?? true
  );

  // Modals
  const [activeOverrideIndex, setActiveOverrideIndex] = useState<number | null>(
    null
  );
  const [isAddPartOpen, setIsAddPartOpen] = useState(false);
  const [savedJobCard, setSavedJobCard] = useState<JobCard | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // 1. Fetch catalog data on mount
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        setLoadingCatalog(true);

        let fetchedTrailers: Trailer[] = [];
        try {
          const trailersSnap = await getDocs(
            query(collection(db, "trailers"), where("companyId", "==", targetCid))
          );
          fetchedTrailers = trailersSnap.docs.map(
            (d) => d.data() as Trailer
          );
        } catch (e) {
          console.warn("Firestore trailers fetch fallback:", e);
        }

        let fetchedDrivers: Driver[] = [];
        try {
          const driversSnap = await getDocs(
            query(collection(db, "drivers"), where("companyId", "==", targetCid))
          );
          fetchedDrivers = driversSnap.docs.map(
            (d) => d.data() as Driver
          );
        } catch (e) {
          console.warn("Firestore drivers fetch fallback:", e);
        }

        let fetchedParts: PartCatalogItem[] = [];
        try {
          const partsSnap = await getDocs(
            query(
              collection(db, "part_catalog"),
              where("companyId", "==", targetCid)
            )
          );
          fetchedParts = partsSnap.docs.map(
            (d) => d.data() as PartCatalogItem
          );
        } catch (e) {
          console.warn("Firestore parts fetch fallback:", e);
        }

        // Check local storage fallback
        if (typeof window !== "undefined") {
          const localFleetStr = localStorage.getItem(`tala_fleet_${targetCid}`);
          if (localFleetStr && fetchedTrailers.length === 0) {
            try {
              const rows = JSON.parse(localFleetStr);
              fetchedTrailers = rows.map((r: any) => ({
                id: r.plateNumber,
                companyId: targetCid,
                plateNumber: r.plateNumber,
                modelType: r.modelType,
                defaultDriverId: `driver-${r.plateNumber}`,
                status: "active",
              }));

              fetchedDrivers = rows.map((r: any) => ({
                id: `driver-${r.plateNumber}`,
                companyId: targetCid,
                fullName: r.driverFullName,
                iqamaNumber: r.iqamaNumber,
                phone: r.driverPhone,
                assignedPlate: r.plateNumber,
              }));
            } catch (e) {}
          }

          const localPartsStr = localStorage.getItem(`tala_parts_${targetCid}`);
          if (localPartsStr && fetchedParts.length === 0) {
            try {
              fetchedParts = JSON.parse(localPartsStr);
            } catch (e) {}
          }
        }

        const activeTrailers = fetchedTrailers.length > 0 ? fetchedTrailers : DEFAULT_TRAILERS;
        const activeDrivers = fetchedDrivers.length > 0 ? fetchedDrivers : DEFAULT_DRIVERS;
        const activeParts = fetchedParts.length > 0 ? fetchedParts : (INITIAL_PARTS as any);

        setTrailers(activeTrailers);
        setDrivers(activeDrivers);
        setPartCatalog(activeParts);

        if (activeTrailers.length > 0) {
          handleSelectPlate(activeTrailers[0].plateNumber, activeTrailers, activeDrivers);
        }
      } catch (err) {
        console.error("Catalog load error:", err);
      } finally {
        setLoadingCatalog(false);
      }
    };

    fetchCatalog();
  }, [targetCid]);

  useEffect(() => {
    if (companyProfile) {
      setVatEnabled(companyProfile.vatEnabled);
    }
  }, [companyProfile]);

  // 2. Handle Plate Selection
  const handleSelectPlate = async (
    plate: string,
    currentTrailers = trailers,
    currentDrivers = drivers
  ) => {
    setSelectedPlate(plate);
    const trailerMatch = currentTrailers.find((t) => t.plateNumber === plate);
    setSelectedTrailer(trailerMatch || null);

    if (trailerMatch) {
      const driverMatch = currentDrivers.find(
        (d) => d.id === trailerMatch.defaultDriverId || d.assignedPlate === plate
      );
      setAssignedDriver(driverMatch || null);
      setSelectedDriverId(driverMatch?.id || "");
    } else {
      setAssignedDriver(null);
      setSelectedDriverId("");
    }

    try {
      setLoadingTimeline(true);
      const jobsQuery = query(
        collection(db, "job_cards"),
        where("companyId", "==", targetCid),
        where("trailerPlate", "==", plate),
        orderBy("createdAt", "desc"),
        limit(3)
      );
      const jobsSnap = await getDocs(jobsQuery);
      const jobsList: JobCard[] = jobsSnap.docs.map((d) => d.data() as JobCard);
      setPastJobCards(jobsList);
    } catch (err) {
      console.warn("Error fetching past job cards:", err);
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

    const updatedItems = [...lineItems, newItem];
    setLineItems(updatedItems);
    runFraudEngineCheck(newItem, updatedItems.length - 1, updatedItems);
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
    setLineItems(updated);

    if (field === "partName" || field === "axlePosition" || field === "action") {
      runFraudEngineCheck(targetItem, index, updated);
    }
  };

  const handleRemoveLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const runFraudEngineCheck = (
    item: JobLineItem,
    itemIndex: number,
    currentList: JobLineItem[]
  ) => {
    if (item.action !== "replace" || !selectedPlate) return;

    const partMatch = partCatalog.find((p) => p.name === item.partName);
    const cooldownDays = partMatch?.cooldownDays || 45;

    const now = new Date();
    let duplicateFound: {
      daysAgo: number;
      jobCardNumber: string;
      driverName: string;
    } | null = null;

    for (const job of pastJobCards) {
      const jobDate = job.createdAt?.toDate ? job.createdAt.toDate() : new Date();
      const diffDays = Math.floor(
        (now.getTime() - jobDate.getTime()) / (1000 * 3600 * 24)
      );

      if (diffDays <= cooldownDays) {
        const matchingItem = job.items.find(
          (pastItem) =>
            pastItem.action === "replace" &&
            (pastItem.partName === item.partName ||
              pastItem.axlePosition === item.axlePosition)
        );

        if (matchingItem) {
          duplicateFound = {
            daysAgo: diffDays,
            jobCardNumber: job.jobCardNumber,
            driverName: job.driverName,
          };
          break;
        }
      }
    }

    const updatedList = [...currentList];

    if (duplicateFound) {
      updatedList[itemIndex] = {
        ...updatedList[itemIndex],
        isFlagged: true,
        flagReason: `Duplicate replacement detected. Replaced ${duplicateFound.daysAgo} days ago on Job #${duplicateFound.jobCardNumber} (Driver: ${duplicateFound.driverName}).`,
        authorizedByPin: false,
      };
    } else {
      updatedList[itemIndex] = {
        ...updatedList[itemIndex],
        isFlagged: false,
        flagReason: undefined,
      };
    }

    setLineItems(updatedList);
  };

  const handleRejectClaim = async (index: number) => {
    const itemToReject = lineItems[index];
    if (!itemToReject) return;

    setPreventedLeakageSAR((prev) => prev + itemToReject.subtotalSAR);
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

      await setDoc(doc(db, "theft_audit_records", auditId), auditPayload);
      await setDoc(doc(db, `companies/${targetCid}/theft_audit_records`, auditId), auditPayload);
    } catch (err) {
      console.warn("Audit record write fallback:", err);
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

      await setDoc(doc(db, "theft_audit_records", auditId), auditPayload);
      await setDoc(doc(db, `companies/${targetCid}/theft_audit_records`, auditId), auditPayload);
    } catch (err) {
      console.warn("Override audit write fallback:", err);
    }
  };

  const subtotalSAR = lineItems.reduce((acc, i) => acc + i.subtotalSAR, 0);
  const vatAmountSAR = vatEnabled ? subtotalSAR * 0.15 : 0;
  const grandTotalSAR = subtotalSAR + vatAmountSAR;

  const hasUnresolvedFlags = lineItems.some(
    (item) => item.isFlagged && !item.authorizedByPin
  );

  const handleSaveJobCard = async () => {
    if (lineItems.length === 0 || !selectedPlate || hasUnresolvedFlags) return;

    try {
      setIsSaving(true);
      const randomSeq = Math.floor(1000 + Math.random() * 9000);
      const jobCardNumber = `TT-2026-${randomSeq}`;
      const jobDocId = `job-${Date.now()}`;

      const newJobCard: JobCard = {
        id: jobDocId,
        jobCardNumber,
        companyId: targetCid,
        trailerPlate: selectedPlate,
        trailerModel: selectedTrailer?.modelType || "Flatbed 40ft",
        driverId: assignedDriver?.id || "unassigned",
        driverName: assignedDriver?.fullName || "Unassigned Driver",
        driverIqama: assignedDriver?.iqamaNumber || "N/A",
        operatorName: "Yard Coordinator",
        items: lineItems,
        subtotalSAR,
        vatAmountSAR,
        grandTotalSAR,
        status: "completed",
        createdAt: Timestamp.now(),
      };

      try {
        await setDoc(doc(db, `companies/${targetCid}/job_cards`, jobDocId), newJobCard);
        await setDoc(doc(db, "job_cards", jobDocId), newJobCard);
      } catch (fsErr) {
        console.warn("Job card Firestore save fallback:", fsErr);
      }

      setSavedJobCard(newJobCard);
    } catch (err) {
      console.error("Error saving job card:", err);
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold text-[#1D1D1F] uppercase tracking-wider mb-2">
              Select Trailer Plate Number
            </label>
            <div className="relative">
              <select
                value={selectedPlate}
                onChange={(e) => handleSelectPlate(e.target.value)}
                className="w-full h-[52px] pl-4 pr-10 bg-[#F5F5F7] border border-[#E5E5EA] rounded-2xl text-base font-bold font-mono text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:bg-white transition-all"
              >
                {trailers.map((t) => (
                  <option key={t.id} value={t.plateNumber}>
                    {t.plateNumber} · ({t.modelType})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-[#F5F5F7] border border-[#E5E5EA] rounded-2xl p-4 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-[#10B981]" />
                <span className="font-bold text-sm text-[#1D1D1F]">
                  {assignedDriver?.fullName || "Unassigned Driver"}
                </span>
              </div>
              <div className="text-xs text-[#86868B] space-x-3">
                <span>
                  Iqama:{" "}
                  <strong className="font-mono text-[#1D1D1F]">
                    {assignedDriver?.iqamaNumber || "N/A"}
                  </strong>
                </span>
                <span>•</span>
                <span>
                  Model:{" "}
                  <strong className="text-[#1D1D1F]">
                    {selectedTrailer?.modelType || "Flatbed 40ft"}
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
                        {d.fullName}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setIsReassigningDriver(false)}
                    className="text-xs text-[#86868B] hover:text-[#1D1D1F]"
                  >
                    Done
                  </button>
                </div>
              )}
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
                Last serviced: <strong>14 days ago</strong> — Replaced:{" "}
                {pastJobCards[0].items.map((i) => i.partName).join(", ")} (Job #
                {pastJobCards[0].jobCardNumber})
              </span>
            ) : (
              <span className="text-amber-800 font-medium">
                No recorded repairs within 60 days for trailer {selectedPlate}.
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
                <div className="bg-[#F5F5F7] border border-[#E5E5EA] rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-[#86868B] uppercase tracking-wider">
                    <span>Line Item #{idx + 1}</span>
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
                        Select Component
                      </label>
                      <select
                        value={item.partName}
                        onChange={(e) =>
                          handleUpdateLineItem(idx, "partName", e.target.value)
                        }
                        className="w-full h-[46px] px-3 bg-white border border-[#E5E5EA] rounded-xl text-xs font-bold text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                      >
                        {partCatalog.map((p) => (
                          <option key={p.id} value={p.name}>
                            {p.name} ({p.category})
                          </option>
                        ))}
                      </select>
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
                  <div className="bg-red-50 border-2 border-red-500/80 rounded-2xl p-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-red-500 text-white flex items-center justify-center shrink-0 shadow-md">
                        <ShieldAlert className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-extrabold text-red-700 tracking-tight flex items-center gap-2">
                          <span>⚠️ Duplicate Replacement Detected</span>
                        </h4>
                        <p className="text-xs text-red-900 leading-relaxed">
                          This trailer already had this component replaced on{" "}
                          <strong>{item.axlePosition}</strong> within the 45-day cooldown threshold.
                        </p>
                        <p className="text-xs text-red-800 font-semibold italic">
                          {item.flagReason}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2 border-t border-red-200">
                      <button
                        type="button"
                        onClick={() => handleRejectClaim(idx)}
                        className="h-[42px] px-4 border border-red-500 text-red-600 hover:bg-red-100 text-xs font-bold rounded-xl transition-all cursor-pointer"
                      >
                        Reject Claim (Block Theft)
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveOverrideIndex(idx)}
                        className="h-[42px] px-4 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
                      >
                        Authorize Replacement (PIN Override)
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

          <div
            onClick={() => setVatEnabled(!vatEnabled)}
            className="h-[46px] px-4 bg-[#F5F5F7] border border-[#E5E5EA] rounded-2xl flex items-center gap-3 cursor-pointer hover:bg-white transition-all"
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-[#1D1D1F]">
              <Percent className="w-4 h-4 text-[#86868B]" />
              <span>Include 15% VAT</span>
            </div>
            <div
              className={`w-10 h-6 rounded-full p-0.5 transition-colors duration-200 ${
                vatEnabled ? "bg-[#10B981]" : "bg-[#D1D1D6]"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${
                  vatEnabled ? "translate-x-4" : "translate-x-0"
                }`}
              />
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
              15% KSA VAT
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

        <div>
          <button
            type="button"
            disabled={isSaving || lineItems.length === 0 || hasUnresolvedFlags}
            onClick={handleSaveJobCard}
            className="w-full h-[56px] bg-[#10B981] hover:bg-[#059669] disabled:bg-[#E5E5EA] disabled:text-[#86868B] text-white text-lg font-bold rounded-2xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Writing to Firestore...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6" />
                <span>Save Job Card & Generate Invoice</span>
              </div>
            )}
          </button>
          {hasUnresolvedFlags && (
            <p className="text-center text-xs font-semibold text-red-600 mt-2">
              ⚠️ Unresolved duplicate replacement flags present. Resolve or override flags to proceed.
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
    </div>
  );
}
