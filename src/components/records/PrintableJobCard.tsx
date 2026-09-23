"use client";

import React from "react";
import { X, Printer, ShieldCheck, Building2, Lock } from "lucide-react";
import { JobCard } from "@/types/workshop";
import { useAuth } from "@/context/AuthContext";
import { printJobCardInvoice } from "@/lib/printUtils";

interface PrintableJobCardProps {
  jobCard: JobCard | null;
  onClose: () => void;
}

export function PrintableJobCard({ jobCard, onClose }: PrintableJobCardProps) {
  const { companyProfile } = useAuth();

  if (!jobCard) return null;

  const handlePrint = () => {
    printJobCardInvoice(jobCard, companyProfile);
  };

  const formattedDate = jobCard.createdAt?.toDate
    ? jobCard.createdAt.toDate().toLocaleString("en-GB")
    : new Date().toLocaleString("en-GB");

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto">
      {/* Container Dialog */}
      <div className="bg-white border border-[#E5E5EA] rounded-3xl p-6 sm:p-10 max-w-3xl w-full shadow-2xl space-y-6 relative print:shadow-none print:border-none print:rounded-none print:p-0 print:max-w-none print:w-full">
        {/* On-Screen Header Action Bar (Hidden when printing) */}
        <div className="flex items-center justify-between print:hidden border-b border-[#E5E5EA] pb-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#10B981]" />
            <span className="font-bold text-sm text-[#1D1D1F]">
              Official A4 Job Card Invoice View
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrint}
              className="h-[42px] px-5 bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print A4 Job Card</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#F5F5F7] rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE A4 AREA */}
        <div id="printable-job-card" className="space-y-6 text-[#1D1D1F] font-sans">
          {/* Print CSS Rules */}
          <style jsx global>{`
            @media print {
              body * {
                visibility: hidden;
              }
              #printable-job-card,
              #printable-job-card * {
                visibility: visible;
              }
              #printable-job-card {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                padding: 20px;
                background: white !important;
                color: black !important;
              }
              .print\\:hidden {
                display: none !important;
              }
            }
          `}</style>

          {/* Letterhead Header */}
          <div className="flex items-start justify-between border-b-2 border-[#1D1D1F] pb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[#10B981]">
                <Building2 className="w-7 h-7 text-[#10B981]" />
                <h1 className="text-2xl font-black tracking-tight text-[#1D1D1F] uppercase">
                  {companyProfile?.name || "Tala Transport"}
                </h1>
              </div>
              <p className="text-xs font-semibold text-[#86868B]">
                Fleet Maintenance Workshop & Anti-Theft Division
              </p>
              <p className="text-xs text-[#86868B]">
                CR #4030182940 · VAT #310284910200003 · Jeddah Industrial City, KSA
              </p>
            </div>

            <div className="text-right space-y-1">
              <span className="px-3 py-1 bg-[#F5F5F7] border border-[#E5E5EA] text-[11px] font-bold uppercase tracking-wider text-[#1D1D1F] rounded-md inline-block">
                Official Work Order
              </span>
              <div className="text-xl font-mono font-black text-[#10B981]">
                {jobCard.jobCardNumber}
              </div>
              <p className="text-xs text-[#86868B]">Date: {formattedDate}</p>
              <p className="text-xs text-[#86868B]">Operator: {jobCard.operatorName}</p>
            </div>
          </div>

          {/* Vehicle & Driver Summary Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-[#F5F5F7] border border-[#E5E5EA] rounded-2xl p-4 text-xs">
            <div>
              <span className="text-[#86868B] font-semibold block uppercase text-[10px]">
                Trailer Plate
              </span>
              <span className="font-mono font-bold text-sm text-[#1D1D1F]">
                {jobCard.trailerPlate}
              </span>
            </div>
            <div>
              <span className="text-[#86868B] font-semibold block uppercase text-[10px]">
                Trailer Model
              </span>
              <span className="font-bold text-[#1D1D1F]">{jobCard.trailerModel}</span>
            </div>
            <div>
              <span className="text-[#86868B] font-semibold block uppercase text-[10px]">
                Assigned Driver
              </span>
              <span className="font-bold text-[#1D1D1F]">{jobCard.driverName}</span>
            </div>
            <div>
              <span className="text-[#86868B] font-semibold block uppercase text-[10px]">
                Driver Iqama / ID
              </span>
              <span className="font-mono font-bold text-[#1D1D1F]">
                {jobCard.driverIqama}
              </span>
            </div>
          </div>

          {/* Itemized Line Items Table */}
          <div className="border border-[#E5E5EA] rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F5F7] text-[#86868B] uppercase font-bold border-b border-[#E5E5EA]">
                <tr>
                  <th className="py-3 px-3">#</th>
                  <th className="py-3 px-3">Part Description</th>
                  <th className="py-3 px-3">Axle Position</th>
                  <th className="py-3 px-3">Action</th>
                  <th className="py-3 px-3 text-center">Qty</th>
                  <th className="py-3 px-3 text-right">Unit Cost</th>
                  <th className="py-3 px-3 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5EA]">
                {jobCard.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-[#F5F5F7]">
                    <td className="py-3 px-3 font-mono text-[#86868B]">{idx + 1}</td>
                    <td className="py-3 px-3 font-bold text-[#1D1D1F]">
                      {item.partName}
                      {item.authorizedByPin && (
                        <div className="mt-1 text-[10px] text-amber-700 font-semibold flex items-center gap-1">
                          <Lock className="w-3 h-3 text-amber-600" />
                          <span>Manager Override: {item.overrideNote}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-[#86868B]">{item.axlePosition}</td>
                    <td className="py-3 px-3 capitalize font-semibold">
                      {item.action}
                    </td>
                    <td className="py-3 px-3 text-center font-bold">{item.quantity}</td>
                    <td className="py-3 px-3 text-right font-mono">
                      {item.unitCostSAR.toFixed(2)} SAR
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold">
                      {item.subtotalSAR.toFixed(2)} SAR
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Anti-Theft Compliance Badge */}
          {jobCard.items.some((i) => i.authorizedByPin) && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between text-xs text-amber-900">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>
                  <strong>Anti-Theft Compliance Audit:</strong> Contains authorized supervisor PIN override.
                </span>
              </div>
              <span className="font-mono text-[10px] font-bold bg-amber-200 px-2 py-0.5 rounded-md">
                AUDITED & VERIFIED
              </span>
            </div>
          )}

          {/* Financial Breakdown */}
          <div className="flex justify-end pt-2">
            <div className="w-72 space-y-2 text-xs">
              <div className="flex justify-between text-[#86868B]">
                <span>Net Subtotal:</span>
                <span className="font-mono font-semibold text-[#1D1D1F]">
                  {jobCard.subtotalSAR.toFixed(2)} SAR
                </span>
              </div>
              <div className="flex justify-between text-[#86868B]">
                <span>VAT ({jobCard.vatRatePercentage ?? (jobCard.vatAmountSAR > 0 ? 15 : 0)}%):</span>
                <span className="font-mono font-semibold text-[#1D1D1F]">
                  {jobCard.vatAmountSAR.toFixed(2)} SAR
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t-2 border-[#1D1D1F] text-base font-extrabold text-[#1D1D1F]">
                <span>Grand Total:</span>
                <span className="font-mono text-[#10B981]">
                  {jobCard.grandTotalSAR.toFixed(2)} SAR
                </span>
              </div>
            </div>
          </div>

          {/* Handover & Sign-Off Authorization Blocks */}
          <div className="grid grid-cols-3 gap-6 pt-12 text-xs border-t border-[#E5E5EA]">
            <div className="space-y-8">
              <div className="border-t border-dashed border-[#86868B] pt-2 text-center text-[#86868B]">
                Workshop Mechanic Signature
              </div>
            </div>
            <div className="space-y-8">
              <div className="border-t border-dashed border-[#86868B] pt-2 text-center text-[#86868B]">
                Driver Handover Acknowledgment
                <p className="text-[10px] text-[#86868B] mt-0.5">
                  &quot;I confirm receipt of the listed parts&quot;
                </p>
              </div>
            </div>
            <div className="space-y-8">
              <div className="border-t border-dashed border-[#86868B] pt-2 text-center text-[#86868B]">
                Supervisor Authorization
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
