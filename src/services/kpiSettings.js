import { supabase } from "./supabase";

export const defaultKpiCriterionTypes = [
  ["operational", "إنتاجي / تشغيلي"],
  ["behavioral", "سلوكي"],
  ["administrative", "إداري"],
  ["financial", "مالي"],
  ["compliance", "امتثال"],
  ["quality", "جودة"],
  ["attendance_discipline", "حضور وانضباط"],
  ["inventory", "مخزون"],
  ["customer_service", "خدمة عملاء"],
  ["other", "أخرى"],
];

export const defaultKpiEvaluationMethods = [
  ["manual", "يدوي", "manual"],
  ["daily_operations", "تلقائي من العمليات اليومية", "daily_operations"],
  ["attendance", "تلقائي من الحضور", "attendance"],
  ["inventory", "تلقائي من المخزون", "inventory"],
  ["evaluation", "تلقائي من التقييم", "evaluation"],
  ["mixed", "مختلط", "mixed"],
];

export const kpiSourceTypes = [
  ["manual", "يدوي"],
  ["daily_operations", "العمليات اليومية"],
  ["attendance", "الحضور"],
  ["inventory", "المخزون"],
  ["evaluation", "التقييم"],
  ["mixed", "مختلط"],
];

const requireCompanyId = (companyId) => {
  const id = String(companyId || "").trim();
  if (!id) throw new Error("لم يتم تحديد الشركة الحالية.");
  return id;
};

