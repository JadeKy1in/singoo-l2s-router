import { useEffect, useRef } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopHeader } from "@/components/layout/TopHeader";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCardsGrid } from "@/components/dashboard/StatCards";
import { SessionsTable } from "@/components/dashboard/SessionsTable";
import { useApi } from "@/hooks/useApi";
import { getThreads } from "@/api/client";
import type { SessionSummary } from "@/types";

export default function SessionList() {
  const { status, data, error, refetch } =
    useApi<SessionSummary[]>(getThreads);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      refetch();
    }, 30_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [refetch]);

  const sessions: SessionSummary[] = data || [];

  const active = sessions.filter(
    (s: SessionSummary) => s.status === "active" || s.status === "in_progress"
  ).length;
  const completed = sessions.filter(
    (s: SessionSummary) => s.status === "completed"
  ).length;
  const escalated = sessions.filter(
    (s: SessionSummary) => s.status === "escalated"
  ).length;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopHeader />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            <PageHeader />
            <StatCardsGrid
              total={sessions.length}
              active={active}
              completed={completed}
              escalated={escalated}
            />
            {status === "error" ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-red-400 text-sm mb-4">{error}</p>
                <button
                  onClick={refetch}
                  className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition-colors"
                >
                  Retry / 重试
                </button>
              </div>
            ) : (
              <SessionsTable
                sessions={sessions}
                loading={status === "loading"}
                onRefresh={refetch}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
