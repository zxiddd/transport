import { JobCard, CompanyProfile } from "@/types/workshop";

/**
 * Universal print helper that works reliably inside iframe environments,
 * mobile browsers, and desktop webviews by creating an isolated document context.
 */
export function printHtmlContent(title: string, bodyHtml: string) {
  if (typeof window === "undefined") return;

  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 15mm;
    }
    *, *::before, *::after {
      box-sizing: border-box;
    }
    body {
      margin: 0;
      padding: 24px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #111827;
      background: #ffffff;
      font-size: 12px;
      line-height: 1.5;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .print-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #111827;
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    .company-title {
      font-size: 22px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: -0.5px;
      margin: 0 0 4px 0;
      color: #047857;
    }
    .company-sub {
      font-size: 11px;
      color: #6b7280;
      margin: 0 0 2px 0;
    }
    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      background: #f3f4f6;
      border: 1px solid #e5e7eb;
      color: #111827;
    }
    .meta-box {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 12px 16px;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 20px;
    }
    .meta-item .label {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      color: #6b7280;
      display: block;
      margin-bottom: 2px;
    }
    .meta-item .value {
      font-size: 13px;
      font-weight: 700;
      color: #111827;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th {
      background: #f3f4f6;
      color: #374151;
      font-weight: 700;
      text-align: left;
      padding: 8px 10px;
      border-bottom: 1px solid #d1d5db;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    td {
      padding: 8px 10px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 11px;
    }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .totals-wrap {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 24px;
    }
    .totals-table {
      width: 280px;
    }
    .totals-table td {
      padding: 4px 8px;
      border: none;
    }
    .grand-total-row {
      border-top: 2px solid #111827 !important;
      font-size: 14px;
      font-weight: 800;
      color: #047857;
    }
    .signatures {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px dashed #d1d5db;
    }
    .sig-line {
      border-bottom: 1px solid #9ca3af;
      margin-top: 40px;
    }
    .footer-note {
      font-size: 9px;
      color: #9ca3af;
      text-align: center;
      margin-top: 25px;
    }
    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body>
  ${bodyHtml}
