"use client";

import React from "react";
import { Plus, Trash2, Zap, Truck } from "lucide-react";

export interface FleetRow {
  plateNumber: string;
  modelType: string;
  driverFullName: string;
  iqamaNumber: string;
  driverPhone: string;
}

interface WizardStep2Props {
  fleetRows: FleetRow[];
  onChange: (rows: FleetRow[]) => void;
  onNext: () => void;
  onBack: () => void;
}

const TRAILER_TYPES = [
  "Flatbed 40ft",
  "Lowbed",
  "Curtain Sider",
  "Tanker",
  "Box Trailer",
  "Tipper / Dumper",
];

const JEDDAH_PILOT_FLEET: FleetRow[] = [
  {
    plateNumber: "7842-JED",
    modelType: "Flatbed 40ft",
    driverFullName: "Ahmed Al-Ghamdi",
    iqamaNumber: "2489102934",
    driverPhone: "+966 50 123 4567",
  },
  {
    plateNumber: "3195-JED",
    modelType: "Curtain Sider",
    driverFullName: "Tariq Mansoor",
    iqamaNumber: "2341908273",
    driverPhone: "+966 55 987 6543",
  },
  {
    plateNumber: "9041-JED",
    modelType: "Lowbed",
    driverFullName: "Sami Al-Harbi",
    iqamaNumber: "2501928374",
    driverPhone: "+966 54 321 0987",
  },
];

export function WizardStep2({
  fleetRows,
  onChange,
  onNext,
  onBack,
}: WizardStep2Props) {
  const handleAddRow = () => {
    onChange([
      ...fleetRows,
      {
        plateNumber: "",
        modelType: "Flatbed 40ft",
        driverFullName: "",
        iqamaNumber: "",
        driverPhone: "",
      },
    ]);
  };

  const handleRemoveRow = (index: number) => {
    if (fleetRows.length <= 1) return;
    const updated = fleetRows.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleUpdateRow = (index: number, field: keyof FleetRow, value: string) => {
    const updated = [...fleetRows];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const handleQuickLoadPilotFleet = () => {
    onChange(JEDDAH_PILOT_FLEET);
  };

  const isValid =
    fleetRows.length > 0 &&
    fleetRows.every(
      (row) =>
        row.plateNumber.trim().length > 0 &&
        row.driverFullName.trim().length > 0 &&
        row.iqamaNumber.trim().length > 0
    );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E5E5EA] pb-5">
        <div>
          <h2 className="text-2xl font-bold text-[#1D1D1F] tracking-tight">
            Step 2: Fleet & Driver Ingestion
          </h2>
          <p className="text-sm text-[#86868B]">
            Register active trailers and assigned drivers for workshop entry scanning.
          </p>
        </div>

        {/* Quick Load Pilot Button */}
        <button
          type="button"
          onClick={handleQuickLoadPilotFleet}
          className="h-[44px] px-4 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[#059669] text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-sm"
        >
          <Zap className="w-4 h-4 fill-[#10B981]" />
          <span>Quick-Load Jeddah Pilot Fleet</span>
        </button>
      </div>

      {/* Fleet Table */}
      <div className="space-y-4">
        {fleetRows.map((row, idx) => (
          <div
            key={idx}
            className="bg-[#F5F5F7] border border-[#E5E5EA] rounded-2xl p-4 space-y-3 relative group hover:border-[#10B981]/40 transition-all"
          >
            <div className="flex items-center justify-between text-xs font-bold text-[#86868B] uppercase tracking-wider">
              <span className="flex items-center gap-1.5 text-[#1D1D1F]">
                <Truck className="w-4 h-4 text-[#10B981]" />
                Trailer #{idx + 1}
              </span>
              {fleetRows.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveRow(idx)}
                  className="text-red-500 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                  title="Remove Row"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
              {/* Plate Number */}
              <div className="md:col-span-1">
                <label className="block text-[11px] font-semibold text-[#86868B] mb-1">
                  Plate Number
                </label>
                <input
                  type="text"
                  value={row.plateNumber}
                  onChange={(e) =>
                    handleUpdateRow(idx, "plateNumber", e.target.value.toUpperCase())
                  }
                  placeholder="7842-JED"
                  className="w-full h-[46px] px-3 bg-white border border-[#E5E5EA] rounded-xl text-sm font-bold font-mono text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                />
              </div>

              {/* Trailer Type */}
              <div className="md:col-span-1">
                <label className="block text-[11px] font-semibold text-[#86868B] mb-1">
                  Trailer Type
                </label>
                <select
                  value={row.modelType}
                  onChange={(e) => handleUpdateRow(idx, "modelType", e.target.value)}
                  className="w-full h-[46px] px-3 bg-white border border-[#E5E5EA] rounded-xl text-sm font-medium text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                >
                  {TRAILER_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Driver Full Name */}
              <div className="md:col-span-1">
                <label className="block text-[11px] font-semibold text-[#86868B] mb-1">
                  Driver Name
                </label>
                <input
                  type="text"
                  value={row.driverFullName}
                  onChange={(e) =>
                    handleUpdateRow(idx, "driverFullName", e.target.value)
                  }
                  placeholder="Ahmed Al-Ghamdi"
                  className="w-full h-[46px] px-3 bg-white border border-[#E5E5EA] rounded-xl text-sm font-medium text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                />
              </div>

              {/* Driver Iqama */}
              <div className="md:col-span-1">
                <label className="block text-[11px] font-semibold text-[#86868B] mb-1">
                  Iqama / ID Number
                </label>
                <input
                  type="text"
                  value={row.iqamaNumber}
                  onChange={(e) => handleUpdateRow(idx, "iqamaNumber", e.target.value)}
                  placeholder="2489102934"
                  className="w-full h-[46px] px-3 bg-white border border-[#E5E5EA] rounded-xl text-sm font-mono text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                />
              </div>

              {/* Driver Phone */}
              <div className="md:col-span-1">
                <label className="block text-[11px] font-semibold text-[#86868B] mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={row.driverPhone}
                  onChange={(e) => handleUpdateRow(idx, "driverPhone", e.target.value)}
                  placeholder="+966 50 123 4567"
                  className="w-full h-[46px] px-3 bg-white border border-[#E5E5EA] rounded-xl text-sm font-medium text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                />
              </div>
            </div>
          </div>
        ))}

        {/* Add Row Button */}
        <button
          type="button"
          onClick={handleAddRow}
          className="w-full h-[48px] bg-white border-2 border-dashed border-[#E5E5EA] hover:border-[#10B981] hover:text-[#10B981] text-[#86868B] text-sm font-semibold rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Another Trailer & Driver Row</span>
        </button>
      </div>

      {/* Step Actions */}
      <div className="grid grid-cols-2 gap-4 pt-4">
        <button
          type="button"
          onClick={onBack}
          className="h-[52px] bg-[#F5F5F7] hover:bg-[#E5E5EA] text-[#1D1D1F] text-base font-semibold rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>← Back</span>
        </button>
        <button
          type="button"
          disabled={!isValid}
          onClick={onNext}
          className="h-[52px] bg-[#10B981] hover:bg-[#059669] disabled:bg-[#E5E5EA] disabled:text-[#86868B] text-white text-base font-semibold rounded-2xl transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
        >
          <span>Continue to Anti-Theft Cooldowns</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
}