const safeKey = (value, prefix) => {
  const key = String(value || "").trim().toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^\w\u0600-\u06FF-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
  return key || `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
};

const makeId = (prefix, companyId, key) =>
  `${prefix}-${companyId}-${key}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    .replace(/\s+/g, "_");

const activeFilter = (options = {}) => options.activeOnly ? "&is_active=eq.true" : "";

const assertNoActiveDuplicate = async (table, companyId, keyColumn, keyValue, idColumn, currentId) => {
  const rows = await supabase.select(
    table,
    `company_id=eq.${encodeURIComponent(companyId)}&${keyColumn}=eq.${encodeURIComponent(keyValue)}&is_active=eq.true&select=${idColumn}&limit=2`,
  );
  if ((rows || []).some((row) => String(row[idColumn]) !== String(currentId || ""))) {
    throw new Error("المفتاح مستخدم مسبقًا ضمن العناصر النشطة لهذه الشركة.");
  }
};

export async function loadKpiCriterionTypes(companyId, options = {}) {
  const id = requireCompanyId(companyId);
  return supabase.select(
    "kpi_criterion_types",
    `company_id=eq.${encodeURIComponent(id)}${activeFilter(options)}&select=*&order=sort_order.asc,type_name.asc`,
  );
}

export async function saveKpiCriterionType(input = {}) {
  const companyId = requireCompanyId(input.company_id);
  const typeName = String(input.type_name || "").trim();
  if (!typeName) throw new Error("اسم النوع مطلوب.");
  const typeKey = safeKey(input.type_key || typeName, "type");
  if (input.is_active !== false) {
    await assertNoActiveDuplicate("kpi_criterion_types", companyId, "type_key", typeKey, "type_id", input.type_id);
  }
  const payload = {
    type_id: String(input.type_id || makeId("KPI-TYPE", companyId, typeKey)),
    company_id: companyId,
    type_key: typeKey,
    type_name: typeName,
    description: String(input.description || "").trim(),
    sort_order: Number(input.sort_order || 0),
    is_active: input.is_active !== false,
    created_at: input.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase.from("kpi_criterion_types").upsert(payload, { onConflict: "type_id" }).select().single();
  if (error) throw error;
  return data;
}

export async function disableKpiCriterionType(companyId, typeId) {
  const id = requireCompanyId(companyId);
  if (!typeId) throw new Error("لم يتم تحديد نوع المعيار.");
  return supabase.request(
    `/rest/v1/kpi_criterion_types?company_id=eq.${encodeURIComponent(id)}&type_id=eq.${encodeURIComponent(typeId)}`,
    { method: "PATCH", prefer: "return=representation", body: JSON.stringify({ is_active: false, updated_at: new Date().toISOString() }) },
  );
}

export async function loadKpiEvaluationMethods(companyId, options = {}) {
  const id = requireCompanyId(companyId);
  return supabase.select(
    "kpi_evaluation_methods",
    `company_id=eq.${encodeURIComponent(id)}${activeFilter(options)}&select=*&order=sort_order.asc,method_name.asc`,
  );
}

export async function saveKpiEvaluationMethod(input = {}) {
  const companyId = requireCompanyId(input.company_id);
  const methodName = String(input.method_name || "").trim();
  if (!methodName) throw new Error("اسم طريقة التقييم مطلوب.");
  const sourceType = String(input.source_type || "").trim();
  if (!kpiSourceTypes.some(([key]) => key === sourceType)) throw new Error("مصدر البيانات مطلوب.");
  const methodKey = safeKey(input.method_key || methodName, "method");
  if (input.is_active !== false) {
    await assertNoActiveDuplicate("kpi_evaluation_methods", companyId, "method_key", methodKey, "method_id", input.method_id);
  }
  const payload = {
    method_id: String(input.method_id || makeId("KPI-METHOD", companyId, methodKey)),
    company_id: companyId,
    method_key: methodKey,
    method_name: methodName,
    source_type: sourceType,
    description: String(input.description || "").trim(),
    sort_order: Number(input.sort_order || 0),
    is_active: input.is_active !== false,
    created_at: input.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase.from("kpi_evaluation_methods").upsert(payload, { onConflict: "method_id" }).select().single();
  if (error) throw error;
  return data;
}

export async function disableKpiEvaluationMethod(companyId, methodId) {
  const id = requireCompanyId(companyId);
  if (!methodId) throw new Error("لم يتم تحديد طريقة التقييم.");
  return supabase.request(
    `/rest/v1/kpi_evaluation_methods?company_id=eq.${encodeURIComponent(id)}&method_id=eq.${encodeURIComponent(methodId)}`,
    { method: "PATCH", prefer: "return=representation", body: JSON.stringify({ is_active: false, updated_at: new Date().toISOString() }) },
  );
}

export async function seedDefaultKpiSettings(companyId) {
  const id = requireCompanyId(companyId);
  const [existingTypes, existingMethods] = await Promise.all([
    loadKpiCriterionTypes(id),
    loadKpiEvaluationMethods(id),
  ]);
  const typeKeys = new Set((existingTypes || []).map((row) => row.type_key));
  const methodKeys = new Set((existingMethods || []).map((row) => row.method_key));
  const typeRows = defaultKpiCriterionTypes
    .filter(([key]) => !typeKeys.has(key))
    .map(([type_key, type_name], index) => ({
      type_id: makeId("KPI-TYPE", id, type_key),
      company_id: id,
      type_key,
      type_name,
      description: "",
      sort_order: index + 1,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
  const methodRows = defaultKpiEvaluationMethods
    .filter(([key]) => !methodKeys.has(key))
    .map(([method_key, method_name, source_type], index) => ({
      method_id: makeId("KPI-METHOD", id, method_key),
      company_id: id,
      method_key,
      method_name,
      source_type,
      description: "",
      sort_order: index + 1,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
  if (typeRows.length) await supabase.upsert("kpi_criterion_types", typeRows, { onConflict: "type_id" });
  if (methodRows.length) await supabase.upsert("kpi_evaluation_methods", methodRows, { onConflict: "method_id" });
  return {
    types: await loadKpiCriterionTypes(id),
    methods: await loadKpiEvaluationMethods(id),
  };
}

export const kpiSettingsService = {
  loadKpiCriterionTypes,
  saveKpiCriterionType,
  disableKpiCriterionType,
  loadKpiEvaluationMethods,
  saveKpiEvaluationMethod,
  disableKpiEvaluationMethod,
  seedDefaultKpiSettings,
};