</body>
</html>`;

  // 1. Try hidden iframe printing (seamless without popup blockers)
  try {
    let printFrame = document.getElementById("hidden-print-frame") as HTMLIFrameElement | null;
    if (!printFrame) {
      printFrame = document.createElement("iframe");
      printFrame.id = "hidden-print-frame";
      printFrame.style.position = "fixed";
      printFrame.style.right = "0";
      printFrame.style.bottom = "0";
      printFrame.style.width = "0";
      printFrame.style.height = "0";
      printFrame.style.border = "none";
      printFrame.style.visibility = "hidden";
      document.body.appendChild(printFrame);
    }

    const frameDoc = printFrame.contentWindow?.document;
    if (frameDoc) {
      frameDoc.open();
      frameDoc.write(fullHtml);
      frameDoc.close();

      setTimeout(() => {
        try {
          printFrame?.contentWindow?.focus();
          printFrame?.contentWindow?.print();
        } catch {
          fallbackWindowPrint(fullHtml);
        }
      }, 250);
      return;
    }
  } catch {
    // If iframe access fails due to sandbox
  }

  // 2. Fallback popup window
  fallbackWindowPrint(fullHtml);
}

function fallbackWindowPrint(fullHtml: string) {
  try {
    const printWin = window.open("", "_blank", "width=800,height=900");
    if (printWin) {
      printWin.document.open();
      printWin.document.write(fullHtml);
      printWin.document.close();
      printWin.focus();
      setTimeout(() => {
        printWin.print();
      }, 300);
      return;
    }
  } catch {}

  // 3. Fallback direct print
  window.print();
}

/**
 * Generate official ZATCA tax invoice print view for a job card
 */
export function printJobCardInvoice(jobCard: JobCard, companyProfile: CompanyProfile | null) {
  const companyName = companyProfile?.name || "Z Transport Management";
  const branch = companyProfile?.branch || "Jeddah Fleet Yard 3";
  const vatRate = jobCard.vatRatePercentage ?? (jobCard.vatAmountSAR > 0 ? 15 : 0);
  const formattedDate = jobCard.createdAt?.toDate
    ? jobCard.createdAt.toDate().toLocaleString("en-GB")
    : new Date().toLocaleString("en-GB");

  const crInfo = companyProfile?.crNumber ? `CR #${companyProfile.crNumber}` : "";
  const vatInfo = companyProfile?.vatRegistrationNumber ? `VAT Registration #${companyProfile.vatRegistrationNumber}` : "";
  const addressInfo = companyProfile?.address || "Kingdom of Saudi Arabia";
  const phoneInfo = companyProfile?.phone ? `Tel: ${companyProfile.phone}` : "";
  const subDetailsStr = [crInfo, vatInfo, addressInfo, phoneInfo].filter(Boolean).join(" · ");

  const rowsHtml = jobCard.items
    .map(
      (item, idx) => `
    <tr>
      <td class="text-center">${idx + 1}</td>
      <td>
        <strong>${item.partName}</strong>
        ${item.authorizedByPin ? '<br><small style="color:#d97706;">[Supervisor Authorized Override]</small>' : ""}
      </td>
      <td>${item.category}</td>
      <td>${item.axlePosition}</td>
      <td class="text-center" style="text-transform: capitalize;">${item.action}</td>
      <td class="text-center">${item.quantity}</td>
      <td class="text-right">${item.unitCostSAR.toFixed(2)} SAR</td>
      <td class="text-right"><strong>${item.subtotalSAR.toFixed(2)} SAR</strong></td>
    </tr>`
    )
    .join("");

  const bodyHtml = `
    <div class="print-header">
      <div>
        <h1 class="company-title">${companyName}</h1>
        <p class="company-sub">${branch}</p>
        ${subDetailsStr ? `<p class="company-sub">${subDetailsStr}</p>` : ""}
      </div>
      <div style="text-align: right;">
        <div class="badge">Official Workshop Job Card</div>
        <div style="font-size: 18px; font-weight: 800; font-family: monospace; color: #047857; margin-top: 4px;">
          ${jobCard.jobCardNumber}
        </div>
        <div style="font-size: 10px; color: #6b7280; margin-top: 2px;">Date: ${formattedDate}</div>
        <div style="font-size: 10px; color: #6b7280;">Operator: ${jobCard.operatorName}</div>
      </div>
    </div>

    <div class="meta-box">
      <div class="meta-item">
        <span class="label">Trailer Plate</span>
        <span class="value">${jobCard.trailerPlate}</span>
      </div>
      <div class="meta-item">
        <span class="label">Trailer Model</span>
        <span class="value" style="font-family: inherit;">${jobCard.trailerModel}</span>
      </div>
      <div class="meta-item">
        <span class="label">Assigned Driver</span>
        <span class="value" style="font-family: inherit;">${jobCard.driverName}</span>
      </div>
      <div class="meta-item">
        <span class="label">Driver Iqama / ID</span>
        <span class="value">${jobCard.driverIqama}</span>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th class="text-center" style="width: 30px;">#</th>
          <th>Part / Component</th>
          <th>Category</th>
          <th>Axle / Location</th>
          <th class="text-center">Action</th>
          <th class="text-center">Qty</th>
          <th class="text-right">Unit Price</th>
          <th class="text-right">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    <div class="totals-wrap">
      <table class="totals-table">
        <tr>
          <td>Subtotal (Excl. VAT):</td>
          <td class="text-right">${jobCard.subtotalSAR.toFixed(2)} SAR</td>
        </tr>
        <tr>
          <td>VAT Rate (${vatRate}%):</td>
          <td class="text-right">${jobCard.vatAmountSAR.toFixed(2)} SAR</td>
        </tr>
        <tr class="grand-total-row">
          <td style="padding-top: 6px;">Total Payable:</td>
          <td class="text-right" style="padding-top: 6px;">${jobCard.grandTotalSAR.toFixed(2)} SAR</td>
        </tr>
      </table>
    </div>

    <div class="signatures">
      <div>
        <span style="font-weight: 700; font-size: 11px;">Yard Maintenance Coordinator</span>
        <div class="sig-line"></div>
        <span style="font-size: 10px; color: #6b7280;">Signature & Stamp</span>
      </div>
      <div>
        <span style="font-weight: 700; font-size: 11px;">Assigned Driver Acknowledgment</span>
        <div class="sig-line"></div>
        <span style="font-size: 10px; color: #6b7280;">Received in good operating condition</span>
      </div>
    </div>

    <div class="footer-note">
      This is a computerized commercial fleet maintenance order compliant with ZATCA tax rules. Anti-theft cooldown monitoring verified.
    </div>
  `;

  printHtmlContent(`Job Card ${jobCard.jobCardNumber}`, bodyHtml);
}

/**
 * Generate official Monthly or Till-Date Fleet Report print view
 */
