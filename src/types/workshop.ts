import { Timestamp } from "firebase/firestore";

export interface CompanyProfile {
  id: string;
  name: string;
  branch: string;
  currency: "SAR";
  vatEnabled: boolean;
  managerPin: string; // 4-digit code or hashed string
  hasCompletedOnboarding: boolean;
  createdAt: Timestamp;
}

export interface Trailer {
  id: string; // Normalized plate number (e.g. "7842-JED")
  companyId: string;
  plateNumber: string;
  modelType: string; // e.g. "Flatbed 40ft", "Lowbed", "Curtain Sider", "Tanker", "Box"
  defaultDriverId: string;
  status: "active" | "in-workshop" | "grounded";
  createdAt: Timestamp;
}

export interface Driver {
  id: string;
  companyId: string;
  fullName: string;
  iqamaNumber: string;
  phone: string;
  assignedPlate: string;
  createdAt: Timestamp;
}

export interface PartCatalogItem {
  id: string;
  companyId: string;
  name: string;
  category: "Tires" | "Brakes" | "Suspension" | "Fluids" | "Body" | "Other";
  cooldownDays: number; // e.g. 45 for tires
  baselineCostSAR: number;
}

export interface JobLineItem {
  id: string;
  partName: string;
  category: string;
  axlePosition: string;
  action: "replace" | "repair";
  quantity: number;
  unitCostSAR: number;
  subtotalSAR: number;
  isFlagged: boolean;
  flagReason?: string;
  overrideNote?: string;
  authorizedByPin?: boolean;
}

export interface JobCard {
  id: string;
  jobCardNumber: string; // e.g. "TT-2026-0001"
  companyId: string;
  trailerPlate: string;
  trailerModel: string;
  driverId: string;
  driverName: string;
  driverIqama: string;
  operatorName: string;
  items: JobLineItem[];
  subtotalSAR: number;
  vatAmountSAR: number;
  grandTotalSAR: number;
  status: "completed" | "flagged_review" | "rejected";
  createdAt: Timestamp;
}

export interface TheftAuditRecord {
  id: string;
  companyId: string;
  trailerPlate: string;
  driverName: string;
  partName: string;
  axlePosition: string;
  daysSinceLastService: number;
  previousJobId: string;
  actionTaken: "BLOCKED" | "AUTHORIZED_OVERRIDE";
  managerNote: string;
  timestamp: Timestamp;
}
