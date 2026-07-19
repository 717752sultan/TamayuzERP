import { supabase } from "./supabase";

const requireCompany = (companyId) => {
  const id = String(companyId || "").trim();
  if (!id) throw new Error("لم يتم تحديد الشركة الحالية");
  return id;
};

const currencyFromDb = (row = {}) => ({
  id: row.id || row.currency_id || row.currency_code || "",
  company_id: row.company_id || "",
  currency_code: row.currency_code || row.code || "",
  currency_name: row.currency_name || row.name || "",
  currency_symbol: row.currency_symbol || row.symbol || "",
  exchange_rate: Number(row.exchange_rate || 1),
  is_default: row.is_default === true || row.is_base_currency === true,
  is_active: row.is_active !== false,
  notes: row.notes || "",
  created_at: row.created_at || "",
  updated_at: row.updated_at || "",
});

const currencyToDb = (companyId, currency = {}) => ({
  id: currency.id || undefined,
  company_id: requireCompany(companyId),
  currency_code: String(currency.currency_code || currency.code || "").trim().toUpperCase(),
  currency_name: String(currency.currency_name || currency.name || "").trim(),
  currency_symbol: String(currency.currency_symbol || currency.symbol || "").trim(),
  exchange_rate: Number(currency.exchange_rate || 1),
  is_default: currency.is_default === true,
  is_active: currency.is_active !== false,
  notes: String(currency.notes || ""),
  updated_at: new Date().toISOString(),
});

const assertCurrency = (payload) => {
  if (!payload.currency_code) throw new Error("كود العملة مطلوب");
  if (!payload.currency_name) throw new Error("اسم العملة مطلوب");
  if (!(Number(payload.exchange_rate) > 0)) throw new Error("سعر الصرف يجب أن يكون رقمًا أكبر من صفر");
  if (!payload.is_active && payload.is_default) throw new Error("لا يمكن تعطيل العملة الافتراضية قبل تحديد عملة بديلة");
};

export const settingsCurrenciesService = {
  async loadCurrencies(companyId) {
    try {
      requireCompany(companyId);
      const rows = await supabase.select("currencies", `company_id=eq.${encodeURIComponent(companyId)}&select=*&order=currency_code.asc`);
      return (rows || []).map(currencyFromDb);
    } catch (error) {
      console.error("Settings CRUD error:", error);
      throw new Error("تعذر تحميل العملات: " + error.message);
    }
  },

  async saveCurrency(companyId, currency) {
    try {
      const payload = currencyToDb(companyId, currency);
      if (payload.is_default && currency.is_active === false) throw new Error("لا يمكن تعطيل العملة الافتراضية قبل تحديد عملة بديلة");
      if (payload.is_default) payload.is_active = true;
      assertCurrency(payload);
      if (!payload.id) delete payload.id;
      if (payload.is_default) {
        await supabase.request(`/rest/v1/currencies?company_id=eq.${encodeURIComponent(companyId)}`, {
          method: "PATCH",
          prefer: "return=minimal",
          body: JSON.stringify({ is_default: false, updated_at: new Date().toISOString() }),
        });
      }
      const { data, error } = await supabase.from("currencies").upsert(payload, { onConflict: "company_id,currency_code" }).select().single();
      if (error) throw error;
      return currencyFromDb(data);
    } catch (error) {
      console.error("Settings CRUD error:", error);
      if (String(error.message || "").toLowerCase().includes("duplicate")) throw new Error("كود العملة مستخدم مسبقًا داخل هذه الشركة");
      throw new Error("تعذر حفظ العملة: " + error.message);
    }
  },

  async createCurrency(companyId, currency) {
    return this.saveCurrency(companyId, currency);
  },

  async updateCurrency(companyId, currencyId, currency) {
    return this.saveCurrency(companyId, { ...currency, id: currencyId || currency.id });
  },

  async setDefaultCurrency(companyId, currencyId, currency = {}) {
    return this.saveCurrency(companyId, { ...currency, id: currencyId || currency.id, is_default: true, is_active: true });
  },

  async deleteCurrency(companyId, currencyId, currency = {}, protectedCurrencyCodes = []) {
    const protectedCodes = new Set((protectedCurrencyCodes || []).map((code) => String(code || "").trim().toUpperCase()).filter(Boolean));
    if (protectedCodes.has(String(currency.currency_code || "").trim().toUpperCase())) {
      throw new Error("لا يمكن تعطيل عملة مستخدمة كعملة نظام أو راتب أو معاملات. اختر عملة بديلة أولًا");
    }
    if (currency.is_default) throw new Error("لا يمكن حذف العملة الافتراضية إلا بعد تحديد عملة افتراضية بديلة");
    return this.saveCurrency(companyId, { ...currency, id: currencyId || currency.id, is_active: false });
  },

  subscribe(onChange) {
    return supabase.subscribeToTable("currencies", onChange);
  },
};
