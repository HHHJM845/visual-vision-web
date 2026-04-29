import { useMemo, useState } from "react";
import { ArrowUpRight, BadgeCheck, Clock3, Film, MessageSquare, ShoppingBag, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { FilterChip, PageHero, PageShell, SectionTitle } from "@/components/PageChrome";
import { SearchEmptyState } from "@/components/StateViews";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { showcaseItems } from "@/data/mockData";
import { createShowcaseIntent, ShowcaseIntent } from "@/services/engagementService";

const categories = ["全部类型", "宣传片", "短视频", "概念影像", "数字人"];

const iconMap = [Film, Sparkles, Clock3, BadgeCheck, MessageSquare];

const ShowcaseCard = ({ item, index, onOpen }: { item: typeof showcaseItems[number]; index: number; onOpen: () => void }) => {
  const Icon = iconMap[index % iconMap.length];
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group grid min-h-64 cursor-pointer overflow-hidden rounded-2xl border border-border bg-card text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-xl"
    >
      <div className="relative flex aspect-[4/3] items-center justify-center bg-[radial-gradient(circle_at_30%_25%,hsl(var(--primary)/0.18),transparent_16rem),hsl(var(--accent))]">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-background/90 text-primary shadow-sm">
          <Icon className="h-8 w-8" />
        </div>
        {item.tag && <span className="absolute left-3 top-3 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">{item.tag}</span>}
        {item.sold != null && <span className="absolute bottom-3 right-3 rounded-full bg-foreground px-2.5 py-1 text-xs text-background">已售 {item.sold}</span>}
      </div>
      <div className="p-4">
        <div className="mb-2 flex items-start justify-between gap-3">
          <p className="line-clamp-2 text-sm font-semibold text-card-foreground">{item.title}</p>
          <ArrowUpRight className="h-4 w-4 flex-shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
        </div>
        <p className="mb-4 text-xs text-muted-foreground">{item.author} · {item.delivery}</p>
        <div className="flex items-center justify-between border-t border-border pt-3">
          <span className="text-xs text-muted-foreground">起价</span>
          <span className="text-lg font-bold text-price">¥{item.price}</span>
        </div>
      </div>
    </button>
  );
};

