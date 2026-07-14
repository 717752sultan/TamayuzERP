import { supabase } from "./supabase";

export const inventoryCategories = ["قرطاسيات", "مطبوعات", "معلقات ولوحات", "أجهزة ومستلزمات", "أدوات نظافة", "مواد تشغيلية", "أخرى"];
export const inventoryUnits = ["حبة", "كرتون", "باكت", "دفتر", "رول", "كيلو", "متر", "علبة", "رزمة", "أخرى"];

export const inventoryCurrencies = [
  { currency_code: "YER", currency_name: "ريال يمني", exchange_rate: 1, is_base_currency: true, is_active: true },
  { currency_code: "SAR", currency_name: "ريال سعودي", exchange_rate: 580, is_base_currency: false, is_active: true },
  { currency_code: "USD", currency_name: "دولار أمريكي", exchange_rate: 530, is_base_currency: false, is_active: true },
];
export const getInventoryCurrency = (code = "YER", currencies = inventoryCurrencies) => currencies.find((c) => c.currency_code === code) || inventoryCurrencies[0];
export const calculateInventoryLineTotal = (row = {}, currencies = inventoryCurrencies) => {
  const currency = getInventoryCurrency(row.currency_code || row.default_currency_code || "YER", currencies);
  const quantity = Number(row.quantity || row.quantity_issued || row.received_quantity || row.accepted_quantity || row.ordered_quantity || row.returned_quantity || row.quantity_requested || row.quantity_approved || row.requested_quantity || row.approved_quantity || 0);
  const unitPrice = Number(row.unit_price || row.unit_cost || row.default_unit_cost || 0);
  const exchangeRate = Number(row.exchange_rate || currency.exchange_rate || 1);
  const totalValue = Number((quantity * unitPrice).toFixed(2));
  const totalValueBase = Number((totalValue * exchangeRate).toFixed(2));
  return { quantity, unit_price: unitPrice, unit_cost: unitPrice, currency_code: currency.currency_code, currency_name: currency.currency_name, exchange_rate: exchangeRate, base_currency_code: "YER", total_value: totalValue, total_amount: totalValue, total_value_base: totalValueBase };
};

const itemFromDb = (row = {}) => ({
  item_id: row.item_id,
  item_code: row.item_code || "",
  item_name: row.item_name || "",
  category: row.category || "",
  unit_type: row.unit_type || "",
  default_unit_cost: Number(row.default_unit_cost || 0),
  minimum_stock: Number(row.minimum_stock || 0),
  reorder_point: Number(row.reorder_point || 0),
  opening_balance: Number(row.opening_balance || 0),
  current_balance: Number(row.current_balance || 0),
  default_currency_code: row.default_currency_code || row.currency_code || "YER",
  default_currency_name: row.default_currency_name || row.currency_name || "ريال يمني",
  currency_code: row.currency_code || row.default_currency_code || "YER",
  currency_name: row.currency_name || row.default_currency_name || "ريال يمني",
  exchange_rate: Number(row.exchange_rate || 1),
  total_value: Number(row.total_value || 0),
  total_value_base: Number(row.total_value_base || 0),
  is_active: row.is_active !== false,
  notes: row.notes || "",
  created_at: row.created_at || "",
  updated_at: row.updated_at || "",
});

