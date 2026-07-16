import {
  APP_DESCRIPTION,
  APP_OFFICIAL_NAME,
  APP_REPORT_SUBTITLE,
  APP_REPORT_TITLE,
  APP_SHORT_NAME,
  APP_VENDOR_NAME,
  DEFAULT_PROVIDER_LOGO_URL,
} from "../constants/branding";
import { supabase } from "./supabase";

export const getProviderLogoUrl = (platformSettings = {}) =>
  platformSettings?.provider_logo_url ||
  platformSettings?.platform_branding?.provider_logo_url ||
  DEFAULT_PROVIDER_LOGO_URL ||
  "";

export const getCompanyLogoUrl = (currentCompany = {}) =>
  currentCompany?.logo_url ||
  currentCompany?.company_logo_url ||
  currentCompany?.report_logo_url ||
  currentCompany?.logo ||
  currentCompany?.logoUrl ||
  "";

export async function loadProviderBranding() {
  try {
    const rows = await supabase.select("platform_branding", "id=eq.default&select=*").catch(() => []);
    return Array.isArray(rows) ? rows[0] || {} : {};
  } catch (error) {
    console.error("Report branding error:", error);
    return {};
  }
}

export async function loadCompanyReportBranding(companyId) {
  if (!companyId) return {};
  try {
    const rows = await supabase.select("companies", `company_id=eq.${encodeURIComponent(companyId)}&select=*`).catch(() => []);
    return Array.isArray(rows) ? rows[0] || {} : {};
  } catch (error) {
    console.error("Report branding error:", error);
    return {};
  }
}

export function getReportBranding({ currentCompany = {}, platformSettings = {} } = {}) {
  const provider = {
    officialName: platformSettings?.official_name || APP_OFFICIAL_NAME,
    shortName: platformSettings?.short_name || APP_SHORT_NAME,
    vendorName: platformSettings?.provider_name || APP_VENDOR_NAME,
    description: platformSettings?.description || APP_DESCRIPTION,
    reportTitle: platformSettings?.report_title || APP_REPORT_TITLE,
    reportSubtitle: platformSettings?.report_subtitle || APP_REPORT_SUBTITLE,
    logoUrl: getProviderLogoUrl(platformSettings),
  };
  const company = {
    id: currentCompany?.company_id || "",
    code: currentCompany?.company_code || "",
    name: currentCompany?.company_name || "",
    logoUrl: getCompanyLogoUrl(currentCompany),
    primaryColor: currentCompany?.primary_color || "#8b1e3f",
  };
  return { provider, company };
}

const htmlEscape = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const logoHtml = (url, fallback, className = "report-logo") =>
  url
    ? `<img class="${className}" src="${htmlEscape(url)}" alt="${htmlEscape(fallback)}" onerror="this.style.display='none';this.nextElementSibling.style.display='grid';" /><span class="${className} report-logo-fallback" style="display:none">${htmlEscape(fallback)}</span>`
    : `<span class="${className} report-logo-fallback">${htmlEscape(fallback)}</span>`;

export function buildReportBrandingHtml({ title = "", currentCompany = {}, platformSettings = {}, printedBy = "" } = {}) {
  const { provider, company } = getReportBranding({ currentCompany, platformSettings });
  const printedAt = new Date().toLocaleString("ar-SA");
  return {
    header: `
      <header class="report-branding-header" style="--accent:${htmlEscape(company.primaryColor)}">
        <div class="report-branding-side">
          ${logoHtml(provider.logoUrl, provider.shortName)}
          <div>
            <h2>${htmlEscape(provider.reportTitle)}</h2>
            <p>${htmlEscape(provider.reportSubtitle)}</p>
          </div>
        </div>
        <div class="report-branding-title">
          <h1>${htmlEscape(title)}</h1>
          <p>${htmlEscape(provider.description)}</p>
        </div>
        <div class="report-branding-side report-branding-company">
          ${logoHtml(company.logoUrl, "شعار الشركة")}
          <div>
            <h2>${htmlEscape(company.name || "الشركة المشتركة")}</h2>
            ${company.code ? `<p>${htmlEscape(company.code)}</p>` : ""}
            ${!company.logoUrl ? `<p class="report-warning">لم يتم رفع شعار الشركة، يرجى إضافته من إعدادات الشركة لضمان ظهور التقارير بشكل رسمي.</p>` : ""}
          </div>
        </div>
      </header>
    `,
    footer: `
      <footer class="report-footer">
        <span>${htmlEscape(provider.officialName)} | ${htmlEscape(provider.shortName)}</span>
        <span>${htmlEscape(provider.reportSubtitle)}</span>
        <span>الشركة: ${htmlEscape(company.name || "غير محددة")}</span>
        <span>تاريخ الطباعة: ${htmlEscape(printedAt)}</span>
        ${printedBy ? `<span>طبع بواسطة: ${htmlEscape(printedBy)}</span>` : ""}
      </footer>
    `,
  };
}
