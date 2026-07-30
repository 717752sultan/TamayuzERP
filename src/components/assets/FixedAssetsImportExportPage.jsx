import React, { useEffect, useState } from "react";
import { Download, Save } from "lucide-react";
import { fixedAssetsService } from "../../services/fixedAssets";
import { downloadFixedAssetsTemplate, exportFixedAssetsRegister, parseAssetMaintenanceExcel, parseFixedAssetsExcel, saveAssetMaintenanceRows, saveFixedAssetsRows } from "../../services/fixedAssetsImportExport";

export default function FixedAssetsImportExportPage({ currentCompany }) {
  const companyId = currentCompany?.company_id || "";
  const [assets, setAssets] = useState([]);
  const [rows, setRows] = useState([]);
  const [type, setType] = useState("assets");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const load = async () => setAssets(await fixedAssetsService.loadFixedAssets({ company_id: companyId }));
  useEffect(() => { if (companyId) load().catch((e) => setMessage(e.message)); }, [companyId]);
  const onFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try { setRows(type === "assets" ? await parseFixedAssetsExcel(file, assets) : await parseAssetMaintenanceExcel(file, assets)); setMessage("تم تجهيز المعاينة."); }
    catch (error) { console.error("Fixed assets import error:", error); setMessage("فشل الاستيراد. يرجى مراجعة الملف."); }
    finally { setLoading(false); }
  };
  const save = async () => {
    setLoading(true);
    try {
      const summary = type === "assets" ? await saveFixedAssetsRows(rows, companyId) : await saveAssetMaintenanceRows(rows, companyId);
      await load();
      setMessage(`تم الاستيراد بنجاح. الإجمالي: ${summary.totalRows}، صحيحة: ${summary.validRows}، خاطئة: ${summary.invalidRows}`);
    } catch (error) { console.error("Fixed assets save import error:", error); setMessage("فشل الاستيراد. يرجى مراجعة الملف."); }
    finally { setLoading(false); }
  };
  return (
    <div className="space-y-5" dir="rtl">
      <section className="panel p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-black">استيراد وتصدير الأصول</h1><p className="text-sm text-slate-500">سجل الأصول والصيانة والعهد.</p></div><div className="flex gap-2"><button onClick={downloadFixedAssetsTemplate} className="btn-secondary"><Download size={17} /> قالب Excel</button><button onClick={() => exportFixedAssetsRegister(assets)} className="btn-secondary"><Download size={17} /> تصدير السجل</button></div></div>
        <div className="grid gap-3 md:grid-cols-3"><select value={type} onChange={(e) => { setType(e.target.value); setRows([]); }} className="field"><option value="assets">سجل الأصول</option><option value="maintenance">الصيانة</option></select><input type="file" accept=".xlsx,.xls" onChange={onFile} className="field" /><button disabled={loading || !rows.some((r) => r.valid)} onClick={save} className="btn-primary"><Save size={17} /> حفظ البيانات</button></div>
        {message && <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-sm font-bold text-slate-700">{message}</div>}
      </section>
      <section className="panel overflow-x-auto p-5"><table className="w-full text-sm"><thead><tr>{["#", "الكود", "الاسم", "التاريخ", "التكلفة", "الحالة", "الأخطاء"].map((h) => <th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((r) => <tr key={r.rowNumber} className={r.valid ? "" : "bg-red-50"}><td>{r.rowNumber}</td><td>{r.asset_code}</td><td>{r.asset_name}</td><td>{r.purchase_date || r.maintenance_date}</td><td>{r.purchase_cost || r.cost}</td><td>{r.status}</td><td>{r.errors?.join("، ")}</td></tr>)}</tbody></table></section>
    </div>
  );
}
