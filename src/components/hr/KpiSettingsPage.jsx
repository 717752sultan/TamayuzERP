import { useEffect, useState } from "react";
import {
  disableKpiCriterionType,
  disableKpiEvaluationMethod,
  kpiSourceTypes,
  loadKpiCriterionTypes,
  loadKpiEvaluationMethods,
  saveKpiCriterionType,
  saveKpiEvaluationMethod,
  seedDefaultKpiSettings,
} from "../../services/kpiSettings";

const emptyType = { type_name: "", type_key: "", description: "", sort_order: 0, is_active: true };
const emptyMethod = { method_name: "", method_key: "", source_type: "manual", description: "", sort_order: 0, is_active: true };
const disabledMessage = "لا يمكن حذف هذا العنصر لأنه قد يكون مستخدمًا، تم تعطيله بدلًا من الحذف.";

function Field({ label, children }) {
  return <label className="text-sm font-bold text-slate-700">{label}{children}</label>;
}

function Status({ active }) {
  return <span className={`rounded-full px-3 py-1 text-xs font-bold ${active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{active ? "نشط" : "معطل"}</span>;
}

export default function KpiSettingsPage({ currentCompany, can }) {
  const companyId = currentCompany?.company_id || "";
  const [tab, setTab] = useState("types");
  const [types, setTypes] = useState([]);
  const [methods, setMethods] = useState([]);
  const [typeForm, setTypeForm] = useState(emptyType);
  const [methodForm, setMethodForm] = useState(emptyMethod);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const canEdit = can?.("kpi_settings", "can_edit") !== false;

  const load = async () => {
    if (!companyId) return;
    setLoading(true);
    setError("");
    try {
      const [typeRows, methodRows] = await Promise.all([
        loadKpiCriterionTypes(companyId),
        loadKpiEvaluationMethods(companyId),
      ]);
      setTypes(typeRows || []);
      setMethods(methodRows || []);
    } catch (loadError) {
      console.error("KPI settings page load error:", loadError);
      setError("تعذر تحميل إعدادات KPI. تأكد من تطبيق ملف migration المعلّق.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [companyId]);

  const saveType = async (event) => {
    event.preventDefault();
    if (!String(typeForm.type_name || "").trim()) return setError("اسم النوع مطلوب.");
    setSaving(true);
    setError("");
    try {
      await saveKpiCriterionType({ ...typeForm, company_id: companyId });
      setTypeForm(emptyType);
      setMessage("تم حفظ نوع المعيار بنجاح.");
      await load();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  const saveMethod = async (event) => {
    event.preventDefault();
    if (!String(methodForm.method_name || "").trim()) return setError("اسم طريقة التقييم مطلوب.");
    setSaving(true);
    setError("");
    try {
      await saveKpiEvaluationMethod({ ...methodForm, company_id: companyId });
      setMethodForm(emptyMethod);
      setMessage("تم حفظ طريقة التقييم بنجاح.");
      await load();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  const disableType = async (row) => {
    if (!canEdit) return;
    try {
      await disableKpiCriterionType(companyId, row.type_id);
      setMessage(disabledMessage);
      await load();
    } catch (disableError) {
      setError(disableError.message);
    }
  };

  const disableMethod = async (row) => {
    if (!canEdit) return;
    try {
      await disableKpiEvaluationMethod(companyId, row.method_id);
      setMessage(disabledMessage);
      await load();
    } catch (disableError) {
      setError(disableError.message);
    }
  };

  const seed = async () => {
    try {
      setLoading(true);
      await seedDefaultKpiSettings(companyId);
      setMessage("تمت إضافة إعدادات KPI الافتراضية للشركة.");
      await load();
    } catch (seedError) {
      setError(seedError.message);
      setLoading(false);
    }
  };

  const TypeTable = () => <div className="table-wrap"><table><thead><tr><th>اسم النوع</th><th>المفتاح</th><th>الوصف</th><th>الترتيب</th><th>الحالة</th><th>الإجراءات</th></tr></thead><tbody>{types.map((row) => <tr key={row.type_id}><td>{row.type_name}</td><td dir="ltr">{row.type_key}</td><td>{row.description}</td><td>{row.sort_order}</td><td><Status active={row.is_active !== false} /></td><td><button disabled={!canEdit} onClick={() => setTypeForm(row)} className="text-blue-700">تعديل</button>{row.is_active !== false && <button disabled={!canEdit} onClick={() => disableType(row)} className="mr-3 text-red-700">تعطيل</button>}</td></tr>)}</tbody></table></div>;
  const MethodTable = () => <div className="table-wrap"><table><thead><tr><th>اسم الطريقة</th><th>المفتاح</th><th>مصدر البيانات</th><th>الوصف</th><th>الترتيب</th><th>الحالة</th><th>الإجراءات</th></tr></thead><tbody>{methods.map((row) => <tr key={row.method_id}><td>{row.method_name}</td><td dir="ltr">{row.method_key}</td><td>{kpiSourceTypes.find(([key]) => key === row.source_type)?.[1] || row.source_type}</td><td>{row.description}</td><td>{row.sort_order}</td><td><Status active={row.is_active !== false} /></td><td><button disabled={!canEdit} onClick={() => setMethodForm(row)} className="text-blue-700">تعديل</button>{row.is_active !== false && <button disabled={!canEdit} onClick={() => disableMethod(row)} className="mr-3 text-red-700">تعطيل</button>}</td></tr>)}</tbody></table></div>;

  return (
    <div className="space-y-5" dir="rtl">
      <div className="panel flex flex-wrap items-center gap-3 p-5"><div><h2 className="text-2xl font-extrabold">إعدادات KPI</h2><p className="mt-1 text-sm text-slate-500">إدارة أنواع المعايير وطرق التقييم الخاصة بالشركة الحالية.</p></div><button disabled={!canEdit || loading} onClick={seed} className="btn-secondary mr-auto">إضافة القيم الافتراضية</button></div>
      <div className="panel flex gap-2 p-3"><button onClick={() => setTab("types")} className={tab === "types" ? "btn-primary" : "btn-secondary"}>أنواع المعايير</button><button onClick={() => setTab("methods")} className={tab === "methods" ? "btn-primary" : "btn-secondary"}>طرق التقييم</button></div>
      {message && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-700">{message}</div>}
      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">{error}</div>}
      {tab === "types" ? <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]"><div className="panel p-4"><TypeTable />{!loading && !types.length && <p className="p-5 text-center text-sm text-slate-500">لا توجد أنواع معايير بعد.</p>}</div><form onSubmit={saveType} className="panel space-y-4 p-5"><h3 className="text-lg font-extrabold">{typeForm.type_id ? "تعديل نوع المعيار" : "إضافة نوع معيار"}</h3><Field label="اسم النوع"><input value={typeForm.type_name} onChange={(e) => setTypeForm({ ...typeForm, type_name: e.target.value })} className="field mt-2" required /></Field><Field label="المفتاح"><input value={typeForm.type_key} onChange={(e) => setTypeForm({ ...typeForm, type_key: e.target.value })} className="field mt-2" dir="ltr" /></Field><Field label="الوصف"><textarea value={typeForm.description || ""} onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })} className="field mt-2 !h-auto py-3" /></Field><Field label="الترتيب"><input type="number" value={typeForm.sort_order || 0} onChange={(e) => setTypeForm({ ...typeForm, sort_order: e.target.value })} className="field mt-2" /></Field><Field label="الحالة"><select value={String(typeForm.is_active !== false)} onChange={(e) => setTypeForm({ ...typeForm, is_active: e.target.value === "true" })} className="field mt-2"><option value="true">نشط</option><option value="false">معطل</option></select></Field><div className="flex gap-2"><button disabled={!canEdit || saving} className="btn-primary">حفظ</button><button type="button" onClick={() => setTypeForm(emptyType)} className="btn-secondary">جديد</button></div></form></div> : <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]"><div className="panel p-4"><MethodTable />{!loading && !methods.length && <p className="p-5 text-center text-sm text-slate-500">لا توجد طرق تقييم بعد.</p>}</div><form onSubmit={saveMethod} className="panel space-y-4 p-5"><h3 className="text-lg font-extrabold">{methodForm.method_id ? "تعديل طريقة التقييم" : "إضافة طريقة تقييم"}</h3><Field label="اسم الطريقة"><input value={methodForm.method_name} onChange={(e) => setMethodForm({ ...methodForm, method_name: e.target.value })} className="field mt-2" required /></Field><Field label="المفتاح"><input value={methodForm.method_key} onChange={(e) => setMethodForm({ ...methodForm, method_key: e.target.value })} className="field mt-2" dir="ltr" /></Field><Field label="مصدر البيانات"><select value={methodForm.source_type} onChange={(e) => setMethodForm({ ...methodForm, source_type: e.target.value })} className="field mt-2">{kpiSourceTypes.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></Field><Field label="الوصف"><textarea value={methodForm.description || ""} onChange={(e) => setMethodForm({ ...methodForm, description: e.target.value })} className="field mt-2 !h-auto py-3" /></Field><Field label="الترتيب"><input type="number" value={methodForm.sort_order || 0} onChange={(e) => setMethodForm({ ...methodForm, sort_order: e.target.value })} className="field mt-2" /></Field><Field label="الحالة"><select value={String(methodForm.is_active !== false)} onChange={(e) => setMethodForm({ ...methodForm, is_active: e.target.value === "true" })} className="field mt-2"><option value="true">نشط</option><option value="false">معطل</option></select></Field><div className="flex gap-2"><button disabled={!canEdit || saving} className="btn-primary">حفظ</button><button type="button" onClick={() => setMethodForm(emptyMethod)} className="btn-secondary">جديد</button></div></form></div>}
    </div>
  );
}
