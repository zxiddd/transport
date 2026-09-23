"use client";

import React from "react";
import { X, Printer, CheckCircle2 } from "lucide-react";
import { JobCard } from "@/types/workshop";
import { useAuth } from "@/context/AuthContext";
import { printJobCardInvoice } from "@/lib/printUtils";

interface JobInvoiceModalProps {
  jobCard: JobCard | null;
  onClose: () => void;
}

export function JobInvoiceModal({ jobCard, onClose }: JobInvoiceModalProps) {
  const { companyProfile } = useAuth();

  if (!jobCard) return null;

  const handlePrint = () => {
    printJobCardInvoice(jobCard, companyProfile);
  };

  const vatRate = jobCard.vatRatePercentage ?? (jobCard.vatAmountSAR > 0 ? 15 : 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white border border-black/[0.08] rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-[0_24px_48px_rgba(0,0,0,0.12)] space-y-6 relative print:shadow-none print:border-none print:rounded-none print:max-w-none print:w-full text-[#1D1D1F]">
        {/* Screen Action Bar (Hidden when printing) */}
        <div className="flex items-center justify-between print:hidden border-b border-black/[0.06] pb-4">
          <div className="flex items-center gap-2 text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-semibold text-sm text-[#1D1D1F]">
              Job Card Saved & Invoice Ready
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="h-9 px-4 bg-[#1D1D1F] hover:bg-black text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print A4 Invoice</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#86868B] hover:text-[#1D1D1F] hover:bg-black/[0.05] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Official Invoice Card */}
        <div className="space-y-6 text-[#1D1D1F] font-sans">
          {/* Invoice Header */}
          <div className="flex items-start justify-between border-b border-black/[0.06] pb-5">
            <div>
              <div className="flex items-center gap-2 text-[#1D1D1F] mb-1">
                <div className="w-8 h-8 rounded-xl bg-[#1D1D1F] text-white flex items-center justify-center font-bold text-xs">
                  TT
                </div>
                <h2 className="text-xl font-bold tracking-tight text-[#1D1D1F]">
                  {companyProfile?.name || "Tala Transport"}
                </h2>
              </div>
              <p className="text-xs text-[#86868B]">
                {companyProfile?.branch || "Jeddah Fleet Yard 3"} · Heavy Fleet Maintenance
              </p>
              <p className="text-xs text-[#86868B]">Kingdom of Saudi Arabia · ZATCA VAT #310284910200003</p>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider block">
                Work Order / Invoice
              </span>
              <span className="text-lg font-mono font-bold text-[#1D1D1F]">
                {jobCard.jobCardNumber}
              </span>
              <p className="text-xs text-[#86868B] mt-0.5">
                Date: {new Date().toLocaleDateString("en-GB")}
              </p>
            </div>
          </div>

          {/* Asset & Driver Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-black/[0.03] border border-black/[0.06] rounded-2xl p-4 text-xs">
            <div>
              <span className="text-[#86868B] block font-medium text-[11px]">Trailer Plate</span>
              <span className="font-mono font-bold text-sm text-[#1D1D1F]">
                {jobCard.trailerPlate}
              </span>
            </div>
            <div>
              <span className="text-[#86868B] block font-medium text-[11px]">Trailer Model</span>
              <span className="font-semibold text-[#1D1D1F]">{jobCard.trailerModel}</span>
            </div>
            <div>
              <span className="text-[#86868B] block font-medium text-[11px]">Assigned Driver</span>
              <span className="font-semibold text-[#1D1D1F]">{jobCard.driverName}</span>
            </div>
            <div>
              <span className="text-[#86868B] block font-medium text-[11px]">Driver Iqama ID</span>
              <span className="font-mono font-bold text-[#1D1D1F]">
                {jobCard.driverIqama}
              </span>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border border-black/[0.08] rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-black/[0.03] text-[#86868B] uppercase text-[10px] font-semibold border-b border-black/[0.06]">
                <tr>
                  <th className="py-2.5 px-3.5">Component</th>
                  <th className="py-2.5 px-3.5">Position</th>
                  <th className="py-2.5 px-3.5">Action</th>
                  <th className="py-2.5 px-3.5 text-center">Qty</th>
                  <th className="py-2.5 px-3.5 text-right">Unit Price</th>
                  <th className="py-2.5 px-3.5 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.06]">
                {jobCard.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-black/[0.02]">
                    <td className="py-3 px-3.5 font-semibold text-[#1D1D1F]">
                      {item.partName}
                      {item.authorizedByPin && (
                        <span className="ml-2 text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full font-medium">
                          PIN Override
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3.5 text-[#86868B]">{item.axlePosition}</td>
                    <td className="py-3 px-3.5 capitalize font-medium">
                      {item.action}
                    </td>
                    <td className="py-3 px-3.5 text-center font-semibold">{item.quantity}</td>
                    <td className="py-3 px-3.5 text-right font-mono">
                      {item.unitCostSAR.toFixed(2)} SAR
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono font-bold text-[#1D1D1F]">
                      {item.subtotalSAR.toFixed(2)} SAR
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Invoice Summary Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2 text-xs">
              <div className="flex justify-between text-[#86868B]">
                <span>Subtotal:</span>
                <span className="font-mono font-medium text-[#1D1D1F]">
                  {jobCard.subtotalSAR.toFixed(2)} SAR
                </span>
              </div>
              <div className="flex justify-between text-[#86868B]">
                <span>VAT ({vatRate}%):</span>
                <span className="font-mono font-medium text-[#1D1D1F]">
                  {jobCard.vatAmountSAR.toFixed(2)} SAR
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-black/[0.08] text-sm font-bold text-[#1D1D1F]">
                <span>Grand Total:</span>
                <span className="font-mono text-emerald-600">
                  {jobCard.grandTotalSAR.toFixed(2)} SAR
                </span>
              </div>
            </div>
          </div>

          {/* Signatures & Seal */}
          <div className="grid grid-cols-2 gap-8 pt-6 border-t border-black/[0.06] text-xs">
            <div className="border-t border-dashed border-black/[0.2] pt-2 text-center text-[#86868B]">
              Mechanic / Workshop Supervisor Signature
            </div>
            <div className="border-t border-dashed border-black/[0.2] pt-2 text-center text-[#86868B]">
              Driver Acknowledgment & Receipt Signature
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
