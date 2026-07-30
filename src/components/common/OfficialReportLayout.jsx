import React from "react";
import { APP_BRAND_NAME } from "../../constants/branding";

export default function OfficialReportLayout({ title, company = {}, period = "", generatedBy = "", filters = [], summary = [], children }) {
  const companyName = company.company_name || company.name || APP_BRAND_NAME;
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm" dir="rtl">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-4 border-b-4 border-brand-800 pb-4">
        <div className="flex items-center gap-3">
          {company.logo_url ? <img src={company.logo_url} alt={companyName} className="h-16 w-16 rounded-2xl border object-contain" /> : <div className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-50 text-xl font-black text-brand-800">ت</div>}
          <div>
            <h2 className="text-2xl font-black text-brand-900">{title}</h2>
            <p className="text-sm font-bold text-slate-500">{companyName}</p>
            {period && <p className="text-xs text-slate-500">{period}</p>}
          </div>
        </div>
        <div className="text-left text-xs font-bold text-slate-500">
          <p>تاريخ الإصدار: {new Date().toLocaleString("ar-SA")}</p>
          <p>بواسطة: {generatedBy || "النظام"}</p>
        </div>
      </header>
      <div className="mb-4 rounded-2xl bg-slate-50 p-3 text-xs font-bold text-slate-600">الفلاتر: {filters.length ? filters.join(" | ") : "بدون فلاتر"}</div>
      {summary.length > 0 && <div className="mb-5 grid gap-3 md:grid-cols-4">{summary.map((item) => <div key={item.label} className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold text-slate-500">{item.label}</p><b className="mt-1 block text-xl text-slate-900">{item.value}</b></div>)}</div>}
      {children}
      <footer className="mt-8 grid gap-8 border-t pt-6 text-center text-sm font-bold text-slate-500 md:grid-cols-2">
        <div className="border-t pt-2">إعداد</div>
        <div className="border-t pt-2">اعتماد</div>
      </footer>
    </section>
  );
}
