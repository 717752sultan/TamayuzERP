import { supabase } from "./supabase";
const id=(prefix)=>prefix+"-"+Date.now()+"-"+Math.random().toString(36).slice(2,8);
const required=(companyId)=>{if(!String(companyId||"").trim()) throw new Error("company_id is required.");};
const query=(companyId,filters={})=>{required(companyId);const p=["select=*",`company_id=eq.${encodeURIComponent(companyId)}`];for(const [k,v] of Object.entries(filters)){if(v!==""&&v!=null)p.push(`${k}=eq.${encodeURIComponent(v)}`)}return p.join("&")+"&order=updated_at.desc"};
const save=async(table,key,payload)=>{required(payload.company_id);const row={...payload,[key]:payload[key]||id(key),updated_at:new Date().toISOString()};const {data,error}=await supabase.from(table).upsert(row,{onConflict:key}).select().single();if(error)throw error;return data};
const remove=(table,key,value,companyId)=>{required(companyId);return supabase.request(`/rest/v1/${table}?${key}=eq.${encodeURIComponent(value)}&company_id=eq.${encodeURIComponent(companyId)}`,{method:"DELETE",prefer:"return=minimal"})};
const copy=async(table,key,companyId,fromMonth,fromYear,toMonth,toYear)=>{const rows=await supabase.select(table,query(companyId,{period_month:fromMonth,period_year:fromYear}));const payload=rows.map(r=>({...r,[key]:id(key),period_month:Number(toMonth),period_year:Number(toYear),created_at:new Date().toISOString(),updated_at:new Date().toISOString()}));return payload.length?supabase.upsert(table,payload,{onConflict:key}):[]};
export const performanceTargetsService={
 loadEmployeeTargets:(c,f={})=>supabase.select("performance_employee_targets",query(c,f)),
 saveEmployeeTarget:(p)=>save("performance_employee_targets","target_id",p),
 deleteEmployeeTarget:(v,c)=>remove("performance_employee_targets","target_id",v,c),
 copyEmployeeTargetsFromPreviousMonth:(c,fm,fy,tm,ty)=>copy("performance_employee_targets","target_id",c,fm,fy,tm,ty),
 loadBranchTargets:(c,f={})=>supabase.select("performance_branch_targets",query(c,f)),
 saveBranchTarget:(p)=>save("performance_branch_targets","branch_target_id",p),
 deleteBranchTarget:(v,c)=>remove("performance_branch_targets","branch_target_id",v,c),
 copyBranchTargetsFromPreviousMonth:(c,fm,fy,tm,ty)=>copy("performance_branch_targets","branch_target_id",c,fm,fy,tm,ty),
};
export const {loadEmployeeTargets,saveEmployeeTarget,deleteEmployeeTarget,copyEmployeeTargetsFromPreviousMonth,loadBranchTargets,saveBranchTarget,deleteBranchTarget,copyBranchTargetsFromPreviousMonth}=performanceTargetsService;