const itemToDb = (item = {}) => {
  const totals = calculateInventoryLineTotal({ ...item, quantity: item.current_balance ?? item.opening_balance ?? 0, unit_price: item.default_unit_cost || 0, currency_code: item.default_currency_code || item.currency_code || "YER" });
  return {
    item_id: String(item.item_id || item.id || `ITM-${Date.now()}`).trim(),
    item_code: String(item.item_code || item.itemCode || "").trim(),
    item_name: String(item.item_name || item.itemName || "").trim(),
    category: String(item.category || ""),
    unit_type: String(item.unit_type || item.unitType || ""),
    default_unit_cost: Number(item.default_unit_cost || item.defaultUnitCost || 0),
    minimum_stock: Number(item.minimum_stock || item.minimumStock || 0),
    reorder_point: Number(item.reorder_point || item.reorderPoint || 0),
    opening_balance: Number(item.opening_balance || item.openingBalance || 0),
    current_balance: Number(item.current_balance ?? item.currentBalance ?? item.opening_balance ?? 0),
    default_currency_code: totals.currency_code,
    default_currency_name: totals.currency_name,
    currency_code: totals.currency_code,
    currency_name: totals.currency_name,
    exchange_rate: totals.exchange_rate,
    total_value: totals.total_value,
    total_value_base: totals.total_value_base,
    is_active: item.is_active !== false,
    notes: String(item.notes || ""),
    created_at: item.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
};

const supplierFromDb = (row = {}) => ({
  supplier_id: row.supplier_id,
  supplier_name: row.supplier_name || "",
  phone: row.phone || "",
  address: row.address || "",
  tax_number: row.tax_number || "",
  commercial_register: row.commercial_register || "",
  contact_person: row.contact_person || "",
  is_active: row.is_active !== false,
  notes: row.notes || "",
  created_at: row.created_at || "",
  updated_at: row.updated_at || "",
});

const supplierToDb = (supplier = {}) => ({
  supplier_id: String(supplier.supplier_id || supplier.id || `SUP-${Date.now()}`).trim(),
  supplier_name: String(supplier.supplier_name || supplier.supplierName || "").trim(),
  phone: String(supplier.phone || ""),
  address: String(supplier.address || ""),
  tax_number: String(supplier.tax_number || supplier.taxNumber || ""),
  commercial_register: String(supplier.commercial_register || supplier.commercialRegister || ""),
  contact_person: String(supplier.contact_person || supplier.contactPerson || ""),
  is_active: supplier.is_active !== false,
  notes: String(supplier.notes || ""),
  created_at: supplier.created_at || new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

const movementFromDb = (row = {}) => ({
  movement_id: row.movement_id,
  movement_date: row.movement_date || "",
  item_id: row.item_id || "",
  item_code: row.item_code || "",
  item_name: row.item_name || "",
  location: row.location || "",
  branch: row.branch || "",
  movement_type: row.movement_type || "",
  source_module: row.source_module || "",
  source_id: row.source_id || "",
  source_number: row.source_number || "",
  quantity_in: Number(row.quantity_in || 0),
  quantity_out: Number(row.quantity_out || 0),
  unit_cost: Number(row.unit_cost || 0),
  total_value: Number(row.total_value || 0),
  currency_code: row.currency_code || "YER",
  currency_name: row.currency_name || "ريال يمني",
  exchange_rate: Number(row.exchange_rate || 1),
  base_currency_code: row.base_currency_code || "YER",
  total_value_base: Number(row.total_value_base || 0),
  balance_after: Number(row.balance_after || 0),
  notes: row.notes || "",
  created_by: row.created_by || "",
  created_at: row.created_at || "",
});

export const normalizeInventoryMovementForDb = (movement = {}) => {
  const quantityIn = Number(movement.quantity_in || 0);
  const quantityOut = Number(movement.quantity_out || 0);
  const unitCost = Number(movement.unit_cost || movement.unit_price || 0);
  const totals = calculateInventoryLineTotal({ ...movement, quantity: quantityIn || quantityOut, unit_cost: unitCost });
  return {
  movement_id: String(movement.movement_id || movement.id || `MOV-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`).trim(),
  movement_date: movement.movement_date || movement.date || new Date().toISOString().slice(0, 10),
  item_id: String(movement.item_id || movement.itemId || "").trim(),
  item_code: String(movement.item_code || movement.itemCode || "بدون كود").trim(),
  item_name: String(movement.item_name || movement.itemName || movement.name || "صنف غير محدد").trim(),
  location: String(movement.location || "المخزن المركزي"),
  branch: String(movement.branch || movement.to_branch || movement.location || "غير محدد").trim(),
  movement_type: String(movement.movement_type || "حركة مخزون").trim(),
  source_module: String(movement.source_module || "inventory").trim(),
  source_id: String(movement.source_id || movement.sourceId || "").trim(),
  source_number: String(movement.source_number || movement.sourceNumber || "").trim(),
  quantity_in: quantityIn,
  quantity_out: quantityOut,
  unit_cost: unitCost,
  currency_code: totals.currency_code,
  currency_name: totals.currency_name,
  exchange_rate: totals.exchange_rate,
  base_currency_code: totals.base_currency_code,
  total_value: totals.total_value,
  total_value_base: totals.total_value_base,
  balance_after: Number(movement.balance_after || 0),
  notes: movement.notes ? String(movement.notes).trim() : "",
  created_by: String(movement.created_by || "النظام").trim(),
  created_at: movement.created_at || new Date().toISOString(),
  };
};

const movementToDb = normalizeInventoryMovementForDb;

export const inventoryService = {
  async loadInventoryCurrencies() {
    try {
      const rows = await supabase.select("inventory_currency_settings", "select=*&order=is_base_currency.desc,currency_code.asc");
      return rows?.length ? rows : inventoryCurrencies;
    } catch (error) {
      console.error("Inventory currency/totals error:", error);
      return inventoryCurrencies;
    }
  },
  async saveInventoryCurrencySetting(row) {
    try {
      const payload = {
        setting_id: row.setting_id || `CUR-${row.currency_code || Date.now()}`,
        currency_code: String(row.currency_code || "YER").trim(),
        currency_name: String(row.currency_name || "").trim(),
        exchange_rate: Number(row.exchange_rate || 1),
        is_base_currency: row.is_base_currency === true,
        is_active: row.is_active !== false,
        updated_at: new Date().toISOString(),
        created_at: row.created_at || new Date().toISOString(),
      };
      if (!payload.currency_code) throw new Error("يجب تحديد العملة");
      if (!payload.exchange_rate) throw new Error("يجب إدخال سعر الصرف");
      const { data, error } = await supabase.from("inventory_currency_settings").upsert(payload, { onConflict: "setting_id" }).select().single();
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Inventory currency/totals error:", error);
      throw new Error("فشل تحميل إعدادات العملات: " + error.message);
    }
  },
  async getDefaultInventoryCurrency() {
    const currencies = await this.loadInventoryCurrencies();
    return currencies.find((c) => c.is_base_currency) || currencies[0] || inventoryCurrencies[0];
  },
  async loadInventoryItems() {
    try {
      const rows = await supabase.select("inventory_items", "select=*&order=item_name.asc");
      return (rows || []).map(itemFromDb);
    } catch (error) {
      console.error("Supabase inventory_items load/save error:", error);
      throw new Error("فشل تحميل بيانات الأصناف من Supabase: " + error.message);
    }
  },
  async saveInventoryItem(item) {
    try {
      const payload = itemToDb(item);
      if (!payload.item_name) throw new Error("يجب إدخال اسم الصنف");
      if (!payload.item_code) throw new Error("يجب إدخال كود الصنف");
      if (!payload.unit_type) throw new Error("يجب تحديد وحدة القياس");
      if (!payload.category) throw new Error("يجب تحديد التصنيف");
      const { data, error } = await supabase.from("inventory_items").upsert(payload, { onConflict: "item_id" }).select().single();
      if (error) throw error;
      return itemFromDb(data);
    } catch (error) {
      console.error("Supabase inventory_items load/save error:", error);
      throw new Error("فشل حفظ بيانات الصنف: " + error.message);
    }
  },
  async deleteInventoryItem(id) {
    try {
      return await supabase.request(`/rest/v1/inventory_items?item_id=eq.${encodeURIComponent(id)}`, { method: "DELETE", prefer: "return=minimal" });
    } catch (error) {
      console.error("Supabase inventory_items delete error:", error);
      throw new Error("فشل حذف الصنف: " + error.message);
    }
  },
  async loadSuppliers() {
    try {
      const rows = await supabase.select("inventory_suppliers", "select=*&order=supplier_name.asc");
      return (rows || []).map(supplierFromDb);
    } catch (error) {
      console.error("Supabase inventory_suppliers load/save error:", error);
      throw new Error("فشل تحميل بيانات الموردين من Supabase: " + error.message);
    }
  },
  async saveSupplier(supplier) {
    try {
      const payload = supplierToDb(supplier);
      if (!payload.supplier_name) throw new Error("يجب إدخال اسم المورد");
      const { data, error } = await supabase.from("inventory_suppliers").upsert(payload, { onConflict: "supplier_id" }).select().single();
      if (error) throw error;
      return supplierFromDb(data);
    } catch (error) {
      console.error("Supabase inventory_suppliers load/save error:", error);
      throw new Error("فشل حفظ بيانات المورد: " + error.message);
    }
  },
  async deleteSupplier(id) {
    try {
      return await supabase.request(`/rest/v1/inventory_suppliers?supplier_id=eq.${encodeURIComponent(id)}`, { method: "DELETE", prefer: "return=minimal" });
    } catch (error) {
      console.error("Supabase inventory_suppliers delete error:", error);
      throw new Error("فشل حذف المورد: " + error.message);
    }
  },
  async loadInventoryMovements() {
    try {
      const rows = await supabase.select("inventory_movements", "select=*&order=movement_date.desc");
      return (rows || []).map(movementFromDb);
    } catch (error) {
      console.error("Inventory movement error:", error);
      throw new Error("فشل تحميل سجل حركة المخزون من Supabase: " + error.message);
    }
  },
  async saveMovement(movement) {
    try {
      const payload = movementToDb(movement);
      if (!payload.item_id) throw new Error("يجب تحديد الصنف قبل تنفيذ حركة المخزون");
      if (!payload.movement_type) throw new Error("يجب تحديد نوع الحركة");
      if (!payload.quantity_in && !payload.quantity_out) throw new Error("لا يمكن أن تكون الكمية صفر");
      const { data, error } = await supabase.from("inventory_movements").upsert(payload, { onConflict: "movement_id" }).select().single();
      if (error) throw error;
      return movementFromDb(data);
    } catch (error) {
      console.error("Inventory movement error:", error);
      throw new Error("فشل حفظ حركة المخزون: " + error.message);
    }
  },
  subscribeItems(onChange) {
    return supabase.subscribeToTable("inventory_items", onChange);
  },
  subscribeSuppliers(onChange) {
    return supabase.subscribeToTable("inventory_suppliers", onChange);
  },
  subscribeMovements(onChange) {
    return supabase.subscribeToTable("inventory_movements", onChange);
  },
};
