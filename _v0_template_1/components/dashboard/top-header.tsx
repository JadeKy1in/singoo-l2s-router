"use client"

import { Search, Bell, Settings } from "lucide-react"
import { Input } from "@/components/ui/input"

export function TopHeader() {
  return (
    <header className="flex items-center justify-between h-16 px-6 border-b border-border bg-card/50">
      {/* Search */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search sessions..."
          className="pl-10 bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground"
        />
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
          <Bell className="w-5 h-5" />
        </button>
        <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
          <Settings className="w-5 h-5" />
        </button>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
          <span className="text-xs font-semibold text-white">JD</span>
        </div>
      </div>
    </header>
  )
}
