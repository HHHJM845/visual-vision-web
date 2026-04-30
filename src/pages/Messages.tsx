import { useMemo, useState } from "react";
import { Bell, CalendarDays, CheckCircle2, Film, ShoppingBag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { PageHero, PageShell, SectionTitle } from "@/components/PageChrome";
import { EmptyState } from "@/components/StateViews";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  listEventRegistrations,
  listNotifications,
  listShowcaseIntents,
  markNotificationRead,
  NotificationItem,
} from "@/services/engagementService";
import { cn } from "@/lib/utils";

const noticeIconMap: Record<NotificationItem["type"], typeof ShoppingBag> = {
  "showcase-intent": ShoppingBag,
  "event-registration": CalendarDays,
  "project-update": Film,
};

function formatTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

const Messages = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(() => listNotifications());
  const showcaseIntents = useMemo(() => listShowcaseIntents(), []);
  const eventRegistrations = useMemo(() => listEventRegistrations(), []);
  const unreadCount = notifications.filter((item) => !item.read).length;

  function handleRead(item: NotificationItem) {
    if (!item.read) {
      markNotificationRead(item.id);
      setNotifications(listNotifications());
    }
    if (item.targetPath) navigate(item.targetPath);
  }

  return (
    <PageShell tone="muted">
      <Navbar />
      <PageHero
        eyebrow="Message Center"
        title="消息中心"
        description="集中查看橱窗沟通意向、活动报名记录和后续节点提醒，避免关键流程提交后没有落点。"
        stats={[
          { label: "未读消息", value: unreadCount },
          { label: "橱窗意向", value: showcaseIntents.length },
          { label: "活动报名", value: eventRegistrations.length },
        ]}
      />

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1fr_22rem]">
        <section>
          <SectionTitle title="最新消息" description="点击消息可标记为已读，关联入口会保留在记录中。" />
          {notifications.length === 0 ? (
            <EmptyState
              icon={<Bell className="h-5 w-5" />}
              title="暂时没有消息"
              description="完成橱窗沟通或活动报名后，对应提醒会出现在这里。"
              actionLabel="去逛橱窗"
              onAction={() => navigate("/showcase")}
            />
          ) : (
            <div className="space-y-3">
              {notifications.map((item) => {
                const Icon = noticeIconMap[item.type];
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleRead(item)}
                    className={cn(
                      "flex w-full cursor-pointer items-start gap-4 rounded-2xl border bg-card p-5 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg",
                      item.read ? "border-border" : "border-primary/25"
                    )}
                  >
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-card-foreground">{item.title}</p>
                        {!item.read && <Badge className="rounded-full">未读</Badge>}
                      </div>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.description}</p>
                      <p className="mt-3 text-xs text-muted-foreground">{formatTime(item.createdAt)}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-card-foreground">橱窗意向</h2>
              <Badge variant="outline">{showcaseIntents.length}</Badge>
            </div>
            {showcaseIntents.length === 0 ? (
              <p className="text-sm leading-6 text-muted-foreground">还没有提交过橱窗沟通。</p>
            ) : (
              <div className="space-y-3">
                {showcaseIntents.slice(0, 3).map((item) => (
                  <div key={item.id} className="rounded-xl border border-border bg-muted/40 p-3">
                    <p className="text-sm font-medium text-foreground">{item.serviceTitle}</p>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{item.requirement}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-card-foreground">活动报名</h2>
              <Badge variant="outline">{eventRegistrations.length}</Badge>
            </div>
            {eventRegistrations.length === 0 ? (
              <p className="text-sm leading-6 text-muted-foreground">报名后会在这里显示活动与作品信息。</p>
            ) : (
              <div className="space-y-3">
                {eventRegistrations.slice(0, 3).map((item) => (
                  <div key={item.id} className="rounded-xl border border-border bg-muted/40 p-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <p className="text-sm font-medium text-foreground">{item.eventTitle}</p>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.workTitle ?? "暂未填写作品名称"}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </aside>
      </main>
    </PageShell>
  );
};

export default Messages;
