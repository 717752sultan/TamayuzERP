import React, { useEffect, useState } from "react";
import { performanceTargetsService as api } from "../../services/performanceTargets";

const defaultForm = {
  period_month: new Date().getMonth() + 1,
  period_year: new Date().getFullYear(),
  target_count: "",
  minimum_count: "",
  excellent_count: "",
  target_weight: "100",
  is_active: true,
  employee_selection: "",
};

function Field({ fieldKey, label, type = "text", form, setForm }) {
  return (
    <label className="text-sm font-bold">
      {label}
      <input
        className="field mt-1"
        type={type}
        value={form?.[fieldKey] ?? ""}
        onChange={(event) => {
          const value = event.target.value;
          setForm((previous) => ({ ...previous, [fieldKey]: value }));
        }}
      />
    </label>
  );
}

const EDIT_FIELDS=[["period_month","\u0627\u0644\u0634\u0647\u0631","number"],["period_year","\u0627\u0644\u0633\u0646\u0629","number"],["employee_id","\u0627\u0644\u0645\u0648\u0638\u0641","employee"],["operation_type","\u0646\u0648\u0639 \u0627\u0644\u0639\u0645\u0644\u064a\u0629","operation"],["service_channel","\u0627\u0644\u0642\u0646\u0627\u0629","text"],["target_count","\u0627\u0644\u0645\u0633\u062a\u0647\u062f\u0641","number"],["minimum_count","\u0627\u0644\u062d\u062f \u0627\u0644\u0623\u062f\u0646\u0649","number"],["excellent_count","\u0627\u0644\u0645\u0645\u062a\u0627\u0632","number"],["target_weight","\u0627\u0644\u0648\u0632\u0646","number"],["is_active","\u0627\u0644\u062d\u0627\u0644\u0629 / \u0645\u0641\u0639\u0644","boolean"],["notes","\u0645\u0644\u0627\u062d\u0638\u0627\u062a","text"]];
function TargetEditDialog({bulk=false,draft={},setDraft,enabled={},setEnabled,employees=[],operationTypes=[],onSave,onClose,saving=false}){const fields=bulk?EDIT_FIELDS.filter(([key])=>key!=="employee_id"):EDIT_FIELDS;return <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><div className="panel max-h-[90vh] w-full max-w-4xl overflow-y-auto p-6" dir="rtl"><div className="mb-5 flex items-center"><h3 className="text-xl font-black">{bulk?"\u062a\u0639\u062f\u064a\u0644 \u062c\u0645\u0627\u0639\u064a":"\u062a\u0639\u062f\u064a\u0644 \u0647\u062f\u0641 \u0627\u0644\u0645\u0648\u0638\u0641"}</h3><button type="button" onClick={onClose} className="mr-auto">X</button></div><div className="grid gap-4 md:grid-cols-3">{fields.map(([key,label,type])=><label key={key} className="text-sm font-bold">{bulk&&<span className="mb-2 flex gap-2"><input type="checkbox" checked={Boolean(enabled[key])} onChange={e=>setEnabled(prev=>({...prev,[key]:e.target.checked}))}/>{"\u062a\u062d\u062f\u064a\u062b \u0647\u0630\u0627 \u0627\u0644\u062d\u0642\u0644"}</span>}{label}{type==="employee"?<select className="field mt-1" value={draft[key]??""} onChange={e=>setDraft(prev=>({...prev,[key]:e.target.value}))}>{employees.map(x=><option key={x.id} value={x.id}>{x.name} - {x.branch}</option>)}</select>:type==="operation"?<select disabled={bulk&&!enabled[key]} className="field mt-1" value={draft[key]??""} onChange={e=>setDraft(prev=>({...prev,[key]:e.target.value}))}><option value="">--</option>{operationTypes.map(x=><option key={x} value={x}>{x}</option>)}</select>:type==="boolean"?<select disabled={bulk&&!enabled[key]} className="field mt-1" value={String(draft[key]??true)} onChange={e=>setDraft(prev=>({...prev,[key]:e.target.value==="true"}))}><option value="true">{"\u0645\u0641\u0639\u0644"}</option><option value="false">{"\u063a\u064a\u0631 \u0645\u0641\u0639\u0644"}</option></select>:<input disabled={bulk&&!enabled[key]} className="field mt-1" type={type} value={draft[key]??""} onChange={e=>setDraft(prev=>({...prev,[key]:e.target.value}))}/>}</label>)}</div><div className="mt-6 flex gap-3"><button type="button" disabled={saving} onClick={onSave} className="btn-primary">{saving?"\u062c\u0627\u0631\u064a \u0627\u0644\u062d\u0641\u0638...":bulk?"\u062a\u0637\u0628\u064a\u0642 \u0627\u0644\u062a\u0639\u062f\u064a\u0644 \u0627\u0644\u062c\u0645\u0627\u0639\u064a":"\u062d\u0641\u0638 \u0627\u0644\u062a\u0639\u062f\u064a\u0644"}</button><button type="button" onClick={onClose} className="btn-secondary">{"\u0625\u0644\u063a\u0627\u0621"}</button></div></div></div>}

