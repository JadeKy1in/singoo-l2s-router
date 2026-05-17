"use client"

import { Upload } from "lucide-react"
import { Button } from "@/components/ui/button"

interface LeadField {
  label: string
  labelCn: string
  value: string
}

const leadFields: LeadField[] = [
  { label: "Company Name", labelCn: "公司名称", value: "Schmidt Manufacturing GmbH" },
  { label: "Contact", labelCn: "联系人", value: "Hans Mueller (hans.mueller@schmidt-mfg.de)" },
  { label: "Country", labelCn: "国家", value: "Germany" },
  { label: "Product Interest", labelCn: "产品兴趣", value: "Conveyor Systems, Robotic Arms (RA-500)" },
]

export function LeadDataCard() {
  return (
    <div className="flex flex-col h-full rounded-xl border border-border bg-card overflow-hidden">
      {/* Card Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/50">
        <div className="flex flex-col">
          <h3 className="text-sm font-semibold text-foreground">Extracted Lead</h3>
          <span className="text-[10px] text-muted-foreground">提取线索</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-[10px] font-medium text-blue-400">AI Extracted</span>
        </div>
      </div>

      {/* Card Content */}
      <div className="flex-1 p-4">
        <div className="flex gap-6 h-full">
          {/* Lead Fields - 2 Column Grid */}
          <div className="flex-1 grid grid-cols-2 gap-x-6 gap-y-4 content-start">
            {leadFields.map((field) => (
              <div key={field.label} className="flex flex-col gap-1">
                <div className="flex flex-col">
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                    {field.label}
                  </span>
                  <span className="text-[9px] text-muted-foreground/70">{field.labelCn}</span>
                </div>
                <p className="text-sm text-foreground font-medium">{field.value}</p>
              </div>
            ))}
          </div>

          {/* Lead Score */}
          <div className="flex flex-col items-center justify-center px-6 border-l border-border">
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
                Lead Score
              </span>
              <span className="text-[9px] text-muted-foreground/70 mb-2">线索评分</span>
              <div className="relative flex items-center justify-center">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-secondary"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeDasharray={`${75 * 2.51} ${100 * 2.51}`}
                    strokeLinecap="round"
                    className="text-emerald-500"
                  />
                </svg>
                <span className="absolute text-2xl font-bold text-emerald-400">75</span>
              </div>
              <span className="text-[10px] text-emerald-400 mt-1">High Quality</span>
            </div>
          </div>
        </div>
      </div>

      {/* Card Footer */}
      <div className="flex items-center justify-end px-4 py-3 border-t border-border bg-card/30">
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Upload className="w-4 h-4 mr-2" />
          <div className="flex flex-col items-start">
            <span className="text-sm">Export to CRM</span>
            <span className="text-[9px] opacity-70">导出至 CRM</span>
          </div>
        </Button>
      </div>
    </div>
  )
}
