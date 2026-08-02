import { supabase } from "./supabase";

const now = () => new Date().toISOString();
const id = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
const requireCompany = (companyId) => {
  const value = String(companyId || "").trim();
  if (!value) throw new Error("معرّف الشركة مطلوب.");
  return value;
};
const query = (companyId, filters = {}) => {
  const params = [`company_id=eq.${encodeURIComponent(requireCompany(companyId))}`];
  Object.entries(filters || {}).forEach(([key, value]) => {
    if (value !== "" && value !== null && value !== undefined && value !== "all") params.push(`${key}=eq.${encodeURIComponent(value)}`);
  });
  return params.join("&");
};
const safeList = async (table, companyId, filters = {}, order = "created_at.desc") => {
  try {
    const rows = await supabase.select(table, `select=*&${query(companyId, filters)}&order=${order}`);
    return Array.isArray(rows) ? rows : [];
  } catch (error) {
    console.error(`Pledges list error (${table})`, error);
    return [];
  }
};
const single = async (table, companyId, key, value) => {
  try {
    const rows = await supabase.select(table, `select=*&${query(companyId, { [key]: value })}&limit=1`);
    return Array.isArray(rows) && rows.length ? rows[0] : null;
  } catch (error) {
    console.error(`Pledges single error (${table})`, error);
    return null;
  }
};
const save = async (table, key, prefix, companyId, payload = {}) => {
  const row = { ...(payload || {}), company_id: requireCompany(companyId), [key]: payload?.[key] || id(prefix), updated_at: now() };
  const { data, error } = await supabase.from(table).upsert(row, { onConflict: key }).select().single();
  if (error) throw error;
  return data || row;
};
const update = async (table, key, companyId, value, payload = {}) => {
  requireCompany(companyId);
  const clean = { ...(payload || {}), updated_at: now() };
  delete clean.company_id; delete clean[key]; delete clean.created_at;
  const { data, error } = await supabase.from(table).update(clean).eq("company_id", companyId).eq(key, value).select().single();
  if (error) throw error;
  return data || null;
};
const audit = async (companyId, entityName, entityId, actionType, newData = null, oldData = null, reason = "") => {
  try {
    await supabase.from("pledge_audit_logs").insert({
      audit_id: id("audit"), company_id: requireCompany(companyId), entity_name: entityName,
      entity_id: String(entityId), action_type: actionType, old_data: oldData, new_data: newData,
      action_by: newData?.action_by || newData?.created_by || "", action_at: now(), reason,
    });
  } catch (error) { console.error("Pledges audit log error", error); }
};
const statusLog = async (companyId, pledgeId, oldStatus, newStatus, actionBy = "", reason = "") => {
  try {
    await supabase.from("pledge_status_logs").insert({
      log_id: id("status"), company_id: requireCompany(companyId), pledge_id: pledgeId,
      old_status: oldStatus || "", new_status: newStatus, action_by: actionBy, action_at: now(), reason,
    });
  } catch (error) { console.error("Pledges status log error", error); }
};

