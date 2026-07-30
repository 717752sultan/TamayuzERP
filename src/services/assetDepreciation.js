import { parseOperationDate } from "./dailyOperationsImportExport";

const n = (value) => Number(value || 0) || 0;
const monthAdd = (yyyyMmDd, add) => {
  const [y, m] = String(yyyyMmDd || "").slice(0, 10).split("-").map(Number);
  const date = new Date(y || new Date().getFullYear(), (m || 1) - 1 + add, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

export const assetDepreciationMethods = ["القسط الثابت", "الرصيد المتناقص", "الرصيد المتناقص المضاعف", "وحدات الإنتاج", "مجموع أرقام السنوات"];

export const buildDepreciationSchedule = (asset = {}, options = {}) => {
  const cost = n(options.purchase_cost ?? asset.purchase_cost ?? asset.purchase_cost_base);
  const salvage = n(options.salvage_value ?? asset.residual_value);
  const lifeMonths = Math.max(1, n(options.useful_life_months ?? asset.useful_life_months ?? 60));
  const method = options.depreciation_method || asset.depreciation_method || "القسط الثابت";
  const startDate = parseOperationDate(options.depreciation_start_date || asset.depreciation_start_date || asset.purchase_date) || new Date().toLocaleDateString("en-CA");
  const depreciable = Math.max(0, cost - salvage);
  const sumYears = ((Math.ceil(lifeMonths / 12)) * (Math.ceil(lifeMonths / 12) + 1)) / 2;
  let book = cost;
  let accumulated = 0;
  return Array.from({ length: lifeMonths }).map((_, index) => {
    let monthly = depreciable / lifeMonths;
    if (method === "الرصيد المتناقص") monthly = Math.max(0, (book - salvage) * (1.5 / 12 / Math.ceil(lifeMonths / 12)));
    if (method === "الرصيد المتناقص المضاعف") monthly = Math.max(0, (book - salvage) * (2 / 12 / Math.ceil(lifeMonths / 12)));
    if (method === "مجموع أرقام السنوات") {
      const yearNo = Math.floor(index / 12) + 1;
      const years = Math.ceil(lifeMonths / 12);
      monthly = (depreciable * ((years - yearNo + 1) / sumYears)) / 12;
    }
    if (method === "وحدات الإنتاج") {
      const totalUnits = Math.max(1, n(options.total_production_units));
      const monthUnits = n(options.monthly_production_units) || totalUnits / lifeMonths;
      monthly = depreciable * (monthUnits / totalUnits);
    }
    monthly = Math.min(monthly, Math.max(0, book - salvage));
    accumulated += monthly;
    book = Math.max(salvage, cost - accumulated);
    return {
      period: monthAdd(startDate, index),
      monthly_depreciation: Number(monthly.toFixed(2)),
      annual_depreciation: Number((monthly * 12).toFixed(2)),
      accumulated_depreciation: Number(accumulated.toFixed(2)),
      book_value: Number(book.toFixed(2)),
      method,
    };
  });
};