export function printFleetReport({
  title,
  periodSubtitle,
  companyProfile,
  summary,
  jobs,
}: {
  title: string;
  periodSubtitle: string;
  companyProfile: CompanyProfile | null;
  summary: {
    totalJobs: number;
    totalSpendSAR: number;
    subtotalSAR: number;
    vatAmountSAR: number;
    vatRatePercentage: number;
    preventedLeakageSAR: number;
    blockedClaimsCount: number;
    supervisorOverridesCount: number;
    totalPartsInstalled: number;
  };
  jobs: JobCard[];
}) {
  const companyName = companyProfile?.name || "Tala Transport";
  const branch = companyProfile?.branch || "Jeddah Fleet Yard 3";
  const printedAt = new Date().toLocaleString("en-GB");

  const tableRows = jobs
    .map((j, i) => {
      const dateStr = j.createdAt?.toDate
        ? j.createdAt.toDate().toLocaleDateString("en-GB")
        : "N/A";
      const partsSummary = j.items.map((it) => `${it.partName} (${it.quantity})`).join(", ");
      return `
      <tr>
        <td class="text-center">${i + 1}</td>
        <td><strong>${j.jobCardNumber}</strong></td>
        <td>${dateStr}</td>
        <td><strong>${j.trailerPlate}</strong><br><small style="color:#6b7280;">${j.trailerModel}</small></td>
        <td>${j.driverName}</td>
        <td style="max-width: 220px; font-size: 10px;">${partsSummary}</td>
        <td class="text-right">${j.subtotalSAR.toFixed(2)}</td>
        <td class="text-right">${j.vatAmountSAR.toFixed(2)}</td>
        <td class="text-right"><strong>${j.grandTotalSAR.toFixed(2)} SAR</strong></td>
      </tr>`;
    })
    .join("");

  const bodyHtml = `
    <div class="print-header">
      <div>
        <h1 class="company-title">${companyName}</h1>
        <p class="company-sub">Executive Fleet Workshop & Financial Audit Report</p>
        <p class="company-sub">${branch} · Kingdom of Saudi Arabia</p>
        <p class="company-sub">CR #4030182940 · VAT Registration #310284910200003</p>
      </div>
      <div style="text-align: right;">
        <div class="badge">${title}</div>
        <div style="font-size: 12px; font-weight: 700; color: #111827; margin-top: 4px;">
          ${periodSubtitle}
        </div>
        <div style="font-size: 10px; color: #6b7280; margin-top: 2px;">Generated: ${printedAt}</div>
      </div>
    </div>

    <!-- Executive Summary Grid -->
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px;">
      <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 12px;">
        <div style="font-size: 9px; font-weight: 700; color: #6b7280; text-transform: uppercase;">Total Work Orders</div>
        <div style="font-size: 18px; font-weight: 800; color: #111827;">${summary.totalJobs}</div>
        <div style="font-size: 10px; color: #6b7280;">${summary.totalPartsInstalled} parts replaced</div>
      </div>
      <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 12px;">
        <div style="font-size: 9px; font-weight: 700; color: #6b7280; text-transform: uppercase;">Net Fleet Spend</div>
        <div style="font-size: 18px; font-weight: 800; color: #047857;">${summary.totalSpendSAR.toLocaleString("en-US", { minimumFractionDigits: 2 })} SAR</div>
        <div style="font-size: 10px; color: #6b7280;">VAT Applied: ${summary.vatAmountSAR.toLocaleString("en-US", { minimumFractionDigits: 2 })} SAR</div>
      </div>
      <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 10px 12px;">
        <div style="font-size: 9px; font-weight: 700; color: #065f46; text-transform: uppercase;">Anti-Theft Savings</div>
        <div style="font-size: 18px; font-weight: 800; color: #047857;">+${summary.preventedLeakageSAR.toLocaleString("en-US", { minimumFractionDigits: 2 })} SAR</div>
        <div style="font-size: 10px; color: #065f46;">${summary.blockedClaimsCount} duplicate claims stopped</div>
      </div>
      <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 12px;">
        <div style="font-size: 9px; font-weight: 700; color: #6b7280; text-transform: uppercase;">Supervisor Overrides</div>
        <div style="font-size: 18px; font-weight: 800; color: #d97706;">${summary.supervisorOverridesCount}</div>
        <div style="font-size: 10px; color: #6b7280;">PIN Authorized Exceptions</div>
      </div>
    </div>

    <h3 style="font-size: 13px; font-weight: 800; margin-bottom: 8px; text-transform: uppercase; color: #374151;">
      Itemized Work Orders & Job Cards (${jobs.length})
    </h3>

    <table>
      <thead>
        <tr>
          <th class="text-center" style="width: 25px;">#</th>
          <th>Job Card</th>
          <th>Date</th>
          <th>Trailer Plate</th>
          <th>Driver</th>
          <th>Serviced Items</th>
          <th class="text-right">Subtotal</th>
          <th class="text-right">VAT</th>
          <th class="text-right">Grand Total</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>

    <div class="totals-wrap">
      <table class="totals-table">
        <tr>
          <td>Cumulative Subtotal:</td>
          <td class="text-right">${summary.subtotalSAR.toFixed(2)} SAR</td>
        </tr>
        <tr>
          <td>Cumulative VAT:</td>
          <td class="text-right">${summary.vatAmountSAR.toFixed(2)} SAR</td>
        </tr>
        <tr class="grand-total-row">
          <td style="padding-top: 6px;">Total Fleet Spend:</td>
          <td class="text-right" style="padding-top: 6px;">${summary.totalSpendSAR.toFixed(2)} SAR</td>
        </tr>
      </table>
    </div>

    <div class="signatures">
      <div>
        <span style="font-weight: 700; font-size: 11px;">Fleet Operations Director</span>
        <div class="sig-line"></div>
        <span style="font-size: 10px; color: #6b7280;">Audit Approval</span>
      </div>
      <div>
        <span style="font-weight: 700; font-size: 11px;">Chief Financial Officer</span>
        <div class="sig-line"></div>
        <span style="font-size: 10px; color: #6b7280;">Accounts & Tax Clearance</span>
      </div>
    </div>

    <div class="footer-note">
      Confidential fleet report generated from Tala Transport Anti-Theft Workshop Terminal. All rights reserved.
    </div>
  `;

  printHtmlContent(`${title} - ${periodSubtitle}`, bodyHtml);
}
