"use client"

import { useState } from "react"
import { Download, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { NewSessionModal } from "./new-session-modal"

export function PageHeader() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <div className="flex items-start justify-between">
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Session Management</h1>
        <div className="flex flex-col mt-1">
          <span className="text-sm text-muted-foreground">
            Monitor and manage all L2S-Router conversations
          </span>
          <span className="text-[10px] text-muted-foreground/70">
            监控和管理所有 L2S 路由器会话
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" className="h-9 gap-2 border-border text-muted-foreground hover:text-foreground">
          <Download className="w-4 h-4" />
          <span>Export</span>
        </Button>
        <Button size="sm" className="h-9 gap-2 bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4" />
          <span>New Session</span>
        </Button>
      </div>

      <NewSessionModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </div>
  )
}
