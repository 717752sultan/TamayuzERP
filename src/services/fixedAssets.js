import { supabase } from "./supabase";
import { getCurrentCompanyId } from "./tenant";

const ASSET_TABLES = {
  categories: "fixed_asset_categories",
  assets: "fixed_assets",
  custodies: "fixed_asset_custodies",
  transfers: "fixed_asset_transfers",
  maintenance: "fixed_asset_maintenance",
  disposals: "fixed_asset_disposals",
  depreciation: "fixed_asset_depreciation_entries",
};

const pad = (value) => String(value).padStart(2, "0");

export const getAssetTodayDateOnly = () => {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

const localStamp = () => getAssetTodayDateOnly().replaceAll("-", "");

const randomPart = () => Math.random().toString(36).slice(2, 8).toUpperCase();

export const createFixedAssetId = (prefix, month = "") =>
  `${prefix}-${month ? String(month).replace("-", "") : localStamp()}-${randomPart()}`;

const requireCompanyId = (companyId) => {
  const id = companyId || getCurrentCompanyId();
  if (!id) throw new Error("لم يتم تحديد الشركة الحالية");
  return id;
};

const safeNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const normalizeDateOnly = (value) => {
  if (!value) return null;
  const text = String(value).trim();
  const match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (match) return `${match[1]}-${pad(match[2])}-${pad(match[3])}`;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
  }
  return text.slice(0, 10);
};

const applyFilters = (filters = {}) => {
  const params = new URLSearchParams();
  params.set("select", "*");
  params.set("company_id", `eq.${requireCompanyId(filters.company_id)}`);
  Object.entries(filters).forEach(([key, value]) => {
    if (["company_id", "q", "from", "to", "order"].includes(key)) return;
    if (value === undefined || value === null || value === "" || value === "all") return;
    params.set(key, `eq.${value}`);
  });
  if (filters.from) params.set("created_at", `gte.${filters.from}`);
  if (filters.order) params.set("order", filters.order);
  return params.toString();
};

const upsertOne = async (table, payload, onConflict) => {
  const { data, error } = await supabase.from(table).upsert(payload, { onConflict }).select().single();
  if (error) {
    console.error(`Supabase ${table} save error:`, error);
    throw error;
  }
  return data;
};

const selectRows = async (table, filters = {}, order = "created_at.desc") => {
  try {
    const query = `${applyFilters({ ...filters, order })}`;
    return await supabase.select(table, query);
  } catch (error) {
    console.error(`Supabase ${table} load error:`, error);
    throw new Error(`فشل تحميل بيانات الأصول من Supabase: ${error.message}`);
  }
};

const patchById = async (table, idField, id, payload, companyId) => {
  const cid = requireCompanyId(companyId);
  return supabase.request(
    `/rest/v1/${table}?${idField}=eq.${encodeURIComponent(id)}&company_id=eq.${encodeURIComponent(cid)}`,
    {
      method: "PATCH",
      prefer: "return=representation",
      body: JSON.stringify({ ...payload, updated_at: new Date().toISOString() }),
      skipTenantScope: true,
    },
  );
};

const deleteById = async (table, idField, id, companyId) => {
  const cid = requireCompanyId(companyId);
  return supabase.request(
    `/rest/v1/${table}?${idField}=eq.${encodeURIComponent(id)}&company_id=eq.${encodeURIComponent(cid)}`,
    { method: "DELETE", prefer: "return=minimal", skipTenantScope: true },
  );
};

export const normalizeAssetCategory = (category = {}) => ({
  category_id: category.category_id || createFixedAssetId("CAT"),
  company_id: requireCompanyId(category.company_id),
  category_name: String(category.category_name || "").trim(),
  depreciation_method: category.depreciation_method || "القسط الثابت",
  default_useful_life_months: safeNumber(category.default_useful_life_months, 60),
  default_residual_value: safeNumber(category.default_residual_value, 0),
  is_active: category.is_active !== false,
  notes: category.notes || "",
  updated_at: new Date().toISOString(),
});

export const normalizeFixedAsset = (asset = {}) => {
  const purchaseCost = safeNumber(asset.purchase_cost);
  const accumulated = safeNumber(asset.accumulated_depreciation);
  return {
    asset_id: asset.asset_id || createFixedAssetId("AST"),
    company_id: requireCompanyId(asset.company_id),
    asset_code: String(asset.asset_code || asset.asset_id || createFixedAssetId("AST")).trim(),
    asset_name: String(asset.asset_name || "").trim(),
    category_id: asset.category_id || null,
    category_name: asset.category_name || "",
    branch: asset.branch || "",
    department: asset.department || "",
    location: asset.location || "",
    custodian_employee_id: asset.custodian_employee_id || "",
    custodian_employee_name: asset.custodian_employee_name || "",
    purchase_date: normalizeDateOnly(asset.purchase_date) || getAssetTodayDateOnly(),
    purchase_cost: purchaseCost,
    currency_code: asset.currency_code || "YER",
    exchange_rate: safeNumber(asset.exchange_rate, 1),
    purchase_cost_base: safeNumber(asset.purchase_cost_base, purchaseCost * safeNumber(asset.exchange_rate, 1)),
    residual_value: safeNumber(asset.residual_value, 0),
    useful_life_months: safeNumber(asset.useful_life_months, 60),
    depreciation_method: asset.depreciation_method || "القسط الثابت",
    accumulated_depreciation: accumulated,
    book_value: safeNumber(asset.book_value, Math.max(0, purchaseCost - accumulated)),
    status: asset.status || "نشط",
    serial_number: asset.serial_number || "",
    supplier_name: asset.supplier_name || "",
    notes: asset.notes || "",
    updated_at: new Date().toISOString(),
  };
};