const Showcase = () => {
  const navigate = useNavigate();
  const [category, setCategory] = useState("全部类型");
  const [selected, setSelected] = useState<typeof showcaseItems[number] | null>(null);
  const [requirement, setRequirement] = useState("");
  const [contact, setContact] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdIntent, setCreatedIntent] = useState<ShowcaseIntent | null>(null);
  const visible = useMemo(() => showcaseItems.filter((item) => category === "全部类型" || item.category === category), [category]);
  const fastDelivery = visible.filter((item) => item.tag === "24H" || item.tag === "48H");
  const recommended = visible.filter((item) => item.tag !== "24H" && item.tag !== "48H");

  function resetDialog() {
    setSelected(null);
    setRequirement("");
    setContact("");
    setFormError("");
    setIsSubmitting(false);
    setCreatedIntent(null);
  }

  function handleOpen(item: typeof showcaseItems[number]) {
    setSelected(item);
    setRequirement("");
    setContact("");
    setFormError("");
    setCreatedIntent(null);
  }

  function handleReserve() {
    if (!selected) return;
    setFormError("");
    setIsSubmitting(true);
    try {
      const intent = createShowcaseIntent({
        serviceId: selected.id,
        serviceTitle: selected.title,
        author: selected.author,
        price: selected.price,
        requirement,
        contact,
      });
      setCreatedIntent(intent);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "提交失败，请稍后重试");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PageShell>
      <Navbar />
      <PageHero
        eyebrow="Creator Showcase"
        title="从成熟服务里快速选择承制方"
        description="橱窗聚合可直接沟通的标准化服务，适合预算明确、周期紧凑或想快速找到风格样本的需求。"
        stats={[
          { label: "橱窗服务", value: showcaseItems.length },
          { label: "快速交付", value: fastDelivery.length },
          { label: "平均起价", value: "¥238" },
        ]}
      />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8 flex flex-wrap gap-2">
          {categories.map((cat) => {
            const count = cat === "全部类型" ? showcaseItems.length : showcaseItems.filter((item) => item.category === cat).length;
            return (
              <FilterChip key={cat} active={category === cat} onClick={() => setCategory(cat)}>
                {cat}<span className="text-xs opacity-75">{count}</span>
              </FilterChip>
            );
          })}
        </div>

        {visible.length === 0 ? (
          <SearchEmptyState onReset={() => setCategory("全部类型")} />
        ) : (
          <>
            <section className="mb-12">
              <SectionTitle title="快速交付" description="适合短周期发布、活动预热和社媒素材。" />
              {fastDelivery.length ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {fastDelivery.map((item, index) => <ShowcaseCard key={item.id} item={item} index={index} onOpen={() => handleOpen(item)} />)}
                </div>
              ) : (
                <SearchEmptyState onReset={() => setCategory("全部类型")} />
              )}
            </section>

            <section className="mb-12">
              <SectionTitle title="好推荐" description="结合售出记录、交付方式和风格覆盖挑选。" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {recommended.map((item, index) => <ShowcaseCard key={item.id} item={item} index={index + 2} onOpen={() => handleOpen(item)} />)}
              </div>
            </section>

            <section>
              <SectionTitle title="即将上架" description="预留需求方向，后续可直接转为服务包。" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {["机甲概念影像", "动态光效特效短片", "虚拟偶像宣传MV", "AI写实人物短片"].map((title, index) => {
                  const Icon = iconMap[(index + 1) % iconMap.length];
                  return (
                    <div key={title} className="rounded-2xl border border-dashed border-border bg-card/70 p-5">
                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-primary">
                        <Icon className="h-6 w-6" />
                      </div>
                      <p className="font-semibold text-card-foreground">{title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">开放预约中</p>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </main>

      <Dialog open={!!selected} onOpenChange={(open) => !open && resetDialog()}>
        <DialogContent className="sm:max-w-xl">
          {selected && (
            <>
              <DialogHeader><DialogTitle>{createdIntent ? "沟通意向已提交" : selected.title}</DialogTitle></DialogHeader>
              {createdIntent ? (
                <>
                  <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-background text-primary shadow-sm">
                      <BadgeCheck className="h-7 w-7" />
                    </div>
                    <p className="font-semibold text-foreground">已生成沟通记录</p>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">
                      记录编号 {createdIntent.id}，需求会进入报价确认，后续提醒已同步到消息中心。
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm">
                    <p className="font-medium text-foreground">{createdIntent.serviceTitle}</p>
                    <p className="mt-1 text-muted-foreground">{createdIntent.requirement}</p>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={resetDialog}>完成</Button>
                    <Button onClick={() => navigate("/messages")}>查看消息</Button>
                  </DialogFooter>
                </>
              ) : (
                <>
                  <div className="rounded-2xl border border-border bg-accent/60 p-6">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-background text-primary shadow-sm">
                      <Film className="h-7 w-7" />
                    </div>
                    <p className="text-sm text-muted-foreground">由 {selected.author} 提供，{selected.delivery}。</p>
                  </div>
                  <div className="grid gap-3 text-sm sm:grid-cols-2">
                    <div><span className="text-muted-foreground">创作者：</span>{selected.author}</div>
                    <div><span className="text-muted-foreground">交付：</span>{selected.delivery}</div>
                    <div><span className="text-muted-foreground">类型：</span>{selected.category}</div>
                    <div><span className="text-muted-foreground">起价：</span><span className="font-bold text-price">¥{selected.price}</span></div>
                  </div>
                  <div className="flex flex-wrap gap-2">{selected.tag && <Badge>{selected.tag}</Badge>}<Badge variant="outline">售后沟通</Badge><Badge variant="outline">节点验收</Badge></div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="showcase-requirement">需求摘要</Label>
                      <Textarea
                        id="showcase-requirement"
                        value={requirement}
                        onChange={(event) => setRequirement(event.target.value)}
                        placeholder="例如：30 秒产品预热视频，需要偏科技感，7 天内交第一版。"
                        rows={4}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="showcase-contact">联系方式</Label>
                      <Input
                        id="showcase-contact"
                        value={contact}
                        onChange={(event) => setContact(event.target.value)}
                        placeholder="手机号 / 微信 / 邮箱"
                      />
                    </div>
                    {formError && <p className="text-sm text-destructive">{formError}</p>}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={resetDialog}>再看看</Button>
                    <Button onClick={handleReserve} disabled={isSubmitting}>
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      {isSubmitting ? "提交中..." : "确认沟通意向"}
                    </Button>
                  </DialogFooter>
                </>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </PageShell>
  );
};

export default Showcase;
