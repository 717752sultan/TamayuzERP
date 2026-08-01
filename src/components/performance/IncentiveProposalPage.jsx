import React, { useEffect, useMemo, useState } from "react";
import { incentiveProposalsService, defaultIncentiveProposal, defaultIncentiveProposalContent } from "../../services/incentiveProposals";

const n = (value) => Number(value || 0) || 0;
const clone = (value) => JSON.parse(JSON.stringify(value || {}));
const safeArray = (value) => Array.isArray(value) ? value : [];
const fontStack = '"Tajawal","Cairo","IBM Plex Sans Arabic","Noto Kufi Arabic","Tahoma","Arial",sans-serif';

const calculateExample = (example = {}) => {
  const total = n(example.totalEligiblePoints);
  return { ...example, calculatedAmount: total ? Number(((n(example.incentivePool) * n(example.employeePoints)) / total).toFixed(2)) : 0 };
};

const escapeHtml = (value = "") => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));

const buildWordHtml = (proposal, companyName = "") => {
  const content = proposal?.content || {};
  const criteria = safeArray(content.criteria);
  const impact = safeArray(content.impact);
  const approvals = safeArray(content.approvals);
  return `<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><style>
    body{direction:rtl;font-family:Tahoma,Arial,sans-serif;color:#172033;line-height:1.9;padding:32px}
    h1{color:#1e1b4b;font-size:30px} h2{color:#312e81;border-bottom:2px solid #c7d2fe;padding-bottom:6px}
    table{width:100%;border-collapse:collapse;margin:12px 0} th,td{border:1px solid #cbd5e1;padding:9px;text-align:right;vertical-align:top}
    th{background:#eef2ff;color:#312e81}.box{background:#f8fafc;border:1px solid #e2e8f0;padding:12px;border-radius:10px;margin:8px 0}
    .bar{height:10px;background:#e2e8f0;border-radius:99px}.bar span{display:block;height:10px;background:#312e81;border-radius:99px}
  </style></head><body>
    <h1>${escapeHtml(proposal.title)}</h1>
    <p><b>${escapeHtml(companyName)}</b></p>
    <p>${escapeHtml(proposal.subtitle)}</p>
    <h2>المقدمة</h2><div class="box">${escapeHtml(content.intro)}</div>
    <h2>الهدف من نظام الحوافز</h2><ul>${safeArray(content.goals).map((x) => `<li>${escapeHtml(x)}</li>`).join("")}</ul>
    <h2>أنواع الحوافز</h2><table><tr><th>النوع</th><th>الوصف</th></tr>${safeArray(content.incentiveTypes).map((x) => `<tr><td>${escapeHtml(x.name)}</td><td>${escapeHtml(x.description)}</td></tr>`).join("")}</table>
    <h2>معايير واستحقاق الحافز</h2><table><tr><th>المعيار</th><th>الوزن %</th><th>مصدر البيانات</th></tr>${criteria.map((x) => `<tr><td>${escapeHtml(x.name)}</td><td>${escapeHtml(x.weight)}</td><td>${escapeHtml(x.source)}</td></tr>`).join("")}</table>
    <h2>آلية ودورة التطبيق</h2><ol>${safeArray(content.cycleSteps).sort((a,b)=>n(a.step)-n(b.step)).map((x) => `<li>${escapeHtml(x.title)}</li>`).join("")}</ol>
    <h2>الضوابط والشروط العامة</h2><ul>${safeArray(content.rules).map((x) => `<li>${escapeHtml(x)}</li>`).join("")}</ul>
    <h2>أثر الحافز</h2><table><tr><th>العنوان</th><th>قبل</th><th>بعد</th><th>الوصف</th></tr>${impact.map((x) => `<tr><td>${escapeHtml(x.title)}</td><td>${escapeHtml(x.before)}%</td><td>${escapeHtml(x.after)}%</td><td>${escapeHtml(x.description)}</td></tr>`).join("")}</table>
    <h2>مثال تجريبي</h2><p>الحافز = إجمالي صندوق الحوافز × نقاط الموظف ÷ إجمالي نقاط المستحقين</p><table><tr><th>صندوق الحوافز</th><th>نقاط الموظف</th><th>إجمالي نقاط المستحقين</th><th>الحافز المحتسب</th></tr><tr><td>${n(content.example?.incentivePool).toLocaleString()}</td><td>${n(content.example?.employeePoints)}</td><td>${n(content.example?.totalEligiblePoints)}</td><td>${n(content.example?.calculatedAmount).toLocaleString()}</td></tr></table>
    <h2>توصية الموارد البشرية</h2><div class="box">${escapeHtml(content.recommendation)}</div>
    <h2>الاعتمادات والتواقيع</h2><table><tr><th>الدور</th><th>الاسم</th><th>التوقيع</th><th>التاريخ</th></tr>${approvals.map((x) => `<tr><td>${escapeHtml(x.role)}</td><td>${escapeHtml(x.name)}</td><td>${escapeHtml(x.signature)}</td><td>${escapeHtml(x.date)}</td></tr>`).join("")}</table>
  </body></html>`;
};

