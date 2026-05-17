import { Activity, CheckCircle, AlertTriangle, ArrowUp, ArrowDown, MessageSquare, TrendingUp } from "lucide-react"

interface StatCardProps {
  title: string
  titleCn: string
  value: number | string
  trend?: {
    value: string
    direction: "up" | "down"
    label: string
  }
  accentColor: "blue" | "green" | "amber" | "slate"
  icon: "activity" | "check" | "alert" | "message"
}

const icons = {
  activity: Activity,
  check: CheckCircle,
  alert: AlertTriangle,
  message: MessageSquare,
}

const accentStyles = {
  blue: "text-blue-400",
  green: "text-emerald-400",
  amber: "text-amber-400",
  slate: "text-slate-400",
}

const trendColors = {
  up: "text-emerald-400",
  down: "text-red-400",
}

export function StatCard({ title, titleCn, value, trend, accentColor, icon }: StatCardProps) {
  const Icon = icons[icon]

  return (
    <div className="relative flex flex-col p-5 rounded-xl bg-card border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${accentStyles[accentColor]}`} />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-muted-foreground">{title}</span>
            <span className="text-[10px] text-muted-foreground/70">{titleCn}</span>
          </div>
        </div>
        <button className="p-1 rounded hover:bg-secondary text-muted-foreground">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
            <circle cx="8" cy="2" r="1.5" />
            <circle cx="8" cy="8" r="1.5" />
            <circle cx="8" cy="14" r="1.5" />
          </svg>
        </button>
      </div>

      {/* Value */}
      <div className="text-4xl font-bold text-foreground tracking-tight">
        {value}
      </div>

      {/* Trend */}
      {trend && (
        <div className="flex items-center gap-1.5 mt-3">
          {trend.direction === "up" ? (
            <ArrowUp className={`w-3 h-3 ${trendColors[trend.direction]}`} />
          ) : (
            <ArrowDown className={`w-3 h-3 ${trendColors[trend.direction]}`} />
          )}
          <span className={`text-xs font-medium ${trendColors[trend.direction]}`}>
            {trend.value}
          </span>
          <span className="text-xs text-muted-foreground">{trend.label}</span>
        </div>
      )}

      {/* Subtle glow effect */}
      <div
        className={`absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-10 blur-2xl ${
          accentColor === "blue"
            ? "bg-blue-500"
            : accentColor === "green"
            ? "bg-emerald-500"
            : accentColor === "amber"
            ? "bg-amber-500"
            : "bg-slate-500"
        }`}
      />
    </div>
  )
}

export function StatCardsGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Total Sessions"
        titleCn="总会话数"
        value={8}
        trend={{ value: "12%", direction: "up", label: "vs last week" }}
        accentColor="slate"
        icon="message"
      />
      <StatCard
        title="Active"
        titleCn="进行中"
        value={3}
        trend={{ value: "37.5%", direction: "up", label: "of total" }}
        accentColor="blue"
        icon="activity"
      />
      <StatCard
        title="Completed"
        titleCn="已完成"
        value={2}
        trend={{ value: "25%", direction: "up", label: "vs last week" }}
        accentColor="green"
        icon="check"
      />
      <StatCard
        title="Escalated"
        titleCn="已升级"
        value={1}
        trend={{ value: "5%", direction: "down", label: "vs last week" }}
        accentColor="amber"
        icon="alert"
      />
    </div>
  )
}
