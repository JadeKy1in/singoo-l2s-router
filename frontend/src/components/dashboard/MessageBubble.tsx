import type { ConversationMessage } from "@/types";

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function renderContent(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br/>");
}

interface MessageBubbleProps {
  message: ConversationMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  if (message.role === "system") {
    return (
      <div className="flex justify-center">
        <p className="text-xs text-muted-foreground italic max-w-[80%] text-center">
          {message.content}
        </p>
      </div>
    );
  }

  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[75%] rounded-xl px-4 py-3 ${
          isUser
            ? "bg-slate-800/50 border border-slate-700/50 text-foreground"
            : "bg-blue-600/20 border border-blue-500/30 text-blue-100"
        }`}
      >
        <span
          className={`text-[10px] font-semibold uppercase tracking-wide ${
            isUser ? "text-slate-400" : "text-blue-400"
          }`}
        >
          {isUser ? "User" : "Assistant"}
        </span>
        <div
          className="text-sm leading-relaxed mt-1"
          dangerouslySetInnerHTML={{ __html: renderContent(message.content) }}
        />
        <p
          className={`text-[10px] mt-2 ${
            isUser ? "text-muted-foreground" : "text-blue-400/70"
          }`}
        >
          {formatTimestamp(message.timestamp)}
        </p>
      </div>
    </div>
  );
}
