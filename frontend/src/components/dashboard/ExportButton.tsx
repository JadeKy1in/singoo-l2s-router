import { useState } from "react";
import { Upload, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportLead } from "@/api/client";

interface ExportButtonProps {
  sessionId: string;
  onSuccess: () => void;
}

export function ExportButton({ sessionId, onSuccess }: ExportButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [exported, setExported] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    setError("");
    try {
      await exportLead(sessionId);
      setExported(true);
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed");
    } finally {
      setLoading(false);
    }
  };

  if (exported) {
    return (
      <div className="flex items-center gap-2 text-emerald-400">
        <Check className="w-4 h-4" />
        <span className="text-sm font-medium">Exported / 已导出</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Button
        onClick={handleExport}
        disabled={loading}
        className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <Upload className="w-4 h-4" />
        )}
        Export to CRM / 导出至 CRM
      </Button>
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}
