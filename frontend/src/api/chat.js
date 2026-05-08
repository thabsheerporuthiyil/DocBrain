import api from "./axios";
import { clearAuth, getToken } from "../utils/auth";

export const askDocumentQuestion = async ({ documentId, query }) => {
  const response = await api.post("/chat/", {
    document_id: documentId,
    query,
  });

  return response.data;
};

export const getDocumentChatHistory = async (documentId) => {
  const response = await api.get(`/chat/history/${documentId}`);
  return response.data.messages ?? [];
};

export const clearDocumentChatHistory = async (documentId) => {
  await api.delete(`/chat/history/${documentId}`);
};

export const getRecentActivity = async (limit = 20) => {
  const response = await api.get(`/chat/activity?limit=${limit}`);
  return response.data;
};

export const getUsageStats = async () => {
  const response = await api.get("/chat/stats");
  return response.data;
};

export const streamDocumentQuestion = async ({
  documentId,
  query,
  onEvent,
}) => {
  const token = getToken();
  const response = await fetch(`${api.defaults.baseURL}/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      document_id: documentId,
      query,
    }),
  });

  if (response.status === 401) {
    clearAuth();
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    let detail = "Unable to stream an answer right now.";

    try {
      const data = await response.json();
      detail = data.detail ?? detail;
    } catch {
      const text = await response.text();
      if (text) {
        detail = text;
      }
    }

    throw new Error(detail);
  }

  if (!response.body) {
    throw new Error("Streaming is not supported in this browser.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";

    for (const event of events) {
      const dataLines = event
        .split("\n")
        .filter((line) => line.startsWith("data: "));

      for (const line of dataLines) {
        const payload = JSON.parse(line.slice(6));
        onEvent?.(payload);
      }
    }
  }

  if (buffer.trim().startsWith("data: ")) {
    const payload = JSON.parse(buffer.trim().slice(6));
    onEvent?.(payload);
  }
};
