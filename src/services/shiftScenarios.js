import { supabase } from "./supabase";

export const scenarioTypes = ["عادي", "رمضان", "عيد", "طوارئ", "جمعة", "مخصص"];

const scenarioFromDb = (row = {}) => ({
  scenario_id: row.scenario_id,
  scenario_name: row.scenario_name || "",
  branch: row.branch || "",
  scenario_type: row.scenario_type || "عادي",
  description: row.description || "",
  is_active: row.is_active !== false,
  created_at: row.created_at || "",
  updated_at: row.updated_at || "",
});

const scenarioToDb = (item = {}) => ({
  scenario_id: String(item.scenario_id || item.id || `SC-${Date.now()}`).trim(),
  scenario_name: String(item.scenario_name || item.scenarioName || "").trim(),
  branch: String(item.branch || "كل الفروع"),
  scenario_type: String(item.scenario_type || item.scenarioType || "عادي"),
  description: String(item.description || ""),
  is_active: item.is_active !== false,
  created_at: item.created_at || new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

const detailFromDb = (row = {}) => ({
  scenario_detail_id: row.scenario_detail_id,
  scenario_id: row.scenario_id || "",
  shift_type_id: row.shift_type_id || "",
  shift_name: row.shift_name || "",
  start_time: row.start_time || "",
  end_time: row.end_time || "",
  required_employees: Number(row.required_employees || 0),
  notes: row.notes || "",
});

const detailToDb = (item = {}) => ({
  scenario_detail_id: String(item.scenario_detail_id || item.id || `SCD-${Date.now()}-${Math.random().toString(16).slice(2)}`).trim(),
  scenario_id: String(item.scenario_id || item.scenarioId || ""),
  shift_type_id: String(item.shift_type_id || item.shiftTypeId || ""),
  shift_name: String(item.shift_name || item.shiftName || ""),
  start_time: String(item.start_time || item.startTime || ""),
  end_time: String(item.end_time || item.endTime || ""),
  required_employees: Number(item.required_employees || item.requiredEmployees || 0),
  notes: String(item.notes || ""),
});

export const shiftScenariosService = {
  async listScenarios() {
    try {
      const rows = await supabase.select("shift_scenarios", "select=*&order=created_at.desc");
      return (rows || []).map(scenarioFromDb);
    } catch (error) {
      console.error("Supabase shift_scenarios load/save error:", error);
      throw new Error("فشل تحميل بيانات سيناريوهات الشفتات من Supabase: " + error.message);
    }
  },
  async listDetails() {
    try {
      const rows = await supabase.select("shift_scenario_details", "select=*");
      return (rows || []).map(detailFromDb);
    } catch (error) {
      console.error("Supabase shift_scenario_details load/save error:", error);
      throw new Error("فشل تحميل تفاصيل سيناريوهات الشفتات من Supabase: " + error.message);
    }
  },
  async saveScenario(item, details = null) {
    try {
      const payload = scenarioToDb(item);
      const { data, error } = await supabase.from("shift_scenarios").upsert(payload, { onConflict: "scenario_id" }).select().single();
      if (error) throw error;
      let savedDetails = [];
      if (Array.isArray(details)) {
        const rows = details.map((d) => detailToDb({ ...d, scenario_id: payload.scenario_id }));
        if (rows.length) {
          const result = await supabase.from("shift_scenario_details").upsert(rows, { onConflict: "scenario_detail_id" }).select();
          if (result.error) throw result.error;
          savedDetails = (result.data || []).map(detailFromDb);
        }
      }
      return { scenario: scenarioFromDb(data), details: savedDetails };
    } catch (error) {
      console.error("Supabase shift_scenarios load/save error:", error);
      throw new Error("فشل حفظ سيناريو الشفتات: " + error.message);
    }
  },
  async removeScenario(id) {
    try {
      await supabase.request(`/rest/v1/shift_scenario_details?scenario_id=eq.${encodeURIComponent(id)}`, {
        method: "DELETE",
        prefer: "return=minimal",
      });
      return await supabase.request(`/rest/v1/shift_scenarios?scenario_id=eq.${encodeURIComponent(id)}`, {
        method: "DELETE",
        prefer: "return=minimal",
      });
    } catch (error) {
      console.error("Supabase shift_scenarios load/save error:", error);
      throw new Error("فشل حذف سيناريو الشفتات: " + error.message);
    }
  },
  subscribeScenarios(onChange) {
    return supabase.subscribeToTable("shift_scenarios", onChange);
  },
  subscribeDetails(onChange) {
    return supabase.subscribeToTable("shift_scenario_details", onChange);
  },
};
