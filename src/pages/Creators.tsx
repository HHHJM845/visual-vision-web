import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Aperture, BadgeCheck, BrainCircuit, Briefcase, Images, Search, Send, Sparkles, UserRound } from "lucide-react";
import Navbar from "@/components/Navbar";
import { FilterChip, PageHero, PageShell, SectionTitle } from "@/components/PageChrome";
import { CardGridSkeleton, EmptyState, ErrorState, SearchEmptyState } from "@/components/StateViews";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { createProjectNotification } from "@/services/engagementService";
import { getApplicationsByCommission, getCommissionById, inviteCreatorToCommission } from "@/services/commissionService";
import {
  demandFromCommission,
  getCreatorRecommendations,
} from "@/services/creatorRecommendationService";
import type { CreatorRecommendation } from "@/services/creatorRecommendationService";

const COMMON_TAGS = ["科幻", "品牌宣传", "产品宣传", "国风", "二次元", "写实", "短片", "动态影像", "角色", "剪辑"];

export default function Creators() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [keyword, setKeyword] = useState("");
  const [tag, setTag] = useState("全部");
  const [sort, setSort] = useState("recommend");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [invitingId, setInvitingId] = useState<string | null>(null);

  const commissionIdParam = searchParams.get("commissionId");
  const commissionId = Number(commissionIdParam);
  const hasCommissionContext = commissionIdParam !== null && Number.isFinite(commissionId);

  const {
    data: targetCommission = null,
    isLoading: commissionLoading,
    isError: commissionError,
  } = useQuery({
    queryKey: ["creator-match-commission", commissionId],
    queryFn: () => getCommissionById(commissionId),
    enabled: hasCommissionContext,
  });

  const {
    data: recommendations = [],
    isLoading: recommendationsLoading,
    isError: recommendationsError,
    refetch,
  } = useQuery({
    queryKey: ["creator-recommendations", targetCommission?.id ?? "all"],
    queryFn: () => getCreatorRecommendations(targetCommission ? demandFromCommission(targetCommission) : undefined),
    enabled: !hasCommissionContext || !commissionLoading,
  });

  const {
    data: candidateApplications = [],
    refetch: refetchCandidateApplications,
  } = useQuery({
    queryKey: ["creator-match-applications", commissionId],
    queryFn: () => getApplicationsByCommission(commissionId),
    enabled: hasCommissionContext && !!targetCommission,
  });

  const selected = recommendations.find((item) => item.creator.id === selectedId) ?? null;
  const invitedCreatorIds = useMemo(
    () => new Set(candidateApplications.map((application) => application.aigcerId)),
    [candidateApplications],
  );
  const availableTags = useMemo(() => {
    const tags = recommendations.flatMap((item) => item.capabilityTags);
    return ["全部", ...Array.from(new Set([...COMMON_TAGS, ...tags])).slice(0, 18)];
  }, [recommendations]);

  const visibleRecommendations = useMemo(() => {
    const text = keyword.trim().toLowerCase();
    return recommendations
      .filter((item) => tag === "全部" || item.capabilityTags.includes(tag) || item.matchedTags.includes(tag))
      .filter((item) => {
        if (!text) return true;
        const creatorText = [
          item.creator.nickname,
          item.creator.aigcerProfile.bio,
          ...item.capabilityTags,
          ...item.creator.aigcerProfile.portfolio.map((portfolio) => `${portfolio.title} ${portfolio.description}`),
        ].join(" ").toLowerCase();
        return creatorText.includes(text);
      })
      .sort((a, b) => {
        if (sort === "portfolio") return b.creator.aigcerProfile.portfolio.length - a.creator.aigcerProfile.portfolio.length;
        if (sort === "name") return a.creator.nickname.localeCompare(b.creator.nickname, "zh-Hans-CN");
        return b.score - a.score;
      });
  }, [keyword, recommendations, sort, tag]);

  const isLoading = commissionLoading || recommendationsLoading;
  const isError = commissionError || recommendationsError;
  const canPost = user?.role === "client" && user.verificationStatus === "verified";
  const canInvite = !!targetCommission && !!user && user.role === "client" && user.id === targetCommission.authorId;

  function resetFilters() {
    setKeyword("");
    setTag("全部");
    setSort("recommend");
  }

  function matchedPortfolio(item: CreatorRecommendation) {
    const ids = item.matchedPortfolioIds.length
      ? item.matchedPortfolioIds
      : item.creator.aigcerProfile.portfolio.slice(0, 3).map((portfolio) => portfolio.id);
    return item.creator.aigcerProfile.portfolio.filter((portfolio) => ids.includes(portfolio.id));
  }

  async function handleInvite(item: CreatorRecommendation) {
    if (!targetCommission || !user) return;
    const alreadyInvited = invitedCreatorIds.has(item.creator.id);
    if (alreadyInvited) {
      navigate(`/commissions/${targetCommission.id}`);
      return;
    }

    setInvitingId(item.creator.id);
    try {
      await inviteCreatorToCommission(targetCommission, item.creator.id, item.creator.nickname, user.id);
      createProjectNotification({
        title: "收到项目邀约",
        description: `${user.nickname} 邀请你参与「${targetCommission.title}」，可进入项目查看需求并沟通合作安排。`,
        targetPath: `/commissions/${targetCommission.id}`,
        recipientId: item.creator.id,
        recipientRole: "aigcer",
        actionLabel: "查看邀约",
        priority: "high",
      });
      toast({
        title: "邀约已发送",
        description: `${item.creator.nickname} 已进入项目候选列表，后续可在项目详情中选定合作。`,
      });
      await Promise.all([
        refetchCandidateApplications(),
        queryClient.invalidateQueries({ queryKey: ["commission-applicants", targetCommission.id] }),
        queryClient.invalidateQueries({ queryKey: ["applications"] }),
        queryClient.invalidateQueries({ queryKey: ["commissions"] }),
      ]);
    } catch (error: unknown) {
      toast({
        title: "邀约失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setInvitingId(null);
    }
  }

  return (
    <PageShell>
      <Navbar />
      <PageHero
        eyebrow="Creator Plaza"
        title={targetCommission ? "系统已为这条需求推荐候选创作者" : "从作品和能力标签找到创作者"}
        description={
          targetCommission
            ? `基于「${targetCommission.title}」的需求描述、类别和创作者作品标签生成推荐排序。`
            : "按能力标签、作品方向和工具链筛选已认证 AIGCer，也可以在发布需求后自动生成候选名单。"
        }
        stats={[
          { label: "认证创作者", value: recommendations.length },
          { label: "当前结果", value: visibleRecommendations.length },
          { label: targetCommission ? "推荐来源" : "作品案例", value: targetCommission ? "项目需求" : recommendations.reduce((sum, item) => sum + item.creator.aigcerProfile.portfolio.length, 0) },
        ]}
        actions={
          <>
            {targetCommission && (
              <Button variant="outline" className="rounded-full" onClick={() => navigate(`/commissions/${targetCommission.id}`)}>
                <Briefcase className="mr-2 h-4 w-4" />查看项目
              </Button>
            )}
            {targetCommission && (
              <Button variant="outline" className="rounded-full" onClick={() => setSearchParams({})}>
                查看全部创作者
              </Button>
            )}
            {canPost && (
              <Button className="rounded-full" onClick={() => navigate("/commissions/new")}>
                发布需求获取推荐
              </Button>
            )}
          </>
        }
      />

      <main className="mx-auto max-w-6xl px-4 py-8">
        {targetCommission && (
          <div className="mb-6 rounded-2xl border border-primary/20 bg-accent/60 p-5 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Auto Match</p>
                <h2 className="mt-1 text-lg font-bold text-foreground">{targetCommission.title}</h2>
                <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">{targetCommission.description}</p>
              </div>
              <Badge className="w-fit rounded-full bg-primary text-primary-foreground">{targetCommission.category}</Badge>
            </div>
          </div>
        )}

        <div className="mb-6 rounded-2xl border border-border bg-card/95 p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                className="h-11 rounded-full pl-9"
                placeholder="搜索创作者、作品、标签或工具"
              />
            </div>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="h-11 rounded-full md:w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="recommend">推荐优先</SelectItem>
                <SelectItem value="portfolio">作品最多</SelectItem>
                <SelectItem value="name">名称排序</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {availableTags.map((item) => (
              <FilterChip key={item} active={tag === item} onClick={() => setTag(item)}>
                {item}
              </FilterChip>
            ))}
          </div>
        </div>

        <SectionTitle
          title={targetCommission ? "推荐候选创作者" : "认证创作者"}
          description={targetCommission ? "排序会优先考虑命中标签、匹配作品和资料完整度。" : "标签来自创作者资料、工具链和作品标题/描述。"}
        />

        {isLoading ? (
          <CardGridSkeleton count={6} />
        ) : isError ? (
          <ErrorState onAction={() => refetch()} />
        ) : recommendations.length === 0 ? (
          <EmptyState title="暂无认证创作者" description="完成创作者认证并上传作品后，会出现在创作者广场。" />
        ) : visibleRecommendations.length === 0 ? (
          <SearchEmptyState onReset={resetFilters} />
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {visibleRecommendations.map((item) => {
              const portfolios = matchedPortfolio(item);
              const alreadyInvited = invitedCreatorIds.has(item.creator.id);
              return (
                <article key={item.creator.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-200 hover:border-primary/30 hover:shadow-md">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                      {item.creator.nickname.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-bold text-foreground">{item.creator.nickname}</h3>
                        <Badge variant="outline" className="rounded-full">
                          <BadgeCheck className="mr-1 h-3.5 w-3.5" />已认证
                        </Badge>
                        <Badge className="rounded-full bg-primary text-primary-foreground">{item.score}% 匹配</Badge>
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{item.creator.aigcerProfile.bio}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {(item.matchedTags.length ? item.matchedTags : item.capabilityTags.slice(0, 6)).map((capability) => (
                      <Badge key={capability} variant={item.matchedTags.includes(capability) ? "default" : "outline"} className="rounded-full">
                        {capability}
                      </Badge>
                    ))}
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {portfolios.slice(0, 3).map((portfolio) => (
                      <button
                        key={portfolio.id}
                        type="button"
                        onClick={() => setSelectedId(item.creator.id)}
                        className="overflow-hidden rounded-lg border border-border bg-muted text-left"
                      >
                        <img src={portfolio.imageUrl} alt={portfolio.title} className="aspect-video w-full object-cover" loading="lazy" />
                      </button>
                    ))}
                  </div>

                  <div className="mt-4 flex flex-col gap-3 rounded-xl bg-muted p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-xs leading-5 text-muted-foreground">
                      {item.reasons[0]}
                    </div>
                    <div className="flex flex-wrap gap-2 sm:justify-end">
                      <Button variant="outline" className="rounded-full" size="sm" onClick={() => setSelectedId(item.creator.id)}>
                        <Images className="mr-2 h-4 w-4" />查看匹配作品
                      </Button>
                      {targetCommission && canInvite && (
                        <Button
                          variant={alreadyInvited ? "outline" : "default"}
                          className="rounded-full"
                          size="sm"
                          onClick={() => handleInvite(item)}
                          disabled={invitingId === item.creator.id}
                        >
                          <Send className="mr-2 h-4 w-4" />
                          {invitingId === item.creator.id ? "发送中..." : alreadyInvited ? "查看项目候选" : "邀约合作"}
                        </Button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelectedId(null)}>
        <DialogContent className="max-w-4xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.creator.nickname} 的匹配证据</DialogTitle>
                <DialogDescription>
                  展示系统用于推荐该创作者的能力标签、推荐理由和匹配作品。
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-5 md:grid-cols-[0.85fr_1.15fr]">
                <div className="space-y-3">
                  <div className="rounded-xl border border-border p-4">
                    <UserRound className="mb-3 h-5 w-5 text-primary" />
                    <p className="text-sm font-semibold text-foreground">创作者简介</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{selected.creator.aigcerProfile.bio}</p>
                  </div>
                  <div className="rounded-xl border border-border p-4">
                    <BrainCircuit className="mb-3 h-5 w-5 text-primary" />
                    <p className="text-sm font-semibold text-foreground">推荐理由</p>
                    <div className="mt-3 space-y-2">
                      {selected.reasons.map((reason) => (
                        <div key={reason} className="flex gap-2 text-sm text-muted-foreground">
                          <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                          <span>{reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="mb-3 flex flex-wrap gap-2">
                    {selected.capabilityTags.slice(0, 10).map((capability) => (
                      <Badge key={capability} variant={selected.matchedTags.includes(capability) ? "default" : "outline"} className="rounded-full">
                        {capability}
                      </Badge>
                    ))}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {matchedPortfolio(selected).map((portfolio) => (
                      <div key={portfolio.id} className="overflow-hidden rounded-xl border border-border bg-muted/30">
                        <img src={portfolio.imageUrl} alt={portfolio.title} className="aspect-video w-full object-cover" />
                        <div className="p-3">
                          <div className="mb-2 flex items-center gap-2">
                            <Aperture className="h-4 w-4 text-primary" />
                            <p className="text-sm font-semibold text-foreground">{portfolio.title}</p>
                          </div>
                          <p className="line-clamp-3 text-xs leading-5 text-muted-foreground">{portfolio.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
