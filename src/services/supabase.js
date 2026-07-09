const getConfig = () => ({
  url: import.meta.env.VITE_SUPABASE_URL,
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
});

const assertConfig = () => {
  const config = getConfig();
  if (!config.url || !config.anonKey) {
    throw new Error("Supabase environment variables are missing.");
  }
  return config;
};

const headers = (prefer) => {
  const { anonKey } = assertConfig();
  return {
    apikey: anonKey,
    Authorization: `Bearer ${localStorage.getItem("ep_supabase_access_token") || anonKey}`,
    "Content-Type": "application/json",
    ...(prefer ? { Prefer: prefer } : {}),
  };
};

export const supabase = {
  config: getConfig,
  async request(path, options = {}) {
    const { url } = assertConfig();
    const res = await fetch(`${url}${path}`, {
      ...options,
      headers: { ...headers(options.prefer), ...(options.headers || {}) },
    });
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    if (!res.ok) {
      throw new Error(data?.message || data?.hint || text || "Supabase request failed.");
    }
    return data;
  },
  select(table, query = "select=*") {
    return this.request(`/rest/v1/${table}?${query}`);
  },
  upsert(table, rows) {
    return this.request(`/rest/v1/${table}`, {
      method: "POST",
      prefer: "resolution=merge-duplicates,return=representation",
      body: JSON.stringify(Array.isArray(rows) ? rows : [rows]),
    });
  },
  from(table) {
    const client = this;
    return {
      upsert(payload) {
        const rows = Array.isArray(payload) ? payload : [payload];
        const execute = async () => {
          try {
            const data = await client.request(`/rest/v1/${table}`, {
              method: "POST",
              prefer: "resolution=merge-duplicates,return=representation",
              body: JSON.stringify(rows),
            });
            return { data, error: null };
          } catch (error) {
            return { data: null, error };
          }
        };
        return {
          select() {
            return {
              async single() {
                const { data, error } = await execute();
                return {
                  data: Array.isArray(data) ? data[0] : data,
                  error,
                };
              },
            };
          },
        };
      },
    };
  },
  remove(table, id) {
    return this.request(`/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`, {
      method: "DELETE",
      prefer: "return=minimal",
    });
  },
  rpc(name, payload) {
    return this.request(`/rest/v1/rpc/${name}`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  subscribeToTable(table, onChange) {
    const { url, anonKey } = assertConfig();
    const wsUrl = url.replace(/^http/, "ws");
    const socket = new WebSocket(`${wsUrl}/realtime/v1/websocket?apikey=${anonKey}&vsn=1.0.0`);
    let ref = 1;
    const topic = `realtime:public:${table}`;
    const send = (event, payload = {}, joinRef = null) => {
      socket.send(JSON.stringify({ topic, event, payload, ref: String(ref++), join_ref: joinRef }));
    };
    socket.addEventListener("open", () => {
      send("phx_join", {
        config: {
          broadcast: { self: false },
          presence: { key: "" },
          postgres_changes: [{ event: "*", schema: "public", table }],
        },
      });
    });
    socket.addEventListener("message", (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.event === "postgres_changes") onChange(message.payload);
      } catch {
        // Ignore malformed realtime frames.
      }
    });
    const heartbeat = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ topic: "phoenix", event: "heartbeat", payload: {}, ref: String(ref++) }));
      }
    }, 25000);
    return () => {
      clearInterval(heartbeat);
      if (socket.readyState === WebSocket.OPEN) socket.close();
    };
  },
};
