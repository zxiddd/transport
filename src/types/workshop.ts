import { Timestamp } from "firebase/firestore";

export interface CompanyProfile {
  id: string;
  name: string;
  branch: string;
  currency: "SAR";
  vatEnabled: boolean;
  vatRatePercentage?: number; // e.g. 15, 5, 0, or custom rate
  crNumber?: string; // Commercial Registration Number (Optional)
  vatRegistrationNumber?: string; // ZATCA Tax ID Number (Optional)
  address?: string; // Yard / Physical Address (Optional)
  phone?: string; // Contact Phone (Optional)
  managerPin: string; // 4-digit code or hashed string
  hasCompletedOnboarding: boolean;
  createdAt: Timestamp;
}

export interface Trailer {
  id: string; // Normalized plate number or trailer ID (e.g. "1286" or "7842-JED")
  companyId: string;
  plateNumber: string;
  trailerNumber?: string;
  modelType: string; // e.g. "Flatbed 40ft", "Lowbed", "Curtain Sider", "40ft Container Chassis"
  defaultDriverId: string;
  driverName?: string;
  status: "active" | "in-workshop" | "grounded";
  loadDate?: string;
  fromLocation?: string;
  toLocation?: string;
  createdAt: Timestamp;
}

export interface Driver {
  id: string;
  companyId: string;
  fullName: string;
  iqamaNumber: string;
  phone: string;
  assignedPlate: string;
  trailerNumber?: string;
  loadDate?: string;
  fromLocation?: string;
  toLocation?: string;
  status?: "active" | "grounded" | "in-workshop";
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
  vatRatePercentage?: number; // Applied VAT % (e.g. 15, 5, 0)
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
