import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Plus } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopHeader } from "@/components/layout/TopHeader";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createThread } from "@/api/client";

const MAX_CHARS = 10000;

export default function NewThread() {
  const navigate = useNavigate();
  const [leadSource, setLeadSource] = useState("WhatsApp");
  const [inquiry, setInquiry] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState("");

  const handleCreate = async () => {
    if (!inquiry.trim()) {
      setFieldError("Message is required / 消息不能为空");
      return;
    }
    setFieldError("");
    setLoading(true);
    setError("");
    try {
      const result = await createThread({
        user_message: inquiry.trim(),
        lead_source: leadSource.trim() || "WhatsApp",
      });
      navigate(`/view/${result.session_id}`);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Server error. Please try again. / 服务器错误，请重试。"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopHeader />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto py-12 px-6">
            {/* Back link */}
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              Back / 返回
            </Link>

            {/* Card */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              {/* Header */}
              <div className="px-6 pt-6 pb-4 border-b border-border">
                <h1 className="text-lg font-semibold text-foreground">
                  Create New Session
                </h1>
                <span className="block text-[10px] text-muted-foreground mt-0.5">
                  创建新会话
                </span>
              </div>

              {/* Form */}
              <div className="px-6 py-5 space-y-5">
                {/* Error banner */}
                {error && (
                  <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20">
                    <p className="text-xs text-red-400">{error}</p>
                    <button
                      onClick={handleCreate}
                      className="text-xs text-red-400 underline mt-1"
                    >
                      Retry / 重试
                    </button>
                  </div>
                )}

                {/* Lead Source */}
                <div className="space-y-2">
                  <Label
                    htmlFor="lead-source"
                    className="text-sm font-medium text-foreground"
                  >
                    Lead Source
                    <span className="block text-[10px] font-normal text-muted-foreground">
                      线索来源
                    </span>
                  </Label>
                  <Input
                    id="lead-source"
                    placeholder="e.g., WhatsApp"
                    value={leadSource}
                    onChange={(e) => setLeadSource(e.target.value.slice(0, 50))}
                    maxLength={50}
                    className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                  />
                  <span className="text-[10px] text-muted-foreground">
                    {leadSource.length}/50
                  </span>
                </div>

                {/* Initial Inquiry */}
                <div className="space-y-2">
                  <Label
                    htmlFor="inquiry"
                    className="text-sm font-medium text-foreground"
                  >
                    Initial Inquiry
                    <span className="block text-[10px] font-normal text-muted-foreground">
                      初始询盘
                    </span>
                  </Label>
                  <div className="relative">
                    <Textarea
                      id="inquiry"
                      placeholder="Enter the initial inquiry message... / 输入初始询盘消息..."
                      value={inquiry}
                      onChange={(e) => {
                        if (e.target.value.length <= MAX_CHARS) {
                          setInquiry(e.target.value);
                          if (fieldError) setFieldError("");
                        }
                      }}
                      className={`min-h-[180px] bg-secondary border-border text-foreground placeholder:text-muted-foreground resize-none pb-8 ${
                        fieldError ? "border-red-500" : ""
                      }`}
                    />
                    <span
                      className={`absolute bottom-2 right-3 text-[11px] ${
                        inquiry.length > MAX_CHARS * 0.9
                          ? "text-red-400"
                          : "text-muted-foreground"
                      }`}
                    >
                      {inquiry.length} / {MAX_CHARS.toLocaleString()}
                    </span>
                  </div>
                  {fieldError && (
                    <p className="text-xs text-red-400">{fieldError}</p>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
                <Button
                  variant="ghost"
                  onClick={() => navigate("/")}
                  className="text-muted-foreground hover:text-foreground hover:bg-secondary"
                >
                  Cancel / 取消
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={loading}
                  className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Create / 创建
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
