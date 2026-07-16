import React from "react";
import { getReportBranding } from "../../services/reportBranding";

function SafeLogo({ src, fallback }) {
  const [failed, setFailed] = React.useState(false);
  if (!src || failed) {
    return <div className="grid h-14 w-14 place-items-center rounded-2xl border border-slate-200 bg-slate-50 text-xs font-extrabold text-slate-500">{fallback}</div>;
  }
  return <img src={src} alt={fallback} onError={() => setFailed(true)} className="h-14 w-14 rounded-2xl object-contain ring-1 ring-slate-200" />;
}

export default function ReportBrandingLayout({
  title,
  subtitle,
  children,
  currentCompany,
  showProviderLogo = true,
  showCompanyLogo = true,
  reportMeta,
  printedBy,
  printDate,
}) {
  const { provider, company } = getReportBranding({ currentCompany });
  const printedAt = printDate || new Date().toLocaleString("ar-SA");
  return (
    <section className="report-branding-layout" dir="rtl">
      <header className="mb-5 grid gap-4 border-b border-slate-200 pb-4 md:grid-cols-[1fr_1.2fr_1fr]">
        <div className="flex items-center gap-3">
          {showProviderLogo && <SafeLogo src={provider.logoUrl} fallback="ERP" />}
          <div>
            <h2 className="font-extrabold text-brand-800">{provider.reportTitle}</h2>
            <p className="text-xs text-slate-500">{provider.reportSubtitle}</p>
          </div>
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-black text-slate-900">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">{subtitle || provider.description}</p>
          {reportMeta && <p className="mt-1 text-xs text-slate-400">{reportMeta}</p>}
        </div>
        <div className="flex items-center justify-end gap-3">
          <div className="text-left">
            <h2 className="font-extrabold text-slate-900">{company.name || "الشركة المشتركة"}</h2>
            {company.code && <p className="text-xs text-slate-500">{company.code}</p>}
          </div>
          {showCompanyLogo && <SafeLogo src={company.logoUrl} fallback="شعار الشركة" />}
        </div>
      </header>
      {children}
      <footer className="mt-8 border-t border-slate-200 pt-3 text-center text-xs leading-6 text-slate-500">
        <p>{provider.officialName} | {provider.shortName}</p>
        <p>{provider.reportSubtitle}</p>
        <p>الشركة: {company.name || "غير محددة"} — تاريخ الطباعة: {printedAt}{printedBy ? ` — طبع بواسطة: ${printedBy}` : ""}</p>
      </footer>
    </section>
  );
}
