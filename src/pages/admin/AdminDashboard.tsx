import { Link } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Clock3, FileCheck2, ShieldCheck } from "lucide-react";
import { AdminShell, StatusBadge } from "@/components/AdminChrome";
import { Button } from "@/components/ui/button";
import { getReviewTypeLabel, listAuditLogs, listReviewItems, ReviewType } from "@/services/adminService";

const reviewTypes: ReviewType[] = ["verification", "project", "portfolio", "showcase", "event", "dispute"];

export default function AdminDashboard() {
  const reviews = listReviewItems();
  const logs = listAuditLogs();
  const pending = reviews.filter((item) => item.status === "pending");
  const needsChanges = reviews.filter((item) => item.status === "needs_changes");
  const verified = reviews.filter((item) => item.status === "verified");

  return (
    <AdminShell
      title="管理员工作台"
      description="集中处理资质、项目、内容、活动和纠纷审核，所有操作会进入审核日志。"
      action={<Button asChild className="rounded-full"><Link to="/admin/verifications">进入审核中心</Link></Button>}
    >
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "待审核", value: pending.length, icon: Clock3 },
          { label: "需补充", value: needsChanges.length, icon: AlertTriangle },
          { label: "已通过", value: verified.length, icon: CheckCircle2 },
          { label: "审核日志", value: logs.length, icon: ShieldCheck },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <Icon className="mb-4 h-5 w-5 text-primary" />
              <p className="text-2xl font-bold text-foreground">{item.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{item.label}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_22rem]">
        <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-foreground">待处理队列</h2>
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <Link to="/admin/verifications">查看全部</Link>
            </Button>
          </div>
          <div className="space-y-3">
            {pending.slice(0, 6).map((item) => (
              <Link key={item.id} to={`/admin/verifications/${item.id}`} className="block rounded-lg border border-border p-4 transition-colors hover:bg-muted">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-foreground">{item.title}</p>
                  <StatusBadge status={item.status} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{getReviewTypeLabel(item.type)} · {item.applicant}</p>
              </Link>
            ))}
            {pending.length === 0 && <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">暂无待审核内容。</p>}
          </div>
        </section>

        <aside className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-4 font-semibold text-foreground">审核类型</h2>
          <div className="space-y-3">
            {reviewTypes.map((type) => {
              const count = reviews.filter((item) => item.type === type && item.status === "pending").length;
              return (
                <Link key={type} to={`/admin/verifications?type=${type}`} className="flex items-center justify-between rounded-lg border border-border px-3 py-3 text-sm transition-colors hover:bg-muted">
                  <span className="flex items-center gap-2 text-foreground"><FileCheck2 className="h-4 w-4 text-primary" />{getReviewTypeLabel(type)}</span>
                  <span className="text-muted-foreground">{count}</span>
                </Link>
              );
            })}
          </div>
        </aside>
      </div>
    </AdminShell>
  );
}
