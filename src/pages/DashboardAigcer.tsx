import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { EmptyState, ErrorState, PageLoading, PermissionState } from "@/components/StateViews";
import { useAuth } from "@/contexts/AuthContext";
import { getApplicationsByAigcer, getCommissionById, getProjectDeliveries, getProjectProgress, projectStages } from "@/services/commissionService";
import { getContractByCommission } from "@/services/contractService";
import { buildAigcerTodos, ProjectTodo } from "@/services/projectTodoService";
import { Application, Commission, DeliverySubmission } from "@/types/commission";
import { ProjectContract } from "@/types/contract";

interface AppWithCommission {
  app: Application;
  commission: Commission | null;
}

export default function DashboardAigcer() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [appDetails, setAppDetails] = useState<AppWithCommission[]>([]);
  const [todos, setTodos] = useState<ProjectTodo[]>([]);
  const activeTab = searchParams.get("tab") === "portfolio" ? "portfolio" : "projects";

  const canLoadApplications = !!user;
  const { data: applications = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["applications", "aigcer", user?.id ?? "guest"],
    queryFn: () => getApplicationsByAigcer(user!.id),
    enabled: canLoadApplications,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!canLoadApplications) {
        return;
      }

      if (applications.length === 0) {
        setAppDetails((current) => current.length ? [] : current);
        return;
      }

      const details = await Promise.all(
        applications.map(async (app) => ({
          app,
          commission: await getCommissionById(app.commissionId),
        })),
      );

      if (!cancelled) setAppDetails(details);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [applications, canLoadApplications]);

  useEffect(() => {
    let cancelled = false;

    async function loadTodos() {
      if (!user || user.role !== 'aigcer') {
        setTodos([]);
        return;
      }

      const accepted = applications.filter((application) => application.status === 'accepted');
      const commissionsById: Record<number, Commission> = {};
      const contractsByCommission: Record<number, ProjectContract | null> = {};
      const deliveriesByCommission: Record<number, DeliverySubmission[]> = {};

      for (const application of accepted) {
        const commission = appDetails.find((item) => item.app.id === application.id)?.commission
          ?? await getCommissionById(application.commissionId).catch(() => null);
        if (!commission) continue;
        commissionsById[commission.id] = commission;
        contractsByCommission[commission.id] = await getContractByCommission(commission.id).catch(() => null);
        deliveriesByCommission[commission.id] = await getProjectDeliveries(commission.id).catch(() => []);
      }

      const nextTodos = buildAigcerTodos({
        applications,
        commissionsById,
        contractsByCommission,
        progressByCommission: Object.fromEntries(accepted.map((application) => [
          application.commissionId,
          getProjectProgress(application.commissionId),
        ])),
        deliveriesByCommission,
      });

      if (!cancelled) setTodos(nextTodos);
    }

    loadTodos();
    return () => {
      cancelled = true;
    };
  }, [appDetails, applications, user]);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-muted">
        <Navbar />
        <PageLoading label="正在加载工作台..." />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-muted">
        <Navbar />
        <PermissionState
          title="请先登录"
          description="登录后可以查看你的创作者工作台。"
          actionLabel="去登录"
          onAction={() => navigate("/login")}
        />
      </div>
    );
  }

  if (user.role !== "aigcer") {
    return (
      <div className="min-h-screen bg-muted">
        <Navbar />
        <PermissionState
          title="这是创作者工作台"
          description="当前账号是需求方身份，请前往需求方工作台管理发布、应征和验收流程。"
          actionLabel="前往需求方工作台"
          onAction={() => navigate("/dashboard/client")}
        />
      </div>
    );
  }

  const stats = {
    applying: applications.filter((app) => app.status === "pending").length,
    ongoing: applications.filter((app) => app.status === "accepted").length,
    done: applications.filter((app) => app.status === "rejected").length,
    income: 0,
  };

  function progressFor(commissionId: number) {
    const progress = getProjectProgress(commissionId);
    const stage = projectStages.find((item) => item.id === progress.currentStage) ?? projectStages[0];
    const status = progress.stageStatus === 'completed'
      ? '全部节点已完成'
      : progress.stageStatus === 'waiting_owner'
        ? '待甲方确认'
        : '待你提交';
    return { stage, status };
  }

  function applicationStatusLabel(app: Application) {
    if (app.status === "accepted") return "合作中";
    if (app.status === "rejected") return "未选中";
    if (app.status === "withdrawn") return "已撤回";
    return app.message.startsWith("项目邀约：") ? "收到邀约" : "已应征";
  }

  function renderTodos() {
    return (
      <div className="mb-6 rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-foreground">待办事项</h2>
            <p className="mt-1 text-xs text-muted-foreground">优先处理合同签署、节点提交和修改反馈。</p>
          </div>
          <span className="rounded-full border border-border px-2 py-1 text-xs text-muted-foreground">{todos.length}</span>
        </div>
        {todos.length === 0 ? (
          <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">当前没有需要立即处理的项目事项。</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            {todos.map((todo) => (
              <div key={todo.id} className="rounded-lg border border-border p-3">
                <p className="text-sm font-semibold text-foreground">{todo.title}</p>
                <p className="mt-1 text-xs text-primary">{todo.commissionTitle}</p>
                <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">{todo.description}</p>
                <Button className="mt-3 h-8 rounded-full px-3 text-xs" onClick={() => navigate(todo.targetPath)}>
                  {todo.actionLabel}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">我的工作台</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-muted-foreground text-sm">{user.nickname}</span>
              {user.verificationStatus === "verified" && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-tag-verified text-primary-foreground">
                  已认证
                </span>
              )}
            </div>
          </div>
          <Button variant="outline" className="rounded-full" onClick={() => navigate("/commissions")}>
            去找项目
          </Button>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { num: stats.applying, label: "应征中" },
            { num: stats.ongoing, label: "进行中" },
            { num: stats.done, label: "未选中" },
            { num: `￥${stats.income}`, label: "累计收入" },
          ].map(({ num, label }) => (
            <div key={label} className="bg-card border border-border rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-primary">{num}</div>
              <div className="text-xs text-muted-foreground mt-1">{label}</div>
            </div>
          ))}
        </div>

        {renderTodos()}

        <div className="bg-card border border-border rounded-xl p-6">
          <Tabs
            value={activeTab}
            onValueChange={(value) => {
              if (value === "portfolio") setSearchParams({ tab: "portfolio" });
              else setSearchParams({});
            }}
          >
            <TabsList className="bg-transparent gap-4 p-0 mb-4">
              {[
                ["projects", "我的项目"],
                ["portfolio", "作品集"],
              ].map(([value, label]) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="text-sm data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent px-0 pb-2"
                >
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="projects">
              {isLoading ? (
                <PageLoading label="正在加载应征项目..." />
              ) : isError ? (
                <ErrorState onAction={() => refetch()} />
              ) : appDetails.length === 0 ? (
                <EmptyState
                  title="还没有应征或收到邀约"
                  description="去项目广场寻找合适需求，或等待需求方通过创作者广场向你发起邀约。"
                  actionLabel="去找项目"
                  onAction={() => navigate("/commissions")}
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {appDetails.map(({ app, commission }) => (
                    <div
                      key={app.id}
                      className="bg-muted rounded-lg p-4 cursor-pointer hover:bg-muted/80"
                      onClick={() => commission && navigate(`/commissions/${commission.id}`)}
                    >
                      <p className="font-medium text-foreground text-sm mb-1">
                        {commission?.title ?? "未知项目"}
                      </p>
                      <p className="text-xs text-muted-foreground mb-3">
                        {commission?.priceRange} · 截止 {commission?.deadline}
                      </p>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        app.status === "accepted" ? "bg-yellow-100 text-yellow-700" : "bg-blue-100 text-blue-700"
                      }`}>
                        {applicationStatusLabel(app)}
                      </span>
                      {app.status === "accepted" && (
                        <div className="mt-3">
                          {(() => {
                            const { stage, status } = progressFor(app.commissionId);
                            return (
                              <>
                                <Progress value={stage.percent} className="h-1.5" />
                                <p className="text-xs text-muted-foreground mt-1">{stage.label} · {status}</p>
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="portfolio">
              {user.aigcerProfile?.portfolio?.length ? (
                <div className="grid grid-cols-3 gap-3">
                  {user.aigcerProfile.portfolio.map((item) => (
                    <div key={item.id} className="aspect-square rounded-lg overflow-hidden bg-accent">
                      <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title={user.verificationStatus === "none" ? "还没有完成作品集认证" : "暂无作品"}
                  description="作品集会帮助需求方判断你的风格匹配度。"
                  actionLabel={user.verificationStatus === "none" ? "完成认证并上传作品集" : "补充作品集"}
                  onAction={() => navigate("/onboarding/aigcer")}
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
