import { Link, useSearchParams } from "react-router-dom";
import { AdminEmpty, AdminShell, StatusBadge } from "@/components/AdminChrome";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getReviewTypeLabel, listReviewItems, ReviewStatus, ReviewType } from "@/services/adminService";

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

export default function AdminReviews() {
  const [searchParams, setSearchParams] = useSearchParams();
  const type = (searchParams.get("type") as ReviewType | "all" | null) ?? "all";
  const status = (searchParams.get("status") as ReviewStatus | "all" | null) ?? "all";
  const reviews = listReviewItems(type === "all" ? undefined : type, status);

  function updateFilter(next: { type?: string; status?: string }) {
    const params = new URLSearchParams(searchParams);
    if (next.type) params.set("type", next.type);
    if (next.status) params.set("status", next.status);
    setSearchParams(params);
  }

  return (
    <AdminShell title="审核中心" description="统一处理资质、项目、作品集、橱窗、活动报名和投诉纠纷。">
      <div className="mb-5 flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm sm:flex-row">
        <Select value={type} onValueChange={(value) => updateFilter({ type: value })}>
          <SelectTrigger className="h-11 rounded-full sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>{reviewTypes.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={status} onValueChange={(value) => updateFilter({ status: value })}>
          <SelectTrigger className="h-11 rounded-full sm:w-40"><SelectValue /></SelectTrigger>
          <SelectContent>{statuses.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {reviews.length === 0 ? (
        <AdminEmpty>当前筛选条件下没有审核项。</AdminEmpty>
      ) : (
        <div className="space-y-3">
          {reviews.map((item) => (
            <Link key={item.id} to={`/admin/verifications/${item.id}`} className="block rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-accent px-2.5 py-1 text-xs text-primary">{getReviewTypeLabel(item.type)}</span>
                    <StatusBadge status={item.status} />
                  </div>
                  <h2 className="font-semibold text-foreground">{item.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{item.summary}</p>
                  <p className="mt-3 text-xs text-muted-foreground">{item.applicantRole} · {item.applicant} · {item.submittedAt}</p>
                </div>
                <Button variant="outline" size="sm" className="rounded-full">查看详情</Button>
              </div>
            </Link>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
