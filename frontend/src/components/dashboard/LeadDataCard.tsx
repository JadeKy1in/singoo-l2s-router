import { Check, Bot } from "lucide-react";
import { ExportButton } from "./ExportButton";
import type { ExtractedLead } from "@/types";

function scoreColor(score: number): string {
  if (score >= 70) return "text-emerald-400";
  if (score >= 40) return "text-amber-400";
  return "text-red-400";
}

function intentColor(intent: string | null): string {
  if (intent === "high") return "text-emerald-400";
  if (intent === "medium") return "text-amber-400";
  if (intent === "low") return "text-red-400";
  return "text-muted-foreground";
}

interface LeadDataCardProps {
  lead: ExtractedLead | null;
  leadExportStatus: string | null;
  sessionId: string;
  onExportSuccess: () => void;
}

export function LeadDataCard({
  lead,
  leadExportStatus,
  sessionId,
  onExportSuccess,
}: LeadDataCardProps) {
  if (!lead) {
    return (
      <div className="flex flex-col rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/50">
          <div className="flex flex-col">
            <h3 className="text-sm font-semibold text-foreground">Extracted Lead</h3>
            <span className="text-[10px] text-muted-foreground">提取线索</span>
          </div>
        </div>
        <div className="flex items-center justify-center py-8">
          <p className="text-sm text-muted-foreground">
            Lead data not yet extracted / 线索数据尚未提取
          </p>
        </div>
      </div>
    );
  }

  const fields: { label: string; labelCn: string; value: string }[] = [
    { label: "Company Name", labelCn: "公司名称", value: lead.company_name || "--" },
    { label: "Contact Name", labelCn: "联系人", value: lead.contact_name || "--" },
    { label: "Email", labelCn: "邮箱", value: lead.contact_email || "--" },
    { label: "Phone", labelCn: "电话", value: lead.contact_phone || "--" },
    { label: "Country", labelCn: "国家", value: lead.country || "--" },
    { label: "Purchase Intent", labelCn: "购买意向", value: lead.purchase_intent || "--" },
    { label: "Product Interest", labelCn: "产品兴趣", value: lead.product_interest || "--" },
  ];

  const isExported = leadExportStatus === "exported";

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/50">
        <div className="flex flex-col">
          <h3 className="text-sm font-semibold text-foreground">Extracted Lead</h3>
          <span className="text-[10px] text-muted-foreground">提取线索</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20">
          <Bot className="w-3 h-3 text-blue-400" />
          <span className="text-[10px] font-medium text-blue-400">AI Extracted</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex gap-4">
          {/* Left: 2-Column Grid */}
          <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-3 content-start">
            {fields.map((field) => (
              <div key={field.label} className="flex flex-col gap-0.5">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                  {field.label}
                </span>
                <span className="text-[9px] text-muted-foreground/70">{field.labelCn}</span>
                <p
                  className={`text-sm font-medium ${
                    field.value === "--" ? "text-muted-foreground/50" : "text-foreground"
                  }`}
                >
                  {field.label === "Purchase Intent" && field.value !== "--" ? (
                    <span className={intentColor(lead.purchase_intent)}>{field.value}</span>
                  ) : (
                    field.value
                  )}
                </p>
              </div>
            ))}

            {/* Missing BANT */}
            <div className="flex flex-col gap-0.5 col-span-2">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                Missing BANT Fields
              </span>
              <span className="text-[9px] text-muted-foreground/70">缺失字段</span>
              {lead.missing_info.length === 0 ? (
                <p className="text-sm text-emerald-400">All BANT fields covered / 全部 BANT 字段已覆盖</p>
              ) : (
                <p className="text-sm text-amber-400">{lead.missing_info.join(", ")}</p>
              )}
            </div>

            {/* Notes */}
            {lead.notes && (
              <div className="flex flex-col gap-0.5 col-span-2">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                  Notes
                </span>
                <span className="text-[9px] text-muted-foreground/70">备注</span>
                <p className="text-sm text-muted-foreground">{lead.notes}</p>
              </div>
            )}
          </div>

          {/* Right: Lead Score */}
          <div className="flex flex-col items-center justify-center shrink-0 w-[100px] px-3 border-l border-border">
            <span className="text-[10px] font-medium text-muted-foreground uppercase text-center leading-tight">
              Lead Score
            </span>
            <span className="text-[9px] text-muted-foreground/70 mb-2">线索评分</span>
            <span
              className={`text-3xl font-bold ${lead.lead_score != null ? scoreColor(lead.lead_score) : "text-muted-foreground"}`}
            >
              {lead.lead_score != null ? lead.lead_score : "--"}
            </span>
            {lead.score_justification && (
              <p className="text-[9px] text-muted-foreground mt-1.5 text-center leading-tight">
                {lead.score_justification}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Footer — always visible when lead exists */}
      <div className="flex items-center justify-end px-4 py-3 border-t border-border bg-card/30">
        {isExported ? (
          <div className="flex items-center gap-2 text-emerald-400">
            <Check className="w-4 h-4" />
            <span className="text-sm font-medium">Exported / 已导出</span>
          </div>
        ) : (
          <ExportButton sessionId={sessionId} onSuccess={onExportSuccess} />
        )}
      </div>
    </div>
  );
}