function Button({ children, onClick, type = "button", variant = "primary", disabled = false }) {
  return <button type={type} disabled={disabled} onClick={onClick} className={variant === "primary" ? "btn-primary" : "btn-secondary"}>{children}</button>;
}

function ProposalPreview({ proposal, companyName = "" }) {
  const content = proposal?.content || defaultIncentiveProposalContent;
  const example = calculateExample(content.example || {});
  return (
    <article className="proposal-print rounded-[2rem] bg-slate-50 shadow-2xl" style={{ fontFamily: fontStack }}>
      <header className="rounded-t-[2rem] bg-gradient-to-l from-indigo-950 via-purple-900 to-slate-800 p-8 text-white">
        <small className="text-indigo-100">{companyName}</small>
        <h1 className="mt-3 text-3xl font-black">{proposal?.title}</h1>
        <p className="mt-2 text-indigo-100">{proposal?.subtitle}</p>
      </header>
      <main className="space-y-5 p-6">
        <section className="rounded-3xl border border-indigo-100 bg-white p-5"><h2 className="font-black text-indigo-950">المقدمة</h2><p className="mt-3 leading-8 text-slate-600">{content.intro}</p></section>
        <section className="grid gap-3 md:grid-cols-4">{safeArray(content.goals).map((goal) => <div key={goal} className="rounded-3xl bg-white p-4 font-extrabold text-indigo-950">{goal}</div>)}</section>
        <section className="grid gap-4 md:grid-cols-3">{safeArray(content.incentiveTypes).map((item) => <div key={item.name} className="rounded-3xl border bg-white p-5"><h3 className="font-black text-indigo-900">{item.name}</h3><p className="mt-2 text-sm leading-7 text-slate-600">{item.description}</p></div>)}</section>
        <section className="overflow-x-auto rounded-3xl bg-white p-5"><h2 className="mb-3 font-black text-indigo-950">معايير واستحقاق الحافز</h2><table className="w-full text-sm"><thead><tr><th>المعيار</th><th>الوزن %</th><th>مصدر البيانات</th></tr></thead><tbody>{safeArray(content.criteria).map((row) => <tr key={row.name}><td>{row.name}</td><td>{row.weight}%</td><td>{row.source}</td></tr>)}</tbody></table></section>
        <section className="grid gap-3 md:grid-cols-4">{safeArray(content.cycleSteps).sort((a,b)=>n(a.step)-n(b.step)).map((step) => <div key={`${step.step}-${step.title}`} className="rounded-3xl border-t-4 border-indigo-800 bg-white p-4 font-extrabold">{step.step}. {step.title}</div>)}</section>
        <section className="grid gap-3 md:grid-cols-2">{safeArray(content.rules).map((rule) => <div key={rule} className="rounded-2xl bg-white p-3 text-sm font-bold">✓ {rule}</div>)}</section>
        <section className="grid gap-4 md:grid-cols-3">{safeArray(content.impact).map((item) => <div key={item.title} className="rounded-3xl bg-white p-4"><h3 className="font-black text-indigo-950">{item.title}</h3><div className="mt-3 h-2 rounded-full bg-slate-200"><span className="block h-2 rounded-full bg-indigo-800" style={{ width: `${Math.min(100, n(item.after))}%` }} /></div><p className="mt-2 text-xs text-slate-500">قبل {item.before}% ← بعد {item.after}%</p><p className="mt-2 text-sm leading-7">{item.description}</p></div>)}</section>
        <section className="rounded-3xl bg-indigo-950 p-5 text-center text-white"><p className="font-black">الحافز = إجمالي صندوق الحوافز × نقاط الموظف ÷ إجمالي نقاط المستحقين</p><div className="mt-4 grid gap-3 md:grid-cols-4"><b>{n(example.incentivePool).toLocaleString()}</b><b>{n(example.employeePoints)}</b><b>{n(example.totalEligiblePoints)}</b><b>{n(example.calculatedAmount).toLocaleString()}</b></div></section>
        <section className="rounded-3xl bg-white p-5"><h2 className="font-black text-indigo-950">توصية الموارد البشرية</h2><p className="mt-3 leading-8">{content.recommendation}</p></section>
        <section className="overflow-x-auto rounded-3xl bg-white p-5"><h2 className="mb-3 font-black text-indigo-950">الاعتمادات والتواقيع</h2><table className="w-full text-sm"><thead><tr><th>الدور</th><th>الاسم</th><th>التوقيع</th><th>التاريخ</th></tr></thead><tbody>{safeArray(content.approvals).map((row, index) => <tr key={`${row.role}-${index}`}><td>{row.role}</td><td>{row.name}</td><td>{row.signature}</td><td>{row.date}</td></tr>)}</tbody></table></section>
      </main>
    </article>
  );
}

