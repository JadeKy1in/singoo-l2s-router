export interface SessionSummary {
  session_id: string;
  intent: "Lead_Gen" | "Support" | "Spam" | null;
  status: "active" | "in_progress" | "completed" | "escalated" | "discarded" | null;
  thread_title: string | null;
  lead_source: string | null;
  turn_count: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface ConversationMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
}

export interface ExtractedLead {
  company_name: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  country: string | null;
  purchase_intent: "high" | "medium" | "low" | null;
  product_interest: string | null;
  lead_score: number | null;
  score_justification: string | null;
  missing_info: string[];
  notes: string | null;
}

export interface ThreadDetail {
  session_id: string;
  intent: string | null;
  status: string | null;
  lead_source: string | null;
  turn_count: number;
  max_turns: number;
  thread_title: string | null;
  pending_human_input: boolean;
  conversation_complete: boolean;
  detected_language: string | null;
  lead_export_status: "pending" | "exported" | "failed" | null;
  conversation: ConversationMessage[];
  extracted_entities: ExtractedLead | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateThreadRequest {
  user_message: string;
  lead_source?: string;
}

export interface ReplyRequest {
  user_message: string;
}

export type PageState<T> =
  | { status: "loading" }
  | { status: "error"; error: string }
  | { status: "success"; data: T };
