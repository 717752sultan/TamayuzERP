import { supabase } from "./supabase";
import { dailyOperationsService } from "./dailyOperations";
import { inventoryService } from "./inventory";
import { performanceCriteriaService } from "./performanceCriteria";

const messageFromDb = (row = {}) => ({
  message_id: row.message_id,
  session_id: row.session_id || "",
  user_id: row.user_id || "",
  role: row.role || "assistant",
  message: row.message || "",
  context: row.context || {},
  created_at: row.created_at || "",
});

export const aiAssistantService = {
  async createChatSession(userId = "", title = "محادثة جديدة") {
    const payload = { session_id: `CHAT-${Date.now()}`, user_id: userId, title, updated_at: new Date().toISOString() };
    const { data, error } = await supabase.from("ai_chat_sessions").upsert(payload, { onConflict: "session_id" }).select().single();
    if (error) throw new Error("فشل إنشاء جلسة المساعد: " + error.message);
    return data;
  },
  async loadChatMessages(sessionId) {
    try {
      const rows = await supabase.select("ai_chat_messages", `session_id=eq.${encodeURIComponent(sessionId)}&select=*&order=created_at.asc`);
      return (rows || []).map(messageFromDb);
    } catch (error) {
      console.error("AI assistant error:", error);
      return [];
    }
  },
  async saveChatMessage(message) {
    const payload = {
      message_id: message.message_id || `MSG-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      session_id: message.session_id,
      user_id: message.user_id || "",
      role: message.role,
      message: String(message.message || ""),
      context: message.context || {},
      created_at: new Date().toISOString(),
    };
    const { data, error } = await supabase.from("ai_chat_messages").upsert(payload, { onConflict: "message_id" }).select().single();
    if (error) throw new Error("فشل حفظ رسالة المساعد: " + error.message);
    return messageFromDb(data);
  },
  async buildAssistantContext() {
    const [operations, items, criteria] = await Promise.all([
      dailyOperationsService.loadDailyOperations().catch(() => []),
      inventoryService.loadInventoryItems().catch(() => []),
      performanceCriteriaService.loadKpiCriteria().catch(() => []),
    ]);
    return { operations, items, criteria };
  },
  summarizeInventoryData(items = []) {
    const low = items.filter((item) => Number(item.current_balance || 0) <= Number(item.reorder_point || 0));
    return `إجمالي الأصناف ${items.length}، والأصناف التي تحتاج شراء ${low.length}. ${low.slice(0, 5).map((x) => x.item_name).join("، ")}`;
  },
  summarizeDailyOperationsData(operations = []) {
    const total = operations.reduce((sum, op) => sum + Number(op.operation_count || 0), 0);
    const errors = operations.reduce((sum, op) => sum + Number(op.error_count || 0), 0);
    return `إجمالي العمليات المسجلة ${total}، وعدد الأخطاء ${errors}، ونسبة الأخطاء ${total ? ((errors / total) * 100).toFixed(2) : 0}%.`;
  },
  summarizePerformanceData(criteria = []) {
    const jobs = new Set(criteria.map((c) => c.job_name).filter(Boolean));
    return `يوجد ${criteria.length} معيار أداء موزعة على ${jobs.size} وظيفة. راجع الأوزان للتأكد من أن كل وظيفة مجموعها 100%.`;
  },
  async generateAssistantReply(question, context = null) {
    const endpoint = import.meta.env.VITE_AI_ASSISTANT_ENDPOINT;
    if (endpoint) {
      try {
        const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question, context }) });
        if (res.ok) {
          const data = await res.json();
          if (data?.reply) return data.reply;
        }
      } catch (error) {
        console.error("AI assistant endpoint error:", error);
      }
    }
    const ctx = context || await this.buildAssistantContext();
    const q = String(question || "");
    if (q.includes("مخزون") || q.includes("شراء") || q.includes("الأصناف")) return this.summarizeInventoryData(ctx.items);
    if (q.includes("عمليات") || q.includes("إنتاجية") || q.includes("فرع")) return this.summarizeDailyOperationsData(ctx.operations);
    if (q.includes("معايير") || q.includes("KPI") || q.includes("تقييم")) return this.summarizePerformanceData(ctx.criteria);
    return `أعمل حاليًا بوضع التحليل الداخلي بدون اتصال خارجي. بناءً على البيانات المتاحة: ${this.summarizeDailyOperationsData(ctx.operations)} ${this.summarizeInventoryData(ctx.items)} أنصح بمراجعة الموظفين منخفضي الإنتاجية داخل نفس الوظيفة فقط، ثم إعداد خطة تحسين أو حافز حسب النتيجة.`;
  },
};