const normalizeWorkflowRecord = (row = {}, prefix, idField) => ({
  [idField]: row[idField] || createFixedAssetId(prefix),
  company_id: requireCompanyId(row.company_id),
  asset_id: row.asset_id || "",
  asset_code: row.asset_code || "",
  asset_name: row.asset_name || "",
  employee_id: row.employee_id || row.to_employee_id || "",
  employee_name: row.employee_name || row.to_employee_name || "",
  from_branch: row.from_branch || "",
  to_branch: row.to_branch || "",
  from_location: row.from_location || "",
  to_location: row.to_location || "",
  branch: row.branch || row.to_branch || row.from_branch || "",
  custody_date: normalizeDateOnly(row.custody_date),
  return_date: normalizeDateOnly(row.return_date),
  transfer_date: normalizeDateOnly(row.transfer_date),
  maintenance_date: normalizeDateOnly(row.maintenance_date),
  disposal_date: normalizeDateOnly(row.disposal_date),
  maintenance_type: row.maintenance_type || "وقائية",
  provider_name: row.provider_name || "",
  cost: safeNumber(row.cost, 0),
  disposal_reason: row.disposal_reason || "",
  disposal_value: safeNumber(row.disposal_value, 0),
  status: row.status || "قيد المراجعة",
  notes: row.notes || "",
  updated_at: new Date().toISOString(),
});

export const calculateAssetDepreciation = (asset = {}, asOfDate = getAssetTodayDateOnly()) => {
  const normalized = normalizeFixedAsset({ ...asset, company_id: asset.company_id || getCurrentCompanyId() });
  const purchaseMonth = String(normalized.purchase_date || "").slice(0, 7);
  const targetMonth = String(asOfDate || getAssetTodayDateOnly()).slice(0, 7);
  const [py, pm] = purchaseMonth.split("-").map(Number);
  const [ty, tm] = targetMonth.split("-").map(Number);
  const elapsedMonths = py && pm && ty && tm ? Math.max(0, (ty * 12 + tm) - (py * 12 + pm) + 1) : 0;
  const depreciable = Math.max(0, safeNumber(normalized.purchase_cost_base) - safeNumber(normalized.residual_value));
  const usefulLife = Math.max(1, safeNumber(normalized.useful_life_months, 60));
  const monthlyAmount = normalized.depreciation_method === "بدون إهلاك" ? 0 : depreciable / usefulLife;
  const monthsUsed = Math.min(elapsedMonths, usefulLife);
  const accumulatedDepreciation = Math.min(depreciable, monthlyAmount * monthsUsed);
  const bookValue = Math.max(safeNumber(normalized.residual_value), safeNumber(normalized.purchase_cost_base) - accumulatedDepreciation);
  return {
    depreciation_month: targetMonth,
    monthly_depreciation: Number(monthlyAmount.toFixed(2)),
    accumulated_depreciation: Number(accumulatedDepreciation.toFixed(2)),
    book_value: Number(bookValue.toFixed(2)),
  };
};