export const listPledges = (companyId, filters = {}) => safeList("pledge_contracts", companyId, filters, "pledge_date.desc");
export const getPledgeById = (companyId, pledgeId) => single("pledge_contracts", companyId, "pledge_id", pledgeId);
export const createPledge = async (companyId, payload = {}) => {
  const row = await save("pledge_contracts", "pledge_id", "pledge", companyId, {
    ...payload, pledge_no: payload.pledge_no || `PLG-${Date.now()}`,
    status: payload.status || "مسودة", approval_status: payload.approval_status || "غير معتمد",
    remaining_amount: Number(payload.approved_amount || 0) + Number(payload.total_fees || 0) - Number(payload.total_paid || 0),
  });
  await audit(companyId, "pledge_contracts", row.pledge_id, "create", row);
  return row;
};
export const updatePledge = async (companyId, pledgeId, payload = {}) => {
  const old = await getPledgeById(companyId, pledgeId);
  const row = await update("pledge_contracts", "pledge_id", companyId, pledgeId, payload);
  await audit(companyId, "pledge_contracts", pledgeId, "update", row, old);
  return row;
};
export const changePledgeStatus = async (companyId, pledgeId, newStatus, reason = "", actionBy = "") => {
  const old = await getPledgeById(companyId, pledgeId);
  const row = await updatePledge(companyId, pledgeId, { status: newStatus });
  await statusLog(companyId, pledgeId, old?.status, newStatus, actionBy, reason);
  await audit(companyId, "pledge_contracts", pledgeId, "status_change", row, old, reason);
  return row;
};
export const cancelPledge = (companyId, pledgeId, reason) => changePledgeStatus(companyId, pledgeId, "ملغي", reason);
export const approvePledge = async (companyId, pledgeId, approvedBy) => {
  const assets = await listPledgeAssets(companyId, pledgeId);
  if (!assets.length) throw new Error("لا يمكن اعتماد الرهن دون إضافة أصل واحد على الأقل.");
  const row = await updatePledge(companyId, pledgeId, { approved_by: approvedBy, approval_status: "معتمد", status: "نشط" });
  await statusLog(companyId, pledgeId, "", "نشط", approvedBy, "اعتماد الرهن");
  await audit(companyId, "pledge_contracts", pledgeId, "approve", row);
  return row;
};

export const listPledgeCustomers = (companyId, filters = {}) => safeList("pledge_customers", companyId, filters, "customer_name.asc");
export const createPledgeCustomer = async (companyId, payload = {}) => {
  const row = await save("pledge_customers", "customer_id", "customer", companyId, payload);
  await audit(companyId, "pledge_customers", row.customer_id, "create", row); return row;
};
export const updatePledgeCustomer = (companyId, customerId, payload = {}) => update("pledge_customers", "customer_id", companyId, customerId, payload);

export const listPledgeAssets = (companyId, pledgeId) => safeList("pledge_assets", companyId, pledgeId ? { pledge_id: pledgeId } : {});
export const createPledgeAsset = async (companyId, payload = {}) => {
  const row = await save("pledge_assets", "asset_id", "asset", companyId, payload);
  await audit(companyId, "pledge_assets", row.asset_id, "create", row); return row;
};
export const updatePledgeAsset = async (companyId, assetId, payload = {}) => {
  const row = await update("pledge_assets", "asset_id", companyId, assetId, payload);
  await audit(companyId, "pledge_assets", assetId, payload.storage_location_id ? "vault_movement" : "update", row); return row;
};

export const createAssetValuation = async (companyId, payload = {}) => {
  const row = await save("pledge_asset_valuations", "valuation_id", "valuation", companyId, payload);
  await audit(companyId, "pledge_asset_valuations", row.valuation_id, "asset_valuation", row); return row;
};
export const listAssetValuations = (companyId, pledgeId) => safeList("pledge_asset_valuations", companyId, pledgeId ? { pledge_id: pledgeId } : {}, "valuation_date.desc");
export const approveAssetValuation = (companyId, valuationId, approvedBy) => update("pledge_asset_valuations", "valuation_id", companyId, valuationId, { approved_by: approvedBy, approval_status: "معتمد" });

