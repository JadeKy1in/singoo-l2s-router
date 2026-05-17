import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopHeader } from "@/components/layout/TopHeader";

export default function NotFound() {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopHeader />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <p className="text-6xl font-bold text-muted-foreground/30">404</p>
            <p className="text-lg text-muted-foreground">
              Page not found / 页面未找到
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Sessions / 返回会话列表
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
