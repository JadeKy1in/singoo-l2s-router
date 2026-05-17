import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, MoreVertical, ChevronUp, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { SessionSummary } from "@/types";

const intentConfig: Record<
  string,
  { color: string; dot: string; label: string }
> = {
  Lead_Gen: {
    color: "text-emerald-400",
    dot: "bg-emerald-400",
    label: "Lead Gen",
  },
  Support: { color: "text-amber-400", dot: "bg-amber-400", label: "Support" },
  Spam: { color: "text-slate-400", dot: "bg-slate-400", label: "Spam" },
};

const statusConfig: Record<
  string,
  { color: string; dot: string; label: string }
> = {
  active: { color: "text-emerald-400", dot: "bg-emerald-400", label: "Active" },
  in_progress: {
    color: "text-cyan-400",
    dot: "bg-cyan-400",
    label: "In Progress",
  },
  completed: {
    color: "text-blue-400",
    dot: "bg-blue-400",
    label: "Completed",
  },
  escalated: {
    color: "text-amber-400",
    dot: "bg-amber-400",
    label: "Escalated",
  },
  discarded: {
    color: "text-slate-400",
    dot: "bg-slate-400",
    label: "Discarded",
  },
};

type SortKey = "intent" | "status" | "turn_count";
type SortDir = "asc" | "desc";

const columns: { key: string; label: string; labelCn: string; sortable?: boolean }[] = [
  { key: "session_id", label: "Session ID", labelCn: "会话 ID" },
  { key: "thread_title", label: "Title", labelCn: "标题" },
  { key: "lead_source", label: "Source", labelCn: "来源" },
  { key: "intent", label: "Intent", labelCn: "意图", sortable: true },
  { key: "status", label: "Status", labelCn: "状态", sortable: true },
  { key: "turn_count", label: "Turns", labelCn: "轮次", sortable: true },
  { key: "updated_at", label: "Updated At", labelCn: "更新时间" },
];

function formatTime(iso: string | null): string {
  if (!iso) return "--";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function truncateId(id: string): string {
  return id.slice(0, 8);
}

interface SessionsTableProps {
  sessions: SessionSummary[];
  loading?: boolean;
  onRefresh?: () => void;
}

export function SessionsTable({ sessions, loading, onRefresh }: SessionsTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterIntent, setFilterIntent] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const navigate = useNavigate();

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sortIcon = (key: SortKey) => {
    if (sortKey !== key) return null;
    return sortDir === "asc" ? (
      <ChevronUp className="w-3 h-3" />
    ) : (
      <ChevronDown className="w-3 h-3" />
    );
  };

  const filtered = useMemo(() => {
    let result = sessions;

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.session_id.toLowerCase().includes(q) ||
          (s.thread_title || "").toLowerCase().includes(q) ||
          (s.lead_source || "").toLowerCase().includes(q)
      );
    }

    // Intent filter
    if (filterIntent !== "All") {
      result = result.filter((s) => s.intent === filterIntent);
    }

    // Status filter
    if (filterStatus !== "All") {
      result = result.filter((s) => s.status === filterStatus);
    }

    // Sort (client-side)
    if (sortKey) {
      result = [...result].sort((a, b) => {
        let va: string | number = a[sortKey] ?? "";
        let vb: string | number = b[sortKey] ?? "";
        if (sortKey === "turn_count") {
          va = va as number;
          vb = vb as number;
          return sortDir === "asc" ? va - vb : vb - va;
        }
        return sortDir === "asc"
          ? String(va).localeCompare(String(vb))
          : String(vb).localeCompare(String(va));
      });
    }

    return result;
  }, [sessions, searchQuery, filterIntent, filterStatus, sortKey, sortDir]);

  return (
    <div className="flex flex-col rounded-xl bg-card border border-border overflow-hidden">
      {/* Table Header */}
      <div className="flex items-center justify-between p-5 border-b border-border">
        <div className="flex flex-col">
          <h2 className="text-lg font-semibold text-foreground">All Sessions</h2>
          <span className="text-[10px] text-muted-foreground">所有会话</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-40 pl-9 h-9 bg-secondary/50 border-border text-sm"
            />
          </div>

          {/* Intent Filter */}
          <select
            value={filterIntent}
            onChange={(e) => setFilterIntent(e.target.value)}
            className="h-9 px-3 rounded-md bg-secondary/50 border border-border text-sm text-foreground outline-none focus:border-ring cursor-pointer"
          >
            <option value="All">Intent / 意图</option>
            <option value="Lead_Gen">Lead Gen</option>
            <option value="Support">Support</option>
            <option value="Spam">Spam</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-9 px-3 rounded-md bg-secondary/50 border border-border text-sm text-foreground outline-none focus:border-ring cursor-pointer"
          >
            <option value="All">Status / 状态</option>
            <option value="active">Active</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="escalated">Escalated</option>
            <option value="discarded">Discarded</option>
          </select>

          {/* Refresh */}
          <button
            className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors"
            onClick={onRefresh}
          >
            <Filter className="w-4 h-4" />
          </button>
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {filtered.length} sessions
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider ${
                    col.sortable ? "cursor-pointer hover:text-foreground select-none" : ""
                  }`}
                  onClick={() => col.sortable && handleSort(col.key as SortKey)}
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1">
                      <span>{col.label}</span>
                      {col.sortable && sortIcon(col.key as SortKey)}
                    </div>
                    <span className="text-[9px] font-normal normal-case text-muted-foreground/70">
                      {col.labelCn}
                    </span>
                  </div>
                </th>
              ))}
              <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <div className="flex flex-col">
                  <span>Action</span>
                  <span className="text-[9px] font-normal normal-case text-muted-foreground/70">
                    操作
                  </span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={col.key} className="px-5 py-4">
                      <Skeleton className="h-4 w-24" />
                    </td>
                  ))}
                  <td className="px-5 py-4">
                    <Skeleton className="h-4 w-8" />
                  </td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="px-5 py-12 text-center text-muted-foreground"
                >
                  {sessions.length === 0
                    ? "No sessions yet. Create one via POST /thread / 暂无会话，请通过 POST /thread 创建"
                    : "No matching sessions / 无匹配会话"}
                </td>
              </tr>
            ) : (
              filtered.map((session) => {
                const intent = session.intent
                  ? intentConfig[session.intent]
                  : null;
                const status = session.status
                  ? statusConfig[session.status]
                  : null;

                return (
                  <tr
                    key={session.session_id}
                    onClick={() => navigate(`/view/${session.session_id}`)}
                    className="hover:bg-secondary/20 transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-4">
                      <span className="text-sm font-medium text-primary font-mono">
                        {truncateId(session.session_id)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col max-w-[200px]">
                        <span className="text-sm font-medium text-foreground truncate">
                          {session.thread_title || "--"}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {session.turn_count} turn{session.turn_count !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-muted-foreground">
                        {session.lead_source || "--"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {intent ? (
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${intent.dot}`} />
                          <span className={`text-sm ${intent.color}`}>
                            {intent.label}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">--</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {status ? (
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${status.dot}`} />
                          <span className={`text-sm ${status.color}`}>
                            {status.label}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">--</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-muted-foreground">
                        {session.turn_count}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-muted-foreground">
                        {formatTime(session.updated_at)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/view/${session.session_id}`);
                        }}
                        className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