export const listPledgePayments = (companyId, pledgeId) => safeList("pledge_payments", companyId, pledgeId ? { pledge_id: pledgeId } : {}, "payment_date.desc");
export const calculatePledgeBalance = async (companyId, pledgeId) => {
  const pledge = await getPledgeById(companyId, pledgeId);
  if (!pledge) return null;
  const payments = await listPledgePayments(companyId, pledgeId);
  const totalPaid = payments.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  return { approved_amount: Number(pledge.approved_amount || 0), total_fees: Number(pledge.total_fees || 0), total_paid: totalPaid, remaining_amount: Math.max(0, Number(pledge.approved_amount || 0) + Number(pledge.total_fees || 0) - totalPaid) };
};
export const createPledgePayment = async (companyId, payload = {}) => {
  try {
    const row = await save("pledge_payments", "payment_id", "payment", companyId, payload);
    const balance = await calculatePledgeBalance(companyId, row.pledge_id);
    if (balance) {
      await updatePledge(companyId, row.pledge_id, balance);
      if (balance.remaining_amount <= 0 && payload.payment_type === "سداد كامل") {
        await changePledgeStatus(companyId, row.pledge_id, "مفكوك", "سداد كامل وفك الرهن", payload.received_by || "");
      }
    }
    await audit(companyId, "pledge_payments", row.payment_id, "payment", row);
    return { ...row, balance };
  } catch (error) {
    console.error("Pledge payment create error", error);
    throw error;
  }
};
export const createPledgeFee = async (companyId, payload = {}) => {
  try {
    const row = await save("pledge_fees", "fee_id", "fee", companyId, payload);
    await audit(companyId, "pledge_fees", row.fee_id, "create", row);
    return row;
  } catch (error) {
    console.error("Pledge fee create error", error);
    throw error;
  }
};

export const listStorageLocations = (companyId) => safeList("pledge_storage_locations", companyId, { is_active: true });
export const createStorageLocation = (companyId, payload = {}) => save("pledge_storage_locations", "location_id", "location", companyId, payload);
export const updateStorageLocation = (companyId, locationId, payload = {}) => update("pledge_storage_locations", "location_id", companyId, locationId, payload);

export const listPledgeNotifications = (companyId, filters = {}) => safeList("pledge_notifications", companyId, filters, "notification_date.desc");
export const createPledgeNotification = (companyId, payload = {}) => save("pledge_notifications", "notification_id", "notification", companyId, payload);
export const markNotificationSent = (companyId, notificationId) => update("pledge_notifications", "notification_id", companyId, notificationId, { status: "مرسل", sent_at: now() });

export const listDisposals = (companyId, filters = {}) => safeList("pledge_disposals", companyId, filters, "disposal_date.desc");
export const createDisposal = async (companyId, payload = {}) => {
  try {
    const pledge = await getPledgeById(companyId, payload.pledge_id);
    if (!["متأخر", "تحت التصفية"].includes(pledge?.status)) throw new Error("لا يمكن تصفية الرهن إلا إذا كان متأخرًا أو تحت التصفية.");
    const row = await save("pledge_disposals", "disposal_id", "disposal", companyId, payload);
    const completed = ["معتمد", "مكتمل", "تمت التصفية", "مصفى"].includes(String(payload.disposal_status || ""));
    if (completed) await changePledgeStatus(companyId, payload.pledge_id, "مصفى", payload.reason || "تسجيل التصفية", payload.approved_by || "");
    await audit(companyId, "pledge_disposals", row.disposal_id, "liquidation", row);
    return row;
  } catch (error) {
    console.error("Pledge disposal create error", error);
    throw error;
  }
};
export const approveDisposal = async (companyId, disposalId, approvedBy) => {
  const row = await update("pledge_disposals", "disposal_id", companyId, disposalId, { approved_by: approvedBy, disposal_status: "معتمد" });
  if (row?.pledge_id) await changePledgeStatus(companyId, row.pledge_id, "مصفى", "اعتماد التصفية", approvedBy);
  return row;
};

