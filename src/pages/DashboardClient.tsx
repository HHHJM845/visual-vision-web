import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EmptyState, ErrorState, PageLoading, PermissionState } from "@/components/StateViews";
import { useAuth } from "@/contexts/AuthContext";
import { getCommissionsByAuthor } from "@/services/commissionService";
import { Commission } from "@/types/commission";

function statusLabel(c: Commission) {
  const now = new Date();
  const deadline = new Date(c.deadline);
  if (deadline < now) return { label: "已结束", class: "bg-muted text-muted-foreground" };
  if (c.applicants === 0) return { label: "招募中", class: "bg-blue-100 text-blue-700" };
  return { label: "进行中", class: "bg-yellow-100 text-yellow-700" };
}

export default function DashboardClient() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: commissions = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['commissions', 'author', user?.id ?? 'guest'],
    queryFn: () => getCommissionsByAuthor(user!.id),
    enabled: !!user && user.role === 'client',
  });

  if (!user) {
    return <div className="min-h-screen bg-muted"><Navbar /><PermissionState title="请先登录" description="登录后可以查看你的项目工作台。" actionLabel="去登录" onAction={() => navigate('/login')} /></div>;
  }
  if (user.role !== 'client') {
    return <div className="min-h-screen bg-muted"><Navbar /><PermissionState title="当前账号不是需求方" description="AIGCer 请前往创作者工作台查看应征项目。" actionLabel="进入创作者工作台" onAction={() => navigate('/dashboard/aigcer')} /></div>;
  }

  const stats = {
    total: commissions.length,
    recruiting: commissions.filter(c => new Date(c.deadline) >= new Date() && c.applicants === 0).length,
    ongoing: commissions.filter(c => new Date(c.deadline) >= new Date() && c.applicants > 0).length,
    pending: 0,
  };

  const tagLabel = user.clientVerificationType === 'enterprise' ? '企业认证' :
    user.verificationStatus === 'verified' ? '实名认证' : '未认证';

  const visibleByTab: Record<string, Commission[]> = {
    all: commissions,
    recruiting: commissions.filter(c => new Date(c.deadline) >= new Date() && c.applicants === 0),
    ongoing: commissions.filter(c => new Date(c.deadline) >= new Date() && c.applicants > 0),
    done: commissions.filter(c => new Date(c.deadline) < new Date()),
  };

  function renderList(items: Commission[], emptyTitle: string) {
    if (isLoading) return <PageLoading label="正在加载项目..." />;
    if (isError) return <ErrorState onAction={() => refetch()} />;
    if (items.length === 0) {
      return (
        <EmptyState
          title={emptyTitle}
          description="发布项目后，招募、沟通和验收状态都会在这里同步。"
          actionLabel={user.verificationStatus === 'verified' ? "发布新项目" : undefined}
          onAction={user.verificationStatus === 'verified' ? () => navigate('/commissions/new') : undefined}
        />
      );
    }
    return (
      <div className="space-y-3">
        {items.map(c => {
          const s = statusLabel(c);
          return (
            <div key={c.id} onClick={() => navigate(`/commissions/${c.id}`)}
              className="flex cursor-pointer items-center gap-4 rounded-lg border border-border p-4 transition-colors hover:bg-muted">
              <div className="flex-1">
                <p className="font-medium text-foreground">{c.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{c.priceRange} · 截止 {c.deadline} · 应征 {c.applicants} 人</p>
              </div>
              <span className={`rounded-full px-2 py-1 text-xs font-medium ${s.class}`}>{s.label}</span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 顶部 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">我的工作台</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-muted-foreground text-sm">{user.nickname}</span>
              <Badge className="text-xs">{tagLabel}</Badge>
            </div>
          </div>
          {user.verificationStatus === 'verified' ? (
            <Button className="rounded-full" onClick={() => navigate('/commissions/new')}>+ 发布新项目</Button>
          ) : (
            <Button variant="outline" className="rounded-full" onClick={() => navigate('/onboarding/client')}>
              完成认证以发布项目
            </Button>
          )}
        </div>

        {/* 统计 */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { num: stats.total, label: "已发布" },
            { num: stats.recruiting, label: "招募中" },
            { num: stats.ongoing, label: "进行中" },
            { num: stats.pending, label: "待验收" },
          ].map(({ num, label }) => (
            <div key={label} className="bg-card border border-border rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-primary">{num}</div>
              <div className="text-xs text-muted-foreground mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* 项目列表 */}
        <div className="bg-card border border-border rounded-xl p-6">
          <Tabs defaultValue="all">
            <TabsList className="bg-transparent gap-4 p-0 mb-4">
              {["all", "recruiting", "ongoing", "done"].map((v, i) => (
                <TabsTrigger key={v} value={v}
                  className="text-sm data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent px-0 pb-2">
                  {["全部项目", "招募中", "进行中", "已完成"][i]}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="all">
              {renderList(visibleByTab.all, "还没有发布过项目")}
            </TabsContent>
            <TabsContent value="recruiting">
              {renderList(visibleByTab.recruiting, "暂无招募中的项目")}
            </TabsContent>
            <TabsContent value="ongoing">
              {renderList(visibleByTab.ongoing, "暂无进行中的项目")}
            </TabsContent>
            <TabsContent value="done">
              {renderList(visibleByTab.done, "暂无已结束项目")}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