function TextListEditor({ title, rows = [], onChange }) {
  const update = (index, value) => onChange(rows.map((item, i) => i === index ? value : item));
  return <section className="rounded-3xl bg-white p-5"><h3 className="mb-3 font-black">{title}</h3>{safeArray(rows).map((item, index) => <div key={index} className="mb-2 flex gap-2"><input className="field" value={item} onChange={(e) => update(index, e.target.value)} /><Button variant="secondary" onClick={() => onChange(rows.filter((_, i) => i !== index))}>حذف</Button></div>)}<Button variant="secondary" onClick={() => onChange([...safeArray(rows), ""])}>إضافة</Button></section>;
}

function ProposalEditor({ draft, setDraft }) {
  const c = draft.content || {};
  const setContent = (patch) => setDraft({ ...draft, content: { ...c, ...patch } });
  const updateArray = (key, rows) => setContent({ [key]: rows });
  const updateObjArray = (key, index, patch) => updateArray(key, safeArray(c[key]).map((row, i) => i === index ? { ...row, ...patch } : row));
  const addObj = (key, item) => updateArray(key, [...safeArray(c[key]), item]);
  const removeObj = (key, index) => updateArray(key, safeArray(c[key]).filter((_, i) => i !== index));
  const example = calculateExample(c.example || {});
  return (
    <div className="space-y-5">
      <div className="panel grid gap-3 p-5 md:grid-cols-2">
        <label>عنوان التصور<input className="field mt-1" value={draft.title || ""} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></label>
        <label>العنوان الفرعي<input className="field mt-1" value={draft.subtitle || ""} onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })} /></label>
        <label>الحالة<select className="field mt-1" value={draft.proposal_status || "مسودة"} onChange={(e) => setDraft({ ...draft, proposal_status: e.target.value })}><option>مسودة</option><option>نهائي</option><option>مؤرشف</option></select></label>
        <label>حالة الاعتماد<select className="field mt-1" value={draft.approval_status || "غير معتمد"} onChange={(e) => setDraft({ ...draft, approval_status: e.target.value })}><option>غير معتمد</option><option>قيد المراجعة</option><option>معتمد</option><option>مرفوض</option></select></label>
        <label className="md:col-span-2">ملاحظات<textarea className="field mt-1 !h-24 py-3" value={draft.notes || ""} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} /></label>
      </div>
      <section className="rounded-3xl bg-white p-5"><h3 className="mb-3 font-black">المقدمة</h3><textarea className="field !h-32 py-3" value={c.intro || ""} onChange={(e) => setContent({ intro: e.target.value })} /></section>
      <TextListEditor title="الهدف من نظام الحوافز" rows={c.goals} onChange={(rows) => updateArray("goals", rows)} />
      <section className="rounded-3xl bg-white p-5"><h3 className="mb-3 font-black">أنواع الحوافز</h3>{safeArray(c.incentiveTypes).map((row, i) => <div key={i} className="mb-3 grid gap-2 md:grid-cols-[1fr_2fr_auto]"><input className="field" value={row.name || ""} onChange={(e) => updateObjArray("incentiveTypes", i, { name: e.target.value })} /><input className="field" value={row.description || ""} onChange={(e) => updateObjArray("incentiveTypes", i, { description: e.target.value })} /><Button variant="secondary" onClick={() => removeObj("incentiveTypes", i)}>حذف</Button></div>)}<Button variant="secondary" onClick={() => addObj("incentiveTypes", { name: "", description: "" })}>إضافة نوع</Button></section>
      <section className="rounded-3xl bg-white p-5"><h3 className="mb-3 font-black">معايير واستحقاق الحافز</h3>{safeArray(c.criteria).map((row, i) => <div key={i} className="mb-3 grid gap-2 md:grid-cols-[2fr_1fr_2fr_auto]"><input className="field" value={row.name || ""} onChange={(e) => updateObjArray("criteria", i, { name: e.target.value })} /><input type="number" className="field" value={row.weight || 0} onChange={(e) => updateObjArray("criteria", i, { weight: e.target.valueAsNumber })} /><input className="field" value={row.source || ""} onChange={(e) => updateObjArray("criteria", i, { source: e.target.value })} /><Button variant="secondary" onClick={() => removeObj("criteria", i)}>حذف</Button></div>)}<Button variant="secondary" onClick={() => addObj("criteria", { name: "", weight: 0, source: "" })}>إضافة معيار</Button></section>
      <section className="rounded-3xl bg-white p-5"><h3 className="mb-3 font-black">آلية ودورة التطبيق</h3>{safeArray(c.cycleSteps).map((row, i) => <div key={i} className="mb-3 grid gap-2 md:grid-cols-[1fr_3fr_auto]"><input type="number" className="field" value={row.step || i + 1} onChange={(e) => updateObjArray("cycleSteps", i, { step: e.target.valueAsNumber })} /><input className="field" value={row.title || ""} onChange={(e) => updateObjArray("cycleSteps", i, { title: e.target.value })} /><Button variant="secondary" onClick={() => removeObj("cycleSteps", i)}>حذف</Button></div>)}<Button variant="secondary" onClick={() => addObj("cycleSteps", { step: safeArray(c.cycleSteps).length + 1, title: "" })}>إضافة خطوة</Button></section>
      <TextListEditor title="الضوابط والشروط العامة" rows={c.rules} onChange={(rows) => updateArray("rules", rows)} />
      <section className="rounded-3xl bg-white p-5"><h3 className="mb-3 font-black">أثر الحافز</h3>{safeArray(c.impact).map((row, i) => <div key={i} className="mb-3 grid gap-2 md:grid-cols-[1fr_1fr_1fr_2fr_auto]"><input className="field" value={row.title || ""} onChange={(e) => updateObjArray("impact", i, { title: e.target.value })} /><input type="number" className="field" value={row.before || 0} onChange={(e) => updateObjArray("impact", i, { before: e.target.valueAsNumber })} /><input type="number" className="field" value={row.after || 0} onChange={(e) => updateObjArray("impact", i, { after: e.target.valueAsNumber })} /><input className="field" value={row.description || ""} onChange={(e) => updateObjArray("impact", i, { description: e.target.value })} /><Button variant="secondary" onClick={() => removeObj("impact", i)}>حذف</Button></div>)}<Button variant="secondary" onClick={() => addObj("impact", { title: "", before: 0, after: 0, description: "" })}>إضافة أثر</Button></section>
      <section className="rounded-3xl bg-white p-5"><h3 className="mb-3 font-black">مثال تجريبي لحساب الحافز</h3><div className="grid gap-3 md:grid-cols-4">{["incentivePool", "employeePoints", "totalEligiblePoints"].map((key) => <label key={key}>{key}<input type="number" className="field mt-1" value={example[key] || 0} onChange={(e) => setContent({ example: calculateExample({ ...example, [key]: e.target.valueAsNumber }) })} /></label>)}<label>الحافز المحتسب<input readOnly className="field mt-1 bg-slate-50" value={example.calculatedAmount || 0} /></label></div></section>
      <section className="rounded-3xl bg-white p-5"><h3 className="mb-3 font-black">توصية الموارد البشرية</h3><textarea className="field !h-28 py-3" value={c.recommendation || ""} onChange={(e) => setContent({ recommendation: e.target.value })} /></section>
      <section className="rounded-3xl bg-white p-5"><h3 className="mb-3 font-black">الاعتمادات والتواقيع</h3>{safeArray(c.approvals).map((row, i) => <div key={i} className="mb-3 grid gap-2 md:grid-cols-4"><input className="field" value={row.role || ""} onChange={(e) => updateObjArray("approvals", i, { role: e.target.value })} /><input className="field" value={row.name || ""} onChange={(e) => updateObjArray("approvals", i, { name: e.target.value })} /><input className="field" value={row.signature || ""} onChange={(e) => updateObjArray("approvals", i, { signature: e.target.value })} /><input type="date" className="field" value={row.date || ""} onChange={(e) => updateObjArray("approvals", i, { date: e.target.value })} /></div>)}<Button variant="secondary" onClick={() => addObj("approvals", { role: "", name: "", signature: "", date: "" })}>إضافة اعتماد</Button></section>
    </div>
  );
}

