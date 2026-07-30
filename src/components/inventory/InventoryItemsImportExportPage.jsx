import React, { useEffect, useState } from "react";
import { Download, Save } from "lucide-react";
import { inventoryService } from "../../services/inventory";
import { downloadInventoryItemsTemplate, exportInventoryItems, parseInventoryItemsExcel, saveInventoryItemsImportRows } from "../../services/inventoryItemsImportExport";

export default function InventoryItemsImportExportPage() {
  const [items, setItems] = useState([]);
  const [rows, setRows] = useState([]);
  const [mode, setMode] = useState("skip");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const load = async () => setItems(await inventoryService.loadInventoryItems());
  useEffect(() => { load().catch((error) => setMessage(error.message)); }, []);
  const onFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try { setRows(await parseInventoryItemsExcel(file, items, mode)); setMessage("تم تجهيز المعاينة."); }
    catch (error) { console.error("Inventory items import error:", error); setMessage("فشل الاستيراد. يرجى مراجعة الملف."); }
    finally { setLoading(false); }
  };
  const save = async () => {
    setLoading(true);
    try {
      const summary = await saveInventoryItemsImportRows(rows);
      await load();
      setMessage(`تم الاستيراد بنجاح. الإجمالي: ${summary.totalRows}، صحيحة: ${summary.validRows}، خاطئة: ${summary.invalidRows}`);
    } catch (error) { console.error("Inventory items save import error:", error); setMessage(error.message || "فشل الاستيراد. يرجى مراجعة الملف."); }
    finally { setLoading(false); }
  };
  return (
    <div className="space-y-5" dir="rtl">
      <section className="panel p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-black">استيراد وتصدير الأصناف</h1><p className="text-sm text-slate-500">استيراد البيانات السابقة وتصدير سجل الأصناف الحالي.</p></div><div className="flex gap-2"><button onClick={downloadInventoryItemsTemplate} className="btn-secondary"><Download size={17} /> قالب Excel</button><button onClick={() => exportInventoryItems(items)} className="btn-secondary"><Download size={17} /> تصدير الأصناف</button></div></div>
        <div className="grid gap-3 md:grid-cols-3"><input type="file" accept=".xlsx,.xls" onChange={onFile} className="field" /><select value={mode} onChange={(e) => setMode(e.target.value)} className="field"><option value="skip">منع المكرر</option><option value="update">تحديث المكرر</option></select><button onClick={save} disabled={loading || !rows.some((r) => r.valid)} className="btn-primary"><Save size={17} /> حفظ الأصناف</button></div>
        {message && <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-sm font-bold text-slate-700">{message}</div>}
      </section>
      <section className="panel overflow-x-auto p-5"><table className="w-full text-sm"><thead><tr>{["#", "الكود", "الصنف", "التصنيف", "الوحدة", "سعر الشراء", "الرصيد", "الأخطاء"].map((h) => <th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((r) => <tr key={r.rowNumber} className={r.valid ? "" : "bg-red-50"}><td>{r.rowNumber}</td><td>{r.item_code}</td><td>{r.item_name}</td><td>{r.category}</td><td>{r.unit_type}</td><td>{r.default_unit_cost}</td><td>{r.opening_balance}</td><td>{r.errors?.join("، ")}</td></tr>)}</tbody></table></section>
    </div>
  );
}