export const fixedAssetsService = {
  loadAssetCategories(companyId) {
    return selectRows(ASSET_TABLES.categories, { company_id: companyId }, "category_name.asc");
  },
  saveAssetCategory(category) {
    return upsertOne(ASSET_TABLES.categories, normalizeAssetCategory(category), "company_id,category_id");
  },
  deleteAssetCategory(categoryId) {
    return deleteById(ASSET_TABLES.categories, "category_id", categoryId);
  },
  loadFixedAssets(filters = {}) {
    return selectRows(ASSET_TABLES.assets, filters, "created_at.desc");
  },
  saveFixedAsset(asset) {
    return upsertOne(ASSET_TABLES.assets, normalizeFixedAsset(asset), "company_id,asset_id");
  },
  deleteFixedAsset(assetId) {
    return deleteById(ASSET_TABLES.assets, "asset_id", assetId);
  },
  deactivateFixedAsset(assetId) {
    return patchById(ASSET_TABLES.assets, "asset_id", assetId, { status: "غير مستخدم" });
  },
  loadAssetCustodies(filters = {}) {
    return selectRows(ASSET_TABLES.custodies, filters, "created_at.desc");
  },
  async saveAssetCustody(custody) {
    const row = normalizeWorkflowRecord(custody, "CUS", "custody_id");
    const saved = await upsertOne(ASSET_TABLES.custodies, row, "company_id,custody_id");
    if (row.asset_id) {
      await patchById(ASSET_TABLES.assets, "asset_id", row.asset_id, {
        custodian_employee_id: row.employee_id,
        custodian_employee_name: row.employee_name,
        branch: row.branch,
        status: "في العهدة",
      });
    }
    return saved;
  },
  async returnAssetCustody(custodyId) {
    const rows = await patchById(ASSET_TABLES.custodies, "custody_id", custodyId, {
      status: "مسترجعة",
      return_date: getAssetTodayDateOnly(),
    });
    const row = Array.isArray(rows) ? rows[0] : rows;
    if (row?.asset_id) {
      await patchById(ASSET_TABLES.assets, "asset_id", row.asset_id, {
        custodian_employee_id: "",
        custodian_employee_name: "",
        status: "نشط",
      });
    }
    return row;
  },
  loadAssetTransfers(filters = {}) {
    return selectRows(ASSET_TABLES.transfers, filters, "created_at.desc");
  },
  async saveAssetTransfer(transfer) {
    const row = normalizeWorkflowRecord(transfer, "TRF", "transfer_id");
    const saved = await upsertOne(ASSET_TABLES.transfers, row, "company_id,transfer_id");
    if (row.asset_id) {
      await patchById(ASSET_TABLES.assets, "asset_id", row.asset_id, {
        branch: row.to_branch || row.branch,
        location: row.to_location,
      });
    }
    return saved;
  },
  loadAssetMaintenance(filters = {}) {
    return selectRows(ASSET_TABLES.maintenance, filters, "created_at.desc");
  },
  saveAssetMaintenance(record) {
    return upsertOne(ASSET_TABLES.maintenance, normalizeWorkflowRecord(record, "MNT", "maintenance_id"), "company_id,maintenance_id");
  },
  loadAssetDisposals(filters = {}) {
    return selectRows(ASSET_TABLES.disposals, filters, "created_at.desc");
  },
  async saveAssetDisposal(disposal) {
    const row = normalizeWorkflowRecord(disposal, "DSP", "disposal_id");
    const saved = await upsertOne(ASSET_TABLES.disposals, row, "company_id,disposal_id");
    if (row.asset_id) {
      await patchById(ASSET_TABLES.assets, "asset_id", row.asset_id, {
        status: "مستبعد",
      });
    }
    return saved;
  },
  calculateAssetDepreciation,
  async generateMonthlyDepreciation(companyId, month) {
    const cid = requireCompanyId(companyId);
    const targetMonth = month || getAssetTodayDateOnly().slice(0, 7);
    const assets = await this.loadFixedAssets({ company_id: cid });
    const existing = await this.loadDepreciationEntries({ company_id: cid, depreciation_month: targetMonth });
    const existingKeys = new Set(existing.map((row) => `${row.asset_id}-${row.depreciation_month}`));
    const rows = assets
      .filter((asset) => !["مستبعد", "مفقود", "تالف", "غير مستخدم"].includes(asset.status))
      .filter((asset) => !existingKeys.has(`${asset.asset_id}-${targetMonth}`))
      .map((asset) => {
        const result = calculateAssetDepreciation(asset, `${targetMonth}-01`);
        return {
          entry_id: createFixedAssetId("DEP", targetMonth),
          company_id: cid,
          asset_id: asset.asset_id,
          asset_code: asset.asset_code,
          asset_name: asset.asset_name,
          depreciation_month: targetMonth,
          depreciation_amount: result.monthly_depreciation,
          accumulated_depreciation: result.accumulated_depreciation,
          book_value: result.book_value,
          status: "مرحل",
          notes: "",
          updated_at: new Date().toISOString(),
        };
      });
    if (!rows.length) return [];
    const data = await supabase.upsert(ASSET_TABLES.depreciation, rows, { onConflict: "company_id,entry_id" });
    return data || [];
  },
  loadDepreciationEntries(filters = {}) {
    return selectRows(ASSET_TABLES.depreciation, filters, "depreciation_month.desc");
  },
  async getAssetsDashboard(companyId) {
    const cid = requireCompanyId(companyId);
    const [assets, custodies, maintenance, disposals, depreciation] = await Promise.all([
      this.loadFixedAssets({ company_id: cid }),
      this.loadAssetCustodies({ company_id: cid }),
      this.loadAssetMaintenance({ company_id: cid }),
      this.loadAssetDisposals({ company_id: cid }),
      this.loadDepreciationEntries({ company_id: cid }),
    ]);
    const activeAssets = assets.filter((asset) => !["مستبعد", "مفقود", "تالف", "غير مستخدم"].includes(asset.status));
    const totalCost = assets.reduce((sum, asset) => sum + safeNumber(asset.purchase_cost_base || asset.purchase_cost), 0);
    const bookValue = assets.reduce((sum, asset) => sum + safeNumber(asset.book_value || asset.purchase_cost_base || asset.purchase_cost), 0);
    return {
      assets,
      custodies,
      maintenance,
      disposals,
      depreciation,
      stats: {
        totalAssets: assets.length,
        activeAssets: activeAssets.length,
        custodyCount: custodies.filter((row) => row.status !== "مسترجعة").length,
        maintenanceCount: maintenance.length,
        disposedCount: disposals.length,
        totalCost,
        bookValue,
      },
    };
  },
};
