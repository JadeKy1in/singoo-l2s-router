"use client"

import { useState } from "react"
import { Search, Filter, MoreVertical, Download, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface Session {
  id: string
  title: string
  source: string
  intent: string
  status: "Active" | "In Progress" | "Completed" | "Escalated"
  turns: number
  updatedAt: string
}

const sessions: Session[] = [
  {
    id: "SES-001",
    title: "Product inquiry from Apex Tech",
    source: "Website",
    intent: "Lead_Gen",
    status: "Active",
    turns: 12,
    updatedAt: "2026-05-17 14:32",
  },
  {
    id: "SES-002",
    title: "Technical support request",
    source: "Email",
    intent: "Support",
    status: "In Progress",
    turns: 8,
    updatedAt: "2026-05-17 13:45",
  },
  {
    id: "SES-003",
    title: "Billing dispute resolution",
    source: "Phone",
    intent: "Billing",
    status: "Escalated",
    turns: 15,
    updatedAt: "2026-05-17 12:20",
  },
  {
    id: "SES-004",
    title: "New feature demo request",
    source: "Website",
    intent: "Lead_Gen",
    status: "Completed",
    turns: 6,
    updatedAt: "2026-05-17 11:55",
  },
  {
    id: "SES-005",
    title: "Integration setup assistance",
    source: "Chat",
    intent: "Support",
    status: "Active",
    turns: 4,
    updatedAt: "2026-05-17 10:30",
  },
  {
    id: "SES-006",
    title: "Enterprise pricing inquiry",
    source: "Email",
    intent: "Lead_Gen",
    status: "Completed",
    turns: 9,
    updatedAt: "2026-05-17 09:15",
  },
  {
    id: "SES-007",
    title: "API rate limit issue",
    source: "Website",
    intent: "Support",
    status: "In Progress",
    turns: 7,
    updatedAt: "2026-05-16 18:45",
  },
  {
    id: "SES-008",
    title: "Partnership opportunity",
    source: "Email",
    intent: "Lead_Gen",
    status: "Active",
    turns: 3,
    updatedAt: "2026-05-16 16:20",
  },
]

const statusConfig: Record<Session["status"], { color: string; dot: string }> = {
  Active: { color: "text-blue-400", dot: "bg-blue-400" },
  "In Progress": { color: "text-cyan-400", dot: "bg-cyan-400" },
  Completed: { color: "text-emerald-400", dot: "bg-emerald-400" },
  Escalated: { color: "text-amber-400", dot: "bg-amber-400" },
}

const intentConfig: Record<string, { color: string; dot: string }> = {
  Lead_Gen: { color: "text-emerald-400", dot: "bg-emerald-400" },
  Support: { color: "text-amber-400", dot: "bg-amber-400" },
  Billing: { color: "text-red-400", dot: "bg-red-400" },
}

const columns = [
  { key: "id", label: "Session ID", labelCn: "会话 ID" },
  { key: "title", label: "Title", labelCn: "标题" },
  { key: "source", label: "Source", labelCn: "来源" },
  { key: "intent", label: "Intent", labelCn: "意图" },
  { key: "status", label: "Status", labelCn: "状态" },
  { key: "turns", label: "Turns", labelCn: "轮次" },
  { key: "updatedAt", label: "Updated At", labelCn: "更新时间" },
  { key: "action", label: "Action", labelCn: "操作" },
]

export function SessionsTable() {
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <div className="flex flex-col rounded-xl bg-card border border-border overflow-hidden">
      {/* Table Header */}
      <div className="flex items-center justify-between p-5 border-b border-border">
        <div className="flex flex-col">
          <h2 className="text-lg font-semibold text-foreground">All Sessions</h2>
          <span className="text-[10px] text-muted-foreground">所有会话</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-48 pl-9 h-9 bg-secondary/50 border-border text-sm"
            />
          </div>
          <Button variant="outline" size="sm" className="h-9 gap-2 border-border text-muted-foreground hover:text-foreground">
            <Filter className="w-4 h-4" />
          </Button>
          <span className="text-sm text-primary cursor-pointer hover:underline">See All</span>
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
                  className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  <div className="flex flex-col">
                    <span>{col.label}</span>
                    <span className="text-[9px] font-normal normal-case text-muted-foreground/70">
                      {col.labelCn}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sessions.map((session) => (
              <tr
                key={session.id}
                className="hover:bg-secondary/20 transition-colors"
              >
                <td className="px-5 py-4">
                  <span className="text-sm font-medium text-primary">{session.id}</span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-col max-w-[200px]">
                    <span className="text-sm font-medium text-foreground truncate">
                      {session.title}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      Last activity: {session.updatedAt.split(" ")[1]}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className="text-sm text-muted-foreground">{session.source}</span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        intentConfig[session.intent]?.dot || "bg-slate-400"
                      }`}
                    />
                    <span
                      className={`text-sm ${
                        intentConfig[session.intent]?.color || "text-slate-400"
                      }`}
                    >
                      {session.intent}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${statusConfig[session.status].dot}`}
                    />
                    <span className={`text-sm ${statusConfig[session.status].color}`}>
                      {session.status}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className="text-sm text-muted-foreground">{session.turns}</span>
                </td>
                <td className="px-5 py-4">
                  <span className="text-sm text-muted-foreground">{session.updatedAt}</span>
                </td>
                <td className="px-5 py-4">
                  <button className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
