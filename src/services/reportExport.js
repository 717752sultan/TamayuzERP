import * as XLSX from "xlsx";
import { APP_BRAND_NAME } from "../constants/branding";

const esc = (value = "") => String(value ?? "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;");

export const downloadBlob = (content, filename, type) => {
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

export const exportWorkbook = (sheets = [], filename = "report.xlsx") => {
  const wb = XLSX.utils.book_new();
  sheets.forEach(({ name, rows }) => {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows || []), String(name || "Sheet").slice(0, 31));
  });
  XLSX.writeFile(wb, filename);
};

export const buildOfficialReportHtml = ({
  title,
  company = {},
  generatedBy = "",
  period = "",
  filters = [],
  summary = [],
  columns = [],
  rows = [],
  logoUrl = "",
}) => {
  const companyName = company.company_name || company.name || APP_BRAND_NAME;
  return `<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8" />
  <style>
  body{font-family:Tahoma,Arial,sans-serif;color:#111827;margin:28px;line-height:1.7}
  .head{display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #7f1d1d;padding-bottom:14px;margin-bottom:16px}
  .logo{width:72px;height:72px;object-fit:contain;border:1px solid #e5e7eb;border-radius:18px}
  h1{margin:0;color:#7f1d1d;font-size:24px}.muted{color:#64748b;font-size:12px}
  .cards{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:16px 0}.card{background:#f8fafc;border:1px solid #e5e7eb;border-radius:14px;padding:10px}
  .card b{display:block;font-size:11px;color:#64748b}.card span{font-size:18px;font-weight:900;color:#111827}
  table{width:100%;border-collapse:collapse;margin-top:12px;font-size:11px}th,td{border:1px solid #e5e7eb;padding:7px;text-align:right}th{background:#f1f5f9;color:#334155}
  .sign{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:36px}.box{border-top:1px solid #94a3b8;padding-top:8px;text-align:center}
  .footer{margin-top:24px;border-top:1px solid #e5e7eb;padding-top:8px;color:#64748b;font-size:11px;text-align:center}
  @media print{button{display:none}.cards{break-inside:avoid}}
  </style></head><body>
  <div class="head"><div>${logoUrl ? `<img class="logo" src="${esc(logoUrl)}" />` : ""}</div><div><h1>${esc(title)}</h1><div class="muted">${esc(companyName)}</div><div class="muted">${esc(period)}</div></div><div class="muted">تاريخ الإصدار: ${new Date().toLocaleString("ar-SA")}<br/>بواسطة: ${esc(generatedBy || "النظام")}</div></div>
  <div class="muted">الفلاتر: ${(filters || []).map((item) => esc(item)).join(" | ") || "بدون فلاتر"}</div>
  <div class="cards">${(summary || []).map((item) => `<div class="card"><b>${esc(item.label)}</b><span>${esc(item.value)}</span></div>`).join("")}</div>
  <table><thead><tr>${columns.map((column) => `<th>${esc(column.label)}</th>`).join("")}</tr></thead><tbody>
  ${(rows || []).map((row) => `<tr>${columns.map((column) => `<td>${esc(row[column.key])}</td>`).join("")}</tr>`).join("") || `<tr><td colspan="${columns.length}">لا توجد بيانات ضمن الفترة المحددة.</td></tr>`}
  </tbody></table>
  <div class="sign"><div class="box">إعداد</div><div class="box">اعتماد</div></div>
  <div class="footer">وثيقة سرية خاصة بالشركة - ${esc(companyName)}</div>
  </body></html>`;
};

export const exportWordHtml = (html, filename = "report.doc") =>
  downloadBlob(`\ufeff${html}`, filename, "application/msword;charset=utf-8");

export const printHtml = (html) => {
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
};
