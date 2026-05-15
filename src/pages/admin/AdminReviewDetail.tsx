import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, FileWarning, XCircle } from "lucide-react";
import { AdminShell, StatusBadge } from "@/components/AdminChrome";
import { EmptyState } from "@/components/StateViews";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { getReviewItem, getReviewTypeLabel, updateReviewStatus, ReviewStatus } from "@/services/adminService";

export default function AdminReviewDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [note, setNote] = useState("");
  const [, setTick] = useState(0);
  const item = getReviewItem(id);
  const isFinalStatus = item?.status === "verified" || item?.status === "rejected";

  function handleAction(action: ReviewStatus) {
    if (!user || !item || isFinalStatus) return;
    try {
      updateReviewStatus(item.id, action, note, user);
      setNote("");
      setTick((value) => value + 1);
      toast({ title: "审核已更新", description: "审核结果和日志已保存。" });
    } catch (error) {
      toast({ title: "操作失败", description: error instanceof Error ? error.message : "请稍后重试", variant: "destructive" });
    }
  }

  if (!item) {
    return (
      <AdminShell title="审核详情">
        <EmptyState title="审核项不存在" description="该审核项可能已被移除或地址输入有误。" actionLabel="返回审核中心" onAction={() => navigate("/admin/verifications")} />
      </AdminShell>
    );
  }

  return (
    <AdminShell
      title="审核详情"
      description="查看完整资料、作品内容和审核记录，并执行通过、驳回或要求补充材料。"
      action={<Button asChild variant="outline" className="rounded-full"><Link to="/admin/verifications"><ArrowLeft className="mr-2 h-4 w-4" />返回审核中心</Link></Button>}
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <section className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Badge variant="outline">{getReviewTypeLabel(item.type)}</Badge>
              <StatusBadge status={item.status} />
            </div>
            <h2 className="text-xl font-bold text-foreground">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.summary}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {item.fields.map((field) => (
                <div key={field.label} className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">{field.label}</p>
                  <p className="mt-1 break-words text-sm font-medium text-foreground">{field.value}</p>
                </div>
              ))}
            </div>
          </div>

          {item.portfolio?.length ? (
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h3 className="mb-4 font-semibold text-foreground">作品集预览</h3>
              <div className="grid gap-4 sm:grid-cols-3">
                {item.portfolio.map((portfolio) => (
                  <div key={portfolio.id} className="overflow-hidden rounded-xl border border-border bg-muted/30">
                    <img src={portfolio.imageUrl} alt={portfolio.title} className="aspect-square w-full object-cover" />
                    <div className="p-3">
                      <p className="text-sm font-semibold text-foreground">{portfolio.title}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{portfolio.description || "暂无描述"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <aside className="h-fit rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="font-semibold text-foreground">审核操作</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {isFinalStatus ? "该审核项已结束，如需重新处理请创建新的审核记录。" : "驳回和要求补充材料必须填写原因。"}
          </p>
          <Textarea
            className="mt-4"
            rows={5}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="填写审核意见、驳回原因或补充材料要求"
            disabled={isFinalStatus}
          />
          <div className="mt-4 grid gap-2">
            <Button className="rounded-full" onClick={() => handleAction("verified")} disabled={isFinalStatus}>
              <CheckCircle2 className="mr-2 h-4 w-4" />通过
            </Button>
            <Button variant="outline" className="rounded-full" onClick={() => handleAction("needs_changes")} disabled={isFinalStatus}>
              <FileWarning className="mr-2 h-4 w-4" />要求补充材料
            </Button>
            <Button variant="outline" className="rounded-full text-destructive hover:text-destructive" onClick={() => handleAction("rejected")} disabled={isFinalStatus}>
              <XCircle className="mr-2 h-4 w-4" />驳回
            </Button>
          </div>
        </aside>
      </div>
    </AdminShell>
  );
}
