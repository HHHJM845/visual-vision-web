import { useState } from "react";
import { CalendarDays, CheckCircle2, Trophy, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { PageHero, PageShell, SectionTitle } from "@/components/PageChrome";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { eventItems } from "@/data/mockData";
import { createEventRegistration, EventRegistration } from "@/services/engagementService";

const eventIcons = [Trophy, CalendarDays, Users, CheckCircle2];

const Events = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<typeof eventItems[number] | null>(null);
  const [participantName, setParticipantName] = useState("");
  const [contact, setContact] = useState("");
  const [workTitle, setWorkTitle] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registration, setRegistration] = useState<EventRegistration | null>(null);
  const featuredEvent = eventItems[0];
  const FeaturedIcon = Trophy;

  function openEvent(event: typeof eventItems[number]) {
    setSelected(event);
    setParticipantName("");
    setContact("");
    setWorkTitle("");
    setFormError("");
    setRegistration(null);
  }

  function resetDialog() {
    setSelected(null);
    setParticipantName("");
    setContact("");
    setWorkTitle("");
    setFormError("");
    setIsSubmitting(false);
    setRegistration(null);
  }

  function handleJoin() {
    if (!selected) return;
    if (selected.status !== "报名中") return;
    setFormError("");
    setIsSubmitting(true);
    try {
      const result = createEventRegistration({
        eventId: selected.id,
        eventTitle: selected.title,
        participantName,
        contact,
        workTitle,
      });
      setRegistration(result);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "提交失败，请稍后重试");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PageShell tone="muted">
      <Navbar />
      <PageHero
        eyebrow="Events"
        title="围绕 AI 影像创作的活动与挑战"
        description="用活动聚合创作者、品牌方与主题命题，让作品曝光、需求合作和行业趋势发生在同一个场域。"
        stats={[
          { label: "历史活动", value: eventItems.length },
          { label: "开放报名", value: eventItems.filter((item) => item.status === "报名中").length },
          { label: "主题方向", value: "AIGC" },
        ]}
      />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <button
          type="button"
          onClick={() => openEvent(featuredEvent)}
          className="group mb-10 grid w-full cursor-pointer overflow-hidden rounded-3xl border border-border bg-card text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-xl md:grid-cols-[1fr_0.85fr]"
        >
          <div className="flex min-h-80 flex-col justify-between bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.18),transparent_18rem),hsl(var(--background))] p-8">
            <div>
              <Badge className="mb-5 rounded-full">{featuredEvent.status}</Badge>
              <h2 className="max-w-xl text-3xl font-bold leading-tight text-foreground md:text-5xl">春季品牌片挑战</h2>
              <p className="mt-4 max-w-lg text-sm leading-7 text-muted-foreground">{featuredEvent.description}</p>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <CalendarDays className="h-4 w-4 text-primary" />
              {featuredEvent.date}
            </div>
          </div>
          <div className="flex min-h-80 items-center justify-center bg-primary text-primary-foreground">
            <FeaturedIcon className="h-24 w-24 transition-transform duration-200 group-hover:scale-105" />
          </div>
        </button>

        <SectionTitle title="往期活动" description="点击卡片查看活动规则、时间与回顾入口。" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {eventItems.slice(1).map((event, index) => {
            const Icon = eventIcons[index % eventIcons.length];
            return (
              <button key={event.id} type="button" onClick={() => openEvent(event)} className="group cursor-pointer rounded-2xl border border-border bg-card p-5 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-primary">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="mb-3 flex items-start justify-between gap-3">
                  <p className="font-semibold leading-snug text-card-foreground">{event.title}</p>
                  <Badge variant="outline" className="flex-shrink-0 text-xs">{event.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{event.date}</p>
                <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{event.description}</p>
              </button>
            );
          })}
        </div>
      </main>

      <Dialog open={!!selected} onOpenChange={(open) => !open && resetDialog()}>
        <DialogContent className="sm:max-w-xl">
          {selected && (
            <>
              <DialogHeader><DialogTitle>{registration ? "报名已提交" : selected.title}</DialogTitle></DialogHeader>
              {registration ? (
                <>
                  <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6">
                    <CheckCircle2 className="mb-4 h-8 w-8 text-primary" />
                    <p className="font-semibold text-foreground">已保存报名信息</p>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">
                      记录编号 {registration.id}，活动节点、作品提交提醒会同步到消息中心。
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm">
                    <p className="font-medium text-foreground">{registration.eventTitle}</p>
                    <p className="mt-1 text-muted-foreground">报名人：{registration.participantName}</p>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={resetDialog}>完成</Button>
                    <Button onClick={() => navigate("/messages")}>查看消息</Button>
                  </DialogFooter>
                </>
              ) : (
                <>
                  <div className="rounded-2xl border border-border bg-accent/70 p-6">
                    <Trophy className="mb-4 h-8 w-8 text-primary" />
                    <p className="text-sm leading-7 text-muted-foreground">{selected.description}</p>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-muted-foreground">活动时间：</span>{selected.date}</p>
                    <p><span className="text-muted-foreground">状态：</span>{selected.status}</p>
                  </div>
                  {selected.status === "报名中" ? (
                    <div className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="event-name">报名人</Label>
                          <Input id="event-name" value={participantName} onChange={(event) => setParticipantName(event.target.value)} placeholder="姓名或昵称" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="event-contact">联系方式</Label>
                          <Input id="event-contact" value={contact} onChange={(event) => setContact(event.target.value)} placeholder="手机号 / 微信 / 邮箱" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="event-work">作品名称（可选）</Label>
                        <Input id="event-work" value={workTitle} onChange={(event) => setWorkTitle(event.target.value)} placeholder="暂未确定可先留空" />
                      </div>
                      {formError && <p className="text-sm text-destructive">{formError}</p>}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm leading-7 text-muted-foreground">
                      活动已结束，当前仅开放规则与历史信息查看；作品回顾页后续可接入独立详情。
                    </div>
                  )}
                  <DialogFooter>
                    <Button variant="outline" onClick={resetDialog}>关闭</Button>
                    {selected.status === "报名中" ? (
                      <Button onClick={handleJoin} disabled={isSubmitting}>{isSubmitting ? "提交中..." : "报名参加"}</Button>
                    ) : (
                      <Button variant="secondary" onClick={resetDialog}>知道了</Button>
                    )}
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

export default Events;