function TargetsPage({ kind, employees = [], currentCompany }) {
  const isEmployee = kind === "employee";
  const companyId = currentCompany?.company_id || currentCompany?.id || "";
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(defaultForm);
  const [message, setMessage] = useState("");
  const [selectionData, setSelectionData] = useState({ employees: [], branches: [], options: [] });
  const [operationTypes, setOperationTypes] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [editDraft, setEditDraft] = useState(null);
  const [bulkDraft, setBulkDraft] = useState(null);
  const [bulkEnabled, setBulkEnabled] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);

  const load = () => {
    if (!companyId) return;
    const request = isEmployee ? api.loadEmployeeTargets(companyId) : api.loadBranchTargets(companyId);
    request
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch((error) => {
        console.error("Performance targets page load error:", error);
        setRows([]);
        setMessage("تعذر تحميل البيانات، يرجى مراجعة الإعدادات أو الاتصال.");
      });
  };

  useEffect(load, [companyId, kind]);

  useEffect(() => {
    let active = true;
    if (!companyId) return undefined;
    Promise.all([api.getEmployeeTargetSelectionOptions(companyId), api.getOperationTypeOptions(companyId)])
      .then(([employeeData, types]) => { if (active) { setSelectionData(employeeData || { employees: [], branches: [], options: [] }); setOperationTypes(Array.isArray(types) ? types : []); } })
      .catch((error) => { console.error("Performance targets selectors load error:", error); if (active) setMessage("\u062a\u0639\u0630\u0631 \u062a\u062d\u0645\u064a\u0644 \u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0645\u0648\u0638\u0641\u064a\u0646 \u0623\u0648 \u0623\u0646\u0648\u0627\u0639 \u0627\u0644\u0639\u0645\u0644\u064a\u0627\u062a."); });
  return () => { active = false; };
  }, [companyId]);

  const toggleSelected=id=>setSelectedIds(prev=>prev.includes(id)?prev.filter(x=>x!==id):[...prev,id]);
  const saveIndividualEdit=async()=>{if(!editDraft?.target_id)return;try{setSavingEdit(true);const employee=(selectionData.employees||[]).find(x=>String(x.id)===String(editDraft.employee_id));await api.updateEmployeeTarget(companyId,editDraft.target_id,{...editDraft,employee_name:employee?.name||editDraft.employee_name,branch:employee?.branch||editDraft.branch,department:employee?.department||editDraft.department,job_title:employee?.job_title||employee?.job||editDraft.job_title});setMessage("\u062a\u0645 \u062a\u0639\u062f\u064a\u0644 \u0627\u0644\u0647\u062f\u0641 \u0628\u0646\u062c\u0627\u062d");setEditDraft(null);load()}catch(error){console.error("Employee target update error:",error);setMessage("\u062a\u0639\u0630\u0631 \u062a\u0639\u062f\u064a\u0644 \u0627\u0644\u0647\u062f\u0641\u060c \u064a\u0631\u062c\u0649 \u0627\u0644\u0645\u062d\u0627\u0648\u0644\u0629 \u0645\u0631\u0629 \u0623\u062e\u0631\u0649")}finally{setSavingEdit(false)}};
  const saveBulkEdit=async()=>{const patch=Object.fromEntries(Object.keys(bulkEnabled).filter(k=>bulkEnabled[k]).map(k=>[k,bulkDraft?.[k]]));if(!selectedIds.length||!Object.keys(patch).length)return;try{setSavingEdit(true);const result=await api.updateEmployeeTargetsBulk(companyId,selectedIds,patch);setMessage(`\u062a\u0645 \u062a\u0639\u062f\u064a\u0644 ${result.updatedCount} \u0633\u062c\u0644 \u0628\u0646\u062c\u0627\u062d`);setSelectedIds([]);setBulkDraft(null);setBulkEnabled({});load()}catch(error){console.error("Employee targets bulk update error:",error);setMessage("\u062a\u0639\u0630\u0631 \u062a\u0639\u062f\u064a\u0644 \u0627\u0644\u0633\u062c\u0644\u0627\u062a \u0627\u0644\u0645\u062d\u062f\u062f\u0629")}finally{setSavingEdit(false)}};
  const deleteSelected=async()=>{if(!selectedIds.length||!window.confirm(`\u0647\u0644 \u0623\u0646\u062a \u0645\u062a\u0623\u0643\u062f \u0645\u0646 \u062d\u0630\u0641 \u0627\u0644\u0633\u062c\u0644\u0627\u062a \u0627\u0644\u0645\u062d\u062f\u062f\u0629\u061f \u0639\u062f\u062f \u0627\u0644\u0633\u062c\u0644\u0627\u062a: ${selectedIds.length}`))return;try{const result=await api.deleteEmployeeTargetsBulk(companyId,selectedIds);setMessage(`\u062a\u0645 \u062d\u0630\u0641 ${result.deletedCount} \u0633\u062c\u0644 \u0628\u0646\u062c\u0627\u062d`);setSelectedIds([]);load()}catch(error){console.error("Employee targets bulk delete error:",error);setMessage("\u062a\u0639\u0630\u0631 \u062d\u0630\u0641 \u0627\u0644\u0633\u062c\u0644\u0627\u062a \u0627\u0644\u0645\u062d\u062f\u062f\u0629")}};



  const save = async () => {
    try {
      if (isEmployee && !form.employee_selection) throw new Error("\u0627\u0644\u0645\u0648\u0638\u0641 \u0623\u0648 \u0627\u0644\u0645\u062c\u0645\u0648\u0639\u0629 \u0645\u0637\u0644\u0648\u0628\u0629");
      if (!isEmployee && !form.branch) throw new Error("\u0627\u0644\u0641\u0631\u0639 \u0645\u0637\u0644\u0648\u0628");
      if (isEmployee) { const result = await api.saveEmployeeTargetsBulk(companyId, form.employee_selection, form); setMessage(result.message); if (!result.success) return; }
      else { await api.saveBranchTarget({ ...form, company_id: companyId }); setMessage("\u062a\u0645 \u0627\u0644\u062d\u0641\u0638 \u0628\u0646\u062c\u0627\u062d."); }
      setForm({ ...defaultForm });
      load();
    } catch (error) { console.error("Performance target save error:", error); setMessage(error.message || "\u062a\u0639\u0630\u0631 \u062d\u0641\u0638 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a."); }
  };

  const remove = async (row) => {
    try {
      await (isEmployee ? api.deleteEmployeeTarget(row.target_id, companyId) : api.deleteBranchTarget(row.branch_target_id, companyId));
      load();
    } catch (error) {
      console.error("Performance target delete error:", error);
      setMessage(error.message || "تعذر حذف البيانات.");
    }
  };


  return (
    <div className="space-y-5" dir="rtl">
      <div>
        <h1 className="text-2xl font-black">{isEmployee ? "أهداف الشهر" : "أهداف الفروع"}</h1>
        {isEmployee && <p className="text-sm text-slate-500">{new Set(rows.map((row) => row.employee_id)).size} / {(Array.isArray(selectionData.employees) ? selectionData.employees : []).length}</p>}
      </div>
      {message && <div className="rounded-xl bg-slate-100 p-3 font-bold">{message}</div>}
      <div className="panel grid gap-3 p-5 md:grid-cols-4">
        <Field form={form} setForm={setForm} fieldKey="period_month" label="الشهر" type="number" />
        <Field form={form} setForm={setForm} fieldKey="period_year" label="السنة" type="number" />
        {isEmployee ? (
          <label className="text-sm font-bold md:col-span-2">
            {"\u0627\u0644\u0645\u0648\u0638\u0641 / \u0627\u0644\u0645\u062c\u0645\u0648\u0639\u0629"}
            <select className="field mt-1" value={form.employee_selection ?? ""} onChange={(event) => setForm((previous) => ({ ...previous, employee_selection: event.target.value }))}>
              <option value="">{"-- \u0627\u062e\u062a\u0631 \u0627\u0644\u0645\u0648\u0638\u0641 \u0623\u0648 \u0627\u0644\u0645\u062c\u0645\u0648\u0639\u0629 --"}</option>
              {(Array.isArray(selectionData.options) ? selectionData.options : []).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <span className="mt-1 block text-xs font-normal text-slate-500">{"\u064a\u0645\u0643\u0646\u0643 \u0627\u062e\u062a\u064a\u0627\u0631 \u0645\u0648\u0638\u0641 \u0648\u0627\u062d\u062f\u060c \u062c\u0645\u064a\u0639 \u0627\u0644\u0645\u0648\u0638\u0641\u064a\u0646\u060c \u0623\u0648 \u0645\u0648\u0638\u0641\u064a \u0641\u0631\u0639 \u0645\u062d\u062f\u062f."}</span>
          </label>
        ) : (
          <label className="text-sm font-bold">
            {"\u0627\u0644\u0641\u0631\u0639"}
            <select className="field mt-1" value={form.branch ?? ""} onChange={(event) => setForm((previous) => ({ ...previous, branch: event.target.value }))}>
              <option value="">{"\u0627\u062e\u062a\u0631 \u0627\u0644\u0641\u0631\u0639"}</option>
              {(Array.isArray(selectionData.branches) ? selectionData.branches : []).map((branch) => <option key={branch} value={branch}>{branch}</option>)}
            </select>
          </label>
        )}
        <label className="text-sm font-bold">
          {"\u0646\u0648\u0639 \u0627\u0644\u0639\u0645\u0644\u064a\u0629"}
          <select className="field mt-1" value={form.operation_type ?? ""} onChange={(event) => setForm((previous) => ({ ...previous, operation_type: event.target.value }))}>
            <option value="">{"\u0627\u062e\u062a\u0631 \u0646\u0648\u0639 \u0627\u0644\u0639\u0645\u0644\u064a\u0629"}</option>
            {(Array.isArray(operationTypes) ? operationTypes : []).map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
          <span className="mt-1 block text-xs font-normal text-slate-500">{"\u0642\u0627\u0626\u0645\u0629 \u0645\u0646\u0633\u062f\u0644\u0629 \u0628\u062c\u0645\u064a\u0639 \u0623\u0646\u0648\u0627\u0639 \u0627\u0644\u0639\u0645\u0644\u064a\u0627\u062a"}</span>
        </label>
        <Field form={form} setForm={setForm} fieldKey="service_channel" label="القناة" />
        <Field form={form} setForm={setForm} fieldKey="target_count" label="المستهدف" type="number" />
        <Field form={form} setForm={setForm} fieldKey="minimum_count" label="الحد الأدنى" type="number" />
        <Field form={form} setForm={setForm} fieldKey="excellent_count" label="الممتاز" type="number" />
        {isEmployee && <Field form={form} setForm={setForm} fieldKey="target_weight" label="الوزن" type="number" />}
        <button type="button" onClick={save} className="btn-primary">حفظ</button>
      </div>
      {isEmployee ? <>
        <div className="grid gap-3 sm:grid-cols-4"><div className="panel p-4"><b>{rows.length}</b><p>{"\u0625\u062c\u0645\u0627\u0644\u064a \u0627\u0644\u0633\u062c\u0644\u0627\u062a"}</p></div><div className="panel p-4"><b>{rows.filter(row=>row.is_active!==false).length}</b><p>{"\u0627\u0644\u0646\u0634\u0637\u0629"}</p></div><div className="panel p-4"><b>{rows.filter(row=>row.is_active===false).length}</b><p>{"\u063a\u064a\u0631 \u0627\u0644\u0646\u0634\u0637\u0629"}</p></div><div className="panel p-4"><b>{selectedIds.length}</b><p>{"\u0639\u062f\u062f \u0627\u0644\u0645\u062d\u062f\u062f"}</p></div></div>
        <div className="panel p-4"><div className="mb-4 flex flex-wrap items-center gap-2"><b>{"\u0639\u062f\u062f \u0627\u0644\u0633\u062c\u0644\u0627\u062a \u0627\u0644\u0645\u062d\u062f\u062f\u0629"}: {selectedIds.length}</b><button type="button" disabled={!selectedIds.length} onClick={()=>{setBulkDraft({is_active:true});setBulkEnabled({})}} className="btn-primary">{"\u062a\u0639\u062f\u064a\u0644 \u062c\u0645\u0627\u0639\u064a"}</button><button type="button" disabled={!selectedIds.length} onClick={deleteSelected} className="btn-secondary text-red-700">{"\u062d\u0630\u0641 \u0627\u0644\u0645\u062d\u062f\u062f"}</button><button type="button" disabled={!selectedIds.length} onClick={()=>setSelectedIds([])} className="btn-secondary">{"\u0625\u0644\u063a\u0627\u0621 \u0627\u0644\u062a\u062d\u062f\u064a\u062f"}</button></div>
          <div className="overflow-x-auto"><table><thead><tr><th><input type="checkbox" checked={rows.length>0&&rows.every(row=>selectedIds.includes(row.target_id))} onChange={e=>setSelectedIds(e.target.checked?rows.map(row=>row.target_id).filter(Boolean):[])} /></th><th>{"\u0627\u0644\u0645\u0648\u0638\u0641"}</th><th>{"\u0627\u0644\u0641\u062a\u0631\u0629"}</th><th>{"\u0646\u0648\u0639 \u0627\u0644\u0639\u0645\u0644\u064a\u0629"}</th><th>{"\u0627\u0644\u0642\u0646\u0627\u0629"}</th><th>{"\u0627\u0644\u0645\u0633\u062a\u0647\u062f\u0641"}</th><th>{"\u0627\u0644\u062d\u062f \u0627\u0644\u0623\u062f\u0646\u0649"}</th><th>{"\u0627\u0644\u0645\u0645\u062a\u0627\u0632"}</th><th>{"\u0627\u0644\u0648\u0632\u0646"}</th><th>{"\u0627\u0644\u062d\u0627\u0644\u0629"}</th><th>{"\u0645\u0644\u0627\u062d\u0638\u0627\u062a"}</th><th></th></tr></thead><tbody>{rows.length?rows.map(row=><tr key={row.target_id}><td><input type="checkbox" checked={selectedIds.includes(row.target_id)} onChange={()=>toggleSelected(row.target_id)} /></td><td className="font-bold">{row.employee_name}</td><td>{row.period_month}/{row.period_year}</td><td>{row.operation_type||"?"}</td><td>{row.service_channel||"?"}</td><td>{row.target_count}</td><td>{row.minimum_count}</td><td>{row.excellent_count}</td><td>{row.target_weight}</td><td>{row.is_active===false?"\u063a\u064a\u0631 \u0645\u0641\u0639\u0644":"\u0645\u0641\u0639\u0644"}</td><td>{row.notes||"?"}</td><td><button type="button" onClick={()=>setEditDraft({...row,period_month:String(row.period_month??""),period_year:String(row.period_year??""),target_count:String(row.target_count??""),minimum_count:String(row.minimum_count??""),excellent_count:String(row.excellent_count??""),target_weight:String(row.target_weight??"")})} className="btn-secondary">{"\u062a\u0639\u062f\u064a\u0644"}</button> <button type="button" onClick={()=>remove(row)} className="text-red-700">{"\u062d\u0630\u0641"}</button></td></tr>):<tr><td colSpan="12" className="py-8 text-center text-slate-400">{"\u0644\u0627 \u062a\u0648\u062c\u062f \u0628\u064a\u0627\u0646\u0627\u062a \u0645\u062d\u0641\u0648\u0638\u0629 \u0628\u0639\u062f"}</td></tr>}</tbody></table></div>
        </div>
        {editDraft&&<TargetEditDialog draft={editDraft} setDraft={setEditDraft} employees={selectionData.employees||[]} operationTypes={operationTypes} onSave={saveIndividualEdit} onClose={()=>setEditDraft(null)} saving={savingEdit}/>}
        {bulkDraft&&<TargetEditDialog bulk draft={bulkDraft} setDraft={setBulkDraft} enabled={bulkEnabled} setEnabled={setBulkEnabled} employees={selectionData.employees||[]} operationTypes={operationTypes} onSave={saveBulkEdit} onClose={()=>{setBulkDraft(null);setBulkEnabled({})}} saving={savingEdit}/>}
      </> : <div className="panel overflow-x-auto p-4"><table><thead><tr><th>{"\u0627\u0644\u0641\u0631\u0639"}</th><th>{"\u0627\u0644\u0641\u062a\u0631\u0629"}</th><th>{"\u0627\u0644\u0645\u0633\u062a\u0647\u062f\u0641"}</th><th>{"\u0627\u0644\u062d\u0627\u0644\u0629"}</th><th></th></tr></thead><tbody>{rows.length?rows.map(row=><tr key={row.branch_target_id}><td>{row.branch}</td><td>{row.period_month}/{row.period_year}</td><td>{row.target_count}</td><td>{row.is_active===false?"\u0645\u0639\u0637\u0644":"\u0646\u0634\u0637"}</td><td><button type="button" onClick={()=>setForm({...defaultForm,...row})} className="btn-secondary">{"\u062a\u0639\u062f\u064a\u0644"}</button> <button type="button" onClick={()=>remove(row)} className="text-red-700">{"\u062d\u0630\u0641"}</button></td></tr>):<tr><td colSpan="5" className="py-8 text-center text-slate-400">{"\u0644\u0627 \u062a\u0648\u062c\u062f \u0628\u064a\u0627\u0646\u0627\u062a \u0645\u062d\u0641\u0648\u0638\u0629 \u0628\u0639\u062f"}</td></tr>}</tbody></table></div>}
    </div>
  );
}

export const MonthlyEmployeeTargetsPage = (props) => <TargetsPage {...props} kind="employee" />;
export const BranchTargetsPage = (props) => <TargetsPage {...props} kind="branch" />;
export { default as AttendanceKpiRulesPage } from "./AttendanceKpiRulesPage";
export { default as IncentiveExclusionsPage } from "./IncentiveExclusionsPage";
export { default as IncentiveProposalPage } from "./IncentiveProposalPage";
export { default as PerformanceProcessGuidePage } from "./PerformanceProcessGuidePage";