export default function IncentiveProposalPage({ currentCompany, currentUser }) {
  const companyId = currentCompany?.company_id || currentUser?.company_id || "";
  const companyName = currentCompany?.company_name || currentCompany?.name || "";
  const [mode, setMode] = useState("list");
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const selectedProposal = useMemo(() => selected || rows.find((row) => row.is_default) || rows[0] || null, [selected, rows]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await incentiveProposalsService.listIncentiveProposals(companyId);
      setRows(data);
      if (!selected && data.length) setSelected(data.find((row) => row.is_default) || data[0]);
    } catch (error) {
      console.error("Incentive proposals page load error:", error);
      setMessage("تعذر تحميل التصورات.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (companyId) load(); }, [companyId]);

  const newProposal = () => {
    const proposal = { ...defaultIncentiveProposal(), company_id: companyId, created_by: currentUser?.username || "", updated_by: currentUser?.username || "" };
    setDraft(proposal);
    setSelected(proposal);
    setMode("edit");
  };

  const save = async () => {
    try {
      const payload = { ...draft, updated_by: currentUser?.username || "" };
      const saved = payload.proposal_id && rows.some((row) => row.proposal_id === payload.proposal_id)
        ? await incentiveProposalsService.updateIncentiveProposal(companyId, payload.proposal_id, payload)
        : await incentiveProposalsService.createIncentiveProposal(companyId, payload);
      setSelected(saved);
      setDraft(null);
      setMode("preview");
      setMessage("تم حفظ التصور بنجاح.");
      await load();
    } catch (error) {
      console.error("Incentive proposal save error:", error);
      setMessage("تعذر حفظ التصور.");
    }
  };

  const remove = async (proposal) => {
    if (!proposal || !confirm("هل تريد حذف هذا التصور؟")) return;
    try {
      await incentiveProposalsService.deleteIncentiveProposal(companyId, proposal.proposal_id);
      setSelected(null);
      setMode("list");
      await load();
    } catch (error) {
      console.error("Incentive proposal delete error:", error);
      setMessage("تعذر حذف التصور.");
    }
  };

  const duplicate = async (proposal) => {
    try {
      const copy = await incentiveProposalsService.duplicateIncentiveProposal(companyId, proposal.proposal_id);
      setSelected(copy);
      setMode("preview");
      await load();
    } catch (error) {
      console.error("Incentive proposal duplicate error:", error);
      setMessage("تعذر نسخ التصور.");
    }
  };

  const setDefault = async (proposal) => {
    try {
      await incentiveProposalsService.setDefaultIncentiveProposal(companyId, proposal.proposal_id);
      setMessage("تم تعيين التصور كافتراضي.");
      await load();
    } catch (error) {
      console.error("Incentive proposal default error:", error);
      setMessage("تعذر تعيين التصور كافتراضي.");
    }
  };

  const print = () => window.print();
  const exportWord = () => {
    try {
      const html = buildWordHtml(selectedProposal, companyName);
      const blob = new Blob(["\ufeff", html], { type: "application/msword;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "تصور_نظام_التقييم_والحوافز.doc";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Incentive proposal Word export error:", error);
      setMessage("تعذر تصدير Word.");
    }
  };
  const copySummary = () => navigator.clipboard?.writeText(selectedProposal?.content?.intro || "").then(() => setMessage("تم نسخ الملخص التنفيذي.")).catch((error) => { console.error("copy summary error:", error); setMessage("تعذر نسخ الملخص."); });

  return (
    <div dir="rtl" className="space-y-5" style={{ fontFamily: fontStack }}>
      <style>{`@media print{body *{visibility:hidden}.proposal-print,.proposal-print *{visibility:visible}.proposal-print{position:absolute;inset:0;width:100%;box-shadow:none!important}.no-print{display:none!important}}`}</style>
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-black">تصور نظام الحوافز</h1><p className="text-sm text-slate-500">إدارة التصورات وإعدادها للطباعة والاعتماد.</p></div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={newProposal}>تصور جديد</Button>
          {selectedProposal && mode !== "edit" && <Button variant="secondary" onClick={() => { setDraft(clone(selectedProposal)); setMode("edit"); }}>تعديل التصور</Button>}
          {mode === "edit" && <><Button onClick={save}>حفظ التعديل</Button><Button variant="secondary" onClick={() => { setDraft(null); setMode(selectedProposal ? "preview" : "list"); }}>إلغاء</Button><Button variant="secondary" onClick={() => setDraft({ ...draft, content: clone(defaultIncentiveProposalContent) })}>استعادة النص الافتراضي</Button></>}
          {selectedProposal && <><Button variant="secondary" onClick={() => duplicate(selectedProposal)}>نسخ التصور</Button><Button variant="secondary" onClick={() => setDefault(selectedProposal)}>تعيين كافتراضي</Button><Button variant="secondary" onClick={() => remove(selectedProposal)}>حذف</Button><Button variant="secondary" onClick={() => setMode("preview")}>معاينة قبل الطباعة</Button><Button variant="secondary" onClick={print}>طباعة</Button><Button variant="secondary" onClick={exportWord}>تصدير Word</Button><Button variant="secondary" onClick={copySummary}>نسخ الملخص التنفيذي</Button></>}
        </div>
      </div>
      {message && <div className="no-print rounded-2xl bg-slate-100 p-3 text-sm font-bold">{message}</div>}
      {loading && <div className="panel p-8 text-center font-bold">جاري تحميل التصورات...</div>}
      {mode === "list" && !loading && <div className="panel overflow-x-auto p-4">{rows.length ? <table className="w-full text-sm"><thead><tr><th>عنوان التصور</th><th>الحالة</th><th>حالة الاعتماد</th><th>النسخة</th><th>الافتراضي</th><th>آخر تحديث</th><th>إجراء</th></tr></thead><tbody>{rows.map((row) => <tr key={row.proposal_id}><td>{row.title}</td><td>{row.proposal_status}</td><td>{row.approval_status}</td><td>{row.version_no}</td><td>{row.is_default ? "نعم" : "لا"}</td><td>{row.updated_at || "—"}</td><td className="space-x-2 space-x-reverse"><button className="text-indigo-700 font-bold" onClick={() => { setSelected(row); setMode("preview"); }}>عرض</button><button className="text-blue-700 font-bold" onClick={() => { setSelected(row); setDraft(clone(row)); setMode("edit"); }}>تعديل</button><button className="text-emerald-700 font-bold" onClick={() => duplicate(row)}>نسخ</button><button className="text-red-700 font-bold" onClick={() => remove(row)}>حذف</button><button className="text-slate-700 font-bold" onClick={() => setDefault(row)}>تعيين كافتراضي</button></td></tr>)}</tbody></table> : <div className="py-12 text-center"><p className="mb-4 text-slate-400">لا توجد تصورات محفوظة بعد</p><Button onClick={newProposal}>إنشاء تصور افتراضي</Button></div>}</div>}
      {mode === "edit" && draft && <ProposalEditor draft={draft} setDraft={setDraft} />}
      {mode === "preview" && selectedProposal && <ProposalPreview proposal={selectedProposal} companyName={companyName} />}
    </div>
  );
}
