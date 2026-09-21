"use client";

import React from "react";
import { X, Printer, CheckCircle2, Building2 } from "lucide-react";
import { JobCard } from "@/types/workshop";
import { useAuth } from "@/context/AuthContext";

interface JobInvoiceModalProps {
  jobCard: JobCard | null;
  onClose: () => void;
}

export function JobInvoiceModal({ jobCard, onClose }: JobInvoiceModalProps) {
  const { companyProfile } = useAuth();

  if (!jobCard) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white border border-[#E5E5EA] rounded-3xl p-8 max-w-2xl w-full shadow-2xl space-y-6 relative print:shadow-none print:border-none print:rounded-none print:max-w-none print:w-full">
        {/* Screen Action Bar (Hidden when printing) */}
        <div className="flex items-center justify-between print:hidden border-b border-[#E5E5EA] pb-4">
          <div className="flex items-center gap-2 text-[#10B981]">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-bold text-sm text-[#1D1D1F]">
              Job Card Saved & Invoice Generated
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="h-[40px] px-4 bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Print Invoice</span>
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

        {/* Printable Official Invoice Card */}
        <div className="space-y-6 text-[#1D1D1F] font-sans">
          {/* Invoice Header */}
          <div className="flex items-start justify-between border-b border-[#E5E5EA] pb-6">
            <div>
              <div className="flex items-center gap-2 text-[#10B981] mb-1">
                <Building2 className="w-6 h-6" />
                <h2 className="text-xl font-extrabold tracking-tight text-[#1D1D1F]">
                  {companyProfile?.name || "Tala Transport"}
                </h2>
              </div>
              <p className="text-xs text-[#86868B]">
                {companyProfile?.branch || "Jeddah Fleet Yard 3"} · Fleet Workshop
              </p>
              <p className="text-xs text-[#86868B]">Saudi Arabia</p>
            </div>

            <div className="text-right">
              <span className="text-xs font-bold text-[#86868B] uppercase tracking-wider block">
                Work Order / Invoice
              </span>
              <span className="text-lg font-mono font-extrabold text-[#10B981]">
                {jobCard.jobCardNumber}
              </span>
              <p className="text-xs text-[#86868B] mt-1">
                Date: {new Date().toLocaleDateString("en-GB")}
              </p>
            </div>
          </div>

          {/* Asset & Driver Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-[#F5F5F7] border border-[#E5E5EA] rounded-2xl p-4 text-xs">
            <div>
              <span className="text-[#86868B] block font-semibold">Trailer Plate</span>
              <span className="font-mono font-bold text-sm text-[#1D1D1F]">
                {jobCard.trailerPlate}
              </span>
            </div>
            <div>
              <span className="text-[#86868B] block font-semibold">Model</span>
              <span className="font-bold text-[#1D1D1F]">{jobCard.trailerModel}</span>
            </div>
            <div>
              <span className="text-[#86868B] block font-semibold">Driver Name</span>
              <span className="font-bold text-[#1D1D1F]">{jobCard.driverName}</span>
            </div>
            <div>
              <span className="text-[#86868B] block font-semibold">Driver Iqama</span>
              <span className="font-mono font-bold text-[#1D1D1F]">
                {jobCard.driverIqama}
              </span>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border border-[#E5E5EA] rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F5F7] text-[#86868B] uppercase font-bold border-b border-[#E5E5EA]">
                <tr>
                  <th className="py-3 px-4">Part / Component</th>
                  <th className="py-3 px-4">Position / Axle</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4 text-center">Qty</th>
                  <th className="py-3 px-4 text-right">Unit Price</th>
                  <th className="py-3 px-4 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5EA]">
                {jobCard.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-[#F5F5F7]">
                    <td className="py-3 px-4 font-bold text-[#1D1D1F]">
                      {item.partName}
                      {item.authorizedByPin && (
                        <span className="ml-2 text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">
                          Authorized Override
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-[#86868B]">{item.axlePosition}</td>
                    <td className="py-3 px-4 capitalize font-semibold">
                      {item.action}
                    </td>
                    <td className="py-3 px-4 text-center font-bold">{item.quantity}</td>
                    <td className="py-3 px-4 text-right font-mono">
                      {item.unitCostSAR.toFixed(2)} SAR
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold">
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
                <span className="font-mono font-semibold text-[#1D1D1F]">
                  {jobCard.subtotalSAR.toFixed(2)} SAR
                </span>
              </div>
              <div className="flex justify-between text-[#86868B]">
                <span>KSA 15% VAT:</span>
                <span className="font-mono font-semibold text-[#1D1D1F]">
                  {jobCard.vatAmountSAR.toFixed(2)} SAR
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#E5E5EA] text-sm font-bold text-[#1D1D1F]">
                <span>Grand Total:</span>
                <span className="font-mono text-[#10B981]">
                  {jobCard.grandTotalSAR.toFixed(2)} SAR
                </span>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 pt-8 border-t border-[#E5E5EA] text-xs">
            <div className="border-t border-dashed border-[#86868B] pt-2 text-center text-[#86868B]">
              Mechanic / Workshop Supervisor Signature
            </div>
            <div className="border-t border-dashed border-[#86868B] pt-2 text-center text-[#86868B]">
              Driver Acknowledgment & Receipt Signature
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
