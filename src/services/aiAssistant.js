import { buildAssistantBusinessContext, executeAssistantAction } from "./aiActions";
import { guaranteesService } from "./guarantees";
import { inventoryService } from "./inventory";
import { supabase } from "./supabase";

const messageFromDb = (row = {}) => ({
  message_id: row.message_id,
  session_id: row.session_id || "",
  user_id: row.user_id || "",
  role: row.role || "assistant",
  message: row.message || "",
  context: row.context || {},
  created_at: row.created_at || "",
});

const fallbackSession = (userId = "", title = "محادثة المساعد") => ({
  session_id: `LOCAL-CHAT-${Date.now()}`,
  user_id: userId,
  title,
  localOnly: true,
  updated_at: new Date().toISOString(),
});

export const aiAssistantService = {
  async createChatSession(userId = "", title = "محادثة المساعد") {
    const payload = { session_id: `CHAT-${Date.now()}`, user_id: userId, title, updated_at: new Date().toISOString() };
    try {
      const { data, error } = await supabase.from("ai_chat_sessions").upsert(payload, { onConflict: "session_id" }).select().single();
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("AI assistant chat session error:", error);
      return fallbackSession(userId, title);
    }
  },
  async loadChatMessages(sessionId) {
    try {
      const rows = await supabase.select("ai_chat_messages", `session_id=eq.${encodeURIComponent(sessionId)}&select=*&order=created_at.asc`);
      return (rows || []).map(messageFromDb);
    } catch (error) {
      console.error("AI assistant messages load error:", error);
      return [];
    }
  },
  async saveChatMessage(message) {
    if (String(message.session_id || "").startsWith("LOCAL-CHAT")) return message;
    const payload = {
      message_id: message.message_id || `MSG-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      session_id: message.session_id,
      user_id: message.user_id || "",
      role: message.role,
      message: String(message.message || ""),
      context: message.context || {},
      created_at: new Date().toISOString(),
    };
    try {
      const { data, error } = await supabase.from("ai_chat_messages").upsert(payload, { onConflict: "message_id" }).select().single();
      if (error) throw error;
      return messageFromDb(data);
    } catch (error) {
      console.error("AI assistant message save error:", error);
      return message;
    }
  },
  async buildAssistantContext(input = {}) {
    const loadInventoryItems = inventoryService.loadInventoryItems
      ? inventoryService.loadInventoryItems.bind(inventoryService)
      : async () => [];
    const [items, guarantees] = await Promise.all([
      loadInventoryItems().catch(() => []),
      guaranteesService.list().catch(() => []),
    ]);
    return buildAssistantBusinessContext({
      ...input,
      inventoryItems: items || [],
      guarantees: guarantees || [],
    });
  },
  async generateAssistantReply(question, context = {}, handlers = {}) {
    const businessContext = context?.employeeCount !== undefined ? context : await this.buildAssistantContext(context);
    const actionResult = executeAssistantAction({
      message: question,
      context: businessContext,
      canOpenPage: handlers.canOpenPage,
      navigateToPage: handlers.navigateToPage,
    });

    if (actionResult?.type === "navigation") return actionResult.reply;

    const endpoint = import.meta.env.VITE_AI_ASSISTANT_ENDPOINT;
    if (endpoint) {
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question, context: businessContext, draft: actionResult?.reply }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.reply) return data.reply;
        }
      } catch (error) {
        console.error("AI assistant endpoint error:", error);
      }
    }

    return actionResult?.reply || "لم أتمكن من فهم الطلب. اكتب الأمر بصيغة أوضح مثل: افتح صفحة الموظفين أو أنشئ تقرير أداء شهري.";
  },
};
