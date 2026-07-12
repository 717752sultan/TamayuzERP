import { supabase } from "./supabase";

export const inventoryCategories = ["قرطاسيات", "مطبوعات", "معلقات ولوحات", "أجهزة ومستلزمات", "أدوات نظافة", "مواد تشغيلية", "أخرى"];
export const inventoryUnits = ["حبة", "كرتون", "باكت", "دفتر", "رول", "كيلو", "متر", "علبة", "رزمة", "أخرى"];

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
  is_active: row.is_active !== false,
  notes: row.notes || "",
  created_at: row.created_at || "",
  updated_at: row.updated_at || "",
});

const itemToDb = (item = {}) => ({
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
  is_active: item.is_active !== false,
  notes: String(item.notes || ""),
  created_at: item.created_at || new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

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
  balance_after: Number(row.balance_after || 0),
  notes: row.notes || "",
  created_by: row.created_by || "",
  created_at: row.created_at || "",
});

const movementToDb = (movement = {}) => ({
  movement_id: String(movement.movement_id || `MOV-${Date.now()}-${Math.random().toString(16).slice(2)}`).trim(),
  movement_date: movement.movement_date || new Date().toISOString().slice(0, 10),
  item_id: String(movement.item_id || ""),
  item_code: String(movement.item_code || ""),
  item_name: String(movement.item_name || ""),
  location: String(movement.location || "المخزن المركزي"),
  branch: String(movement.branch || ""),
  movement_type: String(movement.movement_type || ""),
  source_module: String(movement.source_module || ""),
  source_id: String(movement.source_id || ""),
  source_number: String(movement.source_number || ""),
  quantity_in: Number(movement.quantity_in || 0),
  quantity_out: Number(movement.quantity_out || 0),
  unit_cost: Number(movement.unit_cost || 0),
  total_value: Number(movement.total_value || 0),
  balance_after: Number(movement.balance_after || 0),
  notes: String(movement.notes || ""),
  created_by: String(movement.created_by || ""),
  created_at: movement.created_at || new Date().toISOString(),
});

export const inventoryService = {
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
      console.error("Supabase inventory_movements load/save error:", error);
      throw new Error("فشل تحميل سجل حركة المخزون من Supabase: " + error.message);
    }
  },
  async saveMovement(movement) {
    try {
      const payload = movementToDb(movement);
      const { data, error } = await supabase.from("inventory_movements").upsert(payload, { onConflict: "movement_id" }).select().single();
      if (error) throw error;
      return movementFromDb(data);
    } catch (error) {
      console.error("Supabase inventory_movements load/save error:", error);
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
