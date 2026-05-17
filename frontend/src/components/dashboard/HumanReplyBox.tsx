import { useState } from "react";
import { Send, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { humanReply } from "@/api/client";
import type { ThreadDetail } from "@/types";

interface HumanReplyBoxProps {
  sessionId: string;
  onSuccess: (updated: ThreadDetail) => void;
}

export function HumanReplyBox({ sessionId, onSuccess }: HumanReplyBoxProps) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const MAX = 10000;

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError("");
    try {
      const result = await humanReply(sessionId, { user_message: text.trim() });
      setSent(true);
      onSuccess(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send reply");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
        <p className="text-sm text-emerald-400">
          Reply sent. Session completed. / 回复已发送，会话已完成。
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-3">
      <div className="flex items-center gap-2 text-amber-400">
        <AlertTriangle className="w-4 h-4" />
        <span className="text-sm font-medium">
          This session has been escalated and is waiting for a human response. /
          此会话已转接，等待人工回复。
        </span>
      </div>

      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, MAX))}
        placeholder="Type your reply... / 输入回复..."
        className="min-h-[80px] resize-none bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground"
        disabled={loading}
      />
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">
          {text.length} / {MAX.toLocaleString()}
        </span>
        <Button
          onClick={handleSubmit}
          disabled={!text.trim() || loading}
          className="gap-2"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          Send Reply / 发送回复
        </Button>
      </div>
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}
