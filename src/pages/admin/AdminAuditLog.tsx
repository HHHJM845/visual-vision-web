import { useMemo, useState } from "react";
import { AdminEmpty, AdminShell, StatusBadge } from "@/components/AdminChrome";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getReviewTypeLabel, listAuditLogs, ReviewStatus, ReviewType } from "@/services/adminService";

const reviewTypes: Array<{ value: ReviewType | "all"; label: string }> = [
  { value: "all", label: "全部类型" },
  { value: "verification", label: "资质审核" },
  { value: "project", label: "项目发布审核" },
  { value: "portfolio", label: "作品集内容审核" },
  { value: "showcase", label: "橱窗服务审核" },
  { value: "event", label: "活动报名审核" },
  { value: "dispute", label: "投诉/纠纷处理" },
];

const statuses: Array<{ value: ReviewStatus | "all"; label: string }> = [
  { value: "all", label: "全部状态" },
  { value: "pending", label: "待审核" },
  { value: "needs_changes", label: "需补充" },
  { value: "rejected", label: "已驳回" },
  { value: "verified", label: "已通过" },
];

export default function AdminAuditLog() {
  const logs = listAuditLogs();
  const [type, setType] = useState<ReviewType | "all">("all");
  const [status, setStatus] = useState<ReviewStatus | "all">("all");
  const [keyword, setKeyword] = useState("");
  const filteredLogs = useMemo(() => {
    const word = keyword.trim().toLowerCase();
    return logs
      .filter((log) => type === "all" || log.type === type)
      .filter((log) => status === "all" || log.action === status)
      .filter((log) => {
        if (!word) return true;
        return `${log.reviewTitle} ${log.operatorName} ${log.note}`.toLowerCase().includes(word);
      });
  }, [keyword, logs, status, type]);

  return (
    <AdminShell title="审核日志" description="留存审核人、审核动作、审核时间和处理备注，便于后续追溯。">
      <div className="mb-5 grid gap-3 rounded-xl border border-border bg-card p-4 shadow-sm md:grid-cols-[1fr_12rem_12rem]">
        <Input value={keyword} onChange={(event) => setKeyword(event.target.value)} className="h-11 rounded-full" placeholder="搜索标题、操作人或备注" />
        <Select value={type} onValueChange={(value) => setType(value as ReviewType | "all")}>
          <SelectTrigger className="h-11 rounded-full"><SelectValue /></SelectTrigger>
          <SelectContent>{reviewTypes.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={status} onValueChange={(value) => setStatus(value as ReviewStatus | "all")}>
          <SelectTrigger className="h-11 rounded-full"><SelectValue /></SelectTrigger>
          <SelectContent>{statuses.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {logs.length === 0 ? (
        <AdminEmpty>暂无审核日志。通过、驳回或要求补充材料后会自动生成记录。</AdminEmpty>
      ) : filteredLogs.length === 0 ? (
        <AdminEmpty>当前筛选条件下没有审核日志。</AdminEmpty>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((log) => (
            <div key={log.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-accent px-2.5 py-1 text-xs text-primary">{getReviewTypeLabel(log.type)}</span>
                    <StatusBadge status={log.action} />
                  </div>
                  <p className="font-semibold text-foreground">{log.reviewTitle}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{log.note}</p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <p>{log.operatorName}</p>
                  <p className="mt-1">{log.createdAt}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
