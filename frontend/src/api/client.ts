import type {
  SessionSummary,
  ThreadDetail,
  CreateThreadRequest,
  ReplyRequest,
  ExtractedLead,
} from "@/types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
const API_AUTH_TOKEN = import.meta.env.VITE_API_AUTH_TOKEN || "";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function apiRequest<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(API_AUTH_TOKEN
      ? { Authorization: `Bearer ${API_AUTH_TOKEN}` }
      : {}),
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { ...headers, ...options?.headers },
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: "Unknown error" }));
    throw new ApiError(response.status, error.detail || "Unknown error");
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

export function getThreads(): Promise<SessionSummary[]> {
  return apiRequest<SessionSummary[]>("/threads");
}

export function getThread(sessionId: string): Promise<ThreadDetail> {
  return apiRequest<ThreadDetail>(`/thread/${sessionId}`);
}

export function createThread(
  body: CreateThreadRequest
): Promise<ThreadDetail> {
  return apiRequest<ThreadDetail>("/thread", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function replyToThread(
  sessionId: string,
  body: ReplyRequest
): Promise<ThreadDetail> {
  return apiRequest<ThreadDetail>(`/thread/${sessionId}/reply`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function humanReply(
  sessionId: string,
  body: ReplyRequest
): Promise<ThreadDetail> {
  return apiRequest<ThreadDetail>(`/thread/${sessionId}/human-reply`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function exportLead(sessionId: string): Promise<{
  session_id: string;
  export_status: string;
  lead: ExtractedLead | null;
}> {
  return apiRequest(`/thread/${sessionId}/export`, {
    method: "POST",
  });
}

export function getHealth(): Promise<{ status: string }> {
  return apiRequest<{ status: string }>("/health");
}
