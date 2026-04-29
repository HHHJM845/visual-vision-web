import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import Navbar from "@/components/Navbar";
import CommissionCard from "@/components/CommissionCard";
import { FilterChip, PageHero, PageShell } from "@/components/PageChrome";
import { CardGridSkeleton, EmptyState, ErrorState, SearchEmptyState } from "@/components/StateViews";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { getCommissions } from "@/services/commissionService";

const categories = ["全部", "商业宣传片", "创意短片", "概念影像", "短视频"];

export default function Commissions() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [purpose, setPurpose] = useState("商业用途");
  const [sort, setSort] = useState("newest");
  const [category, setCategory] = useState("全部");
  const [budget, setBudget] = useState("all");
  const [deadline, setDeadline] = useState("all");
  const [keyword, setKeyword] = useState("");

  const { data: commissions = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['commissions'],
    queryFn: getCommissions,
  });

  const canPost = !!user && user.verificationStatus === 'verified';

  const filtered = useMemo(() => {
    const now = Date.now();
    const normalizePrice = (priceRange: string) => {
      const nums = priceRange.match(/\d+/g)?.map(Number) ?? [];
      if (priceRange.includes("k")) return Math.max(...nums) * 1000;
      return Math.max(...nums, 0);
    };

    return commissions
      .filter((item) => item.purpose === purpose)
      .filter((item) => category === "全部" || item.category === category)
      .filter((item) => {
        const text = `${item.title} ${item.description} ${item.category}`.toLowerCase();
        return !keyword.trim() || text.includes(keyword.trim().toLowerCase());
      })
      .filter((item) => {
        const maxPrice = normalizePrice(item.priceRange);
        if (budget === "low") return maxPrice <= 1000;
        if (budget === "mid") return maxPrice > 1000 && maxPrice <= 5000;
        if (budget === "high") return maxPrice > 5000;
        return true;
      })
      .filter((item) => {
        const diffDays = Math.ceil((new Date(item.deadline).getTime() - now) / 86400000);
        if (deadline === "week") return diffDays <= 7 && diffDays >= 0;
        if (deadline === "month") return diffDays <= 30 && diffDays >= 0;
        return true;
      })
      .sort((a, b) => {
        if (sort === "ending") return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        if (sort === "budget") return normalizePrice(b.priceRange) - normalizePrice(a.priceRange);
        return b.id - a.id;
      });
  }, [budget, category, commissions, deadline, keyword, purpose, sort]);

  function resetFilters() {
    setPurpose("商业用途");
    setSort("newest");
    setCategory("全部");
    setBudget("all");
    setDeadline("all");
    setKeyword("");
  }

  return (
    <PageShell>
      <Navbar />
      <PageHero
        eyebrow="Commission Plaza"
        title="找到正在招募的 AI 影片项目"
        description="按用途、预算、交付日期和影片类别筛选需求，快速判断是否适合应征。"
        stats={[
          { label: "开放项目", value: commissions.length },
          { label: "当前结果", value: filtered.length },
          { label: "已应征", value: commissions.reduce((sum, item) => sum + item.applicants, 0) },
        ]}
        actions={
          <>
            {!user && (
              <Button variant="outline" className="rounded-full" onClick={() => navigate('/login')}>
                登录后发布
              </Button>
            )}
            {canPost && (
              <Button className="rounded-full" onClick={() => navigate('/commissions/new')}>
                <Plus className="mr-1 h-4 w-4" /> 发布项目
              </Button>
            )}
          </>
        }
      />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 rounded-2xl border border-border bg-card/95 p-4 shadow-sm backdrop-blur">
          <div className="mb-4 flex flex-wrap gap-2">
            {["商业用途", "个人用途"].map((item) => (
              <FilterChip key={item} active={purpose === item} onClick={() => setPurpose(item)}>
                {item === "商业用途" ? "商业项目" : "个人委托"}
              </FilterChip>
            ))}
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={keyword} onChange={(event) => setKeyword(event.target.value)} className="h-11 rounded-full pl-9" placeholder="搜索项目、风格或关键词" />
            </div>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="h-11 rounded-full md:w-32"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="newest">最新发布</SelectItem><SelectItem value="ending">即将截止</SelectItem><SelectItem value="budget">预算最高</SelectItem></SelectContent>
            </Select>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-11 rounded-full md:w-36"><SelectValue /></SelectTrigger>
              <SelectContent>{categories.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={budget} onValueChange={setBudget}>
              <SelectTrigger className="h-11 rounded-full md:w-36"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">报酬不限</SelectItem><SelectItem value="low">1k以下</SelectItem><SelectItem value="mid">1k-5k</SelectItem><SelectItem value="high">5k以上</SelectItem></SelectContent>
            </Select>
            <Select value={deadline} onValueChange={setDeadline}>
              <SelectTrigger className="h-11 rounded-full md:w-36"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">日期不限</SelectItem><SelectItem value="week">一周内</SelectItem><SelectItem value="month">一月内</SelectItem></SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <CardGridSkeleton count={6} />
        ) : isError ? (
          <ErrorState onAction={() => refetch()} />
        ) : commissions.length === 0 ? (
          <EmptyState title="还没有可应征项目" description="项目发布后会出现在这里，需求方可先完成认证并创建第一条需求。" actionLabel={canPost ? "发布项目" : undefined} onAction={canPost ? () => navigate('/commissions/new') : undefined} />
        ) : filtered.length === 0 ? (
          <SearchEmptyState onReset={resetFilters} />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {filtered.map((c) => (
              <CommissionCard
                key={c.id}
                id={c.id}
                title={c.title}
                description={c.description}
                tag={c.tag}
                reputation={c.reputation}
                deadline={c.deadline}
                category={c.category}
                applicants={c.applicants}
                priceRange={c.priceRange}
              />
            ))}
          </div>
        )}
      </main>
    </PageShell>
  );
}
