import { useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopHeader } from "@/components/layout/TopHeader";
import { MessageBubble } from "@/components/dashboard/MessageBubble";
import { HumanReplyBox } from "@/components/dashboard/HumanReplyBox";
import { LeadDataCard } from "@/components/dashboard/LeadDataCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/hooks/useApi";
import { getThread } from "@/api/client";
import type { ThreadDetail } from "@/types";

const intentConfig: Record<string, { color: string; dot: string; label: string }> = {
  Lead_Gen: { color: "text-emerald-400", dot: "bg-emerald-500", label: "Lead Gen" },
  Support: { color: "text-amber-400", dot: "bg-amber-500", label: "Support" },
  Spam: { color: "text-slate-400", dot: "bg-slate-500", label: "Spam" },
};

const statusConfig: Record<string, { color: string; dot: string; label: string }> = {
  active: { color: "text-emerald-400", dot: "bg-emerald-500", label: "Active" },
  in_progress: { color: "text-cyan-400", dot: "bg-cyan-500", label: "In Progress" },
  completed: { color: "text-blue-400", dot: "bg-blue-500", label: "Completed" },
  escalated: { color: "text-amber-400", dot: "bg-amber-500", label: "Escalated" },
  discarded: { color: "text-slate-400", dot: "bg-slate-500", label: "Discarded" },
};

function intentBadgeStyle(dot: string) {
  if (dot === "bg-emerald-500") return { bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.2)" };
  if (dot === "bg-amber-500") return { bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.2)" };
  return { bg: "rgba(148,163,184,0.1)", border: "rgba(148,163,184,0.2)" };
}

export default function ConversationView() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { status, data, error, refetch } = useApi<ThreadDetail>(
    () => getThread(sessionId!),
    [sessionId]
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (data?.conversation.length) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [data?.conversation.length]);

  const handleExportSuccess = () => refetch();

  // Loading state
  if (status === "loading") {
    return (
      <div className="flex h-screen bg-background overflow-hidden">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <TopHeader />
          <main className="flex-1 overflow-y-auto p-6 space-y-4">
            <Skeleton className="h-6 w-48" />
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className={`h-20 ${i % 2 === 0 ? "w-3/4" : "w-3/4 ml-auto"}`}
                />
              ))}
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Error state
  if (status === "error") {
    return (
      <div className="flex h-screen bg-background overflow-hidden">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <TopHeader />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <p className="text-lg text-muted-foreground">
                {error?.includes("404") || error?.includes("not found")
                  ? "Session not found / 会话未找到"
                  : error}
              </p>
              <div className="flex items-center justify-center gap-4">
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Sessions / 返回会话列表
                </Link>
                <button
                  onClick={refetch}
                  className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition-colors"
                >
                  Retry / 重试
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const thread = data!;
  const intent = thread.intent ? intentConfig[thread.intent] : null;
  const statusObj = thread.status ? statusConfig[thread.status] : null;
  const badgeStyle = intent ? intentBadgeStyle(intent.dot) : null;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopHeader />
        <main className="flex-1 flex flex-col overflow-hidden p-6 gap-4">
          {/* Sub-header */}
          <div className="flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back / 返回
              </Link>
              <span className="text-sm font-mono font-medium text-primary">
                {thread.session_id.slice(0, 8)}
              </span>
              {intent && badgeStyle && (
                <div
                  className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border"
                  style={{
                    backgroundColor: badgeStyle.bg,
                    borderColor: badgeStyle.border,
                  }}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${intent.dot}`} />
                  <span className={`text-[11px] font-medium ${intent.color}`}>
                    {intent.label}
                  </span>
                </div>
              )}
              {statusObj && (
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${statusObj.dot}`} />
                  <span className={`text-xs ${statusObj.color}`}>{statusObj.label}</span>
                </div>
              )}
              <span className="text-xs text-muted-foreground">
                Turn {thread.turn_count}/{thread.max_turns}
              </span>
              {thread.detected_language && (
                <span className="text-[10px] text-muted-foreground uppercase">
                  {thread.detected_language}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{thread.conversation.length} messages</span>
            </div>
          </div>

          {/* Conversation Area */}
          <div className="flex-[65] min-h-0 rounded-xl border border-border bg-card overflow-hidden flex flex-col">
            {thread.conversation.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">No messages / 暂无消息</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {thread.conversation.map((msg, i) => (
                  <MessageBubble key={i} message={msg} />
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Human Reply Box */}
          {thread.pending_human_input && (
            <HumanReplyBox sessionId={thread.session_id} onSuccess={refetch} />
          )}

          {/* Lead Data Card */}
          <div className="flex-[35] min-h-0 overflow-y-auto">
            <LeadDataCard
              lead={thread.extracted_entities}
              leadExportStatus={thread.lead_export_status}
              sessionId={thread.session_id}
              onExportSuccess={handleExportSuccess}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
