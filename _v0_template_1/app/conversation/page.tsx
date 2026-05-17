import { Sidebar } from "@/components/dashboard/sidebar"
import { TopHeader } from "@/components/dashboard/top-header"
import { ChatInterface } from "@/components/dashboard/chat-interface"
import { LeadDataCard } from "@/components/dashboard/lead-data-card"

export default function ConversationPage() {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Header */}
        <TopHeader />

        {/* Page Content - Split into Chat (65%) and Lead Data (35%) */}
        <main className="flex-1 flex flex-col overflow-hidden p-6 gap-4">
          {/* Chat Interface - 65% */}
          <div className="flex-[65] min-h-0 rounded-xl border border-border bg-card overflow-hidden">
            <ChatInterface />
          </div>

          {/* Extracted Lead Data - 35% */}
          <div className="flex-[35] min-h-0">
            <LeadDataCard />
          </div>
        </main>
      </div>
    </div>
  )
}
