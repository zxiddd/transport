import { Trailer, Driver } from "@/types/workshop";

export interface TalaFleetRecord {
  sn: number;
  driverName: string;
  trailerNumber: string;
  loadDate: string;
  fromLocation: string;
  toLocation: string;
  status: "active" | "grounded";
  modelType: string;
  iqamaNumber: string;
  phone: string;
}

export const TALA_FLEET_50: TalaFleetRecord[] = [];

export function getTalaTrailers(companyId = "tala-transport"): Trailer[] {
  return TALA_FLEET_50.map((record) => ({
    id: `TR-${record.trailerNumber}`,
    companyId,
    plateNumber: record.trailerNumber,
    trailerNumber: record.trailerNumber,
    modelType: record.modelType,
    defaultDriverId: `driver-${record.trailerNumber}`,
    status: record.status,
    loadDate: record.loadDate,
    fromLocation: record.fromLocation,
    toLocation: record.toLocation,
    driverName: record.driverName,
    createdAt: new Date() as any,
  }));
}

export function getTalaDrivers(companyId = "tala-transport"): Driver[] {
  return TALA_FLEET_50.map((record) => ({
    id: `driver-${record.trailerNumber}`,
    companyId,
    fullName: record.driverName,
    iqamaNumber: record.iqamaNumber,
    phone: record.phone,
    assignedPlate: record.trailerNumber,
    trailerNumber: record.trailerNumber,
    loadDate: record.loadDate,
    fromLocation: record.fromLocation,
    toLocation: record.toLocation,
    status: record.status,
    createdAt: new Date() as any,
  }));
}
