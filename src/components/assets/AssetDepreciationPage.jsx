import React, { useEffect, useMemo, useState } from "react";
import { Download, RefreshCw } from "lucide-react";
import { fixedAssetsService } from "../../services/fixedAssets";
import { assetDepreciationMethods, buildDepreciationSchedule } from "../../services/assetDepreciation";
import { exportDepreciationSchedule } from "../../services/fixedAssetsImportExport";

export default function AssetDepreciationPage({ currentCompany }) {
  const companyId = currentCompany?.company_id || "";
  const [assets, setAssets] = useState([]);
  const [assetId, setAssetId] = useState("");
  const [options, setOptions] = useState({ depreciation_method: "القسط الثابت", useful_life_months: 60, salvage_value: 0, total_production_units: 0, monthly_production_units: 0 });
  const selected = useMemo(() => assets.find((asset) => asset.asset_id === assetId) || {}, [assets, assetId]);
  const schedule = useMemo(() => buildDepreciationSchedule(selected, options), [selected, options]);
  useEffect(() => { if (companyId) fixedAssetsService.loadFixedAssets({ company_id: companyId }).then(setAssets).catch(() => setAssets([])); }, [companyId]);
  return (
    <div className="space-y-5" dir="rtl">
      <section className="panel p-5">
        <div className="mb-4 flex items-center justify-between"><div><h1 className="text-2xl font-black">الإهلاك</h1><p className="text-sm text-slate-500">احتساب جدول الإهلاك الشهري والسنوي والقيمة الدفترية.</p></div><button onClick={() => exportDepreciationSchedule(selected, options)} disabled={!assetId} className="btn-secondary"><Download size={17} /> تصدير الجدول</button></div>
        <div className="grid gap-3 md:grid-cols-4">
          <select value={assetId} onChange={(e) => setAssetId(e.target.value)} className="field"><option value="">اختر الأصل</option>{assets.map((asset) => <option key={asset.asset_id} value={asset.asset_id}>{asset.asset_code} - {asset.asset_name}</option>)}</select>
          <select value={options.depreciation_method} onChange={(e) => setOptions({ ...options, depreciation_method: e.target.value })} className="field">{assetDepreciationMethods.map((m) => <option key={m}>{m}</option>)}</select>
          <input type="number" value={options.useful_life_months} onChange={(e) => setOptions({ ...options, useful_life_months: e.target.value })} className="field" placeholder="العمر بالأشهر" />
          <input type="number" value={options.salvage_value} onChange={(e) => setOptions({ ...options, salvage_value: e.target.value })} className="field" placeholder="القيمة التخريدية" />
          <input type="date" value={options.depreciation_start_date || selected.purchase_date || ""} onChange={(e) => setOptions({ ...options, depreciation_start_date: e.target.value })} className="field" />
          {options.depreciation_method === "وحدات الإنتاج" && <input type="number" value={options.total_production_units} onChange={(e) => setOptions({ ...options, total_production_units: e.target.value })} className="field" placeholder="إجمالي وحدات الإنتاج" />}
          {options.depreciation_method === "وحدات الإنتاج" && <input type="number" value={options.monthly_production_units} onChange={(e) => setOptions({ ...options, monthly_production_units: e.target.value })} className="field" placeholder="وحدات الشهر" />}
          <button onClick={() => setOptions({ ...options })} className="btn-primary"><RefreshCw size={17} /> احتساب</button>
        </div>
      </section>
      <section className="panel overflow-x-auto p-5"><table className="w-full text-sm"><thead><tr>{["الشهر", "إهلاك شهري", "إهلاك سنوي", "مجمع الإهلاك", "القيمة الدفترية", "الطريقة"].map((h) => <th key={h}>{h}</th>)}</tr></thead><tbody>{schedule.map((r) => <tr key={r.period}><td>{r.period}</td><td>{r.monthly_depreciation}</td><td>{r.annual_depreciation}</td><td>{r.accumulated_depreciation}</td><td>{r.book_value}</td><td>{r.method}</td></tr>)}</tbody></table></section>
    </div>
  );
}