const reportByStatuses = async (companyId, statuses = [], filters = {}) => {
  const rows = await listPledges(companyId, filters);
  return rows.filter((row) => statuses.includes(row.status));
};
export const getActivePledgesReport = (companyId, filters = {}) => reportByStatuses(companyId, ["نشط", "مستحق قريبًا", "ممدد"], filters);
export const getDuePledgesReport = async (companyId, filters = {}) => {
  const reminderDays = Math.max(0, Number(filters.reminder_days_before_due ?? 7));
  const cleanFilters = { ...(filters || {}) };
  delete cleanFilters.reminder_days_before_due;
  const rows = await listPledges(companyId, cleanFilters);
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const limit = new Date(start); limit.setDate(limit.getDate() + reminderDays);
  return rows.filter((row) => ["نشط", "ممدد", "مستحق قريبًا"].includes(row.status)
    && row.due_date && new Date(row.due_date).getTime() >= start.getTime()
    && new Date(row.due_date).getTime() <= limit.getTime());
};
export const getOverduePledgesReport = async (companyId, filters = {}) => {
  const rows = await listPledges(companyId, filters);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return rows.filter((row) => row.due_date
    && new Date(row.due_date).getTime() < today.getTime()
    && Number(row.remaining_amount || 0) > 0
    && !["مفكوك", "مصفى", "ملغي", "مرفوض"].includes(row.status));
};
export const listPledgeStatusLogs = (companyId, filters = {}) => safeList("pledge_status_logs", companyId, filters, "action_at.desc");
export const getVaultAssetsReport = (companyId, filters = {}) => safeList("pledge_assets", companyId, filters);
export const getCustomerPledgesReport = (companyId, customerId) => listPledges(companyId, { customer_id: customerId });
export const getPledgesDashboardStats = async (companyId, filters = {}) => {
  const [pledges, assets] = await Promise.all([listPledges(companyId, filters), getVaultAssetsReport(companyId)]);
  const due = await getDuePledgesReport(companyId, filters), overdue = await getOverduePledgesReport(companyId, filters);
  const active = pledges.filter((x) => ["نشط", "مستحق قريبًا", "ممدد"].includes(x.status));
  return {
    active_count: active.length, approved_amount_total: active.reduce((s,x)=>s+Number(x.approved_amount||0),0),
    asset_value_total: assets.reduce((s,x)=>s+Number(x.accepted_pledge_value||x.estimated_market_value||0),0),
    due_soon_count: due.length, overdue_count: overdue.length, redeemed_count: pledges.filter(x=>x.status==="مفكوك").length,
    liquidation_count: pledges.filter(x=>x.status==="تحت التصفية").length,
    risk_percent: pledges.length ? Math.round((overdue.length / pledges.length) * 100) : 0, pledges, assets,
  };
};
export const listPledgeAuditLogs = (companyId, filters = {}) => safeList("pledge_audit_logs", companyId, filters, "action_at.desc");
export const listPledgeSettings = (companyId) => safeList("pledge_settings", companyId, {}, "asset_type.asc");
export const upsertPledgeSetting = (companyId, payload = {}) => save("pledge_settings", "setting_id", "setting", companyId, payload);

export const pledgeStatuses = ["مسودة","قيد التقييم","بانتظار الاعتماد","نشط","مستحق قريبًا","متأخر","ممدد","مفكوك","تحت التصفية","مصفى","ملغي","مرفوض"];
export const pledgeAssetTypes = ["ذهب","فضة","مجوهرات","جوال","سيارة","معدات","وثيقة عقار","أصل آخر"];
export const pledgePaymentTypes = ["سداد جزئي","سداد كامل","رسوم حفظ","رسوم تقييم","رسوم إدارية","رسوم تمديد"];
export const pledgeNotificationTypes = ["تذكير قبل الاستحقاق","إشعار استحقاق","إشعار تأخير","إشعار نهائي","إشعار تصفية"];

export const pledgesService = {
  listPledges,getPledgeById,createPledge,updatePledge,cancelPledge,approvePledge,changePledgeStatus,
  listPledgeCustomers,createPledgeCustomer,updatePledgeCustomer,listPledgeAssets,createPledgeAsset,updatePledgeAsset,
  createAssetValuation,listAssetValuations,approveAssetValuation,listPledgePayments,createPledgePayment,createPledgeFee,calculatePledgeBalance,
  listStorageLocations,createStorageLocation,updateStorageLocation,listPledgeNotifications,createPledgeNotification,markNotificationSent,
  listDisposals,createDisposal,approveDisposal,getPledgesDashboardStats,getActivePledgesReport,getDuePledgesReport,
  getOverduePledgesReport,getVaultAssetsReport,getCustomerPledgesReport,listPledgeStatusLogs,listPledgeAuditLogs,listPledgeSettings,upsertPledgeSetting,
};
export default pledgesService;
