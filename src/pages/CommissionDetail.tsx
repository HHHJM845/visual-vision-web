import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, BadgeCheck, BrainCircuit, CheckCircle, ChevronLeft, Gauge, Loader2, MessageCircle, Share2, Sparkles, Star, UserRound, WandSparkles } from "lucide-react";
import Navbar from "@/components/Navbar";
import { EmptyState, ErrorState, PageLoading } from "@/components/StateViews";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { applyToCommission, getApplicantsWithProfiles, getCommissionById, updateApplicationStatus } from "@/services/commissionService";
import { useSmartMatch } from "@/hooks/useSmartMatch";

const milestones = [
  { label: "开始合作", percent: 0 },
  { label: "概念稿", percent: 20 },
  { label: "分镜", percent: 40 },
  { label: "粗剪", percent: 70 },
  { label: "确认交付", percent: 100 },
];

export default function CommissionDetail() {
  const { id } = useParams();
  const commissionId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  const [applyOpen, setApplyOpen] = useState(false);
  const [applyMessage, setApplyMessage] = useState("");
  const [expectedPrice, setExpectedPrice] = useState("");
  const [applying, setApplying] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'smart'>('all');
  const [selectedApplicantId, setSelectedApplicantId] = useState<string | null>(null);
  const [applicationActionId, setApplicationActionId] = useState<string | null>(null);
  const { isLoading: matchLoading, scores, error: matchError, runMatch } = useSmartMatch();

  const { data: commission, isLoading, isError, refetch } = useQuery({
    queryKey: ['commission', commissionId],
    queryFn: () => getCommissionById(commissionId),
    enabled: Number.isFinite(commissionId),
  });

  const { data: applicants = [], refetch: refetchApplicants } = useQuery({
    queryKey: ['commission-applicants', commissionId],
    queryFn: () => getApplicantsWithProfiles(commissionId),
    enabled: Number.isFinite(commissionId),
  });

  const hasApplied = !!user && applicants.some((applicant) => applicant.aigcerId === user.id);

  const sortedApplicants = useMemo(() => {
    if (activeTab !== 'smart' || !scores) return applicants;
    return [...applicants].sort((a, b) => {
      const sa = scores.find((score) => score.id === a.aigcerId)?.score ?? 0;
      const sb = scores.find((score) => score.id === b.aigcerId)?.score ?? 0;
      return sb - sa;
    });
  }, [activeTab, applicants, scores]);

  const daysLeft = commission
    ? Math.max(0, Math.ceil((new Date(commission.deadline).getTime() - Date.now()) / 86400000))
    : 0;
  const isExpired = commission ? new Date(commission.deadline).getTime() < Date.now() : false;
  const selectedApplicant = applicants.find((applicant) => applicant.id === selectedApplicantId) ?? null;
  const acceptedApplicant = applicants.find((applicant) => applicant.status === 'accepted') ?? null;
  const isProjectOwner = !!user && !!commission && user.id === commission.authorId;

  function getScore(aigcerId: string) {
    return scores?.find((item) => item.id === aigcerId)?.score ?? null;
  }

  function getRecommendation(score: number | null) {
    if (score === null) return { label: "待分析", className: "bg-muted text-muted-foreground", summary: "切换到智能推荐后会生成匹配评分。" };
    if (score >= 85) return { label: "优先沟通", className: "bg-primary text-primary-foreground", summary: "风格与需求高度契合，建议优先约定样片或节点计划。" };
    if (score >= 70) return { label: "值得沟通", className: "bg-secondary text-secondary-foreground", summary: "能力方向较匹配，可进一步确认档期、预算与交付方式。" };
    return { label: "谨慎评估", className: "bg-muted text-muted-foreground", summary: "匹配度一般，建议重点核对相关案例和执行经验。" };
  }

  function getMatchReasons(applicant: typeof applicants[number]) {
    const text = `${commission?.description ?? ""} ${commission?.category ?? ""}`;
    const styleHits = applicant.styles.filter((style) => text.includes(style));
    const toolText = applicant.tools.length ? applicant.tools.join("、") : "暂未填写工具";
    return [
      styleHits.length ? `风格命中：${styleHits.join("、")}` : `风格资料：${applicant.styles.slice(0, 3).join("、") || "暂未填写"}`,
      `工具链：${toolText}`,
      applicant.bio ? `简介线索：${applicant.bio}` : "简介资料较少，建议沟通时补充案例。",
    ];
  }

  async function handleApply() {
    if (!user || !commission) return;
    setApplying(true);
    try {
      await applyToCommission(commission.id, user.id, user.nickname, applyMessage.trim(), expectedPrice.trim());
      toast({ title: "应征成功", description: "需求方会在项目工作台查看你的应征信息。" });
      setApplyOpen(false);
      setApplyMessage("");
      setExpectedPrice("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['commissions'] }),
        queryClient.invalidateQueries({ queryKey: ['commission', commission.id] }),
        refetchApplicants(),
      ]);
    } catch (e: unknown) {
      toast({ title: "应征失败", description: e instanceof Error ? e.message : "请稍后重试", variant: "destructive" });
    } finally {
      setApplying(false);
    }
  }

  async function handleApplicationStatus(applicationId: string, status: 'accepted' | 'rejected') {
    if (!commission) return;
    setApplicationActionId(applicationId);
    try {
      await updateApplicationStatus(commission.id, applicationId, status);
      toast({
        title: status === 'accepted' ? '已选定创作者' : '已拒绝应征',
        description: status === 'accepted' ? '项目已进入合作中，双方工作台会同步状态。' : '该应征已从候选列表中移出。',
      });
      setSelectedApplicantId(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['commission-applicants', commission.id] }),
        queryClient.invalidateQueries({ queryKey: ['applications'] }),
        refetchApplicants(),
      ]);
    } catch (e: unknown) {
      toast({
        title: '操作失败',
        description: e instanceof Error ? e.message : '请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setApplicationActionId(null);
    }
  }

  function handleShare() {
    navigator.clipboard?.writeText(window.location.href).catch(() => undefined);
    toast({ title: "链接已复制", description: "可以发送给协作成员继续评估。" });
  }

  function getApplyButton() {
    if (!commission) return null;
    if (isExpired) return <Button className="w-full rounded-full text-base" size="lg" disabled>项目已截止</Button>;
    if (acceptedApplicant) return <Button className="w-full rounded-full text-base" size="lg" disabled>项目已进入合作中</Button>;
    if (!user) return <Button className="w-full rounded-full text-base" size="lg" onClick={() => navigate('/login')}>登录后应征</Button>;
    if (user.verificationStatus !== 'verified') return <Button className="w-full rounded-full text-base" size="lg" onClick={() => navigate('/onboarding/aigcer')}>完成认证后应征</Button>;
    if (hasApplied) return <Button className="w-full rounded-full text-base" size="lg" disabled>已提交应征</Button>;
    return <Button className="w-full rounded-full text-base" size="lg" onClick={() => setApplyOpen(true)}>应征项目</Button>;
  }

  if (!Number.isFinite(commissionId)) {
    return <><Navbar /><EmptyState title="项目地址无效" description="请从项目列表重新选择一个需求。" actionLabel="返回项目列表" onAction={() => navigate('/commissions')} /></>;
  }

  if (isLoading) return <div className="min-h-screen bg-muted"><Navbar /><PageLoading label="正在加载项目详情..." /></div>;
  if (isError) return <div className="min-h-screen bg-muted"><Navbar /><div className="mx-auto max-w-3xl px-4 py-10"><ErrorState onAction={() => refetch()} /></div></div>;
  if (!commission) {
    return (
      <div className="min-h-screen bg-muted">
        <Navbar />
        <div className="mx-auto max-w-3xl px-4 py-10">
          <EmptyState title="项目不存在或已下架" description="该需求可能已被关闭，建议返回列表查看其它机会。" actionLabel="返回项目列表" onAction={() => navigate('/commissions')} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex gap-6">
          <aside className="hidden w-64 flex-shrink-0 lg:block">
            <div className="rounded-lg border border-border bg-card p-6 text-center">
              <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-accent text-3xl">🎬</div>
              <h3 className="mb-2 font-semibold text-card-foreground">{commission.authorNickname}</h3>
              <div className="mb-1 flex items-center justify-center gap-0.5">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} className={`h-4 w-4 ${index < (commission.rating ?? 5) ? "fill-secondary text-secondary" : "text-muted-foreground"}`} />
                ))}
              </div>
              <p className="mb-3 text-xs text-muted-foreground">共 {commission.reviews ?? 0} 条评价</p>
              <div className="mb-4 flex items-center justify-center gap-1 text-xs text-primary">
                <CheckCircle className="h-3.5 w-3.5" />
                <span>{commission.authorVerification === 'enterprise' ? '已完成企业认证' : commission.authorVerification === 'realname' ? '已完成实名认证' : '暂未认证'}</span>
              </div>
              <p className="mb-1 text-sm text-muted-foreground">需求完成率 {commission.completionRate ?? '0 / 0'}</p>
              <Badge variant="outline" className="text-xs">{commission.reputation}</Badge>
            </div>

            <div className="mt-4 space-y-4 rounded-lg border border-border bg-card p-5">
              <div><p className="text-xs text-muted-foreground">交付日期</p><p className="text-lg font-bold text-primary">{commission.deadline}</p></div>
              <div><p className="text-xs text-muted-foreground">项目报酬预算</p><p className="text-lg font-bold text-price">{commission.priceRange}</p></div>
              <div><p className="text-xs text-muted-foreground">平台托管服务费</p><p className="text-lg font-bold text-primary">{commission.handlingFee ?? '5%'}</p></div>
              <p className="text-xs text-muted-foreground">{isExpired ? "项目已截止" : `${daysLeft} 天后关闭项目`}</p>
              {getApplyButton()}
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
              <button className="flex items-center gap-1 transition-colors hover:text-primary" onClick={handleShare}><Share2 className="h-3.5 w-3.5" />分享项目</button>
              <Link to="/commissions" className="flex items-center gap-1 transition-colors hover:text-primary"><ChevronLeft className="h-3.5 w-3.5" />返回列表</Link>
            </div>
          </aside>

          <main className="min-w-0 flex-1">
            <div className="mb-6 rounded-lg border border-border bg-card p-6">
              <div className="mb-2 flex items-start justify-between gap-4">
                <h1 className="text-2xl font-bold text-card-foreground">{commission.title}</h1>
                <Badge variant={isExpired ? "secondary" : "outline"} className="flex-shrink-0 text-xs">{isExpired ? "已截止" : "审核项目"}</Badge>
              </div>
              <div className="mb-6 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <span>发布方 {commission.authorNickname}</span>
                <span>{commission.purpose}</span>
                <span>{commission.category}</span>
                <span>{commission.applicants} 人应征</span>
              </div>

              <div className="mb-6 rounded-lg bg-accent/50 p-5">
                <h3 className="mb-4 text-center font-bold text-primary">承制流程</h3>
                <div className="grid gap-3 text-xs text-muted-foreground sm:grid-cols-5">
                  {milestones.map((item) => (
                    <div key={item.label} className="rounded-lg bg-background p-3 text-center shadow-sm">
                      <div className="mx-auto mb-2 h-2 w-full rounded-full bg-border">
                        <div className="h-2 rounded-full bg-primary" style={{ width: `${item.percent}%` }} />
                      </div>
                      {item.label}
                    </div>
                  ))}
                </div>
              </div>

              <h2 className="mb-3 text-lg font-bold text-primary">需求详情</h2>
              <p className="mb-6 text-sm leading-7 text-foreground">{commission.description}</p>

              <h2 className="mb-3 text-lg font-bold text-primary">影片要求</h2>
              <div className="mb-6 grid gap-3 text-sm sm:grid-cols-2">
                <div><span className="text-muted-foreground">影片类别：</span>{commission.category}</div>
                <div><span className="text-muted-foreground">用途：</span>{commission.purpose}</div>
                <div><span className="text-muted-foreground">文件格式：</span>{commission.format || 'MP4、MOV'}</div>
                <div><span className="text-muted-foreground">反馈节奏：</span>按节点提交并确认</div>
              </div>

              <h2 className="mb-3 text-lg font-bold text-primary">项目流程</h2>
              <div className="rounded-lg bg-accent/30 p-4 text-sm text-secondary">
                需求方选定合作 AIGCer 后，项目报酬将进入平台托管；创作者按节点提交概念稿、分镜和粗剪，需求方验收后确认交付。
              </div>
              <div className="mt-6">
                <Progress value={acceptedApplicant ? 20 : isExpired ? 100 : 0} className="h-2" />
                <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                  {milestones.map((item) => <span key={item.label}>{item.label}</span>)}
                </div>
              </div>
            </div>

            {acceptedApplicant && (
              <div className="mb-6 rounded-2xl border border-primary/20 bg-accent/60 p-5 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Project Started</p>
                    <h2 className="mt-1 text-lg font-bold text-foreground">已选定 {acceptedApplicant.aigcerNickname}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      当前项目已进入合作中。下一步可继续确认档期、首版样片节点和交付验收标准。
                    </p>
                  </div>
                  <Badge className="w-fit rounded-full bg-primary text-primary-foreground">合作中</Badge>
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Smart Matching</p>
                  <h2 className="mt-1 text-lg font-bold text-card-foreground">应征AIGCer决策面板</h2>
                  <p className="mt-1 text-sm text-muted-foreground">先看总体排序，再进入单个候选人的匹配解释。</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setActiveTab('all')} className={`min-h-10 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'all' ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:border-primary hover:text-primary'}`}>全部应征</button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('smart');
                      runMatch(commission.description, commission.category, applicants);
                    }}
                    className={`min-h-10 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'smart' ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:border-primary hover:text-primary'}`}
                  >
                    <WandSparkles className="mr-1 inline h-4 w-4" />智能推荐
                  </button>
                </div>
              </div>

              {activeTab === 'smart' && (
                <div className="mb-5 grid gap-3 md:grid-cols-3">
                  <div className="rounded-xl bg-accent/50 p-4">
                    <BrainCircuit className="mb-3 h-5 w-5 text-primary" />
                    <p className="text-lg font-bold text-foreground">{scores ? "已生成" : "待生成"}</p>
                    <p className="text-xs text-muted-foreground">AI 匹配状态</p>
                  </div>
                  <div className="rounded-xl bg-accent/50 p-4">
                    <Gauge className="mb-3 h-5 w-5 text-primary" />
                    <p className="text-lg font-bold text-foreground">
                      {scores?.length ? Math.max(...scores.map((item) => item.score)) : "--"}%
                    </p>
                    <p className="text-xs text-muted-foreground">最高匹配度</p>
                  </div>
                  <div className="rounded-xl bg-accent/50 p-4">
                    <MessageCircle className="mb-3 h-5 w-5 text-primary" />
                    <p className="text-lg font-bold text-foreground">{applicants.length}</p>
                    <p className="text-xs text-muted-foreground">可沟通候选人</p>
                  </div>
                </div>
              )}

              {matchLoading && <PageLoading label="AI 正在分析匹配度..." />}
              {matchError && <div className="mb-3 flex items-center gap-2 rounded-lg bg-destructive/5 p-3 text-sm text-destructive"><AlertTriangle className="h-4 w-4" />{matchError}</div>}
              {!matchLoading && sortedApplicants.length === 0 ? (
                <EmptyState title="暂无AIGCer应征" description="你可以分享项目链接，或稍后回来查看新的应征信息。" />
              ) : (
                <div className="space-y-3">
                  {sortedApplicants.map((applicant) => {
                    const score = getScore(applicant.aigcerId);
                    const recommendation = getRecommendation(score);
                    return (
                      <div key={applicant.id} className="rounded-xl border border-border p-4 transition-all duration-200 hover:border-primary/30 hover:shadow-md">
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-foreground">{applicant.aigcerNickname}</span>
                              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${recommendation.className}`}>{recommendation.label}</span>
                              <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                                {applicant.status === 'accepted' ? '已选定' : applicant.status === 'rejected' ? '已拒绝' : '待沟通'}
                              </span>
                            </div>
                            <p className="text-sm leading-6 text-muted-foreground">{applicant.message}</p>
                            {activeTab === 'smart' && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {getMatchReasons(applicant).slice(0, 2).map((reason) => (
                                  <span key={reason} className="rounded-full bg-accent px-3 py-1 text-xs text-accent-foreground">{reason}</span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center justify-between gap-4 md:flex-col md:items-end">
                            <div className="flex items-center gap-3">
                              <div
                                className="flex h-14 w-14 items-center justify-center rounded-full text-sm font-bold text-foreground"
                                style={{ background: `conic-gradient(hsl(var(--primary)) ${(score ?? 0) * 3.6}deg, hsl(var(--muted)) 0deg)` }}
                              >
                                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-card">
                                  {score !== null ? `${score}` : "--"}
                                </div>
                              </div>
                              <div className="md:text-right">
                                <p className="text-xs text-muted-foreground">期望报酬</p>
                                <p className="text-sm font-semibold text-price">{applicant.expectedPrice}</p>
                              </div>
                            </div>
                            <div className="flex flex-wrap justify-end gap-2">
                              <Button variant="outline" size="sm" className="rounded-full" onClick={() => setSelectedApplicantId(applicant.id)}>
                                查看解释
                              </Button>
                              {isProjectOwner && applicant.status === 'pending' && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-full"
                                    disabled={applicationActionId === applicant.id}
                                    onClick={() => handleApplicationStatus(applicant.id, 'rejected')}
                                  >
                                    拒绝
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="rounded-full"
                                    disabled={applicationActionId === applicant.id}
                                    onClick={() => handleApplicationStatus(applicant.id, 'accepted')}
                                  >
                                    {applicationActionId === applicant.id ? '处理中...' : '选定合作'}
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-background/95 p-3 backdrop-blur lg:hidden">
        {getApplyButton()}
      </div>

      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>应征项目</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>应征留言</Label>
              <Textarea className="mt-1" rows={4} placeholder="介绍你的优势、创作思路、预计交付节奏..." value={applyMessage} onChange={(event) => setApplyMessage(event.target.value)} />
              <p className="mt-1 text-right text-xs text-muted-foreground">{applyMessage.length}/200</p>
            </div>
            <div>
              <Label>期望报酬</Label>
              <Input className="mt-1" placeholder="如：¥5000" value={expectedPrice} onChange={(event) => setExpectedPrice(event.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApplyOpen(false)}>取消</Button>
            <Button onClick={handleApply} disabled={applyMessage.trim().length < 10 || !expectedPrice.trim() || applying}>
              {applying ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />提交中...</> : "确认应征"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedApplicant} onOpenChange={(open) => !open && setSelectedApplicantId(null)}>
        <DialogContent className="max-w-2xl">
          {selectedApplicant && (
            <>
              <DialogHeader>
                <DialogTitle>智能推荐解释</DialogTitle>
              </DialogHeader>
              {(() => {
                const score = getScore(selectedApplicant.aigcerId);
                const recommendation = getRecommendation(score);
                return (
                  <div className="space-y-5">
                    <div className="grid gap-4 rounded-2xl border border-border bg-accent/50 p-5 md:grid-cols-[auto_1fr]">
                      <div
                        className="flex h-20 w-20 items-center justify-center rounded-full text-lg font-bold text-foreground"
                        style={{ background: `conic-gradient(hsl(var(--primary)) ${(score ?? 0) * 3.6}deg, hsl(var(--muted)) 0deg)` }}
                      >
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-card">
                          {score !== null ? `${score}%` : "--"}
                        </div>
                      </div>
                      <div>
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <Badge className={recommendation.className}>{recommendation.label}</Badge>
                          <Badge variant="outline">{selectedApplicant.status === 'accepted' ? '已选定' : '待沟通'}</Badge>
                        </div>
                        <h3 className="text-lg font-bold text-foreground">{selectedApplicant.aigcerNickname}</h3>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">{recommendation.summary}</p>
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                      {[
                        { icon: UserRound, title: "创作者资料", desc: selectedApplicant.bio || "简介资料较少" },
                        { icon: Sparkles, title: "擅长风格", desc: selectedApplicant.styles.join("、") || "暂未填写" },
                        { icon: BadgeCheck, title: "工具链", desc: selectedApplicant.tools.join("、") || "暂未填写" },
                      ].map((item) => {
                        const Icon = item.icon;
                        return (
                          <div key={item.title} className="rounded-xl border border-border p-4">
                            <Icon className="mb-3 h-5 w-5 text-primary" />
                            <p className="text-sm font-semibold text-foreground">{item.title}</p>
                            <p className="mt-1 line-clamp-4 text-xs leading-5 text-muted-foreground">{item.desc}</p>
                          </div>
                        );
                      })}
                    </div>

                    <div className="rounded-xl border border-border p-4">
                      <p className="mb-3 text-sm font-semibold text-foreground">AI 判断依据</p>
                      <div className="space-y-2">
                        {getMatchReasons(selectedApplicant).map((reason) => (
                          <div key={reason} className="flex gap-2 text-sm text-muted-foreground">
                            <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                            <span>{reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl bg-muted p-4">
                      <p className="text-sm font-semibold text-foreground">建议下一步</p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        先确认档期、报价包含范围、首版样片节点和修改次数。匹配度只辅助排序，最终仍建议结合过往案例和沟通质量判断。
                      </p>
                    </div>
                  </div>
                );
              })()}
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedApplicantId(null)}>关闭</Button>
                {isProjectOwner && selectedApplicant.status === 'pending' && (
                  <>
                    <Button
                      variant="outline"
                      disabled={applicationActionId === selectedApplicant.id}
                      onClick={() => handleApplicationStatus(selectedApplicant.id, 'rejected')}
                    >
                      拒绝应征
                    </Button>
                    <Button
                      disabled={applicationActionId === selectedApplicant.id}
                      onClick={() => handleApplicationStatus(selectedApplicant.id, 'accepted')}
                    >
                      {applicationActionId === selectedApplicant.id ? '处理中...' : '选定合作'}
                    </Button>
                  </>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
