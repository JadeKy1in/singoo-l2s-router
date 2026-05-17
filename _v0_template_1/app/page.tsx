import { Sidebar } from "@/components/dashboard/sidebar"
import { TopHeader } from "@/components/dashboard/top-header"
import { PageHeader } from "@/components/dashboard/page-header"
import { StatCardsGrid } from "@/components/dashboard/stat-cards"
import { SessionsTable } from "@/components/dashboard/sessions-table"

export default function SessionsPage() {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Header */}
        <TopHeader />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Page Header with Actions */}
            <PageHeader />

            {/* Stat Cards */}
            <StatCardsGrid />

            {/* Sessions Table */}
            <SessionsTable />
          </div>
        </main>
      </div>
    </div>
  )
}
