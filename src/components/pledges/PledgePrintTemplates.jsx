export const pledgeDocumentTitles = {
  contract: "عقد رهن عيني",
  receipt: "سند استلام أصل مرهون",
  delivery: "سند تسليم أصل للعميل",
  due: "إشعار استحقاق",
  overdue: "إشعار تأخير",
  redemption: "إشعار فك رهن",
  liquidation: "إشعار تصفية",
};

const escapeHtml = (value = "") => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));

export const buildPledgeDocumentHtml = (type, data = {}, company = {}) => {
  const title = pledgeDocumentTitles[type] || "مستند رهن";
  const asset = data.asset || {};
  return `<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>${title}</title>
  <style>body{font-family:Tahoma,Arial,sans-serif;color:#172033;padding:38px;line-height:2}h1{color:#312e81;border-bottom:2px solid #312e81;padding-bottom:12px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.box{border:1px solid #cbd5e1;border-radius:10px;padding:14px}.sign{display:grid;grid-template-columns:repeat(3,1fr);gap:22px;margin-top:55px}</style></head><body>
  <h1>${title}</h1><div class="box"><b>بيانات الشركة</b><br>${escapeHtml(company.company_name || company.name || "")}</div>
  <div class="grid"><div class="box"><b>بيانات العميل</b><br>الاسم: ${escapeHtml(data.customer_name)}<br>الهوية: ${escapeHtml(data.identity_number)}<br>الجوال: ${escapeHtml(data.phone)}</div>
  <div class="box"><b>بيانات الأصل</b><br>النوع: ${escapeHtml(asset.asset_type || data.asset_type)}<br>الوصف: ${escapeHtml(asset.asset_description || data.asset_description)}<br>إثبات الملكية: ${escapeHtml(asset.ownership_proof || "")}</div></div>
  <div class="box"><b>بيانات الرهن</b><br>رقم الرهن: ${escapeHtml(data.pledge_no)}<br>مبلغ الرهن: ${escapeHtml(data.approved_amount)}<br>تاريخ الرهن: ${escapeHtml(data.pledge_date)}<br>تاريخ الاستحقاق: ${escapeHtml(data.due_date)}<br>مدة الرهن وشروطه: ${escapeHtml(data.notes || "وفق الشروط المعتمدة لدى الشركة.")}</div>
  <p>يقر العميل بملكية الأصل وصحة بياناته، وباستلام مبلغ الرهن المبين أعلاه، وباطلاعه على شروط الرهن والاستحقاق والتصفية.</p>
  <div class="sign"><div>توقيع العميل:<br><br>____________</div><div>توقيع الموظف:<br><br>____________</div><div>اعتماد الإدارة:<br><br>____________</div></div>
  </body></html>`;
};

export const printPledgeDocument = (type, data = {}, company = {}) => {
  try {
    const popup = window.open("", "_blank");
    if (!popup) throw new Error("تعذر فتح نافذة الطباعة");
    popup.document.write(buildPledgeDocumentHtml(type, data, company));
    popup.document.close();
    popup.focus();
    popup.print();
  } catch (error) {
    console.error("Pledge document print error", error);
  }
};
