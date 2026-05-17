"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

interface NewSessionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const MAX_CHARS = 10000

export function NewSessionModal({ open, onOpenChange }: NewSessionModalProps) {
  const [leadSource, setLeadSource] = useState("")
  const [inquiry, setInquiry] = useState("")

  const handleCreate = () => {
    // Handle session creation logic here
    console.log({ leadSource, inquiry })
    onOpenChange(false)
    setLeadSource("")
    setInquiry("")
  }

  const handleCancel = () => {
    onOpenChange(false)
    setLeadSource("")
    setInquiry("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] bg-card border-border p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="text-lg font-semibold text-foreground">
            Create New Session
            <span className="block text-[10px] font-normal text-muted-foreground mt-0.5">
              创建新会话
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-5 space-y-5">
          {/* Lead Source Input */}
          <div className="space-y-2">
            <Label htmlFor="lead-source" className="text-sm font-medium text-foreground">
              Lead Source
              <span className="block text-[10px] font-normal text-muted-foreground">
                线索来源
              </span>
            </Label>
            <Input
              id="lead-source"
              placeholder="e.g., WhatsApp"
              value={leadSource}
              onChange={(e) => setLeadSource(e.target.value)}
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:ring-primary focus:border-primary"
            />
          </div>

          {/* Initial Inquiry Textarea */}
          <div className="space-y-2">
            <Label htmlFor="inquiry" className="text-sm font-medium text-foreground">
              Initial Inquiry
              <span className="block text-[10px] font-normal text-muted-foreground">
                初始询盘
              </span>
            </Label>
            <div className="relative">
              <Textarea
                id="inquiry"
                placeholder="Enter the initial inquiry message..."
                value={inquiry}
                onChange={(e) => {
                  if (e.target.value.length <= MAX_CHARS) {
                    setInquiry(e.target.value)
                  }
                }}
                className="min-h-[180px] bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:ring-primary focus:border-primary resize-none pb-8"
              />
              <span className="absolute bottom-2 right-3 text-[11px] text-muted-foreground">
                {inquiry.length} / {MAX_CHARS.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <Button
            variant="ghost"
            onClick={handleCancel}
            className="text-muted-foreground hover:text-foreground hover:bg-secondary"
          >
            Cancel
            <span className="text-[10px] text-muted-foreground ml-1">取消</span>
          </Button>
          <Button
            onClick={handleCreate}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Create
            <span className="text-[10px] text-primary-foreground/80 ml-1">创建</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
